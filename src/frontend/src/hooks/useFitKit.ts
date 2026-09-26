import type { BikeConnectionState, RideMetrics } from "@/types/ride";
import { useCallback, useEffect, useRef, useState } from "react";

// ── UUID Constants — verified from the FS-2980D8 bike ─────────────────────────
const FTMS_SERVICE = "00001826-0000-1000-8000-00805f9b34fb";
const FTMS_FEATURE = "00002acc-0000-1000-8000-00805f9b34fb"; // read
const INDOOR_BIKE_DATA = "00002ad2-0000-1000-8000-00805f9b34fb"; // notify — THIS is the real data channel
const CONTROL_POINT = "00002ad9-0000-1000-8000-00805f9b34fb"; // indicate + write
const TRAINING_STATUS = "00002ada-0000-1000-8000-00805f9b34fb"; // notify — log only
const TRAINING_STATUS_CHAR = "00002ad3-0000-1000-8000-00805f9b34fb"; // notify + read — log only, NOT ride data

const PROPRIETARY_SERVICE = "0000fff0-0000-1000-8000-00805f9b34fb";
const PROPRIETARY_FFF1 = "0000fff1-0000-1000-8000-00805f9b34fb"; // heartbeat only — subscribe for logging

const DEVICE_INFO_SERVICE = "0000180a-0000-1000-8000-00805f9b34fb";

export interface DiscoveredService {
  serviceUuid: string;
  characteristics: { uuid: string; properties: string[] }[];
}

const OPTIONAL_SERVICES: BluetoothServiceUUID[] = [
  FTMS_SERVICE,
  PROPRIETARY_SERVICE,
  DEVICE_INFO_SERVICE,
];

function toHex(data: DataView): string {
  return Array.from({ length: data.byteLength }, (_, i) =>
    data.getUint8(i).toString(16).padStart(2, "0"),
  ).join(" ");
}

function readUint24LE(view: DataView, offset: number): number {
  return (
    view.getUint8(offset) |
    (view.getUint8(offset + 1) << 8) |
    (view.getUint8(offset + 2) << 16)
  );
}

const DEFAULT_METRICS: RideMetrics = {
  speedKph: 0,
  distanceKm: 0,
  calories: 0,
  resistance: 0,
  cadenceRpm: 0,
  elapsedSeconds: 0,
};

export interface ParseStep {
  field: string;
  offset: number;
  rawValue: number | null;
  convertedValue: string;
  skipped: boolean;
}

export interface ConnectionLogEntry {
  message: string;
  status: "info" | "success" | "error";
  timestamp: Date;
}

export interface IndoorBikeDebug {
  packets: number;
  lastRawBytes: number[];
  flagsHex: string;
  flagsBinary: string;
  parsedFields: string;
  lastPacketTime: number | null;
}

export interface FitKitDebugState {
  rawHex: string;
  flagsHex: string;
  flagsBinary: string;
  flagBits: Record<string, number>;
  parsedSteps: ParseStep[];
  finalResult: Partial<RideMetrics>;
  packetCount: number;
  lastPacketTime: number | null;
  connectionLog: ConnectionLogEntry[];
  indoorBikeDebug: IndoorBikeDebug;
}

// ── FTMS Indoor Bike Data parser (0x2AD2) ────────────────────────────────────
function parseIndoorBikeData(
  data: DataView,
  packetCount: number,
): {
  metrics: Partial<RideMetrics>;
  rawHex: string;
  flagsHex: string;
  flagsBinary: string;
  flagBits: Record<string, number>;
  parsedSteps: ParseStep[];
  lastRawBytes: number[];
} {
  const byteArr = Array.from({ length: data.byteLength }, (_, i) =>
    data.getUint8(i),
  );
  const rawHex = byteArr
    .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
    .join(" ");

  console.log(
    `[FitKit Indoor Bike Data 00002ad2] packet #${packetCount} (${data.byteLength} bytes): ${rawHex}`,
  );

  if (data.byteLength < 2) {
    return {
      metrics: {},
      rawHex,
      flagsHex: "",
      flagsBinary: "",
      flagBits: {},
      parsedSteps: [],
      lastRawBytes: byteArr,
    };
  }

  const flags = data.getUint16(0, true);
  const flagsHex = `0x${flags.toString(16).toUpperCase().padStart(4, "0")}`;
  const flagsBinary = `0b${flags.toString(2).padStart(16, "0")}`;

  const BIT_NAMES: [number, string][] = [
    [0, "More Data / speed-absent"],
    [1, "Avg Speed"],
    [2, "Instantaneous Cadence"],
    [3, "Avg Cadence"],
    [4, "Total Distance"],
    [5, "Resistance Level"],
    [6, "Instantaneous Power"],
    [7, "Avg Power"],
    [8, "Expended Energy"],
    [9, "Heart Rate"],
    [10, "Metabolic Equiv"],
    [11, "Elapsed Time"],
    [12, "Remaining Time"],
  ];

  const flagBits: Record<string, number> = {};
  for (const [bit, name] of BIT_NAMES) {
    flagBits[`bit${bit}`] = (flags >> bit) & 1;
    console.log(`[FitKit Flags] bit${bit} (${name}): ${(flags >> bit) & 1}`);
  }

  let offset = 2;
  const partial: Partial<RideMetrics> = {};
  const steps: ParseStep[] = [];

  const skip = (field: string, o: number): void => {
    steps.push({
      field,
      offset: o,
      rawValue: null,
      convertedValue: "SKIPPED (flag not set)",
      skipped: true,
    });
  };

  try {
    // Bit 0 — Instantaneous Speed (absent if bit set)
    if (!(flags & 0x0001)) {
      const o = offset;
      if (offset + 2 <= data.byteLength) {
        const raw = data.getUint16(offset, true);
        partial.speedKph = raw * 0.01;
        offset += 2;
        steps.push({
          field: "speed",
          offset: o,
          rawValue: raw,
          convertedValue: `${partial.speedKph.toFixed(2)} km/h`,
          skipped: false,
        });
      }
    } else {
      skip("speed", offset);
    }

    // Bit 1 — Average Speed (skip)
    if (flags & 0x0002) {
      if (offset + 2 <= data.byteLength) {
        const raw = data.getUint16(offset, true);
        steps.push({
          field: "avgSpeed",
          offset,
          rawValue: raw,
          convertedValue: `${(raw * 0.01).toFixed(2)} km/h (skipped)`,
          skipped: false,
        });
        offset += 2;
      }
    } else {
      skip("avgSpeed", offset);
    }

    // Bit 2 — Instantaneous Cadence
    if (flags & 0x0004) {
      const o = offset;
      if (offset + 2 <= data.byteLength) {
        const raw = data.getUint16(offset, true);
        partial.cadenceRpm = raw * 0.5;
        offset += 2;
        steps.push({
          field: "cadence",
          offset: o,
          rawValue: raw,
          convertedValue: `${partial.cadenceRpm.toFixed(1)} rpm`,
          skipped: false,
        });
      }
    } else {
      skip("cadence", offset);
    }

    // Bit 3 — Average Cadence (skip)
    if (flags & 0x0008) {
      if (offset + 2 <= data.byteLength) {
        const raw = data.getUint16(offset, true);
        steps.push({
          field: "avgCadence",
          offset,
          rawValue: raw,
          convertedValue: `${(raw * 0.5).toFixed(1)} rpm (skipped)`,
          skipped: false,
        });
        offset += 2;
      }
    } else {
      skip("avgCadence", offset);
    }

    // Bit 4 — Total Distance (uint24LE in metres)
    if (flags & 0x0010) {
      const o = offset;
      if (offset + 3 <= data.byteLength) {
        const distM = readUint24LE(data, offset);
        partial.distanceKm = distM / 1000;
        offset += 3;
        steps.push({
          field: "distance",
          offset: o,
          rawValue: distM,
          convertedValue: `${partial.distanceKm.toFixed(3)} km`,
          skipped: false,
        });
      }
    } else {
      skip("distance", offset);
    }

    // Bit 5 — Resistance Level (int16LE)
    if (flags & 0x0020) {
      const o = offset;
      if (offset + 2 <= data.byteLength) {
        partial.resistance = data.getInt16(offset, true);
        offset += 2;
        steps.push({
          field: "resistance",
          offset: o,
          rawValue: partial.resistance,
          convertedValue: String(partial.resistance),
          skipped: false,
        });
      }
    } else {
      skip("resistance", offset);
    }

    // Bit 6 — Instantaneous Power (int16LE) — skip, not needed
    if (flags & 0x0040) {
      if (offset + 2 <= data.byteLength) {
        const power = data.getInt16(offset, true);
        steps.push({
          field: "instantPower",
          offset,
          rawValue: power,
          convertedValue: `${power} W`,
          skipped: false,
        });
        offset += 2;
      }
    } else {
      skip("instantPower", offset);
    }

    // Bit 7 — Average Power (int16LE) — skip
    if (flags & 0x0080) {
      if (offset + 2 <= data.byteLength) {
        const power = data.getInt16(offset, true);
        steps.push({
          field: "avgPower",
          offset,
          rawValue: power,
          convertedValue: `${power} W`,
          skipped: false,
        });
        offset += 2;
      }
    } else {
      skip("avgPower", offset);
    }

    // Bit 8 — Expended Energy (uint16 total + uint16/hr + uint8/min)
    if (flags & 0x0100) {
      const o = offset;
      if (offset + 5 <= data.byteLength) {
        const totalKcal = data.getUint16(offset, true);
        const perHour = data.getUint16(offset + 2, true);
        const perMin = data.getUint8(offset + 4);
        partial.calories = totalKcal;
        offset += 5;
        steps.push({
          field: "calories",
          offset: o,
          rawValue: totalKcal,
          convertedValue: `${totalKcal} kcal`,
          skipped: false,
        });
        steps.push({
          field: "caloriesPerHour",
          offset: o + 2,
          rawValue: perHour,
          convertedValue: `${perHour} kcal/h`,
          skipped: false,
        });
        steps.push({
          field: "caloriesPerMinute",
          offset: o + 4,
          rawValue: perMin,
          convertedValue: `${perMin} kcal/min`,
          skipped: false,
        });
      }
    } else {
      skip("calories", offset);
    }

    // Bit 9 — Heart Rate (uint8) — skip
    if (flags & 0x0200) {
      if (offset + 1 <= data.byteLength) {
        const hr = data.getUint8(offset);
        steps.push({
          field: "heartRate",
          offset,
          rawValue: hr,
          convertedValue: `${hr} bpm`,
          skipped: false,
        });
        offset += 1;
      }
    } else {
      skip("heartRate", offset);
    }

    // Bit 10 — Metabolic Equivalent (uint8) — skip
    if (flags & 0x0400) {
      if (offset + 1 <= data.byteLength) {
        const met = data.getUint8(offset);
        steps.push({
          field: "metabolicEquiv",
          offset,
          rawValue: met,
          convertedValue: `${(met * 0.1).toFixed(1)}`,
          skipped: false,
        });
        offset += 1;
      }
    } else {
      skip("metabolicEquiv", offset);
    }

    // Bit 11 — Elapsed Time (uint16LE seconds)
    if (flags & 0x0800) {
      const o = offset;
      if (offset + 2 <= data.byteLength) {
        const elapsed = data.getUint16(offset, true);
        if (elapsed > 0) partial.elapsedSeconds = elapsed;
        offset += 2;
        steps.push({
          field: "elapsedTime",
          offset: o,
          rawValue: elapsed,
          convertedValue: `${elapsed} seconds`,
          skipped: false,
        });
      }
    } else {
      skip("elapsedTime", offset);
    }

    // Bit 12 — Remaining Time (uint16LE) — skip
    if (flags & 0x1000) {
      if (offset + 2 <= data.byteLength) {
        const remaining = data.getUint16(offset, true);
        steps.push({
          field: "remainingTime",
          offset,
          rawValue: remaining,
          convertedValue: `${remaining} seconds`,
          skipped: false,
        });
        offset += 2;
      }
    } else {
      skip("remainingTime", offset);
    }
  } catch (e) {
    console.warn("[FitKit Parse] parse error:", e);
  }

  console.log("[FitKit Result]", JSON.stringify(partial));

  return {
    metrics: partial,
    rawHex,
    flagsHex,
    flagsBinary,
    flagBits,
    parsedSteps: steps,
    lastRawBytes: byteArr,
  };
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useFitKit() {
  const [connectionState, setConnectionState] =
    useState<BikeConnectionState>("idle");
  const [metrics, setMetrics] = useState<RideMetrics>(DEFAULT_METRICS);
  const [rideState, setRideState] = useState<
    "idle" | "riding" | "paused" | "stopped"
  >("idle");
  const [isRiding, setIsRiding] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [connectionLog, setConnectionLog] = useState<ConnectionLogEntry[]>([]);
  const [debugState, setDebugState] = useState<FitKitDebugState>({
    rawHex: "",
    flagsHex: "",
    flagsBinary: "",
    flagBits: {},
    parsedSteps: [],
    finalResult: {},
    packetCount: 0,
    lastPacketTime: null,
    connectionLog: [],
    indoorBikeDebug: {
      packets: 0,
      lastRawBytes: [],
      flagsHex: "",
      flagsBinary: "",
      parsedFields: "",
      lastPacketTime: null,
    },
  });
  const [discoveredServices, setDiscoveredServices] = useState<
    DiscoveredService[]
  >([]);

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const serverRef = useRef<BluetoothRemoteGATTServer | null>(null);
  const characteristicsRef = useRef<BluetoothRemoteGATTCharacteristic[]>([]);
  const ctrlCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  // accumulated elapsed seconds before the current segment started
  const pausedAccumulatedRef = useRef(0);
  const metricsRef = useRef<RideMetrics>(DEFAULT_METRICS);
  const bikeElapsedRef = useRef(false);
  const packetCountRef = useRef(0);
  const rideStateRef = useRef<"idle" | "riding" | "paused" | "stopped">("idle");

  const addLog = useCallback(
    (message: string, status: "info" | "success" | "error") => {
      const entry: ConnectionLogEntry = {
        message,
        status,
        timestamp: new Date(),
      };
      setConnectionLog((prev) => [entry, ...prev]);
      setDebugState((prev) => ({
        ...prev,
        connectionLog: [entry, ...prev.connectionLog],
      }));
    },
    [],
  );

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Indoor Bike Data notification handler (00002ad2) ─────────────────────
  const handleIndoorBikeData = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const data = target.value;
    if (!data) return;

    packetCountRef.current += 1;
    const count = packetCountRef.current;

    const {
      metrics: partial,
      rawHex,
      flagsHex,
      flagsBinary,
      flagBits,
      parsedSteps,
      lastRawBytes,
    } = parseIndoorBikeData(data, count);

    const fieldNames = parsedSteps
      .filter((s) => !s.skipped)
      .map((s) => s.field)
      .join(", ");

    setDebugState((prev) => ({
      ...prev,
      rawHex,
      flagsHex,
      flagsBinary,
      flagBits,
      parsedSteps,
      finalResult: partial,
      packetCount: count,
      lastPacketTime: Date.now(),
      indoorBikeDebug: {
        packets: count,
        lastRawBytes,
        flagsHex,
        flagsBinary,
        parsedFields: fieldNames,
        lastPacketTime: Date.now(),
      },
    }));

    if (partial.elapsedSeconds !== undefined && partial.elapsedSeconds > 0) {
      bikeElapsedRef.current = true;
    }

    // Only merge bike-reported elapsedSeconds when actively riding
    const shouldApplyElapsed =
      rideStateRef.current === "riding" || rideStateRef.current === "idle";

    if (Object.keys(partial).length > 0) {
      setMetrics((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(partial) as (keyof RideMetrics)[]) {
          if (key === "elapsedSeconds" && !shouldApplyElapsed) {
            continue;
          }
          (next as Record<keyof RideMetrics, unknown>)[key] = partial[key];
        }
        metricsRef.current = next;
        return next;
      });
    }
  }, []);

  const handleTrainingStatusChar = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const data = target.value;
    if (data)
      console.log(`[FitKit Training Status 00002ad3] raw: ${toHex(data)}`);
  }, []);

  const handleTrainingStatus = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const data = target.value;
    if (data)
      console.log(`[FitKit Training Status 00002ada] raw: ${toHex(data)}`);
  }, []);

  const handleFff1 = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const data = target.value;
    if (!data) return;
    const byteArr = Array.from({ length: data.byteLength }, (_, i) =>
      data.getUint8(i),
    );
    const hexStr = byteArr
      .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
      .join(" ");
    console.log(`[FitKit fff1 heartbeat] ${hexStr}`);
  }, []);

  // ── Send FTMS control command — fail silently ───────────────────────────
  const sendFtmsCommand = useCallback(async (opcode: number) => {
    const ctrl = ctrlCharRef.current;
    if (!ctrl) return;
    try {
      await ctrl.writeValueWithResponse(new Uint8Array([opcode]));
    } catch {
      /* fail silently — UI state still updates */
    }
  }, []);

  const disconnect = useCallback(() => {
    stopTimer();
    for (const ch of characteristicsRef.current) {
      try {
        ch.removeEventListener(
          "characteristicvaluechanged",
          handleIndoorBikeData,
        );
        ch.removeEventListener(
          "characteristicvaluechanged",
          handleTrainingStatus,
        );
        ch.removeEventListener(
          "characteristicvaluechanged",
          handleTrainingStatusChar,
        );
        ch.removeEventListener("characteristicvaluechanged", handleFff1);
        ch.stopNotifications().catch(() => {});
      } catch {
        /* ignore */
      }
    }
    characteristicsRef.current = [];
    ctrlCharRef.current = null;
    if (serverRef.current?.connected) {
      serverRef.current.disconnect();
    }
    serverRef.current = null;
    bikeElapsedRef.current = false;
    packetCountRef.current = 0;
    pausedAccumulatedRef.current = 0;
    setIsRiding(false);
    setIsPaused(false);
    setRideState("idle");
    rideStateRef.current = "idle";
    setConnectionState("disconnected");
    setMetrics(DEFAULT_METRICS);
    setConnectionLog([]);
    setDebugState({
      rawHex: "",
      flagsHex: "",
      flagsBinary: "",
      flagBits: {},
      parsedSteps: [],
      finalResult: {},
      packetCount: 0,
      lastPacketTime: null,
      connectionLog: [],
      indoorBikeDebug: {
        packets: 0,
        lastRawBytes: [],
        flagsHex: "",
        flagsBinary: "",
        parsedFields: "",
        lastPacketTime: null,
      },
    });
  }, [
    stopTimer,
    handleIndoorBikeData,
    handleTrainingStatus,
    handleTrainingStatusChar,
    handleFff1,
  ]);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      addLog(
        "Web Bluetooth not available — use Chrome or Edge on desktop",
        "error",
      );
      setConnectionState("error");
      return;
    }

    setConnectionLog([]);
    setDebugState((prev) => ({ ...prev, connectionLog: [] }));

    try {
      setConnectionState("scanning");
      bikeElapsedRef.current = false;
      packetCountRef.current = 0;

      addLog("Requesting Bluetooth device...", "info");
      let device: BluetoothDevice;
      try {
        device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: OPTIONAL_SERVICES,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog(`Device request failed: ${msg}`, "error");
        setConnectionState("idle");
        return;
      }
      addLog(`Device found: ${device.name ?? "(unnamed)"}`, "success");
      deviceRef.current = device;

      device.addEventListener("gattserverdisconnected", () => {
        setConnectionState("disconnected");
        setIsRiding(false);
        setIsPaused(false);
        setRideState("stopped");
        rideStateRef.current = "stopped";
        stopTimer();
      });

      addLog("Connecting to GATT server...", "info");
      let server: BluetoothRemoteGATTServer;
      try {
        server = await device.gatt!.connect();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog(`GATT connect failed: ${msg}`, "error");
        setConnectionState("error");
        return;
      }
      serverRef.current = server;
      addLog("GATT connected", "success");

      // Discover and log all services
      const discoveredList: DiscoveredService[] = [];
      try {
        const allServices = await server.getPrimaryServices();
        for (const svc of allServices) {
          const svcEntry: DiscoveredService = {
            serviceUuid: svc.uuid,
            characteristics: [],
          };
          try {
            const chars = await svc.getCharacteristics();
            for (const ch of chars) {
              const props: string[] = [];
              if (ch.properties.notify) props.push("notify");
              if (ch.properties.indicate) props.push("indicate");
              if (ch.properties.read) props.push("read");
              if (ch.properties.write) props.push("write");
              if (ch.properties.writeWithoutResponse)
                props.push("writeWithoutResponse");
              svcEntry.characteristics.push({
                uuid: ch.uuid,
                properties: props,
              });
            }
          } catch {
            /* ignore */
          }
          discoveredList.push(svcEntry);
        }
      } catch {
        /* ignore */
      }
      setDiscoveredServices(discoveredList);

      // ── 1. Get FTMS service ────────────────────────────────────────────────
      addLog("Getting FTMS service 00001826...", "info");
      let ftmsSvc: BluetoothRemoteGATTService;
      try {
        ftmsSvc = await server.getPrimaryService(FTMS_SERVICE);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog(`Failed to get FTMS service: ${msg}`, "error");
        setConnectionState("error");
        return;
      }
      addLog("Got FTMS service", "success");

      // ── 2. Read FTMS Feature flags ─────────────────────────────────────────
      try {
        const featureChar = await ftmsSvc.getCharacteristic(FTMS_FEATURE);
        const val = await featureChar.readValue();
        addLog(`FTMS Feature flags: ${toHex(val)}`, "info");
      } catch {
        /* ignore */
      }

      // ── 3. Subscribe to Indoor Bike Data (00002ad2) — the real data channel ─
      addLog("Getting characteristic 00002ad2 (Indoor Bike Data)...", "info");
      try {
        const bikeDataChar = await ftmsSvc.getCharacteristic(INDOOR_BIKE_DATA);
        addLog("Got characteristic 00002ad2", "success");
        addLog(
          "Starting notifications on 00002ad2 (Indoor Bike Data)...",
          "info",
        );
        bikeDataChar.addEventListener(
          "characteristicvaluechanged",
          handleIndoorBikeData,
        );
        await bikeDataChar.startNotifications();
        characteristicsRef.current.push(bikeDataChar);
        addLog(
          "Subscribed to Indoor Bike Data (00002ad2) — listening for ride data",
          "success",
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog(
          `Failed to subscribe to Indoor Bike Data (00002ad2): ${msg}`,
          "error",
        );
        // Fatal — this is the only real data channel
        setConnectionState("error");
        return;
      }

      // ── 4. Subscribe to Control Point indications (00002ad9) ───────────────
      let ctrlChar: BluetoothRemoteGATTCharacteristic | null = null;
      try {
        ctrlChar = await ftmsSvc.getCharacteristic(CONTROL_POINT);
        ctrlCharRef.current = ctrlChar;
        ctrlChar.addEventListener("characteristicvaluechanged", (e: Event) => {
          const target = e.target as BluetoothRemoteGATTCharacteristic;
          const d = target.value;
          if (!d) return;
          const hex = toHex(d);
          console.log(`[FitKit] Control Point indication: ${hex}`);
          // 0x80 0x00 0x01 = Request Control success
          // 0x80 0x07 0x01 = Start or Resume success
          const opcode = d.getUint8(0);
          const reqOpcode = d.getUint8(1);
          const resultCode = d.getUint8(2);
          if (opcode === 0x80 && resultCode === 0x01) {
            addLog(
              `Control Point ACK: op=0x${reqOpcode.toString(16).padStart(2, "0")} → success`,
              "success",
            );
          } else {
            addLog(`Control Point indication: ${hex}`, "info");
          }
        });
        await ctrlChar.startNotifications();
        characteristicsRef.current.push(ctrlChar);
        addLog(
          "Subscribed to Control Point (00002ad9) for indications",
          "info",
        );
      } catch {
        addLog("Control Point subscribe failed — non-fatal", "info");
      }

      // ── 5. Subscribe to Training Status (00002ada) — log only ─────────────
      try {
        const trainingChar = await ftmsSvc.getCharacteristic(TRAINING_STATUS);
        trainingChar.addEventListener(
          "characteristicvaluechanged",
          handleTrainingStatus,
        );
        await trainingChar.startNotifications();
        characteristicsRef.current.push(trainingChar);
        addLog("Subscribed to Training Status (00002ada) — log only", "info");
      } catch {
        /* ignore */
      }

      // ── 6. Subscribe to 00002ad3 Training Status char — log only ──────────
      try {
        const tsChar = await ftmsSvc.getCharacteristic(TRAINING_STATUS_CHAR);
        tsChar.addEventListener(
          "characteristicvaluechanged",
          handleTrainingStatusChar,
        );
        await tsChar.startNotifications();
        characteristicsRef.current.push(tsChar);
        addLog("Subscribed to 00002ad3 (Training Status) — log only", "info");
      } catch {
        /* ignore */
      }

      // ── 7. Subscribe to fff1 heartbeat — log only, NOT ride data ──────────
      try {
        const propSvc = await server.getPrimaryService(PROPRIETARY_SERVICE);
        const fff1Char = await propSvc.getCharacteristic(PROPRIETARY_FFF1);
        fff1Char.addEventListener("characteristicvaluechanged", handleFff1);
        await fff1Char.startNotifications();
        characteristicsRef.current.push(fff1Char);
        addLog("Subscribed to fff1 (heartbeat only — not ride data)", "info");
      } catch {
        /* ignore */
      }

      // ── 8. Send Request Control (0x00) to Control Point ───────────────────
      if (ctrlChar) {
        try {
          await ctrlChar.writeValueWithResponse(new Uint8Array([0x00]));
          addLog(
            "Sent Request Control (0x00) to Control Point 00002ad9",
            "success",
          );
        } catch (e) {
          console.warn("[FitKit] Request Control failed:", e);
          addLog("Request Control failed — non-fatal", "info");
        }

        // ── 9. Wait for indication then send Start or Resume (0x07) ──────────
        await new Promise((r) => setTimeout(r, 500));
        try {
          await ctrlChar.writeValueWithResponse(new Uint8Array([0x07]));
          addLog("Sent Start or Resume (0x07) to Control Point", "success");
        } catch (e) {
          console.warn("[FitKit] Start or Resume failed:", e);
          addLog("Start or Resume failed — non-fatal", "info");
        }
      }

      // Device info read (logging only)
      try {
        const devInfoSvc = await server.getPrimaryService(DEVICE_INFO_SERVICE);
        const devInfoChars = await devInfoSvc.getCharacteristics();
        for (const ch of devInfoChars) {
          if (ch.properties.read) {
            try {
              const val = await ch.readValue();
              const text = new TextDecoder().decode(val);
              console.log(`[FitKit] DevInfo ${ch.uuid}: "${text}"`);
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        /* ignore */
      }

      const total = characteristicsRef.current.length;
      addLog(
        `Connection complete — ${total} subscription(s) active`,
        "success",
      );
      setConnectionState("connected");
    } catch (err) {
      const error = err as Error;
      addLog(`Connection error: ${error.message ?? String(error)}`, "error");
      if (error.name === "NotFoundError" || error.name === "AbortError") {
        setConnectionState("idle");
      } else {
        setConnectionState("error");
      }
    }
  }, [
    addLog,
    stopTimer,
    handleIndoorBikeData,
    handleTrainingStatus,
    handleTrainingStatusChar,
    handleFff1,
  ]);

  const startRide = useCallback(() => {
    startTimeRef.current = Date.now();
    pausedAccumulatedRef.current = 0;
    bikeElapsedRef.current = false;
    setIsPaused(false);
    setIsRiding(true);
    setRideState("riding");
    rideStateRef.current = "riding";
    setMetrics((prev) => ({ ...prev, elapsedSeconds: 0 }));

    timerRef.current = setInterval(() => {
      if (!bikeElapsedRef.current) {
        const elapsed =
          pausedAccumulatedRef.current +
          Math.floor(
            (Date.now() - (startTimeRef.current ?? Date.now())) / 1000,
          );
        setMetrics((prev) => {
          const next = { ...prev, elapsedSeconds: elapsed };
          metricsRef.current = next;
          return next;
        });
      }
    }, 1000);
  }, []);

  const stopRide = useCallback(() => {
    stopTimer();
    setIsRiding(false);
    setIsPaused(false);
    setRideState("stopped");
    rideStateRef.current = "stopped";
    startTimeRef.current = null;
    pausedAccumulatedRef.current = 0;
    const snapshot = metricsRef.current;
    setMetrics((prev) => {
      const next = { ...prev, elapsedSeconds: 0 };
      metricsRef.current = next;
      return next;
    });
    return snapshot;
  }, [stopTimer]);

  const pauseRide = useCallback(async () => {
    if (rideStateRef.current !== "riding") return;
    // Accumulate elapsed before stopping the interval
    pausedAccumulatedRef.current +=
      startTimeRef.current !== null
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0;
    stopTimer();
    setIsPaused(true);
    setRideState("paused");
    rideStateRef.current = "paused";
    // Tell the bike to stop via FTMS (0x02 = Stop). Fail silently.
    void sendFtmsCommand(0x02);
  }, [stopTimer, sendFtmsCommand]);

  const resumeRide = useCallback(async () => {
    if (rideStateRef.current !== "paused") return;
    startTimeRef.current = Date.now();
    setIsPaused(false);
    setRideState("riding");
    rideStateRef.current = "riding";
    // Restart local timer
    timerRef.current = setInterval(() => {
      if (!bikeElapsedRef.current) {
        const elapsed =
          pausedAccumulatedRef.current +
          Math.floor(
            (Date.now() - (startTimeRef.current ?? Date.now())) / 1000,
          );
        setMetrics((prev) => {
          const next = { ...prev, elapsedSeconds: elapsed };
          metricsRef.current = next;
          return next;
        });
      }
    }, 1000);
    // Tell the bike to start/resume via FTMS (0x07). Fail silently.
    void sendFtmsCommand(0x07);
  }, [sendFtmsCommand]);

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  return {
    connect,
    disconnect,
    connectionState,
    isConnected: connectionState === "connected",
    metrics,
    startRide,
    stopRide,
    pauseRide,
    resumeRide,
    isRiding,
    isPaused,
    rideState,
    elapsedSeconds: metrics.elapsedSeconds,
    discoveredServices,
    debugState,
    connectionLog,
    noDataWarning: false,
    lastRawPacket: debugState?.rawHex ?? "",
  };
}
