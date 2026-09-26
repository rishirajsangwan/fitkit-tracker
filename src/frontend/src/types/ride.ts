export type BikeConnectionState =
  | "idle"
  | "scanning"
  | "connected"
  | "disconnected"
  | "error";

export interface RideMetrics {
  speedKph: number;
  distanceKm: number;
  calories: number;
  resistance: number;
  cadenceRpm: number;
  elapsedSeconds: number;
  heartRate?: number;
}

export interface RideSession {
  id: string;
  date: Date;
  durationSeconds: number;
  distanceKm: number;
  calories: number;
  avgSpeedKph: number;
  peakResistance: number;
  minResistance: number;
  maxResistance: number;
  avgResistance: number;
  // Optional heart rate + hydration (populated when HR monitor is connected)
  maxHeartRate?: number | null;
  avgHeartRate?: number | null;
  hydrationLogged?: number | null; // ml
}

export interface SaveRideRequest {
  durationSeconds: number;
  distanceMeters: number;
  calories: number;
  avgSpeedKph: number;
  peakResistance: number;
  minResistance: number;
  maxResistance: number;
  avgResistance: number;
  avgHeartRate?: number | null;
  maxHeartRate?: number | null;
  hydrationLogged?: number | null;
}

export interface AutoSaveRideRequest {
  id: string;
  startTimestamp: number;
  elapsedSeconds: number;
  distanceKm: number;
  calories: number;
  avgSpeed: number;
  avgCadence: number;
  avgResistance: number;
  avgHeartRate: number;
}
