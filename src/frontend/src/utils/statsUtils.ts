import type { RideSession } from "@/types/ride";
import type {
  DayData,
  HeatmapDay,
  PersonalRecords,
  StatsResult,
} from "@/types/stats";

// ── Grouping helpers ──────────────────────────────────────────────────────────

export function groupRidesByWeek(
  rides: RideSession[],
): Record<string, RideSession[]> {
  const groups: Record<string, RideSession[]> = {};
  for (const ride of rides) {
    const d = new Date(ride.date);
    // ISO week: find the Monday of that week
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    const key = monday.toISOString().slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(ride);
  }
  return groups;
}

export function groupRidesByMonth(
  rides: RideSession[],
): Record<string, RideSession[]> {
  const groups: Record<string, RideSession[]> = {};
  for (const ride of rides) {
    const d = new Date(ride.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(ride);
  }
  return groups;
}

export function groupRidesByYear(
  rides: RideSession[],
): Record<string, RideSession[]> {
  const groups: Record<string, RideSession[]> = {};
  for (const ride of rides) {
    const key = String(new Date(ride.date).getFullYear());
    if (!groups[key]) groups[key] = [];
    groups[key].push(ride);
  }
  return groups;
}

// ── Period stats ──────────────────────────────────────────────────────────────

export function calculatePeriodStats(rides: RideSession[]): StatsResult {
  if (rides.length === 0) {
    return {
      totalDistance: 0,
      totalCalories: 0,
      totalDurationSeconds: 0,
      totalRides: 0,
      avgSpeed: 0,
      maxHeartRate: null,
      avgHeartRate: null,
      totalHydration: 0,
    };
  }

  const totalDistance = rides.reduce((s, r) => s + r.distanceKm, 0);
  const totalCalories = rides.reduce((s, r) => s + r.calories, 0);
  const totalDurationSeconds = rides.reduce((s, r) => s + r.durationSeconds, 0);
  const avgSpeed =
    totalDurationSeconds > 0
      ? totalDistance / (totalDurationSeconds / 3600)
      : 0;

  const hrRides = rides.filter(
    (r) => r.avgHeartRate != null && (r.avgHeartRate ?? 0) > 0,
  );
  const avgHeartRate =
    hrRides.length > 0
      ? Math.round(
          hrRides.reduce((s, r) => s + (r.avgHeartRate ?? 0), 0) /
            hrRides.length,
        )
      : null;

  const hrMaxRides = rides.filter(
    (r) => r.maxHeartRate != null && (r.maxHeartRate ?? 0) > 0,
  );
  const maxHeartRate =
    hrMaxRides.length > 0
      ? Math.max(...hrMaxRides.map((r) => r.maxHeartRate ?? 0))
      : null;

  const totalHydration = rides.reduce(
    (s, r) => s + (r.hydrationLogged ?? 0),
    0,
  );

  return {
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalCalories,
    totalDurationSeconds,
    totalRides: rides.length,
    avgSpeed: Math.round(avgSpeed * 10) / 10,
    maxHeartRate,
    avgHeartRate,
    totalHydration,
  };
}

// ── Chart data ────────────────────────────────────────────────────────────────

export function getLast7DaysData(rides: RideSession[]): DayData[] {
  const days: DayData[] = [];
  const today = new Date();
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
      rides: stats.totalRides,
    });
  }
  return days;
}

export function getCalendarHeatmapData(
  rides: RideSession[],
  year: number,
  month: number, // 0-indexed
): HeatmapDay[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result: HeatmapDay[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStart = new Date(year, month, day, 0, 0, 0, 0);
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999);
    const dayRides = rides.filter((r) => {
      const rd = new Date(r.date);
      return rd >= dayStart && rd <= dayEnd;
    });
    const totalDist = dayRides.reduce((s, r) => s + r.distanceKm, 0);
    result.push({
      date: dayStart.toISOString().slice(0, 10),
      day,
      rides: dayRides.length,
      distance: Math.round(totalDist * 100) / 100,
      hasRide: dayRides.length > 0,
    });
  }
  return result;
}

// ── Personal records ──────────────────────────────────────────────────────────

export function getPersonalRecords(rides: RideSession[]): PersonalRecords {
  if (rides.length === 0) {
    return {
      bestDistance: null,
      longestDuration: null,
      highestAvgSpeed: null,
      mostCalories: null,
    };
  }

  const bestDistance = rides.reduce(
    (best, r) => (!best || r.distanceKm > best.distanceKm ? r : best),
    null as RideSession | null,
  );
  const longestDuration = rides.reduce(
    (best, r) => (!best || r.durationSeconds > best.durationSeconds ? r : best),
    null as RideSession | null,
  );
  const highestAvgSpeed = rides.reduce(
    (best, r) => (!best || r.avgSpeedKph > best.avgSpeedKph ? r : best),
    null as RideSession | null,
  );
  const mostCalories = rides.reduce(
    (best, r) => (!best || r.calories > best.calories ? r : best),
    null as RideSession | null,
  );

  return { bestDistance, longestDuration, highestAvgSpeed, mostCalories };
}

// ── Trend comparison ──────────────────────────────────────────────────────────

export function getTrendVsPreviousPeriod(
  current: StatsResult,
  previous: StatsResult,
): {
  distancePct: number | null;
  caloriesPct: number | null;
  durationPct: number | null;
} {
  const pct = (curr: number, prev: number): number | null => {
    if (prev === 0) return curr > 0 ? 100 : null;
    return Math.round(((curr - prev) / prev) * 100);
  };
  return {
    distancePct: pct(current.totalDistance, previous.totalDistance),
    caloriesPct: pct(current.totalCalories, previous.totalCalories),
    durationPct: pct(
      current.totalDurationSeconds,
      previous.totalDurationSeconds,
    ),
  };
}
