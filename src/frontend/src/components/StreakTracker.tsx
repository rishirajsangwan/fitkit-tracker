import { cn } from "@/lib/utils";
import type { RideSession } from "@/types/ride";
import { Flame, Target } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeStreak(workouts: RideSession[]): number {
  if (workouts.length === 0) return 0;
  const weeks = new Set<string>();
  for (const w of workouts) {
    const ws = getWeekStart(w.date);
    weeks.add(ws.toISOString().slice(0, 10));
  }
  const sorted = [...weeks].sort().reverse();
  const today = new Date();
  const currentWeekStart = getWeekStart(today).toISOString().slice(0, 10);
  const lastWeekStart = new Date(getWeekStart(today));
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekKey = lastWeekStart.toISOString().slice(0, 10);

  let streak = 0;
  if (!weeks.has(currentWeekStart) && !weeks.has(lastWeekKey)) return 0;
  for (const wk of sorted) {
    const expected = new Date(getWeekStart(today));
    expected.setDate(expected.getDate() - streak * 7);
    const expectedKey = expected.toISOString().slice(0, 10);
    if (wk === expectedKey) streak++;
    else break;
  }
  return streak;
}

function getThisWeekDays(workouts: RideSession[]): boolean[] {
  const ws = getWeekStart(new Date());
  const days: boolean[] = Array(7).fill(false);
  for (const w of workouts) {
    const d = new Date(w.date);
    const diff = Math.floor(
      (d.getTime() - ws.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff >= 0 && diff < 7) days[diff] = true;
  }
  return days;
}

interface StreakTrackerProps {
  workouts: RideSession[];
  weeklyGoalKm: number;
  onGoalChange: (km: number) => void;
}

export function StreakTracker({
  workouts,
  weeklyGoalKm,
  onGoalChange,
}: StreakTrackerProps) {
  const streak = computeStreak(workouts);
  const days = getThisWeekDays(workouts);
  const today = new Date();
  const weekStart = getWeekStart(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const thisWeekKm = workouts
    .filter((w) => w.date >= weekStart && w.date < weekEnd)
    .reduce((acc, w) => acc + w.distanceKm, 0);

  const progress = Math.min((thisWeekKm / weeklyGoalKm) * 100, 100);
  const circumference = 2 * Math.PI * 26;
  const dashOffset = circumference - (circumference * progress) / 100;

  const [editing, setEditing] = useState(false);
  const [draftGoal, setDraftGoal] = useState(String(weeklyGoalKm));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitGoal = () => {
    const val = Number.parseFloat(draftGoal);
    if (!Number.isNaN(val) && val > 0) onGoalChange(val);
    setEditing(false);
  };

  const todayIdx = (() => {
    const d = today.getDay();
    return d === 0 ? 6 : d - 1;
  })();

  return (
    <div
      className="rounded-xl border border-border/60 bg-card p-4 space-y-4"
      data-ocid="live.streak_tracker"
    >
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-400" />
        <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground font-body">
          Weekly Streak
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 items-center">
        {/* Streak count */}
        <div className="flex flex-col items-center">
          <span
            className={cn(
              "font-mono font-bold tabular-nums leading-none text-4xl",
              streak > 0
                ? "text-orange-400 metric-glow-orange"
                : "text-muted-foreground/40",
            )}
            data-ocid="live.streak.count"
          >
            {streak}
          </span>
          <span className="text-[10px] text-muted-foreground font-body mt-1">
            {streak === 1 ? "week" : "weeks"}
          </span>
        </div>

        {/* 7-day dot calendar */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-1.5">
            {days.map((active, i) => (
              <div
                key={`day-${DAY_LABELS[i]}-${i}`}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border transition-all duration-200",
                    active
                      ? "bg-primary border-primary shadow-[0_0_8px_oklch(0.65_0.25_185/0.5)]"
                      : i === todayIdx
                        ? "bg-transparent border-primary/50"
                        : "bg-muted/40 border-border/40",
                  )}
                />
                <span
                  className={cn(
                    "text-[9px] font-mono",
                    i === todayIdx
                      ? "text-primary"
                      : "text-muted-foreground/50",
                  )}
                >
                  {DAY_LABELS[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly goal ring */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative w-[60px] h-[60px]">
            <svg
              viewBox="0 0 60 60"
              className="w-full h-full -rotate-90"
              role="img"
              aria-labelledby="goal-ring-title"
            >
              <title id="goal-ring-title">Weekly goal progress ring</title>
              <circle
                cx="30"
                cy="30"
                r="26"
                fill="none"
                stroke="oklch(0.85 0.018 280 / 0.3)"
                strokeWidth="4"
              />
              <circle
                cx="30"
                cy="30"
                r="26"
                fill="none"
                stroke="oklch(0.65 0.22 115)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono font-bold text-[11px] text-accent tabular-nums leading-none">
                {thisWeekKm.toFixed(1)}
              </span>
              <span className="text-[8px] text-muted-foreground font-mono">
                km
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="live.streak.goal_edit_button"
          >
            <Target className="w-2.5 h-2.5" />
            {editing ? (
              <input
                ref={inputRef}
                value={draftGoal}
                onChange={(e) => setDraftGoal(e.target.value)}
                onBlur={commitGoal}
                onKeyDown={(e) => e.key === "Enter" && commitGoal()}
                className="w-10 bg-transparent border-b border-primary outline-none text-[9px] font-mono text-foreground"
                data-ocid="live.streak.goal_input"
              />
            ) : (
              <span>Goal: {weeklyGoalKm}km</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
