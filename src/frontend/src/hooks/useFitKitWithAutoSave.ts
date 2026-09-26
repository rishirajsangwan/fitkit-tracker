import { useEffect } from "react";
import { useFitKit } from "./useFitKit";
import { useWorkoutHistory } from "./useWorkoutHistory";

export function useFitKitWithAutoSave() {
  const fitKit = useFitKit();
  const {
    autoSaveRide,
    partialRide: partialRideQuery,
    clearPartialRide: clearPartialMutation,
  } = useWorkoutHistory();

  useEffect(() => {
    if (!fitKit.isRiding || fitKit.isPaused) return;

    const interval = setInterval(() => {
      autoSaveRide({
        id: `partial-${Date.now()}`,
        startTimestamp: Date.now(),
        elapsedSeconds: fitKit.metrics?.elapsedSeconds || 0,
        distanceKm: fitKit.metrics?.distanceKm || 0,
        calories: fitKit.metrics?.calories || 0,
        avgSpeed: fitKit.metrics?.speedKph || 0,
        avgCadence: fitKit.metrics?.cadenceRpm || 0,
        avgResistance: fitKit.metrics?.resistance || 0,
        avgHeartRate: fitKit.metrics?.heartRate || 0,
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [fitKit.isRiding, fitKit.isPaused, fitKit.metrics, autoSaveRide]);

  return {
    ...fitKit,
    partialRide: partialRideQuery,
    resumeRide: async () => {
      if (partialRideQuery) {
        fitKit.startRide();
      }
    },
    clearPartialRide: () => clearPartialMutation(),
  };
}
