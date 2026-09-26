import type { RideMetrics } from "@/types/ride";
import { useWorkoutHistory } from "./useWorkoutHistory";

function generateRideId(): string {
  return `ride-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useAutoSave() {
  const {
    autoSaveRide,
    partialRide,
    isAutoSaving,
    isPartialRideLoading,
    clearPartialRide,
    isClearingPartial,
  } = useWorkoutHistory();

  async function autoSaveNow(metrics: RideMetrics, startTimestamp: number) {
    const rideId = partialRide?.id ?? generateRideId();
    await autoSaveRide({
      id: rideId,
      startTimestamp,
      elapsedSeconds: metrics.elapsedSeconds,
      distanceKm: metrics.distanceKm,
      calories: metrics.calories,
      avgSpeed: metrics.speedKph,
      avgCadence: metrics.cadenceRpm,
      avgResistance: metrics.resistance,
      avgHeartRate: metrics.heartRate ?? 0,
    });
  }

  return {
    autoSaveNow,
    partialRide,
    isAutoSaving,
    isPartialRideLoading,
    clearPartialRide,
    isClearingPartial,
  };
}
