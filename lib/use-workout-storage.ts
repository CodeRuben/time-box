"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

export type WorkoutType = "unknown" | "resistance" | "cardio";
export type WorkoutDotType = Exclude<WorkoutType, "unknown">;
export type WorkoutSubtaskStatus = "pending" | "completed" | "error";

export interface WorkoutSubtask {
  id: string;
  name: string;
  status: WorkoutSubtaskStatus;
}

export interface Workout {
  id: string;
  type: WorkoutType;
  name: string;
  subtasks: WorkoutSubtask[];
  createdAt: string;
}

export interface WorkoutDayData {
  workouts: Workout[];
  lastSaved?: string;
}

export interface NewWorkoutInput {
  type: WorkoutType;
  name?: string;
  subtaskNames?: string[];
}

const STORAGE_PREFIX = "workout-tracker-";

export function formatWorkoutDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWorkoutStorageKey(date: Date): string {
  return `${STORAGE_PREFIX}${formatWorkoutDateKey(date)}`;
}

export function getDefaultWorkoutDayData(): WorkoutDayData {
  return {
    workouts: [],
  };
}

function isWorkoutSubtaskStatus(value: unknown): value is WorkoutSubtaskStatus {
  return value === "pending" || value === "completed" || value === "error";
}

function isWorkoutType(value: unknown): value is WorkoutType {
  return value === "unknown" || value === "resistance" || value === "cardio";
}

function normalizeWorkout(raw: unknown): Workout | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const workout = raw as Partial<Workout> & {
    name?: unknown;
    description?: unknown;
    durationMinutes?: unknown;
    subtasks?: unknown;
  };

  if (
    typeof workout.id !== "string" ||
    !isWorkoutType(workout.type) ||
    (workout.name !== undefined && typeof workout.name !== "string") ||
    (workout.description !== undefined && typeof workout.description !== "string") ||
    (workout.durationMinutes !== undefined &&
      typeof workout.durationMinutes !== "number") ||
    typeof workout.createdAt !== "string"
  ) {
    return null;
  }

  const normalizedName =
    typeof workout.name === "string"
      ? workout.name
      : (workout.description ?? "").trim();

  const rawSubtasks = Array.isArray(workout.subtasks) ? workout.subtasks : [];
  const normalizedSubtasks: WorkoutSubtask[] = rawSubtasks
    .map((subtask): WorkoutSubtask | null => {
      if (!subtask || typeof subtask !== "object") {
        return null;
      }

      const parsed = subtask as Partial<WorkoutSubtask>;
      if (
        typeof parsed.id !== "string" ||
        typeof parsed.name !== "string" ||
        (!isWorkoutSubtaskStatus(parsed.status) &&
          typeof (parsed as { completed?: unknown }).completed !== "boolean")
      ) {
        return null;
      }

      return {
        id: parsed.id,
        name: parsed.name,
        status: isWorkoutSubtaskStatus(parsed.status)
          ? parsed.status
          : (parsed as { completed?: boolean }).completed
            ? "completed"
            : "pending",
      };
    })
    .filter((subtask): subtask is WorkoutSubtask => subtask !== null);

  // Migrate legacy description-only entries to one checklist item.
  if (normalizedSubtasks.length === 0 && workout.description?.trim()) {
    normalizedSubtasks.push({
      id: crypto.randomUUID(),
      name: workout.description.trim(),
      status: "pending",
    });
  }

  return {
    id: workout.id,
    type: workout.type,
    name: normalizedName,
    subtasks: normalizedSubtasks,
    createdAt: workout.createdAt,
  };
}

export function loadWorkoutDayData(date: Date): WorkoutDayData | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const key = getWorkoutStorageKey(date);
    const stored = localStorage.getItem(key);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<WorkoutDayData>;
    const workouts = Array.isArray(parsed.workouts)
      ? parsed.workouts
          .map(normalizeWorkout)
          .filter((workout): workout is Workout => workout !== null)
      : [];

    return {
      workouts,
      lastSaved: parsed.lastSaved,
    };
  } catch (error) {
    console.error("Failed to load workout data:", error);
    return null;
  }
}

export function saveWorkoutDayData(date: Date, data: WorkoutDayData): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const key = getWorkoutStorageKey(date);
    localStorage.setItem(
      key,
      JSON.stringify({
        ...data,
        lastSaved: new Date().toISOString(),
      } satisfies WorkoutDayData)
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded. Workouts not saved.");
    } else {
      console.error("Failed to save workout data:", error);
    }
  }
}

export function clearWorkoutDayData(date: Date): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(getWorkoutStorageKey(date));
}

export function loadWorkoutTypesForDate(date: Date): WorkoutDotType[] {
  const loaded = loadWorkoutDayData(date);
  if (!loaded || loaded.workouts.length === 0) {
    return [];
  }

  return loaded.workouts
    .map((workout) => workout.type)
    .filter((type): type is WorkoutDotType => type !== "unknown");
}

export function useWorkoutStorage(date: Date) {
  const [refreshToken, setRefreshToken] = useState(0);
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const data = useMemo(() => {
    if (!isHydrated) {
      return getDefaultWorkoutDayData();
    }
    return loadWorkoutDayData(date) ?? getDefaultWorkoutDayData();
  }, [date, refreshToken, isHydrated]);

  const addWorkout = useCallback(
    (newWorkout: NewWorkoutInput) => {
      const subtaskNames = newWorkout.subtaskNames ?? [];
      const currentData = loadWorkoutDayData(date) ?? getDefaultWorkoutDayData();
      const updated: WorkoutDayData = {
        ...currentData,
        workouts: [
          ...currentData.workouts,
          {
            id: crypto.randomUUID(),
            type: newWorkout.type ?? "unknown",
            name: newWorkout.name?.trim() || "",
            subtasks: subtaskNames.map((name) => ({
              id: crypto.randomUUID(),
              name,
              status: "pending" as const,
            })),
            createdAt: new Date().toISOString(),
          },
        ],
      };
      saveWorkoutDayData(date, updated);
      setRefreshToken((value) => value + 1);
    },
    [date]
  );

  const updateWorkout = useCallback(
    (workoutId: string, updater: (workout: Workout) => Workout) => {
      const currentData = loadWorkoutDayData(date) ?? getDefaultWorkoutDayData();
      const updated: WorkoutDayData = {
        ...currentData,
        workouts: currentData.workouts.map((workout) =>
          workout.id === workoutId ? updater(workout) : workout
        ),
      };
      saveWorkoutDayData(date, updated);
      setRefreshToken((value) => value + 1);
    },
    [date]
  );

  const deleteWorkout = useCallback(
    (workoutId: string) => {
      const currentData = loadWorkoutDayData(date) ?? getDefaultWorkoutDayData();
      const updated: WorkoutDayData = {
        ...currentData,
        workouts: currentData.workouts.filter((workout) => workout.id !== workoutId),
      };
      saveWorkoutDayData(date, updated);
      setRefreshToken((value) => value + 1);
    },
    [date]
  );

  const clearWorkouts = useCallback(() => {
    clearWorkoutDayData(date);
    setRefreshToken((value) => value + 1);
  }, [date]);

  const getWorkoutTypesForDate = useCallback(
    (targetDate: Date): WorkoutDotType[] => {
      if (!isHydrated) {
        return [];
      }
      return loadWorkoutTypesForDate(targetDate);
    },
    [isHydrated]
  );

  return {
    data,
    isLoading: !isHydrated,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    clearWorkouts,
    getWorkoutTypesForDate,
  };
}
