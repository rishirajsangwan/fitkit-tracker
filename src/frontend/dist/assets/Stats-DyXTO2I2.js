import { c as createLucideIcon, u as useWorkoutHistory, r as reactExports, j as jsxRuntimeExports, S as Skeleton } from "./index-CHiX1a6S.js";
import { a as Timer, T as TrendingUp, B as Badge } from "./badge-BkwCWq2H.js";
import { k as generateCategoricalChart, B as Bar, X as XAxis, Y as YAxis, l as formatAxisMap, R as ResponsiveContainer, n as CartesianGrid, T as Tooltip, m as calculateRecommendedHydration } from "./generateCategoricalChart-cw_8Wb4k.js";
import { Z as Zap, B as Bike, F as Flame, H as Heart, D as Droplets } from "./index-CprevZi-.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["circle", { cx: "6", cy: "19", r: "3", key: "1kj8tv" }],
  ["path", { d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15", key: "1d8sl" }],
  ["circle", { cx: "18", cy: "5", r: "3", key: "gq8acd" }]
];
const Route = createLucideIcon("route", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M16 17h6v-6", key: "t6n2it" }],
  ["path", { d: "m22 17-8.5-8.5-5 5L2 7", key: "x473p" }]
];
const TrendingDown = createLucideIcon("trending-down", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6", key: "17hqa7" }],
  ["path", { d: "M18 9h1.5a2.5 2.5 0 0 0 0-5H18", key: "lmptdp" }],
  ["path", { d: "M4 22h16", key: "57wxv0" }],
  ["path", { d: "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22", key: "1nw9bq" }],
  ["path", { d: "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22", key: "1np0yb" }],
  ["path", { d: "M18 2H6v7a6 6 0 0 0 12 0V2Z", key: "u46fv3" }]
];
const Trophy = createLucideIcon("trophy", __iconNode);
var BarChart = generateCategoricalChart({
  chartName: "BarChart",
  GraphicalChild: Bar,
  defaultTooltipEventType: "axis",
  validateTooltipEventTypes: ["axis", "item"],
  axisComponents: [{
    axisType: "xAxis",
    AxisComp: XAxis
  }, {
    axisType: "yAxis",
    AxisComp: YAxis
  }],
  formatAxisMap
});
function calculatePeriodStats(rides) {
  if (rides.length === 0) {
    return {
      totalDistance: 0,
      totalCalories: 0,
      totalDurationSeconds: 0,
      totalRides: 0,
      avgSpeed: 0,
      maxHeartRate: null,
      avgHeartRate: null,
      totalHydration: 0
    };
  }
  const totalDistance = rides.reduce((s, r) => s + r.distanceKm, 0);
  const totalCalories = rides.reduce((s, r) => s + r.calories, 0);
  const totalDurationSeconds = rides.reduce((s, r) => s + r.durationSeconds, 0);
  const avgSpeed = totalDurationSeconds > 0 ? totalDistance / (totalDurationSeconds / 3600) : 0;
  const hrRides = rides.filter(
    (r) => r.avgHeartRate != null && (r.avgHeartRate ?? 0) > 0
  );
  const avgHeartRate = hrRides.length > 0 ? Math.round(
    hrRides.reduce((s, r) => s + (r.avgHeartRate ?? 0), 0) / hrRides.length
  ) : null;
  const hrMaxRides = rides.filter(
    (r) => r.maxHeartRate != null && (r.maxHeartRate ?? 0) > 0
  );
  const maxHeartRate = hrMaxRides.length > 0 ? Math.max(...hrMaxRides.map((r) => r.maxHeartRate ?? 0)) : null;
  const totalHydration = rides.reduce(
    (s, r) => s + (r.hydrationLogged ?? 0),
    0
  );
  return {
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalCalories,
    totalDurationSeconds,
    totalRides: rides.length,
    avgSpeed: Math.round(avgSpeed * 10) / 10,
    maxHeartRate,
    avgHeartRate,
    totalHydration
  };
}
function getLast7DaysData(rides) {
  const days = [];
  const today = /* @__PURE__ */ new Date();
  today.setHours(23, 59, 59, 999);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    const dayRides = rides.filter((r) => {
      const rd = new Date(r.date);
      return rd >= dayStart && rd <= dayEnd;
    });
    const stats = calculatePeriodStats(dayRides);
    days.push({
      date: dayStart.toISOString().slice(0, 10),
      label: dayStart.toLocaleDateString("en", { weekday: "short" }),
      distance: stats.totalDistance,
      calories: stats.totalCalories,
      duration: Math.round(stats.totalDurationSeconds / 60),
      rides: stats.totalRides
    });
  }
  return days;
}
function getPersonalRecords(rides) {
  if (rides.length === 0) {
    return {
      bestDistance: null,
      longestDuration: null,
      highestAvgSpeed: null,
      mostCalories: null
    };
  }
  const bestDistance = rides.reduce(
    (best, r) => !best || r.distanceKm > best.distanceKm ? r : best,
    null
  );
  const longestDuration = rides.reduce(
    (best, r) => !best || r.durationSeconds > best.durationSeconds ? r : best,
    null
  );
  const highestAvgSpeed = rides.reduce(
    (best, r) => !best || r.avgSpeedKph > best.avgSpeedKph ? r : best,
    null
  );
  const mostCalories = rides.reduce(
    (best, r) => !best || r.calories > best.calories ? r : best,
    null
  );
  return { bestDistance, longestDuration, highestAvgSpeed, mostCalories };
}
function getTrendVsPreviousPeriod(current, previous) {
  const pct = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : null;
    return Math.round((curr - prev) / prev * 100);
  };
  return {
    distancePct: pct(current.totalDistance, previous.totalDistance),
    caloriesPct: pct(current.totalCalories, previous.totalCalories),
    durationPct: pct(
      current.totalDurationSeconds,
      previous.totalDurationSeconds
    )
  };
}
function fmtDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor(sec % 3600 / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m ${String(sec % 60).padStart(2, "0")}s`;
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}
function filterByPeriod(rides, period) {
  if (period === "all") return rides;
  const now = /* @__PURE__ */ new Date();
  const cutoff = new Date(now);
  if (period === "week") cutoff.setDate(now.getDate() - 7);
  else if (period === "month") cutoff.setMonth(now.getMonth() - 1);
  else if (period === "year") cutoff.setFullYear(now.getFullYear() - 1);
  return rides.filter((r) => new Date(r.date) >= cutoff);
}
function filterPreviousPeriod(rides, period) {
  if (period === "all") return [];
  const now = /* @__PURE__ */ new Date();
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
const PERIODS = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "all", label: "All Time" }
];
const CHART_METRICS = [
  { key: "distance", label: "Distance", unit: "km" },
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "duration", label: "Duration", unit: "min" }
];
function TrendBadge({ value }) {
  if (value == null) return null;
  const positive = value >= 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      className: `inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${positive ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"}`,
      children: [
        positive ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 9 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { size: 9 }),
        positive ? "+" : "",
        value,
        "%"
      ]
    }
  );
}
function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  iconBg = "bg-cyan-500/10",
  glowColor = "cyan"
}) {
  const glowClass = {
    cyan: "group-hover:border-cyan-500/40 group-hover:shadow-[0_0_16px_0_oklch(0.55_0.2_185/0.18)]",
    lime: "group-hover:border-lime-500/40 group-hover:shadow-[0_0_16px_0_oklch(0.7_0.18_115/0.18)]",
    orange: "group-hover:border-orange-500/40 group-hover:shadow-[0_0_16px_0_oklch(0.65_0.18_30/0.18)]",
    violet: "group-hover:border-violet-500/40 group-hover:shadow-[0_0_16px_0_oklch(0.55_0.2_290/0.18)]",
    rose: "group-hover:border-rose-500/40 group-hover:shadow-[0_0_16px_0_oklch(0.6_0.18_10/0.18)]",
    amber: "group-hover:border-amber-500/40 group-hover:shadow-[0_0_16px_0_oklch(0.65_0.18_75/0.18)]"
  }[glowColor];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `stat-card rounded-xl px-4 py-4 flex flex-col gap-2 relative overflow-hidden group transition-all duration-300 border border-border/40 ${glowClass}`,
      "data-ocid": "stats.stat_card",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent pointer-events-none" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 border border-black/5`,
              children: icon
            }
          ),
          trend != null && /* @__PURE__ */ jsxRuntimeExports.jsx(TrendBadge, { value: trend })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[26px] font-bold font-display tabular-nums leading-none text-foreground", children: value }),
          sub && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground mt-1", children: sub })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-auto", children: label })
      ]
    }
  );
}
function ChartTooltip({ active, payload, label }) {
  if (!active || !(payload == null ? void 0 : payload.length)) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-black/10 rounded-xl px-4 py-3 text-xs shadow-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-foreground mb-2 font-display text-sm", children: label }),
    payload.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: p.name }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-[oklch(0.5_0.2_185)] tabular-nums text-sm", children: p.value })
    ] }, p.name))
  ] });
}
function PRRow({ label, ride, valueText, icon, ocid }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex items-center justify-between py-3 border-b border-black/5 last:border-0",
      "data-ocid": ocid,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0", children: icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: label }),
            ride && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground", children: fmtDate(ride.date) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold font-display text-cyan-600 tabular-nums", children: ride ? valueText : "—" })
      ]
    }
  );
}
function HydrationCard({ stats }) {
  const [todayLogged, setTodayLogged] = reactExports.useState(0);
  const recommended = calculateRecommendedHydration(
    Math.round(stats.totalDurationSeconds / 60),
    stats.totalCalories,
    stats.avgHeartRate
  );
  const logged = stats.totalHydration + todayLogged;
  const pct = recommended > 0 ? Math.min(100, Math.round(logged / recommended * 100)) : 0;
  const isGood = pct >= 80;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "rounded-xl border border-cyan-500/15 bg-card px-5 py-5 relative overflow-hidden",
      "data-ocid": "stats.hydration_card",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-transparent pointer-events-none" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5 mb-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-xl bg-cyan-500/12 border border-cyan-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Droplets, { size: 15, className: "text-cyan-400" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground font-mono", children: "Hydration" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Badge,
            {
              variant: "outline",
              className: `ml-auto text-[10px] px-2.5 py-0.5 border font-bold rounded-full ${isGood ? "bg-emerald-500/12 text-emerald-400 border-emerald-500/30" : "bg-amber-500/12 text-amber-400 border-amber-500/30"}`,
              children: [
                pct,
                "% of goal"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-3xl font-bold font-display text-foreground tabular-nums leading-none", children: [
              logged,
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base font-medium text-muted-foreground ml-1.5", children: "ml" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-muted-foreground mt-1.5", children: [
              "logged · goal",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-cyan-400 font-semibold", children: [
                recommended,
                " ml"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold text-muted-foreground tabular-nums", children: [
              Math.max(0, recommended - logged),
              " ml"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground", children: "remaining" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2.5 rounded-full bg-black/[0.06] overflow-hidden mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: `h-full rounded-full transition-all duration-700 ${isGood ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-cyan-600 to-cyan-400"}`,
            style: { width: `${pct}%` }
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: [250, 500, 750].map((ml) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            "data-ocid": `stats.hydration.add_${ml}_button`,
            onClick: () => setTodayLogged((prev) => prev + ml),
            className: "rounded-xl bg-cyan-500/8 hover:bg-cyan-500/18 active:scale-95 py-2.5 px-2 text-xs font-semibold text-cyan-400/70 hover:text-cyan-300 transition-all duration-200 border border-cyan-500/15 hover:border-cyan-500/35",
            children: [
              "+",
              ml,
              " ml"
            ]
          },
          ml
        )) }),
        todayLogged > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 text-center text-[11px] text-cyan-400 font-semibold", children: [
          "+",
          todayLogged,
          " ml added today"
        ] })
      ]
    }
  );
}
function EmptyState() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "rounded-xl border border-black/10 bg-card px-6 py-14 text-center flex flex-col items-center gap-3",
      "data-ocid": "stats.empty_state",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bike, { size: 32, className: "text-cyan-400" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-bold text-foreground font-display", children: "No rides yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground max-w-xs leading-relaxed", children: "Complete your first ride to unlock your personal stats dashboard, charts, and records." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 w-6 rounded-full bg-cyan-500/30" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 w-3 rounded-full bg-black/10" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 w-3 rounded-full bg-black/10" })
        ] })
      ]
    }
  );
}
function LoadingSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 pb-8", "data-ocid": "stats.loading_state", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-20 rounded-full" }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3", children: [1, 2, 3, 4, 5, 6].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-28 rounded-xl" }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-52 w-full rounded-xl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-40 w-full rounded-xl" })
  ] });
}
function SectionHeader({
  title,
  icon
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-6 h-6 rounded-md bg-black/[0.04] flex items-center justify-center", children: icon }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-widest text-muted-foreground", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-black/5" })
  ] });
}
function StatsPage() {
  var _a, _b, _c, _d, _e;
  const { workouts, isLoading } = useWorkoutHistory();
  const [period, setPeriod] = reactExports.useState("week");
  const [chartMetric, setChartMetric] = reactExports.useState("distance");
  const currentRides = reactExports.useMemo(
    () => filterByPeriod(workouts, period),
    [workouts, period]
  );
  const previousRides = reactExports.useMemo(
    () => filterPreviousPeriod(workouts, period),
    [workouts, period]
  );
  const stats = reactExports.useMemo(
    () => calculatePeriodStats(currentRides),
    [currentRides]
  );
  const prevStats = reactExports.useMemo(
    () => calculatePeriodStats(previousRides),
    [previousRides]
  );
  const trend = reactExports.useMemo(
    () => getTrendVsPreviousPeriod(stats, prevStats),
    [stats, prevStats]
  );
  const chartData = reactExports.useMemo(() => getLast7DaysData(workouts), [workouts]);
  const prs = reactExports.useMemo(() => getPersonalRecords(workouts), [workouts]);
  if (isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSkeleton, {});
  const periodLabel = period === "week" ? "Week" : period === "month" ? "Month" : period === "year" ? "Year" : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-5 pb-10", "data-ocid": "stats.page", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "flex gap-1 p-1 rounded-2xl bg-black/[0.03] border border-black/10",
        "data-ocid": "stats.period_selector",
        children: PERIODS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            "data-ocid": `stats.period.${p.id}.tab`,
            onClick: () => setPeriod(p.id),
            className: `flex-1 py-2 rounded-xl text-[11px] font-bold font-mono uppercase tracking-wider transition-all duration-200 ${period === p.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-black/5"}`,
            children: p.label
          },
          p.id
        ))
      }
    ),
    workouts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, {}),
    workouts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { "data-ocid": "stats.summary_section", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SectionHeader,
        {
          title: periodLabel ? `This ${periodLabel}` : "All Time",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 12, className: "text-primary" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            label: "Total Distance",
            value: `${stats.totalDistance.toFixed(2)} km`,
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { size: 16, className: "text-cyan-400" }),
            trend: period !== "all" ? trend.distancePct : null,
            iconBg: "bg-cyan-500/12",
            glowColor: "cyan"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            label: "Total Time",
            value: fmtDuration(stats.totalDurationSeconds),
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Timer, { size: 16, className: "text-violet-400" }),
            trend: period !== "all" ? trend.durationPct : null,
            iconBg: "bg-violet-500/12",
            glowColor: "violet"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            label: "Rides",
            value: String(stats.totalRides),
            sub: period !== "all" ? "this period" : "all time",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Bike, { size: 16, className: "text-cyan-300" }),
            iconBg: "bg-cyan-500/8",
            glowColor: "cyan"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            label: "Avg Speed",
            value: `${stats.avgSpeed} km/h`,
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 16, className: "text-amber-400" }),
            iconBg: "bg-amber-500/12",
            glowColor: "amber"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            label: "Calories",
            value: stats.totalCalories.toLocaleString(),
            sub: "kcal burned",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { size: 16, className: "text-orange-400" }),
            trend: period !== "all" ? trend.caloriesPct : null,
            iconBg: "bg-orange-500/12",
            glowColor: "orange"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            label: "Avg Heart Rate",
            value: stats.avgHeartRate != null ? `${stats.avgHeartRate} bpm` : "—",
            sub: stats.avgHeartRate != null ? stats.maxHeartRate != null ? `max ${stats.maxHeartRate} bpm` : "from boAt watch" : "Connect boAt watch",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { size: 16, className: "text-rose-400" }),
            iconBg: "bg-rose-500/12",
            glowColor: "rose"
          }
        )
      ] })
    ] }),
    workouts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "section",
      {
        className: "rounded-2xl border border-black/10 bg-card overflow-hidden",
        "data-ocid": "stats.chart_section",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-5 pt-5 pb-4 border-b border-black/5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 14, className: "text-primary" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground font-mono", children: "7-Day Activity" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "flex gap-1 bg-black/[0.03] rounded-xl p-1",
                "data-ocid": "stats.chart_metric_toggle",
                children: CHART_METRICS.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    "data-ocid": `stats.chart.${m.key}.toggle`,
                    onClick: () => setChartMetric(m.key),
                    className: `px-3 py-1 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition-all duration-200 ${chartMetric === m.key ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"}`,
                    children: m.label
                  },
                  m.key
                ))
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pb-5 pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: 160, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            BarChart,
            {
              data: chartData,
              barCategoryGap: "32%",
              margin: { left: -12, right: 4 },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  CartesianGrid,
                  {
                    strokeDasharray: "2 6",
                    stroke: "rgba(0,0,0,0.06)",
                    vertical: false
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  XAxis,
                  {
                    dataKey: "label",
                    tick: {
                      fontSize: 11,
                      fill: "rgba(0,0,0,0.6)",
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)"
                    },
                    axisLine: false,
                    tickLine: false
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  YAxis,
                  {
                    tick: {
                      fontSize: 10,
                      fill: "rgba(0,0,0,0.35)",
                      fontFamily: "var(--font-mono)"
                    },
                    axisLine: false,
                    tickLine: false,
                    width: 28
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Tooltip,
                  {
                    content: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltip, {}),
                    cursor: { fill: "rgba(0,0,0,0.04)", radius: 4 }
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Bar,
                  {
                    dataKey: chartMetric,
                    name: ((_a = CHART_METRICS.find((m) => m.key === chartMetric)) == null ? void 0 : _a.label) ?? chartMetric,
                    fill: "oklch(0.55 0.2 185)",
                    radius: [5, 5, 0, 0],
                    maxBarSize: 36
                  }
                )
              ]
            }
          ) }) })
        ]
      }
    ),
    workouts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "section",
      {
        className: "rounded-2xl border border-amber-500/20 bg-card px-5 py-5 relative overflow-hidden",
        "data-ocid": "stats.personal_records_section",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] via-transparent to-transparent pointer-events-none" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SectionHeader,
            {
              title: "Personal Records",
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { size: 12, className: "text-amber-400" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PRRow,
            {
              label: "Best Distance",
              ride: prs.bestDistance,
              valueText: `${(_b = prs.bestDistance) == null ? void 0 : _b.distanceKm.toFixed(2)} km`,
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { size: 14, className: "text-amber-400" }),
              ocid: "stats.pr.best_distance"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PRRow,
            {
              label: "Longest Ride",
              ride: prs.longestDuration,
              valueText: fmtDuration(((_c = prs.longestDuration) == null ? void 0 : _c.durationSeconds) ?? 0),
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Timer, { size: 14, className: "text-amber-400" }),
              ocid: "stats.pr.longest_ride"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PRRow,
            {
              label: "Fastest Avg Speed",
              ride: prs.highestAvgSpeed,
              valueText: `${(_d = prs.highestAvgSpeed) == null ? void 0 : _d.avgSpeedKph.toFixed(1)} km/h`,
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 14, className: "text-amber-400" }),
              ocid: "stats.pr.fastest_speed"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PRRow,
            {
              label: "Most Calories",
              ride: prs.mostCalories,
              valueText: `${(_e = prs.mostCalories) == null ? void 0 : _e.calories} kcal`,
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { size: 14, className: "text-amber-400" }),
              ocid: "stats.pr.most_calories"
            }
          )
        ]
      }
    ),
    workouts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(HydrationCard, { stats }),
    workouts.length > 0 && period !== "all" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "section",
      {
        className: "rounded-2xl border border-black/10 bg-card px-5 py-5",
        "data-ocid": "stats.trend_section",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SectionHeader,
            {
              title: `vs Previous ${periodLabel}`,
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 12, className: "text-primary" })
            }
          ),
          trend.distancePct == null && trend.caloriesPct == null && trend.durationPct == null ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No previous period data yet — keep riding!" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-3", children: [
            { label: "Distance", value: trend.distancePct },
            { label: "Calories", value: trend.caloriesPct },
            { label: "Time", value: trend.durationPct }
          ].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "rounded-xl bg-black/[0.03] border border-black/5 px-3 py-4 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-2", children: t.label }),
                t.value == null ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-muted-foreground font-display", children: "—" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "p",
                  {
                    className: `text-base font-bold font-display ${t.value >= 0 ? "text-emerald-600" : "text-red-600"}`,
                    children: [
                      t.value >= 0 ? "+" : "",
                      t.value,
                      "%"
                    ]
                  }
                )
              ]
            },
            t.label
          )) })
        ]
      }
    )
  ] });
}
export {
  StatsPage as default
};
