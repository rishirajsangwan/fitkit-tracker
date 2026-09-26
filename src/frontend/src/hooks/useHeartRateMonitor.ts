import { useCallback, useRef, useState } from "react";

export interface HeartRateData {
  currentBpm: number;
  avgBpm: number;
  maxBpm: number;
  sampleCount: number;
}

export interface HeartRateMonitorState extends HeartRateData {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

const HR_SERVICE_UUID = 0x180d;
const HR_MEASUREMENT_UUID = 0x2a37;

function parseHeartRate(data: DataView): number {
  // Bit 0 of first byte: 0 = uint8 format, 1 = uint16LE format
  const flags = data.getUint8(0);
  const is16Bit = (flags & 0x01) !== 0;
  if (is16Bit) {
    return data.getUint16(1, true);
  }
  return data.getUint8(1);
}

export function useHeartRateMonitor() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBpm, setCurrentBpm] = useState(0);
  const [maxBpm, setMaxBpm] = useState(0);
  const [avgBpm, setAvgBpm] = useState(0);

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const charRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const samplesRef = useRef<number[]>([]);

  const handleHrChange = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (!target.value) return;
    const bpm = parseHeartRate(target.value);
    if (bpm <= 0 || bpm > 250) return;

    samplesRef.current.push(bpm);
    const samples = samplesRef.current;
    const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
    const max = Math.max(...samples);

    setCurrentBpm(bpm);
    setAvgBpm(avg);
    setMaxBpm(max);
  }, []);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      setError("Web Bluetooth not available — use Chrome or Edge");
      return;
    }
    setError(null);
    setIsConnecting(true);
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "boAt" }],
        optionalServices: [HR_SERVICE_UUID],
      });
      deviceRef.current = device;

      device.addEventListener("gattserverdisconnected", () => {
        setIsConnected(false);
        setCurrentBpm(0);
      });

      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService(HR_SERVICE_UUID);
      const characteristic =
        await service.getCharacteristic(HR_MEASUREMENT_UUID);
      charRef.current = characteristic;
      characteristic.addEventListener(
        "characteristicvaluechanged",
        handleHrChange,
      );
      await characteristic.startNotifications();

      setIsConnected(true);
    } catch (err) {
      // If boAt filter fails, try acceptAllDevices with HR service
      try {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [HR_SERVICE_UUID],
        });
        deviceRef.current = device;

        device.addEventListener("gattserverdisconnected", () => {
          setIsConnected(false);
          setCurrentBpm(0);
        });

        const server = await device.gatt!.connect();
        const service = await server.getPrimaryService(HR_SERVICE_UUID);
        const characteristic =
          await service.getCharacteristic(HR_MEASUREMENT_UUID);
        charRef.current = characteristic;
        characteristic.addEventListener(
          "characteristicvaluechanged",
          handleHrChange,
        );
        await characteristic.startNotifications();
        setIsConnected(true);
      } catch (fallbackErr) {
        const msg =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : String(fallbackErr);
        if (err instanceof Error && err.name === "NotFoundError") {
          // User cancelled
        } else {
          setError(msg);
        }
      }
    } finally {
      setIsConnecting(false);
    }
  }, [handleHrChange]);

  const disconnect = useCallback(() => {
    if (charRef.current) {
      try {
        charRef.current.removeEventListener(
          "characteristicvaluechanged",
          handleHrChange,
        );
        charRef.current.stopNotifications().catch(() => {});
      } catch {
        /* ignore */
      }
      charRef.current = null;
    }
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    deviceRef.current = null;
    setIsConnected(false);
    setCurrentBpm(0);
    setAvgBpm(0);
    setMaxBpm(0);
    samplesRef.current = [];
    setError(null);
  }, [handleHrChange]);

  const reset = useCallback(() => {
    samplesRef.current = [];
    setCurrentBpm(0);
    setAvgBpm(0);
    setMaxBpm(0);
  }, []);

  return {
    connect,
    disconnect,
    reset,
    isConnected,
    isConnecting,
    error,
    currentBpm,
    avgBpm,
    maxBpm,
  };
}
