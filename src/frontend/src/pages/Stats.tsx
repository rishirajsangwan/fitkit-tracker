import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import type { RideSession } from "@/types/ride";
import type { StatsPeriod, StatsResult } from "@/types/stats";
import { calculateRecommendedHydration } from "@/utils/hydrationUtils";
import {
  calculatePeriodStats,
  getLast7DaysData,
  getPersonalRecords,
  getTrendVsPreviousPeriod,
} from "@/utils/statsUtils";
import {
  Bike,
  Droplets,
  Flame,
  Heart,
  Route,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0
    ? `${h}h ${String(m).padStart(2, "0")}m`
    : `${m}m ${String(sec % 60).padStart(2, "0")}s`;
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function filterByPeriod(
  rides: RideSession[],
  period: StatsPeriod,
): RideSession[] {
  if (period === "all") return rides;
  const now = new Date();
  const cutoff = new Date(now);
  if (period === "week") cutoff.setDate(now.getDate() - 7);
  else if (period === "month") cutoff.setMonth(now.getMonth() - 1);
  else if (period === "year") cutoff.setFullYear(now.getFullYear() - 1);
  return rides.filter((r) => new Date(r.date) >= cutoff);
}

function filterPreviousPeriod(
  rides: RideSession[],
  period: StatsPeriod,
): RideSession[] {
  if (period === "all") return [];
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (period === "week") {
    start.setDate(now.getDate() - 14);
    end.setDate(now.getDate() - 7);
  } else if (period === "month") {
    start.setMonth(now.getMonth() - 2);
    end.setMonth(now.getMonth() - 1);
  } else {
    start.setFullYear(now.getFullYear() - 2);
    end.setFullYear(now.getFullYear() - 1);
  }
  return rides.filter((r) => {
    const d = new Date(r.date);
    return d >= start && d <= end;
  });
}

// ── period selector ────────────────────────────────────────────────────────────

const PERIODS: { id: StatsPeriod; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "all", label: "All Time" },
];

const CHART_METRICS: {
  key: "distance" | "calories" | "duration";
  label: string;
  unit: string;
}[] = [
  { key: "distance", label: "Distance", unit: "km" },
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "duration", label: "Duration", unit: "min" },
];

// ── trend badge ────────────────────────────────────────────────────────────────

function TrendBadge({ value }: { value: number | null }) {
  if (value == null) return null;
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
        positive
          ? "bg-emerald-500/15 text-emerald-600"
          : "bg-red-500/15 text-red-600"
      }`}
    >
      {positive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {positive ? "+" : ""}
      {value}%
    </span>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trend?: number | null;
  iconBg?: string;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  iconBg = "bg-cyan-500/10",
  glowColor = "cyan",
}: StatCardProps & {
  glowColor?: "cyan" | "lime" | "orange" | "violet" | "rose" | "amber";
}) {
  const glowClass = {
    cyan: "group-hover:border-cyan-500/40 group-hover:shadow-[0_0_16px_0_oklch(0.55_0.2_185/0.18)]",
    lime: "group-hover:border-lime-500/40 group-hover:shadow-[0_0_16px_0_oklch(0.7_0.18_115/0.18)]",
    orange:
      "group-hover:border-orange-500/40 group-hover:shadow-[0_0_16px_0_oklch(0.65_0.18_30/0.18)]",
    violet:
      "group-hover:border-violet-500/40 group-hover:shadow-[0_0_16px_0_oklch(0.55_0.2_290/0.18)]",
    rose: "group-hover:border-rose-500/40 group-hover:shadow-[0_0_16px_0_oklch(0.6_0.18_10/0.18)]",
    amber:
      "group-hover:border-amber-500/40 group-hover:shadow-[0_0_16px_0_oklch(0.65_0.18_75/0.18)]",
  }[glowColor];

  return (
    <div
      className={`stat-card rounded-xl px-4 py-4 flex flex-col gap-2 relative overflow-hidden group transition-all duration-300 border border-border/40 ${glowClass}`}
      data-ocid="stats.stat_card"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent pointer-events-none" />

      <div className="flex items-start justify-between">
        <div
          className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 border border-black/5`}
        >
          {icon}
        </div>
        {trend != null && <TrendBadge value={trend} />}
      </div>

      <div className="mt-0.5">
        <p className="text-[26px] font-bold font-display tabular-nums leading-none text-foreground">
          {value}
        </p>
        {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
      </div>

      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-auto">
        {label}
      </p>
    </div>
  );
}

// ── custom recharts tooltip ────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-black/10 rounded-xl px-4 py-3 text-xs shadow-2xl">
      <p className="font-bold text-foreground mb-2 font-display text-sm">
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-bold text-[oklch(0.5_0.2_185)] tabular-nums text-sm">
            {p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

// ── pr row ────────────────────────────────────────────────────────────────────

interface PRRowProps {
  label: string;
  ride: RideSession | null;
  valueText: string;
  icon: React.ReactNode;
  ocid: string;
}

function PRRow({ label, ride, valueText, icon, ocid }: PRRowProps) {
  return (
    <div
      className="flex items-center justify-between py-3 border-b border-black/5 last:border-0"
      data-ocid={ocid}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {ride && (
            <p className="text-[10px] text-muted-foreground">
              {fmtDate(ride.date)}
            </p>
          )}
        </div>
      </div>
      <p className="text-sm font-bold font-display text-cyan-600 tabular-nums">
        {ride ? valueText : "—"}
      </p>
    </div>
  );
}

// ── hydration card ─────────────────────────────────────────────────────────────

function HydrationCard({ stats }: { stats: StatsResult }) {
  const [todayLogged, setTodayLogged] = useState(0);

  const recommended = calculateRecommendedHydration(
    Math.round(stats.totalDurationSeconds / 60),
    stats.totalCalories,
    stats.avgHeartRate,
  );
  const logged = stats.totalHydration + todayLogged;
  const pct =
    recommended > 0
      ? Math.min(100, Math.round((logged / recommended) * 100))
      : 0;
  const isGood = pct >= 80;

  return (
    <div
      className="rounded-xl border border-cyan-500/15 bg-card px-5 py-5 relative overflow-hidden"
      data-ocid="stats.hydration_card"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-transparent pointer-events-none" />

      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/12 border border-cyan-500/20 flex items-center justify-center">
          <Droplets size={15} className="text-cyan-400" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground font-mono">
          Hydration
        </p>
        <Badge
          variant="outline"
          className={`ml-auto text-[10px] px-2.5 py-0.5 border font-bold rounded-full ${
            isGood
              ? "bg-emerald-500/12 text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/12 text-amber-400 border-amber-500/30"
          }`}
        >
          {pct}% of goal
        </Badge>
      </div>

      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-3xl font-bold font-display text-foreground tabular-nums leading-none">
            {logged}
            <span className="text-base font-medium text-muted-foreground ml-1.5">
              ml
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            logged · goal{" "}
            <span className="text-cyan-400 font-semibold">
              {recommended} ml
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-muted-foreground tabular-nums">
            {Math.max(0, recommended - logged)} ml
          </p>
          <p className="text-[10px] text-muted-foreground">remaining</p>
        </div>
      </div>

      {/* progress bar */}
      <div className="h-2.5 rounded-full bg-black/[0.06] overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isGood
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
              : "bg-gradient-to-r from-cyan-600 to-cyan-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {([250, 500, 750] as const).map((ml) => (
          <button
            key={ml}
            type="button"
            data-ocid={`stats.hydration.add_${ml}_button`}
            onClick={() => setTodayLogged((prev) => prev + ml)}
            className="rounded-xl bg-cyan-500/8 hover:bg-cyan-500/18 active:scale-95 py-2.5 px-2 text-xs font-semibold text-cyan-400/70 hover:text-cyan-300 transition-all duration-200 border border-cyan-500/15 hover:border-cyan-500/35"
          >
            +{ml} ml
          </button>
        ))}
      </div>

      {todayLogged > 0 && (
        <p className="mt-3 text-center text-[11px] text-cyan-400 font-semibold">
          +{todayLogged} ml added today
        </p>
      )}
    </div>
  );
}

// ── empty state ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="rounded-xl border border-black/10 bg-card px-6 py-14 text-center flex flex-col items-center gap-3"
      data-ocid="stats.empty_state"
    >
      <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-2">
        <Bike size={32} className="text-cyan-400" />
      </div>
      <p className="text-lg font-bold text-foreground font-display">
        No rides yet
      </p>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        Complete your first ride to unlock your personal stats dashboard,
        charts, and records.
      </p>
      <div className="mt-2 flex gap-3">
        <div className="h-1.5 w-6 rounded-full bg-cyan-500/30" />
        <div className="h-1.5 w-3 rounded-full bg-black/10" />
        <div className="h-1.5 w-3 rounded-full bg-black/10" />
      </div>
    </div>
  );
}

// ── loading skeleton ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4 pb-8" data-ocid="stats.loading_state">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-52 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

// ── section header ─────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  icon,
}: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 rounded-md bg-black/[0.04] flex items-center justify-center">
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="flex-1 h-px bg-black/5" />
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const { workouts, isLoading } = useWorkoutHistory();
  const [period, setPeriod] = useState<StatsPeriod>("week");
  const [chartMetric, setChartMetric] = useState<
    "distance" | "calories" | "duration"
  >("distance");

  const currentRides = useMemo(
    () => filterByPeriod(workouts, period),
    [workouts, period],
  );
  const previousRides = useMemo(
    () => filterPreviousPeriod(workouts, period),
    [workouts, period],
  );

  const stats = useMemo(
    () => calculatePeriodStats(currentRides),
    [currentRides],
  );
  const prevStats = useMemo(
    () => calculatePeriodStats(previousRides),
    [previousRides],
  );
  const trend = useMemo(
    () => getTrendVsPreviousPeriod(stats, prevStats),
    [stats, prevStats],
  );
  const chartData = useMemo(() => getLast7DaysData(workouts), [workouts]);
  const prs = useMemo(() => getPersonalRecords(workouts), [workouts]);

  if (isLoading) return <LoadingSkeleton />;

  const periodLabel =
    period === "week"
      ? "Week"
      : period === "month"
        ? "Month"
        : period === "year"
          ? "Year"
          : null;

  return (
    <div className="flex flex-col gap-5 pb-10" data-ocid="stats.page">
      {/* ── period tabs ── */}
      <div
        className="flex gap-1 p-1 rounded-2xl bg-black/[0.03] border border-black/10"
        data-ocid="stats.period_selector"
      >
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            data-ocid={`stats.period.${p.id}.tab`}
            onClick={() => setPeriod(p.id)}
            className={`flex-1 py-2 rounded-xl text-[11px] font-bold font-mono uppercase tracking-wider transition-all duration-200 ${
              period === p.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-black/5"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── empty state ── */}
      {workouts.length === 0 && <EmptyState />}

      {/* ── summary cards ── */}
      {workouts.length > 0 && (
        <section data-ocid="stats.summary_section">
          <SectionHeader
            title={periodLabel ? `This ${periodLabel}` : "All Time"}
            icon={<Zap size={12} className="text-primary" />}
          />
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Total Distance"
              value={`${stats.totalDistance.toFixed(2)} km`}
              icon={<Route size={16} className="text-cyan-400" />}
              trend={period !== "all" ? trend.distancePct : null}
              iconBg="bg-cyan-500/12"
              glowColor="cyan"
            />
            <StatCard
              label="Total Time"
              value={fmtDuration(stats.totalDurationSeconds)}
              icon={<Timer size={16} className="text-violet-400" />}
              trend={period !== "all" ? trend.durationPct : null}
              iconBg="bg-violet-500/12"
              glowColor="violet"
            />
            <StatCard
              label="Rides"
              value={String(stats.totalRides)}
              sub={period !== "all" ? "this period" : "all time"}
              icon={<Bike size={16} className="text-cyan-300" />}
              iconBg="bg-cyan-500/8"
              glowColor="cyan"
            />
            <StatCard
              label="Avg Speed"
              value={`${stats.avgSpeed} km/h`}
              icon={<Zap size={16} className="text-amber-400" />}
              iconBg="bg-amber-500/12"
              glowColor="amber"
            />
            <StatCard
              label="Calories"
              value={stats.totalCalories.toLocaleString()}
              sub="kcal burned"
              icon={<Flame size={16} className="text-orange-400" />}
              trend={period !== "all" ? trend.caloriesPct : null}
              iconBg="bg-orange-500/12"
              glowColor="orange"
            />
            <StatCard
              label="Avg Heart Rate"
              value={
                stats.avgHeartRate != null ? `${stats.avgHeartRate} bpm` : "—"
              }
              sub={
                stats.avgHeartRate != null
                  ? stats.maxHeartRate != null
                    ? `max ${stats.maxHeartRate} bpm`
                    : "from boAt watch"
                  : "Connect boAt watch"
              }
              icon={<Heart size={16} className="text-rose-400" />}
              iconBg="bg-rose-500/12"
              glowColor="rose"
            />
          </div>
        </section>
      )}

      {/* ── 7-day chart ── */}
      {workouts.length > 0 && (
        <section
          className="rounded-2xl border border-black/10 bg-card overflow-hidden"
          data-ocid="stats.chart_section"
        >
          {/* chart header */}
          <div className="px-5 pt-5 pb-4 border-b border-black/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground font-mono">
                  7-Day Activity
                </span>
              </div>
              {/* metric toggle */}
              <div
                className="flex gap-1 bg-black/[0.03] rounded-xl p-1"
                data-ocid="stats.chart_metric_toggle"
              >
                {CHART_METRICS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    data-ocid={`stats.chart.${m.key}.toggle`}
                    onClick={() => setChartMetric(m.key)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition-all duration-200 ${
                      chartMetric === m.key
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground border border-transparent"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 pb-5 pt-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={chartData}
                barCategoryGap="32%"
                margin={{ left: -12, right: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="2 6"
                  stroke="rgba(0,0,0,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 11,
                    fill: "rgba(0,0,0,0.6)",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: "rgba(0,0,0,0.35)",
                    fontFamily: "var(--font-mono)",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "rgba(0,0,0,0.04)", radius: 4 }}
                />
                <Bar
                  dataKey={chartMetric}
                  name={
                    CHART_METRICS.find((m) => m.key === chartMetric)?.label ??
                    chartMetric
                  }
                  fill="oklch(0.55 0.2 185)"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ── personal records ── */}
      {workouts.length > 0 && (
        <section
          className="rounded-2xl border border-amber-500/20 bg-card px-5 py-5 relative overflow-hidden"
          data-ocid="stats.personal_records_section"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] via-transparent to-transparent pointer-events-none" />
          <SectionHeader
            title="Personal Records"
            icon={<Trophy size={12} className="text-amber-400" />}
          />
          <PRRow
            label="Best Distance"
            ride={prs.bestDistance}
            valueText={`${prs.bestDistance?.distanceKm.toFixed(2)} km`}
            icon={<Route size={14} className="text-amber-400" />}
            ocid="stats.pr.best_distance"
          />
          <PRRow
            label="Longest Ride"
            ride={prs.longestDuration}
            valueText={fmtDuration(prs.longestDuration?.durationSeconds ?? 0)}
            icon={<Timer size={14} className="text-amber-400" />}
            ocid="stats.pr.longest_ride"
          />
          <PRRow
            label="Fastest Avg Speed"
            ride={prs.highestAvgSpeed}
            valueText={`${prs.highestAvgSpeed?.avgSpeedKph.toFixed(1)} km/h`}
            icon={<Zap size={14} className="text-amber-400" />}
            ocid="stats.pr.fastest_speed"
          />
          <PRRow
            label="Most Calories"
            ride={prs.mostCalories}
            valueText={`${prs.mostCalories?.calories} kcal`}
            icon={<Flame size={14} className="text-amber-400" />}
            ocid="stats.pr.most_calories"
          />
        </section>
      )}

      {/* ── hydration ── */}
      {workouts.length > 0 && <HydrationCard stats={stats} />}

      {/* ── trend comparison ── */}
      {workouts.length > 0 && period !== "all" && (
        <section
          className="rounded-2xl border border-black/10 bg-card px-5 py-5"
          data-ocid="stats.trend_section"
        >
          <SectionHeader
            title={`vs Previous ${periodLabel}`}
            icon={<TrendingUp size={12} className="text-primary" />}
          />
          {trend.distancePct == null &&
          trend.caloriesPct == null &&
          trend.durationPct == null ? (
            <p className="text-sm text-muted-foreground">
              No previous period data yet — keep riding!
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { label: "Distance", value: trend.distancePct },
                  { label: "Calories", value: trend.caloriesPct },
                  { label: "Time", value: trend.durationPct },
                ] as { label: string; value: number | null }[]
              ).map((t) => (
                <div
                  key={t.label}
                  className="rounded-xl bg-black/[0.03] border border-black/5 px-3 py-4 text-center"
                >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-2">
                    {t.label}
                  </p>
                  {t.value == null ? (
                    <p className="text-sm font-bold text-muted-foreground font-display">
                      —
                    </p>
                  ) : (
                    <p
                      className={`text-base font-bold font-display ${
                        t.value >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {t.value >= 0 ? "+" : ""}
                      {t.value}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
