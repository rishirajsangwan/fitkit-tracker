import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type PartialRideId = string;
export interface AutoSaveRideRequest {
    id: PartialRideId;
    avgSpeed: number;
    avgResistance: bigint;
    calories: bigint;
    distanceKm: number;
    avgCadence: bigint;
    elapsedSeconds: bigint;
    startTimestamp: bigint;
    avgHeartRate: bigint;
}
export type Time = bigint;
export interface Ride {
    id: RideId;
    peakResistance: bigint;
    avgResistance: number;
    maxHeartRate?: bigint;
    date: Time;
    calories: number;
    durationSeconds: bigint;
    maxResistance: bigint;
    minResistance: bigint;
    hydrationLogged?: bigint;
    distanceMeters: number;
    avgSpeedKph: number;
    avgHeartRate?: bigint;
}
export interface StatsResult {
    avgSpeed: number;
    maxHeartRate?: bigint;
    totalCalories: bigint;
    totalHydration: bigint;
    totalDurationSeconds: bigint;
    totalDistance: number;
    rides: Array<Ride>;
    avgHeartRate?: bigint;
    totalRides: bigint;
}
export interface SaveRideRequest {
    peakResistance: bigint;
    avgResistance: number;
    maxHeartRate?: bigint;
    calories: number;
    durationSeconds: bigint;
    maxResistance: bigint;
    minResistance: bigint;
    hydrationLogged?: bigint;
    distanceMeters: number;
    avgSpeedKph: number;
    avgHeartRate?: bigint;
}
export interface RideSummary {
    totalDistanceMeters: number;
    totalCalories: number;
    totalDurationSeconds: bigint;
    totalCaloriesNat: bigint;
    totalDistance: number;
    totalRides: bigint;
}
export type RideId = bigint;
export interface PartialRide {
    id: PartialRideId;
    avgSpeed: number;
    avgResistance: bigint;
    calories: bigint;
    lastSavedAt: bigint;
    distanceKm: number;
    avgCadence: bigint;
    elapsedSeconds: bigint;
    startTimestamp: bigint;
    avgHeartRate: bigint;
    isPartial: boolean;
}
export interface backendInterface {
    autoSaveRide(req: AutoSaveRideRequest): Promise<PartialRide>;
    clearPartialRide(dayStartMs: bigint, dayEndMs: bigint): Promise<boolean>;
    deleteRide(id: RideId): Promise<boolean>;
    getPartialRide(dayStartMs: bigint, dayEndMs: bigint): Promise<PartialRide | null>;
    getRidesByDateRange(startMs: bigint, endMs: bigint): Promise<Array<Ride>>;
    getStatsByPeriod(startMs: bigint, endMs: bigint): Promise<StatsResult>;
    getSummary(): Promise<RideSummary>;
    listRides(): Promise<Array<Ride>>;
    saveRide(req: SaveRideRequest): Promise<Ride>;
}
