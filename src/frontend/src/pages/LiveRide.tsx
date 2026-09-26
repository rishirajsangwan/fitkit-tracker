import { StreakTracker } from "@/components/StreakTracker";
import { Button } from "@/components/ui/button";
import type {
  ConnectionLogEntry,
  DiscoveredService,
  FitKitDebugState,
  ParseStep,
  useFitKit,
} from "@/hooks/useFitKit";
import { useHeartRateMonitor } from "@/hooks/useHeartRateMonitor";
import { useVoiceAnnouncements } from "@/hooks/useVoiceAnnouncements";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { cn } from "@/lib/utils";
import { calculateRecommendedHydration } from "@/utils/hydrationUtils";
import {
  AlertTriangle,
  Bike,
  BluetoothOff,
  Droplets,
  Heart,
  Pause,
  Play,
  Square,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const MAX_HR = 190;
const MAX_SPEED_POINTS = 60;

type SpeedPoint = { t: number; speed: number };

type HrZone = {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
};

function getHrZone(bpm: number): HrZone {
  const pct = (bpm / MAX_HR) * 100;
  if (pct < 60)
    return {
      label: "Rest",
      color: "text-sky-300",
      bgColor: "bg-sky-900/30",
      borderColor: "border-sky-500/40",
    };
  if (pct < 70)
    return {
      label: "Fat Burn",
      color: "text-emerald-300",
      bgColor: "bg-emerald-900/30",
      borderColor: "border-emerald-500/40",
    };
  if (pct < 80)
    return {
      label: "Cardio",
      color: "text-amber-300",
      bgColor: "bg-amber-900/30",
      borderColor: "border-amber-500/40",
    };
  if (pct < 90)
    return {
      label: "Peak",
      color: "text-orange-300",
      bgColor: "bg-orange-900/30",
      borderColor: "border-orange-500/40",
    };
  return {
    label: "Max",
    color: "text-red-300",
    bgColor: "bg-red-900/40",
    borderColor: "border-red-500/50",
  };
}

// ─── Speed Graph ──────────────────────────────────────────────────────────────
interface SpeedGraphProps {
  data: SpeedPoint[];
  isRiding: boolean;
}

function SpeedGraph({ data, isRiding }: SpeedGraphProps) {
  const maxSpeed = Math.max(...data.map((d) => d.speed), 1);
  const domainMax = Math.ceil(maxSpeed * 1.2);

  if (!isRiding && data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-card overflow-hidden"
      data-ocid="live.speed_graph"
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground font-body">
          Speed
        </span>
        <div className="flex items-center gap-1.5">
          {isRiding && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
          )}
          <span className="text-[10px] font-mono text-muted-foreground">
            Last {Math.min(data.length, MAX_SPEED_POINTS)}s
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 12, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="oklch(0.26 0.018 280 / 0.25)"
            horizontal={false}
          />
          <YAxis
            domain={[0, domainMax]}
            tick={{ fontSize: 9, fill: "oklch(0.55 0.012 280)" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-card border border-primary/30 rounded-md px-2 py-1 text-[11px] shadow-lg">
                  <span className="font-mono font-bold text-primary">
                    {(payload[0].value as number).toFixed(1)}
                  </span>
                  <span className="text-muted-foreground ml-1">km/h</span>
                </div>
              );
            }}
            cursor={{ stroke: "oklch(0.65 0.25 185 / 0.3)", strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="speed"
            stroke="oklch(0.65 0.25 185)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  hero?: boolean;
  positive?: boolean;
  intensity?: boolean;
  isActive: boolean;
  ocid?: string;
}

function MetricCard({
  label,
  value,
  unit,
  hero,
  positive,
  intensity,
  isActive,
  ocid,
}: MetricCardProps) {
  const prevValue = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (isActive && prevValue.current !== value) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 300);
      prevValue.current = value;
      return () => clearTimeout(t);
    }
  }, [value, isActive]);

  return (
    <div
      data-ocid={ocid}
      className={cn(
        "rounded-xl border flex flex-col gap-1.5 transition-all duration-300 overflow-hidden",
        hero
          ? isActive
            ? "bg-primary border-primary/60 shadow-[0_0_32px_oklch(0.65_0.25_185/0.3)] p-5"
            : "bg-primary/8 border-primary/20 p-5"
          : intensity
            ? isActive
              ? "bg-[oklch(0.72_0.2_30/0.08)] border-[oklch(0.72_0.2_30/0.4)] p-4"
              : "bg-card border-border p-4"
            : positive
              ? isActive
                ? "bg-accent/10 border-accent/40 p-4"
                : "bg-card border-border p-4"
              : "bg-card border-border p-4",
        flash && "scale-[1.02]",
      )}
    >
      <span
        className={cn(
          "text-[10px] font-semibold tracking-[0.18em] uppercase font-body",
          hero && isActive
            ? "text-primary-foreground/70"
            : hero
              ? "text-primary/60"
              : intensity && isActive
                ? "text-[oklch(0.72_0.2_30)]/80"
                : positive && isActive
                  ? "text-accent/80"
                  : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span
          className={cn(
            "font-mono font-bold tabular-nums leading-none",
            hero ? "text-5xl" : "text-[2.25rem]",
            hero && isActive
              ? "text-primary-foreground metric-glow"
              : hero
                ? "text-primary"
                : intensity && isActive
                  ? "text-[oklch(0.72_0.2_30)] metric-glow-orange"
                  : positive && isActive
                    ? "text-accent metric-glow-accent"
                    : "text-foreground",
          )}
        >
          {value}
        </span>
        {unit && (
          <span
            className={cn(
              "text-sm font-body shrink-0",
              hero && isActive
                ? "text-primary-foreground/60"
                : hero
                  ? "text-primary/50"
                  : intensity && isActive
                    ? "text-[oklch(0.72_0.2_30)]/60"
                    : positive && isActive
                      ? "text-accent/60"
                      : "text-muted-foreground",
            )}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Heart Rate Card ──────────────────────────────────────────────────────────
interface HeartRateCardProps {
  currentBpm: number;
  avgBpm: number;
  maxBpm: number;
  isConnected: boolean;
  isRiding: boolean;
}

function HeartRateCard({
  currentBpm,
  avgBpm,
  maxBpm,
  isConnected,
  isRiding,
}: HeartRateCardProps) {
  const zone = getHrZone(currentBpm);
  const isActive = isConnected && currentBpm > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border p-4 transition-all duration-300",
        isActive
          ? `${zone.bgColor} ${zone.borderColor} shadow-[0_0_24px_oklch(0.65_0.2_15/0.25)]`
          : "bg-card border-border",
      )}
      data-ocid="live.hr.card"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-[10px] font-semibold tracking-[0.18em] uppercase font-body text-muted-foreground">
          Heart Rate
        </span>
        {isActive && (
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border font-body",
              zone.color,
              zone.bgColor,
              zone.borderColor,
            )}
          >
            {zone.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <Heart
          className={cn(
            "w-7 h-7 shrink-0 transition-colors duration-300",
            isActive
              ? "text-rose-400 fill-rose-400/30"
              : "text-muted-foreground",
          )}
          style={
            isActive && isRiding
              ? { animation: "pulse 0.8s ease-in-out infinite" }
              : {}
          }
        />
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-mono font-bold tabular-nums leading-none text-5xl",
              isActive ? "text-rose-300" : "text-muted-foreground/40",
            )}
            data-ocid="live.hr.bpm"
          >
            {isActive ? currentBpm : "--"}
          </span>
          <span
            className={cn(
              "text-sm font-body",
              isActive ? "text-rose-300/60" : "text-muted-foreground/30",
            )}
          >
            BPM
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-background/40 border border-border/50 px-3 py-2">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground font-body mb-0.5">
            Avg
          </p>
          <p
            className={cn(
              "font-mono font-bold text-xl tabular-nums",
              avgBpm > 0 ? "text-rose-300/80" : "text-muted-foreground/30",
            )}
            data-ocid="live.hr.avg_bpm"
          >
            {avgBpm > 0 ? avgBpm : "--"}
            <span className="text-xs text-muted-foreground/50 ml-0.5 font-normal">
              bpm
            </span>
          </p>
        </div>
        <div className="rounded-lg bg-background/40 border border-border/50 px-3 py-2">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground font-body mb-0.5">
            Max
          </p>
          <p
            className={cn(
              "font-mono font-bold text-xl tabular-nums",
              maxBpm > 0 ? "text-rose-300/80" : "text-muted-foreground/30",
            )}
            data-ocid="live.hr.max_bpm"
          >
            {maxBpm > 0 ? maxBpm : "--"}
            <span className="text-xs text-muted-foreground/50 ml-0.5 font-normal">
              bpm
            </span>
          </p>
        </div>
      </div>

      {isActive && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-background/40 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((currentBpm / MAX_HR) * 100, 100)}%`,
                background: `oklch(0.65 0.2 ${currentBpm > 155 ? "22" : currentBpm > 133 ? "50" : currentBpm > 114 ? "90" : currentBpm > 95 ? "145" : "210"})`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            {["Rest", "Fat Burn", "Cardio", "Peak", "Max"].map((z) => (
              <span
                key={z}
                className={cn(
                  "text-[9px] font-body",
                  zone.label === z ? zone.color : "text-muted-foreground/40",
                )}
              >
                {z}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Hydration Modal ──────────────────────────────────────────────────────────
interface HydrationModalProps {
  isOpen: boolean;
  recommendedMl: number;
  onConfirm: (ml: number) => void;
  onSkip: () => void;
}

function HydrationModal({
  isOpen,
  recommendedMl,
  onConfirm,
  onSkip,
}: HydrationModalProps) {
  const [loggedMl, setLoggedMl] = useState(0);
  const [customInput, setCustomInput] = useState("");

  const handleAdd = (ml: number) => setLoggedMl((prev) => prev + ml);

  const handleCustomAdd = () => {
    const val = Number.parseInt(customInput, 10);
    if (!Number.isNaN(val) && val > 0) {
      setLoggedMl((prev) => prev + val);
      setCustomInput("");
    }
  };

  const handleConfirm = () => {
    onConfirm(loggedMl);
    setLoggedMl(0);
    setCustomInput("");
  };
  const handleSkip = () => {
    onSkip();
    setLoggedMl(0);
    setCustomInput("");
  };

  if (!isOpen) return null;
  const progressPct = Math.min((loggedMl / recommendedMl) * 100, 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="hydration-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          data-ocid="live.hydration.dialog"
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <div className="bg-sky-900/40 border-b border-sky-500/30 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-sky-300" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground text-lg">
                    Hydration Check
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Great ride! Time to rehydrate.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="rounded-xl border border-sky-500/30 bg-sky-900/20 px-4 py-3 flex items-center gap-3">
                <Droplets className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Recommended intake
                  </p>
                  <p className="font-display font-bold text-2xl text-sky-300">
                    {recommendedMl.toLocaleString()}
                    <span className="text-sm font-body font-normal text-sky-300/60 ml-1">
                      ml
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-body text-muted-foreground">
                    Total logged today
                  </span>
                  <span
                    className="font-mono font-bold text-sky-300 text-lg tabular-nums"
                    data-ocid="live.hydration.logged_total"
                  >
                    {loggedMl.toLocaleString()} ml
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-sky-400"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                {loggedMl >= recommendedMl && (
                  <p className="text-xs text-emerald-400 font-body mt-1">
                    ✓ Goal reached!
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground font-body">
                  Quick Add
                </p>
                <div className="flex gap-2">
                  {[250, 500, 750].map((ml) => (
                    <Button
                      key={ml}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 font-mono border-sky-500/40 text-sky-300 hover:bg-sky-900/40 hover:border-sky-400"
                      onClick={() => handleAdd(ml)}
                      data-ocid={`live.hydration.add_${ml}_button`}
                    >
                      +{ml}ml
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="5000"
                  placeholder="Custom ml"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustomAdd()}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  data-ocid="live.hydration.custom_input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-sky-500/40 text-sky-300 hover:bg-sky-900/40 px-4"
                  onClick={handleCustomAdd}
                  data-ocid="live.hydration.custom_add_button"
                >
                  Add
                </Button>
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleSkip}
                  data-ocid="live.hydration.skip_button"
                >
                  Skip
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-semibold"
                  onClick={handleConfirm}
                  data-ocid="live.hydration.confirm_button"
                >
                  <Droplets className="w-4 h-4 mr-1.5" />
                  Confirm & Save
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Browser Warning ──────────────────────────────────────────────────────────
function BrowserWarning() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3"
      data-ocid="live.browser_warning"
    >
      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
      <p className="text-sm text-destructive leading-snug">
        <strong className="font-semibold">Bluetooth not supported</strong> —
        this app requires <strong>Chrome</strong> or <strong>Edge</strong> on
        desktop.
      </p>
    </motion.div>
  );
}

function NotConnectedBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-4 py-14"
      data-ocid="live.empty_state"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Bike className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center space-y-1.5">
        <p className="font-display font-semibold text-lg text-foreground">
          No Bike Connected
        </p>
        <p className="text-sm text-muted-foreground">
          Tap <strong className="text-foreground font-medium">Connect</strong>{" "}
          in the header to pair your CultSport FitKit
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-full px-3 py-1.5 border border-border">
        <Zap className="w-3 h-3 text-accent" />
        Chrome &amp; Edge only — requires Bluetooth
      </div>
    </motion.div>
  );
}

function DisconnectedBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3"
      data-ocid="live.disconnected_state"
    >
      <BluetoothOff className="w-4 h-4 text-destructive shrink-0" />
      <p className="text-sm text-destructive">
        Bike disconnected. Tap{" "}
        <strong className="font-semibold">Reconnect</strong> in the header.
      </p>
    </motion.div>
  );
}

// ─── Debug Panel (hidden — triple-tap logo to reveal) ─────────────────────────
interface DebugPanelProps {
  debugState: FitKitDebugState;
  discoveredServices: DiscoveredService[];
  connectionLog: ConnectionLogEntry[];
  visible: boolean;
}

function DebugPanel({
  debugState,
  discoveredServices,
  connectionLog,
  visible,
}: DebugPanelProps) {
  const [gattCollapsed, setGattCollapsed] = useState(true);
  const [parseCollapsed, setParseCollapsed] = useState(true);

  if (!visible) return null;

  const hasPackets = debugState.packetCount > 0;
  const ibd = debugState.indoorBikeDebug;
  const isLive =
    ibd.lastPacketTime !== null &&
    Date.now() - (ibd.lastPacketTime ?? 0) < 5000;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 border-primary/40 bg-card text-xs"
      data-ocid="live.debug_panel"
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-primary/8 rounded-t-xl">
        <span
          className={cn(
            "w-2.5 h-2.5 rounded-full shrink-0",
            isLive
              ? "bg-green-500 animate-pulse"
              : hasPackets
                ? "bg-yellow-500"
                : "bg-muted-foreground/50",
          )}
        />
        <span className="font-mono font-bold text-primary flex-1">
          🔧 Bluetooth Debug — Indoor Bike Data
        </span>
        <span className="text-muted-foreground font-mono text-[10px]">
          Triple-tap logo to hide
        </span>
        <span className="text-muted-foreground font-mono">
          {hasPackets ? `${debugState.packetCount} pkts` : "Waiting..."}
        </span>
      </div>
      <div className="p-3 space-y-4">
        <section className="rounded-lg border border-primary/30 bg-primary/5 overflow-hidden">
          <div className="flex items-center gap-3 px-3 py-2 border-b border-primary/20">
            <span className="font-mono font-bold text-primary text-xs flex-1">
              Indoor Bike Data (00002ad2)
            </span>
            <span
              className={cn(
                "font-mono text-xs px-2 py-0.5 rounded-full border",
                isLive
                  ? "text-green-300 bg-green-900/40 border-green-500/50"
                  : hasPackets
                    ? "text-yellow-300 bg-yellow-900/40 border-yellow-500/50"
                    : "text-muted-foreground bg-muted/20 border-border",
              )}
            >
              {hasPackets
                ? `${debugState.packetCount} packets`
                : "No packets — pedal the bike"}
            </span>
          </div>
          <div className="p-3 space-y-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                Last raw packet
              </p>
              {!hasPackets ? (
                <p className="text-muted-foreground italic">
                  No packets received yet
                </p>
              ) : (
                <div className="font-mono break-all select-all rounded bg-background/80 border border-primary/30 px-2 py-2 text-foreground leading-relaxed text-[11px]">
                  {debugState.rawHex || "(empty)"}
                </div>
              )}
            </div>
            {hasPackets && (
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ["speed", debugState.finalResult.speedKph, "km/h"],
                    ["cadence", debugState.finalResult.cadenceRpm, "rpm"],
                    ["distance", debugState.finalResult.distanceKm, "km"],
                    ["resistance", debugState.finalResult.resistance, "lvl"],
                    ["calories", debugState.finalResult.calories, "kcal"],
                    ["elapsed", debugState.finalResult.elapsedSeconds, "s"],
                  ] as [string, number | undefined, string][]
                ).map(([label, val, unit]) => (
                  <div
                    key={label}
                    className="rounded bg-background/60 border border-border/60 px-2 py-1.5"
                  >
                    <p className="text-[10px] text-muted-foreground truncate">
                      {label}
                    </p>
                    <p
                      className={cn(
                        "font-mono font-bold text-[11px]",
                        val != null && val > 0
                          ? "text-green-400"
                          : "text-destructive/70",
                      )}
                    >
                      {val != null
                        ? typeof val === "number"
                          ? val.toFixed(2)
                          : val
                        : "0.00"}
                      <span className="text-muted-foreground font-normal ml-0.5 text-[10px]">
                        {unit}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        {hasPackets && debugState.parsedSteps.length > 0 && (
          <section>
            <button
              type="button"
              className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-1.5 hover:text-foreground transition-colors"
              onClick={() => setParseCollapsed((c) => !c)}
            >
              <span>Parse Steps ({debugState.parsedSteps.length})</span>
              <span>{parseCollapsed ? "▸" : "▾"}</span>
            </button>
            {!parseCollapsed && (
              <div className="rounded border border-border/60 overflow-hidden divide-y divide-border/40">
                {debugState.parsedSteps.map((step: ParseStep) => (
                  <div
                    key={step.field}
                    className={cn(
                      "grid grid-cols-[minmax(0,1fr)_auto_auto_minmax(0,1fr)] gap-x-3 px-2 py-1 font-mono",
                      step.skipped
                        ? "text-muted-foreground/50"
                        : step.rawValue != null && step.rawValue > 0
                          ? "text-green-400"
                          : "text-yellow-400/80",
                    )}
                  >
                    <span className="truncate font-semibold">{step.field}</span>
                    <span className="text-muted-foreground text-right">
                      @{step.offset}
                    </span>
                    <span className="text-right">
                      {step.skipped ? (
                        <span className="text-[10px] uppercase">skip</span>
                      ) : (
                        step.rawValue
                      )}
                    </span>
                    <span className="truncate text-right opacity-80">
                      {step.convertedValue}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
        <section>
          <p className="text-[10px] font-bold tracking-widest uppercase text-primary/80 mb-2">
            Connection Log
          </p>
          <div className="rounded border border-border/60 bg-background/60 divide-y divide-border/30 max-h-48 overflow-y-auto">
            {connectionLog.length === 0 ? (
              <p className="px-3 py-3 text-muted-foreground italic">
                Waiting for connection...
              </p>
            ) : (
              connectionLog.map((entry, i) => (
                <div
                  key={`${entry.timestamp.getTime()}-${i}`}
                  className={cn(
                    "flex items-start gap-2 px-3 py-1.5 font-mono leading-snug",
                    entry.status === "error" && "bg-destructive/8",
                    entry.status === "success" && "bg-green-500/5",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 text-[10px] font-bold mt-0.5 w-12 uppercase",
                      entry.status === "error" && "text-destructive",
                      entry.status === "success" && "text-green-400",
                      entry.status === "info" && "text-sky-400",
                    )}
                  >
                    {entry.status}
                  </span>
                  <span
                    className={cn(
                      "break-all",
                      entry.status === "error" && "text-destructive",
                      entry.status === "success" && "text-green-300",
                      entry.status === "info" && "text-slate-200",
                    )}
                  >
                    {entry.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
        <section>
          <button
            type="button"
            className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-1.5 hover:text-foreground transition-colors"
            onClick={() => setGattCollapsed((c) => !c)}
          >
            <span>GATT Services ({discoveredServices.length})</span>
            <span>{gattCollapsed ? "▸" : "▾"}</span>
          </button>
          {!gattCollapsed && discoveredServices.length > 0 && (
            <div className="rounded border border-border/60 bg-background/60 p-2 font-mono space-y-2 max-h-48 overflow-y-auto">
              {discoveredServices.map((svc) => (
                <div key={svc.serviceUuid}>
                  <span className="text-accent font-semibold">Service:</span>{" "}
                  <span className="text-foreground break-all">
                    {svc.serviceUuid}
                  </span>
                  {svc.characteristics.map((ch) => (
                    <div key={ch.uuid} className="ml-3 text-muted-foreground">
                      ↳ {ch.uuid}{" "}
                      <span
                        className={cn(
                          ch.uuid === "00002ad2-0000-1000-8000-00805f9b34fb"
                            ? "text-green-400 font-bold"
                            : "text-primary/70",
                        )}
                      >
                        [{ch.properties.join(", ")}]
                        {ch.uuid === "00002ad2-0000-1000-8000-00805f9b34fb" &&
                          " ← RIDE DATA"}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}

// ─── LiveRide Page ────────────────────────────────────────────────────────────
interface LiveRideProps {
  fitKit: ReturnType<typeof useFitKit>;
}

export default function LiveRide({ fitKit }: LiveRideProps) {
  const {
    metrics,
    isConnected,
    isRiding,
    isPaused,
    startRide,
    stopRide,
    pauseRide,
    resumeRide,
    connectionState,
    discoveredServices,
    debugState,
    connectionLog,
  } = fitKit;

  const hr = useHeartRateMonitor();
  const { saveWorkout, isSaving, workouts } = useWorkoutHistory();
  useVoiceAnnouncements(metrics.distanceKm, isRiding, isPaused);

  // Secret debug panel — triple-tap logo area
  const [debugVisible, setDebugVisible] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSecretTap = useCallback(() => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      if (tapCountRef.current >= 3) setDebugVisible((v) => !v);
      tapCountRef.current = 0;
    }, 600);
  }, []);

  // Speed history for graph — freeze when paused
  const [speedHistory, setSpeedHistory] = useState<SpeedPoint[]>([]);
  const lastSpeedSample = useRef(0);

  useEffect(() => {
    if (!isRiding || isPaused) return;
    const now = Date.now();
    if (now - lastSpeedSample.current < 900) return;
    lastSpeedSample.current = now;
    setSpeedHistory((prev) => {
      const next = [
        ...prev,
        { t: metrics.elapsedSeconds, speed: metrics.speedKph },
      ];
      return next.slice(-MAX_SPEED_POINTS);
    });
  }, [isRiding, isPaused, metrics.speedKph, metrics.elapsedSeconds]);

  const peakResRef = useRef(0);
  const minResRef = useRef(999);
  const resistanceSumRef = useRef(0);
  const resistanceSamplesRef = useRef(0);

  const [hydrationOpen, setHydrationOpen] = useState(false);
  const pendingRideRef = useRef<{
    finalMetrics: ReturnType<typeof stopRide>;
    avgBpm: number;
    maxBpm: number;
  } | null>(null);

  useEffect(() => {
    if (!isRiding || metrics.resistance === 0) return;
    peakResRef.current = Math.max(peakResRef.current, metrics.resistance);
    minResRef.current = Math.min(minResRef.current, metrics.resistance);
    resistanceSumRef.current += metrics.resistance;
    resistanceSamplesRef.current += 1;
  }, [isRiding, metrics.resistance]);

  // Weekly goal state
  const [weeklyGoalKm, setWeeklyGoalKm] = useState(50);

  const bluetoothUnsupported =
    typeof navigator !== "undefined" && !navigator.bluetooth;

  const handleStartRide = () => {
    peakResRef.current = 0;
    minResRef.current = 999;
    resistanceSumRef.current = 0;
    resistanceSamplesRef.current = 0;
    setSpeedHistory([]);
    hr.reset();
    startRide();
  };

  const handlePauseResume = () => {
    if (isPaused) {
      void resumeRide();
    } else {
      void pauseRide();
    }
  };

  const handleStopRide = () => {
    const finalMetrics = stopRide();
    if (finalMetrics.elapsedSeconds < 5) {
      toast.info("Ride too short to save (< 5 s).");
      return;
    }
    pendingRideRef.current = {
      finalMetrics,
      avgBpm: hr.avgBpm,
      maxBpm: hr.maxBpm,
    };
    setHydrationOpen(true);
  };

  const doSaveRide = async (hydrationLogged: number | null) => {
    const pending = pendingRideRef.current;
    if (!pending) return;
    const { finalMetrics, avgBpm, maxBpm } = pending;
    pendingRideRef.current = null;
    try {
      await saveWorkout({
        durationSeconds: finalMetrics.elapsedSeconds,
        distanceMeters: finalMetrics.distanceKm * 1000,
        calories: finalMetrics.calories,
        avgSpeedKph: finalMetrics.speedKph,
        peakResistance: Math.max(peakResRef.current, finalMetrics.resistance),
        minResistance:
          minResRef.current === 999
            ? finalMetrics.resistance
            : Math.min(minResRef.current, finalMetrics.resistance),
        maxResistance: Math.max(peakResRef.current, finalMetrics.resistance),
        avgResistance:
          resistanceSamplesRef.current > 0
            ? resistanceSumRef.current / resistanceSamplesRef.current
            : finalMetrics.resistance,
        avgHeartRate: avgBpm > 0 ? avgBpm : null,
        maxHeartRate: maxBpm > 0 ? maxBpm : null,
        hydrationLogged:
          hydrationLogged != null && hydrationLogged > 0
            ? hydrationLogged
            : null,
      });
      toast.success("Ride saved to history!");
    } catch {
      toast.error("Failed to save ride — check connection.");
    }
  };

  const handleHydrationConfirm = async (ml: number) => {
    setHydrationOpen(false);
    await doSaveRide(ml);
  };
  const handleHydrationSkip = async () => {
    setHydrationOpen(false);
    await doSaveRide(null);
  };

  const isIdle = connectionState === "idle" || connectionState === "error";
  const isDisconnected = connectionState === "disconnected";

  const recommendedHydration = pendingRideRef.current
    ? calculateRecommendedHydration(
        Math.round(pendingRideRef.current.finalMetrics.elapsedSeconds / 60),
        pendingRideRef.current.finalMetrics.calories,
        pendingRideRef.current.avgBpm > 0
          ? pendingRideRef.current.avgBpm
          : null,
      )
    : 0;

  return (
    <div className="space-y-4" data-ocid="live.page">
      {bluetoothUnsupported && <BrowserWarning />}

      <HydrationModal
        isOpen={hydrationOpen}
        recommendedMl={recommendedHydration || 500}
        onConfirm={handleHydrationConfirm}
        onSkip={handleHydrationSkip}
      />

      {/* Secret debug panel — triple-tap the logo area in header to reveal */}
      <DebugPanel
        debugState={debugState}
        discoveredServices={discoveredServices}
        connectionLog={connectionLog}
        visible={debugVisible}
      />

      {/* Timer + Controls Row */}
      <div className="flex items-end justify-between gap-4">
        {/* Timer — tap 3× quickly to toggle debug */}
        <button
          type="button"
          tabIndex={-1}
          onClick={handleSecretTap}
          className="cursor-default select-none text-left bg-transparent border-0 p-0"
          aria-label="Timer — triple-tap to toggle debug panel"
        >
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-muted-foreground font-body mb-1.5">
            {isRiding && isPaused
              ? "Paused"
              : isRiding
                ? "Live Workout"
                : "Ready to Ride"}
          </p>
          <motion.p
            key={metrics.elapsedSeconds}
            className={cn(
              "font-mono font-bold tabular-nums leading-none text-[3.5rem]",
              isRiding && !isPaused
                ? "text-primary metric-glow"
                : isRiding && isPaused
                  ? "text-amber-300"
                  : "text-foreground/60",
            )}
            data-ocid="live.timer"
          >
            {formatElapsed(metrics.elapsedSeconds)}
          </motion.p>
          {debugVisible && (
            <p className="text-[9px] text-primary/50 font-mono mt-0.5">
              🔧 debug on — tap 3× to hide
            </p>
          )}
        </button>

        <div className="flex flex-col items-end gap-2 pb-1">
          <Button
            type="button"
            variant={hr.isConnected ? "outline" : "secondary"}
            size="sm"
            onClick={hr.isConnected ? hr.disconnect : hr.connect}
            disabled={hr.isConnecting}
            className={cn(
              "gap-2 font-body text-xs transition-smooth",
              hr.isConnected
                ? "border-rose-500/50 text-rose-300 bg-rose-900/20 hover:bg-rose-900/40"
                : "text-muted-foreground",
            )}
            data-ocid="live.hr.connect_button"
          >
            <Heart
              className={cn(
                "w-3.5 h-3.5",
                hr.isConnected ? "text-rose-400 fill-rose-400/50" : "",
              )}
            />
            {hr.isConnecting
              ? "Connecting…"
              : hr.isConnected
                ? "HR Connected"
                : "Connect HR"}
          </Button>

          <AnimatePresence mode="wait">
            {!isRiding ? (
              <motion.div
                key="start"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Button
                  type="button"
                  data-ocid="live.start_button"
                  onClick={handleStartRide}
                  disabled={!isConnected}
                  size="lg"
                  className={cn(
                    "gap-2 font-semibold font-body transition-smooth",
                    isConnected &&
                      "shadow-[0_0_24px_oklch(0.65_0.25_185/0.4)] hover:shadow-[0_0_32px_oklch(0.65_0.25_185/0.6)]",
                  )}
                >
                  <Play className="w-4 h-4" />
                  Start Ride
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="active-controls"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2"
              >
                {/* Pause / Resume */}
                <Button
                  type="button"
                  data-ocid="live.pause_button"
                  variant="outline"
                  onClick={handlePauseResume}
                  size="lg"
                  className={cn(
                    "gap-2 font-semibold font-body transition-smooth border-2",
                    isPaused
                      ? "border-amber-400/70 text-amber-300 bg-amber-900/20 hover:bg-amber-900/40 hover:border-amber-300"
                      : "border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/70",
                  )}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  )}
                </Button>

                {/* Stop */}
                <Button
                  type="button"
                  data-ocid="live.stop_button"
                  variant="destructive"
                  onClick={handleStopRide}
                  disabled={isSaving}
                  size="lg"
                  className="gap-2 font-semibold font-body"
                >
                  <Square className="w-4 h-4 fill-current" />
                  {isSaving ? "Saving…" : "Stop"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* HR error */}
      <AnimatePresence>
        {hr.error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-900/15 px-4 py-3"
            data-ocid="live.hr.error_state"
          >
            <Heart className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="text-sm text-rose-300">{hr.error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paused banner */}
      <AnimatePresence>
        {isRiding && isPaused && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3 rounded-xl border border-amber-400/50 bg-amber-400/10 px-4 py-3"
            data-ocid="live.paused_state"
          >
            <Pause className="w-4 h-4 text-amber-300 shrink-0" />
            <p className="text-sm font-semibold text-amber-200">
              Ride paused — tap <strong>Resume</strong> to continue
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start pedaling banner */}
      <AnimatePresence>
        {isConnected &&
          !isPaused &&
          metrics.speedKph === 0 &&
          metrics.distanceKm === 0 &&
          metrics.cadenceRpm === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 rounded-xl border border-amber-400/50 bg-amber-400/15 px-4 py-3"
              data-ocid="live.pedal_prompt"
            >
              <span className="text-xl shrink-0">🚴</span>
              <p className="text-sm font-semibold text-amber-200">
                Start pedaling to see speed, distance, and cadence data
              </p>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Hero metrics */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <MetricCard
          label="Speed"
          value={metrics.speedKph.toFixed(1)}
          unit="km/h"
          hero
          isActive={isRiding && !isPaused}
          ocid="live.speed.card"
        />
        <MetricCard
          label="Distance"
          value={metrics.distanceKm.toFixed(2)}
          unit="km"
          hero
          isActive={isRiding && !isPaused}
          ocid="live.distance.card"
        />
      </motion.div>

      {/* Live Speed Graph */}
      <SpeedGraph data={speedHistory} isRiding={isRiding} />
      {/* Secondary metrics */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <MetricCard
          label="Calories"
          value={Math.round(metrics.calories)}
          unit="kcal"
          positive
          isActive={isRiding && !isPaused}
          ocid="live.calories.card"
        />
        <MetricCard
          label="Resistance"
          value={metrics.resistance}
          unit="level"
          intensity
          isActive={isRiding && !isPaused}
          ocid="live.resistance.card"
        />
        <MetricCard
          label="Cadence"
          value={Math.round(metrics.cadenceRpm)}
          unit="RPM"
          isActive={isRiding && !isPaused}
          ocid="live.cadence.card"
        />
        <MetricCard
          label="Elapsed"
          value={formatElapsed(metrics.elapsedSeconds)}
          unit=""
          isActive={isRiding && !isPaused}
          ocid="live.elapsed.card"
        />
      </motion.div>

      {/* Heart Rate — always updates, even when paused */}
      <AnimatePresence>
        {(hr.isConnected || hr.currentBpm > 0) && (
          <HeartRateCard
            currentBpm={hr.currentBpm}
            avgBpm={hr.avgBpm}
            maxBpm={hr.maxBpm}
            isConnected={hr.isConnected}
            isRiding={isRiding}
          />
        )}
      </AnimatePresence>

      {/* Weekly Streak Tracker */}
      <StreakTracker
        workouts={workouts}
        weeklyGoalKm={weeklyGoalKm}
        onGoalChange={setWeeklyGoalKm}
      />

      {/* Riding indicator */}
      <AnimatePresence>
        {isRiding && !isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-xs font-body text-primary/80"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            Live data from Indoor Bike Data (00002ad2)
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status banners */}
      <AnimatePresence>
        {isIdle && <NotConnectedBanner />}
        {isDisconnected && <DisconnectedBanner />}
      </AnimatePresence>
    </div>
  );
}
