import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import type { RideSession } from "@/types/ride";
import {
  Activity,
  Bike,
  ChevronDown,
  ChevronUp,
  Droplets,
  Flame,
  Heart,
  MapPin,
  Timer,
  Trash2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface RideCardProps {
  ride: RideSession;
  index: number;
  onDelete: (id: string) => Promise<unknown>;
  isDeleting: boolean;
}

function RideCard({ ride, index, onDelete, isDeleting }: RideCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_20px_0_oklch(0.65_0.25_185/0.12)] border-l-4 border-l-primary"
      data-ocid={`history.item.${index}`}
    >
      <button
        type="button"
        className="w-full text-left px-4 pt-4 pb-3 hover:bg-white/[0.02] transition-colors duration-200"
        onClick={() => setExpanded((v) => !v)}
        data-ocid={`history.expand_button.${index}`}
        aria-expanded={expanded}
      >
        {/* Date + time row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold text-foreground font-display tracking-wide">
              {formatDate(ride.date)}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              {formatTime(ride.date)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Duration pill */}
            <span className="inline-flex items-center gap-1 rounded-full bg-black/5 border border-black/10 px-2 py-0.5 text-[11px] font-semibold font-mono text-muted-foreground">
              <Timer className="w-3 h-3" />
              {formatDuration(ride.durationSeconds)}
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Headline distance stat */}
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-[32px] font-bold font-display tabular-nums leading-none text-primary metric-glow">
            {ride.distanceKm.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground font-mono">km</span>
        </div>

        {/* Secondary stats row */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="text-sm font-semibold font-display text-foreground tabular-nums">
              {ride.calories}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              kcal
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-sm font-semibold font-display text-foreground tabular-nums">
              {ride.avgSpeedKph.toFixed(1)}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              km/h
            </span>
          </div>
          {ride.avgHeartRate != null && (
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-sm font-semibold font-display text-foreground tabular-nums">
                {ride.avgHeartRate}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                bpm
              </span>
            </div>
          )}
          {ride.hydrationLogged != null && (
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-sm font-semibold font-display text-foreground tabular-nums">
                {ride.hydrationLogged}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                ml
              </span>
            </div>
          )}
        </div>
      </button>

      {expanded && (
        <div
          className="border-t border-black/5 bg-black/[0.03] px-4 py-4"
          data-ocid={`history.details.${index}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono font-bold">
              Resistance Breakdown
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-card border border-border/60 px-3 py-2.5 text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1.5">
                Min
              </div>
              <div className="text-xl font-bold text-foreground font-display">
                {ride.minResistance}
              </div>
            </div>
            <div className="rounded-xl bg-card border border-primary/25 px-3 py-2.5 text-center">
              <div className="text-[10px] uppercase tracking-widest text-primary/70 font-mono mb-1.5">
                Avg
              </div>
              <div className="text-xl font-bold text-primary font-display metric-glow">
                {ride.avgResistance.toFixed(1)}
              </div>
            </div>
            <div className="rounded-xl bg-card border border-accent/25 px-3 py-2.5 text-center">
              <div className="text-[10px] uppercase tracking-widest text-accent/70 font-mono mb-1.5">
                Peak
              </div>
              <div className="text-xl font-bold text-accent font-display metric-glow-accent">
                {ride.peakResistance}
              </div>
            </div>
          </div>

          {/* HR pills in expanded */}
          {ride.maxHeartRate != null && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {ride.maxHeartRate != null && (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-rose-500/25 bg-rose-500/8 px-2.5 py-0.5 text-[11px] font-semibold font-mono text-rose-400"
                  data-ocid={`history.max_hr_pill.${index}`}
                >
                  <Heart className="w-3 h-3" />
                  Max {ride.maxHeartRate} BPM
                </span>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/12 hover:text-destructive gap-1.5 h-8 text-xs"
                  disabled={isDeleting}
                  data-ocid={`history.delete_button.${index}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete ride
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent
                className="bg-card border-border"
                data-ocid={`history.delete_dialog.${index}`}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display text-foreground">
                    Delete this ride?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This will permanently remove the ride from{" "}
                    <span className="text-foreground font-semibold">
                      {formatDate(ride.date)}
                    </span>
                    . This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    className="bg-muted/40 border-border text-foreground hover:bg-muted"
                    data-ocid={`history.cancel_button.${index}`}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
                    onClick={() => onDelete(ride.id)}
                    data-ocid={`history.confirm_button.${index}`}
                  >
                    Delete ride
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryBar({
  totalRides,
  totalDistanceKm,
  totalCalories,
}: {
  totalRides: number;
  totalDistanceKm: number;
  totalCalories: number;
}) {
  return (
    <div
      className="grid grid-cols-3 gap-0 rounded-2xl border border-primary/20 bg-card overflow-hidden"
      data-ocid="history.summary_bar"
    >
      <div className="flex flex-col items-center gap-1 py-5 relative">
        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-1.5">
          <Bike className="w-4 h-4 text-primary" />
        </div>
        <span className="text-3xl font-bold font-display text-primary metric-glow leading-none">
          {totalRides}
        </span>
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-mono mt-1">
          Rides
        </span>
      </div>
      <div className="flex flex-col items-center gap-1 py-5 border-x border-border/40">
        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center mb-1.5">
          <MapPin className="w-4 h-4 text-foreground" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold font-display text-foreground leading-none">
            {totalDistanceKm.toFixed(1)}
          </span>
          <span className="text-xs font-mono text-muted-foreground">km</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-mono mt-1">
          Distance
        </span>
      </div>
      <div className="flex flex-col items-center gap-1 py-5">
        <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-1.5">
          <Flame className="w-4 h-4 text-orange-400" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold font-display text-orange-400 metric-glow-orange leading-none">
            {totalCalories}
          </span>
          <span className="text-xs font-mono text-muted-foreground">kcal</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-mono mt-1">
          Calories
        </span>
      </div>
    </div>
  );
}

function HistorySkeletons() {
  return (
    <div className="space-y-3" data-ocid="history.loading_state">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-4 space-y-3"
        >
          <div className="flex gap-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Skeleton className="h-10 rounded" />
            <Skeleton className="h-10 rounded" />
            <Skeleton className="h-10 rounded" />
            <Skeleton className="h-10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function History() {
  const { workouts, isLoading, isError, deleteWorkout, isDeleting, summary } =
    useWorkoutHistory();

  const sorted = [...workouts].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  const totalRides = summary
    ? Number((summary as { totalRides?: bigint }).totalRides ?? sorted.length)
    : sorted.length;
  const rawDistanceMeters = (summary as { totalDistanceMeters?: number } | null)
    ?.totalDistanceMeters;
  const totalDistanceKm =
    rawDistanceMeters != null
      ? rawDistanceMeters / 1000
      : sorted.reduce((acc, r) => acc + r.distanceKm, 0);
  const rawCalories = (summary as { totalCalories?: number } | null)
    ?.totalCalories;
  const totalCalories =
    rawCalories != null
      ? rawCalories
      : sorted.reduce((acc, r) => acc + r.calories, 0);

  return (
    <div className="space-y-5" data-ocid="history.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-foreground tracking-wide">
            WORKOUT HISTORY
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            All your past rides
          </p>
        </div>
        {sorted.length > 0 && (
          <Badge
            variant="outline"
            className="border-primary/40 text-primary font-mono text-xs"
            data-ocid="history.ride_count_badge"
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            {sorted.length} ride{sorted.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {!isLoading && !isError && sorted.length > 0 && (
        <SummaryBar
          totalRides={totalRides}
          totalDistanceKm={totalDistanceKm}
          totalCalories={totalCalories}
        />
      )}

      {isLoading && <HistorySkeletons />}

      {isError && !isLoading && (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center"
          data-ocid="history.error_state"
        >
          <Zap className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm font-semibold text-destructive font-display">
            Failed to load workout history
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Check your connection and try again
          </p>
        </div>
      )}

      {!isLoading && !isError && sorted.length === 0 && (
        <div
          className="rounded-xl border border-dashed border-border bg-card/50 py-16 flex flex-col items-center justify-center gap-3"
          data-ocid="history.empty_state"
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bike className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold font-display text-foreground">
              No rides yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Complete your first ride to see history here
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-primary/30 text-primary/70 font-mono text-[10px] uppercase tracking-widest"
          >
            Start pedaling
          </Badge>
        </div>
      )}

      {!isLoading && !isError && sorted.length > 0 && (
        <div className="space-y-3" data-ocid="history.list">
          {sorted.map((ride, i) => (
            <RideCard
              key={ride.id}
              ride={ride}
              index={i + 1}
              onDelete={deleteWorkout}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
