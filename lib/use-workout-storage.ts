"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { formatDateKey } from "@/lib/date-key";
import type { AutosaveStatus } from "@/lib/autosave-status";
import { AUTOSAVE_DEBOUNCE_MS } from "@/lib/autosave-debounce";

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
const WORKOUTS_API_PREFIX = "/api/workouts";

export type WorkoutStorageMode = "local" | "account";

export function formatWorkoutDateKey(date: Date): string {
  return formatDateKey(date);
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

function hydrateWorkoutDayData(raw: unknown): WorkoutDayData | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const parsed = raw as Partial<WorkoutDayData>;
  const workouts = Array.isArray(parsed.workouts)
    ? parsed.workouts
        .map(normalizeWorkout)
        .filter((workout): workout is Workout => workout !== null)
    : [];

  return {
    workouts,
    lastSaved: parsed.lastSaved,
  };
}

function extractWorkoutTypes(data: WorkoutDayData): WorkoutDotType[] {
  return data.workouts
    .map((workout) => workout.type)
    .filter((type): type is WorkoutDotType => type !== "unknown");
}

export function getStorageMode(
  status: "authenticated" | "loading" | "unauthenticated"
): WorkoutStorageMode | null {
  if (status === "loading") {
    return null;
  }

  return status === "authenticated" ? "account" : "local";
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

    return hydrateWorkoutDayData(JSON.parse(stored));
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

  return extractWorkoutTypes(loaded);
}

export function loadAllLocalWorkoutDays(): Array<{
  dateKey: string;
  data: WorkoutDayData;
}> {
  if (typeof window === "undefined") {
    return [];
  }

  const entries: Array<{ dateKey: string; data: WorkoutDayData }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(STORAGE_PREFIX)) {
      continue;
    }

    const dateKey = key.slice(STORAGE_PREFIX.length);

    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      const data = hydrateWorkoutDayData(JSON.parse(raw));
      if (data && data.workouts.length > 0) {
        entries.push({ dateKey, data });
      }
    } catch {
      continue;
    }
  }

  return entries.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

async function loadWorkoutDayDataFromAccount(
  date: Date
): Promise<WorkoutDayData | null> {
  const response = await fetch(`${WORKOUTS_API_PREFIX}/${formatWorkoutDateKey(date)}`, {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load workout data from account");
  }

  const payload = (await response.json()) as {
    data?: unknown;
  };

  return hydrateWorkoutDayData(payload.data);
}

async function saveWorkoutDayDataToAccount(
  date: Date,
  data: WorkoutDayData
): Promise<void> {
  const response = await fetch(`${WORKOUTS_API_PREFIX}/${formatWorkoutDateKey(date)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      data,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save workout data to account");
  }
}

async function clearWorkoutDayDataFromAccount(date: Date): Promise<void> {
  const response = await fetch(`${WORKOUTS_API_PREFIX}/${formatWorkoutDateKey(date)}`, {
    method: "DELETE",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Failed to clear workout data from account");
  }
}

function buildLocalSummary(dates: Date[]): Record<string, WorkoutDotType[]> {
  return Object.fromEntries(
    dates.map((targetDate) => [
      formatWorkoutDateKey(targetDate),
      loadWorkoutTypesForDate(targetDate),
    ])
  );
}

function normalizeWorkoutSummary(
  raw: unknown
): Record<string, WorkoutDotType[]> {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const parsed = raw as Record<string, unknown>;

  return Object.fromEntries(
    Object.entries(parsed).map(([dateKey, value]) => [
      dateKey,
      Array.isArray(value)
        ? value.filter(
            (type): type is WorkoutDotType =>
              type === "resistance" || type === "cardio"
          )
        : [],
    ])
  );
}

async function loadWorkoutSummaryFromAccount(
  dates: Date[]
): Promise<Record<string, WorkoutDotType[]>> {
  if (dates.length === 0) {
    return {};
  }

  const dateKeys = dates.map(formatWorkoutDateKey).sort();
  const searchParams = new URLSearchParams({
    start: dateKeys[0],
    end: dateKeys[dateKeys.length - 1],
  });
  const response = await fetch(`${WORKOUTS_API_PREFIX}/summary?${searchParams}`, {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Failed to load workout summary from account");
  }

  const payload = (await response.json()) as {
    summary?: unknown;
  };

  return normalizeWorkoutSummary(payload.summary);
}

function flushWorkoutDayToStorage(
  mode: WorkoutStorageMode,
  targetDate: Date,
  payload: WorkoutDayData
): void {
  if (mode === "local") {
    saveWorkoutDayData(targetDate, payload);
    return;
  }

  void saveWorkoutDayDataToAccount(targetDate, payload).catch((error) => {
    console.error("Failed to flush workout data:", error);
  });
}

export function useWorkoutStorage(date: Date, summaryDates: Date[] = []) {
  const { status } = useSession();
  const storageMode = getStorageMode(status);
  const [data, setData] = useState<WorkoutDayData>(getDefaultWorkoutDayData());
  const [isLoading, setIsLoading] = useState(true);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const savedResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<WorkoutDayData>(getDefaultWorkoutDayData());
  const currentDateRef = useRef<Date | undefined>(undefined);
  const currentModeRef = useRef<WorkoutStorageMode | null>(null);
  const storageModeRef = useRef<WorkoutStorageMode | null>(null);
  const persistIdRef = useRef(0);
  const [summaryMap, setSummaryMap] = useState<Record<string, WorkoutDotType[]>>(
    {}
  );
  const summaryDatesKey = useMemo(
    () => summaryDates.map(formatWorkoutDateKey).join("|"),
    [summaryDates]
  );

  const clearSavedReset = useCallback(() => {
    if (savedResetTimeoutRef.current) {
      clearTimeout(savedResetTimeoutRef.current);
      savedResetTimeoutRef.current = null;
    }
  }, []);

  const scheduleResetToIdle = useCallback(() => {
    clearSavedReset();
    savedResetTimeoutRef.current = setTimeout(() => {
      setAutosaveStatus("idle");
      savedResetTimeoutRef.current = null;
    }, 2000);
  }, [clearSavedReset]);

  useEffect(() => {
    storageModeRef.current = storageMode;
  }, [storageMode]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const updateSummaryEntry = useCallback(
    (targetDate: Date, nextData: WorkoutDayData) => {
      setSummaryMap((previous) => ({
        ...previous,
        [formatWorkoutDateKey(targetDate)]: extractWorkoutTypes(nextData),
      }));
    },
    []
  );

  const debouncedPersist = useCallback(() => {
    if (!storageMode) {
      return;
    }

    setAutosaveStatus("saving");
    clearSavedReset();

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const id = ++persistIdRef.current;
      const snapshot = dataRef.current;
      const targetDate = currentDateRef.current;
      const mode = storageModeRef.current;

      if (!targetDate || !mode) {
        saveTimeoutRef.current = null;
        return;
      }

      void (async () => {
        try {
          if (mode === "local") {
            saveWorkoutDayData(targetDate, snapshot);
          } else {
            await saveWorkoutDayDataToAccount(targetDate, snapshot);
          }

          if (id === persistIdRef.current) {
            setAutosaveStatus("saved");
            scheduleResetToIdle();
          }
        } catch (error) {
          console.error("Failed to persist workout data:", error);

          if (id === persistIdRef.current) {
            setAutosaveStatus("error");
          }
        }
      })();

      saveTimeoutRef.current = null;
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [storageMode, clearSavedReset, scheduleResetToIdle]);

  useEffect(() => {
    if (!storageMode) {
      setIsLoading(true);
      setAutosaveStatus("idle");
      clearSavedReset();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      return;
    }

    persistIdRef.current += 1;
    setAutosaveStatus("idle");
    clearSavedReset();

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (currentDateRef.current && currentModeRef.current) {
      const isDateChanged =
        currentDateRef.current.getTime() !== date.getTime();
      const isModeChanged = currentModeRef.current !== storageMode;

      if (isDateChanged || isModeChanged) {
        flushWorkoutDayToStorage(
          currentModeRef.current,
          currentDateRef.current,
          dataRef.current
        );
      }
    }

    currentDateRef.current = date;
    currentModeRef.current = storageMode;

    let isCancelled = false;
    setIsLoading(true);

    const loadDay = async () => {
      try {
        const loaded =
          storageMode === "account"
            ? await loadWorkoutDayDataFromAccount(date)
            : loadWorkoutDayData(date);
        const nextData = loaded ?? getDefaultWorkoutDayData();

        if (isCancelled) {
          return;
        }

        setData(nextData);
        dataRef.current = nextData;
        updateSummaryEntry(date, nextData);
      } catch (error) {
        console.error("Failed to hydrate workout data:", error);

        if (isCancelled) {
          return;
        }

        const defaultData = getDefaultWorkoutDayData();
        setData(defaultData);
        dataRef.current = defaultData;
        updateSummaryEntry(date, defaultData);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDay();

    return () => {
      isCancelled = true;
    };
  }, [date, storageMode, updateSummaryEntry, clearSavedReset]);

  useEffect(() => {
    if (!storageMode) {
      return;
    }

    let isCancelled = false;

    const loadSummary = async () => {
      try {
        const nextSummary =
          storageMode === "account"
            ? await loadWorkoutSummaryFromAccount(summaryDates)
            : buildLocalSummary(summaryDates);

        if (!isCancelled) {
          setSummaryMap(nextSummary);
        }
      } catch (error) {
        console.error("Failed to load workout summary:", error);

        if (!isCancelled) {
          setSummaryMap(buildLocalSummary(summaryDates));
        }
      }
    };

    void loadSummary();

    return () => {
      isCancelled = true;
    };
  }, [storageMode, summaryDates, summaryDatesKey]);

  const addWorkout = useCallback(
    (newWorkout: NewWorkoutInput) => {
      if (!storageMode) {
        return;
      }

      const subtaskNames = newWorkout.subtaskNames ?? [];
      setData((currentData) => {
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

        updateSummaryEntry(date, updated);
        debouncedPersist();
        return updated;
      });
    },
    [date, debouncedPersist, storageMode, updateSummaryEntry]
  );

  const updateWorkout = useCallback(
    (workoutId: string, updater: (workout: Workout) => Workout) => {
      if (!storageMode) {
        return;
      }

      setData((currentData) => {
        const updated: WorkoutDayData = {
          ...currentData,
          workouts: currentData.workouts.map((workout) =>
            workout.id === workoutId ? updater(workout) : workout
          ),
        };

        updateSummaryEntry(date, updated);
        debouncedPersist();
        return updated;
      });
    },
    [date, debouncedPersist, storageMode, updateSummaryEntry]
  );

  const deleteWorkout = useCallback(
    (workoutId: string) => {
      if (!storageMode) {
        return;
      }

      setData((currentData) => {
        const updated: WorkoutDayData = {
          ...currentData,
          workouts: currentData.workouts.filter((workout) => workout.id !== workoutId),
        };

        updateSummaryEntry(date, updated);
        debouncedPersist();
        return updated;
      });
    },
    [date, debouncedPersist, storageMode, updateSummaryEntry]
  );

  const clearWorkouts = useCallback(() => {
    if (!storageMode) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const defaultData = getDefaultWorkoutDayData();
    setData(defaultData);
    dataRef.current = defaultData;
    updateSummaryEntry(date, defaultData);

    if (storageMode === "local") {
      clearWorkoutDayData(date);
      setAutosaveStatus("saved");
      scheduleResetToIdle();
      return;
    }

    const id = ++persistIdRef.current;
    setAutosaveStatus("saving");
    clearSavedReset();

    void clearWorkoutDayDataFromAccount(date)
      .then(() => {
        if (id === persistIdRef.current) {
          setAutosaveStatus("saved");
          scheduleResetToIdle();
        }
      })
      .catch((error) => {
        console.error("Failed to clear workout data:", error);
        if (id === persistIdRef.current) {
          setAutosaveStatus("error");
        }
      });
  }, [
    date,
    storageMode,
    updateSummaryEntry,
    scheduleResetToIdle,
    clearSavedReset,
  ]);

  const getWorkoutTypesForDate = useCallback(
    (targetDate: Date): WorkoutDotType[] =>
      summaryMap[formatWorkoutDateKey(targetDate)] ?? [],
    [summaryMap]
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      clearSavedReset();
      if (currentDateRef.current && currentModeRef.current) {
        flushWorkoutDayToStorage(
          currentModeRef.current,
          currentDateRef.current,
          dataRef.current
        );
      }
    };
  }, [clearSavedReset]);

  return {
    data,
    isLoading,
    autosaveStatus,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    clearWorkouts,
    getWorkoutTypesForDate,
  };
}
