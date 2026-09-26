import { createActor } from "@/backend";
import type { AutoSaveRideRequest } from "@/types/ride";
import type { RideSession, SaveRideRequest } from "@/types/ride";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function toRideSession(r: {
  id: bigint;
  date: bigint;
  durationSeconds: bigint;
  distanceMeters: number;
  calories: number;
  avgSpeedKph: number;
  peakResistance: bigint;
  minResistance: bigint;
  maxResistance: bigint;
  avgResistance: number;
  maxHeartRate?: bigint;
  avgHeartRate?: bigint;
  hydrationLogged?: bigint;
}): RideSession {
  return {
    id: r.id.toString(),
    date: new Date(Number(r.date / 1_000_000n)),
    durationSeconds: Number(r.durationSeconds),
    distanceKm: r.distanceMeters / 1000,
    calories: r.calories,
    avgSpeedKph: r.avgSpeedKph,
    peakResistance: Number(r.peakResistance),
    minResistance: Number(r.minResistance),
    maxResistance: Number(r.maxResistance),
    avgResistance: r.avgResistance,
    maxHeartRate: r.maxHeartRate != null ? Number(r.maxHeartRate) : null,
    avgHeartRate: r.avgHeartRate != null ? Number(r.avgHeartRate) : null,
    hydrationLogged:
      r.hydrationLogged != null ? Number(r.hydrationLogged) : null,
  };
}

export function useWorkoutHistory() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  const historyQuery = useQuery<RideSession[]>({
    queryKey: ["workouts"],
    queryFn: async () => {
      if (!actor) return [];
      const rides = await actor.listRides();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rides as any[]).map(toRideSession);
    },
    enabled: !!actor && !isFetching,
  });

  const saveMutation = useMutation({
    mutationFn: async (req: SaveRideRequest) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.saveRide({
        durationSeconds: BigInt(req.durationSeconds),
        distanceMeters: req.distanceMeters,
        calories: req.calories,
        avgSpeedKph: req.avgSpeedKph,
        peakResistance: BigInt(req.peakResistance),
        minResistance: BigInt(req.minResistance),
        maxResistance: BigInt(req.maxResistance),
        avgResistance: req.avgResistance,
        avgHeartRate:
          req.avgHeartRate != null
            ? BigInt(Math.round(req.avgHeartRate))
            : undefined,
        maxHeartRate:
          req.maxHeartRate != null
            ? BigInt(Math.round(req.maxHeartRate))
            : undefined,
        hydrationLogged:
          req.hydrationLogged != null
            ? BigInt(Math.round(req.hydrationLogged))
            : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteRide(BigInt(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });

  const summaryQuery = useQuery({
    queryKey: ["summary"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSummary();
    },
    enabled: !!actor && !isFetching,
  });

  const autoSaveMutation = useMutation({
    mutationFn: async (req: AutoSaveRideRequest) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.autoSaveRide({
        id: req.id,
        startTimestamp: BigInt(req.startTimestamp),
        elapsedSeconds: BigInt(req.elapsedSeconds),
        distanceKm: req.distanceKm,
        calories: BigInt(req.calories),
        avgSpeed: req.avgSpeed,
        avgCadence: BigInt(req.avgCadence),
        avgResistance: BigInt(req.avgResistance),
        avgHeartRate: BigInt(req.avgHeartRate),
      });
    },
  });

  const partialRideQuery = useQuery({
    queryKey: ["partialRide", "today"],
    queryFn: async () => {
      if (!actor) return null;
      const now = new Date();
      const dayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;
      return actor.getPartialRide(BigInt(dayStart), BigInt(dayEnd));
    },
    enabled: !!actor && !isFetching,
  });

  const clearPartialMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const now = new Date();
      const dayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;
      return actor.clearPartialRide(BigInt(dayStart), BigInt(dayEnd));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partialRide", "today"] });
    },
  });

  return {
    workouts: historyQuery.data ?? [],
    isLoading: historyQuery.isLoading,
    isError: historyQuery.isError,
    saveWorkout: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    deleteWorkout: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    summary: summaryQuery.data ?? null,
    autoSaveRide: autoSaveMutation.mutateAsync,
    isAutoSaving: autoSaveMutation.isPending,
    partialRide: partialRideQuery.data ?? null,
    isPartialRideLoading: partialRideQuery.isLoading,
    clearPartialRide: clearPartialMutation.mutateAsync,
    isClearingPartial: clearPartialMutation.isPending,
  };
}
