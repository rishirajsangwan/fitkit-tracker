import type { RideSession } from "@/types/ride";

export interface HeartRateData {
  currentBpm: number;
  avgBpm: number;
  maxBpm: number;
  sampleCount: number;
}

export interface HydrationEntry {
  timestamp: Date;
  amountMl: number;
}

export interface StatsResult {
  totalDistance: number; // km
  totalCalories: number; // kcal
  totalDurationSeconds: number;
  totalRides: number;
  avgSpeed: number; // km/h
  maxHeartRate: number | null;
  avgHeartRate: number | null;
  totalHydration: number; // ml
}

export interface DayData {
  date: string; // ISO YYYY-MM-DD
  label: string; // e.g. "Mon"
  distance: number; // km
  calories: number; // kcal
  duration: number; // minutes
  rides: number;
}

export interface HeatmapDay {
  date: string; // ISO YYYY-MM-DD
  day: number; // 1-31
  rides: number;
  distance: number; // km
  hasRide: boolean;
}

export type PersonalRecordField = RideSession | null;

export interface PersonalRecords {
  bestDistance: PersonalRecordField;
  longestDuration: PersonalRecordField;
  highestAvgSpeed: PersonalRecordField;
  mostCalories: PersonalRecordField;
}

export type StatsPeriod = "week" | "month" | "year" | "all";
