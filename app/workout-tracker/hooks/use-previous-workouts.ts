"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import {
  type Workout,
  type WorkoutDayData,
  formatWorkoutDateKey,
  getStorageMode,
  loadAllLocalWorkoutDays,
} from "@/lib/use-workout-storage";

export interface PreviousWorkoutEntry {
  dateKey: string;
  workout: Workout;
}

function hydrateWorkoutDayResponse(
  raw: unknown,
): Array<{ dateKey: string; data: WorkoutDayData }> {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(
      (item): item is { dateKey: string; data: { workouts: unknown[] } } =>
        item != null &&
        typeof item === "object" &&
        typeof item.dateKey === "string" &&
        item.data != null &&
        typeof item.data === "object" &&
        Array.isArray(item.data.workouts),
    )
    .map((item) => ({
      dateKey: item.dateKey,
      data: item.data as WorkoutDayData,
    }));
}

const MAX_PREVIOUS_WORKOUTS = 10;

function flattenToPreviousEntries(
  days: Array<{ dateKey: string; data: WorkoutDayData }>,
  excludeDateKey: string,
): PreviousWorkoutEntry[] {
  const withIndex = days
    .filter((day) => day.dateKey !== excludeDateKey)
    .flatMap((day) =>
      day.data.workouts
        .filter((w) => w.name || w.subtasks.length > 0)
        .map((workout, workoutIndex) => ({
          dateKey: day.dateKey,
          workout,
          workoutIndex,
        })),
    );

  withIndex.sort((a, b) => {
    const byDate = b.dateKey.localeCompare(a.dateKey);
    if (byDate !== 0) {
      return byDate;
    }
    return b.workoutIndex - a.workoutIndex;
  });

  return withIndex.slice(0, MAX_PREVIOUS_WORKOUTS).map(({ dateKey, workout }) => ({
    dateKey,
    workout,
  }));
}

export function usePreviousWorkouts(excludeDate: Date) {
  const { status } = useSession();
  const [entries, setEntries] = useState<PreviousWorkoutEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    const mode = getStorageMode(status);
    if (!mode) {
      return;
    }

    const excludeDateKey = formatWorkoutDateKey(excludeDate);
    setIsLoading(true);

    try {
      if (mode === "local") {
        const days = loadAllLocalWorkoutDays();
        setEntries(flattenToPreviousEntries(days, excludeDateKey));
      } else {
        const response = await fetch("/api/workouts/history", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error("Failed to load workout history");
        }

        const payload = (await response.json()) as { days?: unknown };
        const days = hydrateWorkoutDayResponse(payload.days);
        setEntries(flattenToPreviousEntries(days, excludeDateKey));
      }
    } catch (error) {
      console.error("Failed to load previous workouts:", error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [status, excludeDate]);

  return { entries, isLoading, load };
}
