"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ALL_HOURS } from "@/app/planner/constants";
import { formatDateKey } from "@/lib/date-key";
import type { AutosaveStatus } from "@/lib/autosave-status";
import { AUTOSAVE_DEBOUNCE_MS } from "@/lib/autosave-debounce";

export type TaskStatus = "pending" | "completed" | "error";

export interface SubTask {
  id: string;
  name: string;
  completed: boolean;
}

export interface TopPriority {
  id: string;
  name: string;
  completed: boolean;
  subtasks: SubTask[];
  linkedTaskId?: string;
}

export interface HourlyItem {
  id: string;
  text: string;
  status: TaskStatus;
}

export interface PlannerData {
  topPriorities: TopPriority[];
  brainDump: string;
  hourlySlots: Record<string, HourlyItem[]>;
  lastSaved?: string;
}

export interface CopyPreviousDayOptions {
  includeTopPriorities: boolean;
  includeHourlySchedule: boolean;
  includeBrainDump: boolean;
  onlyUnfinished: boolean;
  mode: "replace" | "merge";
}

// Legacy interface for migration (exported for testing)
export interface LegacyPlannerData {
  priorities?: string[];
  priorityCompleted?: boolean[];
  brainDump?: string;
  hourlyPlans?: Record<string, string>;
  hourlyCompleted?: Record<string, boolean>;
  hourlyStatuses?: Record<string, TaskStatus>;
  hourlySlots?: Record<string, HourlyItem[]>;
  lastSaved?: string;
}

const STORAGE_PREFIX = "planner-";
const PLANNER_API_PREFIX = "/api/planner";

type PlannerStorageMode = "local" | "account";

/**
 * Generate a consistent storage key from a date
 * Format: planner-YYYY-MM-DD
 */
export function getStorageKey(date: Date): string {
  return `${STORAGE_PREFIX}${formatDateKey(date)}`;
}

/**
 * Get default/empty planner data
 * Uses ALL_HOURS to ensure all possible time slots are initialized,
 * even if the user has configured a narrower visible range
 */
export function getDefaultData(): PlannerData {
  return {
    topPriorities: [],
    brainDump: "",
    hourlySlots: ALL_HOURS.reduce(
      (acc, hour) => ({
        ...acc,
        [`${hour}:00`]: [],
        [`${hour}:30`]: [],
      }),
      {} as Record<string, HourlyItem[]>
    ),
  };
}

/**
 * Migrate hourlyCompleted (boolean) to hourlyStatuses (TaskStatus)
 */
export function migrateHourlyCompleted(
  completed: Record<string, boolean>
): Record<string, TaskStatus> {
  const statuses: Record<string, TaskStatus> = {};
  for (const [key, value] of Object.entries(completed)) {
    statuses[key] = value ? "completed" : "pending";
  }
  return statuses;
}

/**
 * Migrate legacy hourlyPlans + hourlyStatuses to new hourlySlots format
 */
export function migrateToHourlySlots(
  hourlyPlans: Record<string, string>,
  hourlyStatuses: Record<string, TaskStatus>
): Record<string, HourlyItem[]> {
  const hourlySlots: Record<string, HourlyItem[]> = {};

  for (const [key, text] of Object.entries(hourlyPlans)) {
    if (text && text.trim() !== "") {
      hourlySlots[key] = [
        {
          id: crypto.randomUUID(),
          text: text.trim(),
          status: hourlyStatuses[key] || "pending",
        },
      ];
    } else {
      hourlySlots[key] = [];
    }
  }

  return hourlySlots;
}

/**
 * Migrate legacy data format to new format
 */
export function migrateFromLegacy(legacy: LegacyPlannerData): TopPriority[] {
  if (!legacy.priorities || !Array.isArray(legacy.priorities)) {
    return [];
  }

  const migrated: TopPriority[] = [];

  for (const name of legacy.priorities) {
    if (name && name.trim() !== "") {
      migrated.push({
        id: crypto.randomUUID(),
        name: name.trim(),
        completed: false,
        subtasks: [] as SubTask[],
      });
    }
  }

  return migrated;
}

/**
 * Ensure TopPriority has all required fields (for backwards compatibility)
 */
export function ensurePriorityFields(
  priority: Partial<TopPriority> & { id: string; name: string }
): TopPriority {
  return {
    id: priority.id,
    name: priority.name,
    completed: priority.completed ?? false,
    subtasks: priority.subtasks ?? [],
    linkedTaskId: priority.linkedTaskId,
  };
}

function withLastSaved(data: PlannerData): PlannerData {
  return {
    ...data,
    lastSaved: new Date().toISOString(),
  };
}

function copySubTasks(subtasks: SubTask[], onlyUnfinished: boolean): SubTask[] {
  return subtasks
    .filter((subtask) => !onlyUnfinished || !subtask.completed)
    .map((subtask) => ({
      ...subtask,
      id: crypto.randomUUID(),
      completed: false,
    }));
}

function copyTopPriority(
  priority: TopPriority,
  onlyUnfinished: boolean
): TopPriority {
  return {
    ...priority,
    id: crypto.randomUUID(),
    completed: false,
    subtasks: copySubTasks(priority.subtasks, onlyUnfinished),
  };
}

function copyHourlyItems(
  items: HourlyItem[] | undefined,
  onlyUnfinished: boolean
): HourlyItem[] {
  return (items ?? [])
    .filter((item) => !onlyUnfinished || item.status !== "completed")
    .map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      status: "pending",
    }));
}

function mergeBrainDump(current: string, previous: string): string {
  const currentText = current.trim();
  const previousText = previous.trim();

  if (!previousText) {
    return current;
  }

  if (!currentText) {
    return previous;
  }

  return `${current}\n\n${previous}`;
}

function getCopiedTopPriorities(
  previous: PlannerData,
  onlyUnfinished: boolean
): TopPriority[] {
  return previous.topPriorities
    .filter((priority) => !onlyUnfinished || !priority.completed)
    .map((priority) => copyTopPriority(priority, onlyUnfinished));
}

function copyHourlySlots(
  current: Record<string, HourlyItem[]>,
  previous: Record<string, HourlyItem[]>,
  options: CopyPreviousDayOptions
): Record<string, HourlyItem[]> {
  const allSlotKeys = new Set([...Object.keys(current), ...Object.keys(previous)]);
  const nextSlots: Record<string, HourlyItem[]> = {};

  for (const slotKey of allSlotKeys) {
    const copiedItems = copyHourlyItems(
      previous[slotKey],
      options.onlyUnfinished
    );

    nextSlots[slotKey] =
      options.mode === "replace"
        ? copiedItems
        : [...(current[slotKey] ?? []), ...copiedItems];
  }

  return nextSlots;
}

export function hasCopyablePlannerData(
  previous: PlannerData,
  options: CopyPreviousDayOptions
): boolean {
  if (
    options.includeTopPriorities &&
    previous.topPriorities.some(
      (priority) => !options.onlyUnfinished || !priority.completed
    )
  ) {
    return true;
  }

  if (
    options.includeHourlySchedule &&
    Object.values(previous.hourlySlots).some((items) =>
      items.some((item) => !options.onlyUnfinished || item.status !== "completed")
    )
  ) {
    return true;
  }

  return options.includeBrainDump && previous.brainDump.trim().length > 0;
}

export function copyPlannerDataFromPreviousDay(
  current: PlannerData,
  previous: PlannerData,
  options: CopyPreviousDayOptions
): PlannerData {
  const copiedPriorities = getCopiedTopPriorities(
    previous,
    options.onlyUnfinished
  );

  return {
    ...current,
    topPriorities: options.includeTopPriorities
      ? options.mode === "replace"
        ? copiedPriorities.slice(0, 3)
        : [...current.topPriorities, ...copiedPriorities].slice(0, 3)
      : current.topPriorities,
    brainDump: options.includeBrainDump
      ? options.mode === "replace"
        ? previous.brainDump
        : mergeBrainDump(current.brainDump, previous.brainDump)
      : current.brainDump,
    hourlySlots: options.includeHourlySchedule
      ? copyHourlySlots(current.hourlySlots, previous.hourlySlots, options)
      : current.hourlySlots,
  };
}

function hydratePlannerData(raw: unknown): PlannerData | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const parsed = raw as PlannerData & LegacyPlannerData;
  const defaultData = getDefaultData();

  const isLegacyFormat =
    Array.isArray(parsed.priorities) &&
    (parsed.priorities.length === 0 || typeof parsed.priorities[0] === "string");

  let topPriorities: TopPriority[];

  if (isLegacyFormat) {
    topPriorities = migrateFromLegacy(parsed);
  } else if (Array.isArray(parsed.topPriorities)) {
    topPriorities = parsed.topPriorities.slice(0, 3).map(ensurePriorityFields);
  } else {
    topPriorities = [];
  }

  let hourlySlots: Record<string, HourlyItem[]>;
  if (parsed.hourlySlots) {
    hourlySlots = { ...defaultData.hourlySlots, ...parsed.hourlySlots };
  } else if (parsed.hourlyPlans) {
    let hourlyStatuses: Record<string, TaskStatus> = {};
    if (parsed.hourlyStatuses) {
      hourlyStatuses = parsed.hourlyStatuses;
    } else if (parsed.hourlyCompleted) {
      hourlyStatuses = migrateHourlyCompleted(parsed.hourlyCompleted);
    }
    hourlySlots = {
      ...defaultData.hourlySlots,
      ...migrateToHourlySlots(parsed.hourlyPlans, hourlyStatuses),
    };
  } else {
    hourlySlots = defaultData.hourlySlots;
  }

  return {
    ...defaultData,
    brainDump: parsed.brainDump || defaultData.brainDump,
    hourlySlots,
    topPriorities,
    lastSaved: parsed.lastSaved,
  };
}

/**
 * Load planner data from localStorage for a specific date
 */
export function loadPlannerData(date: Date): PlannerData | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const key = getStorageKey(date);
    const stored = localStorage.getItem(key);

    if (!stored) {
      return null;
    }

    return hydratePlannerData(JSON.parse(stored));
  } catch (error) {
    console.error("Failed to load planner data:", error);
    return null;
  }
}

/**
 * Save planner data to localStorage for a specific date
 */
export function savePlannerData(date: Date, data: PlannerData): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const key = getStorageKey(date);
    localStorage.setItem(key, JSON.stringify(withLastSaved(data)));
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded. Data not saved.");
      // Could show user notification here
    } else {
      console.error("Failed to save planner data:", error);
    }
  }
}

async function loadPlannerDataFromAccount(date: Date): Promise<PlannerData | null> {
  const response = await fetch(`${PLANNER_API_PREFIX}/${formatDateKey(date)}`, {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load planner data from account");
  }

  const payload = (await response.json()) as {
    data?: unknown;
  };

  return hydratePlannerData(payload.data);
}

async function savePlannerDataToAccount(
  date: Date,
  data: PlannerData
): Promise<void> {
  const response = await fetch(`${PLANNER_API_PREFIX}/${formatDateKey(date)}`, {
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
    throw new Error("Failed to save planner data to account");
  }
}

function getStorageMode(
  status: "authenticated" | "loading" | "unauthenticated"
): PlannerStorageMode | null {
  if (status === "loading") {
    return null;
  }

  return status === "authenticated" ? "account" : "local";
}

// Identity used to scope the in-memory caches so different users (or
// unauthenticated local storage) never read each other's data across SPA
// navigations without a full page reload.
type CacheIdentity = string;

function getCacheIdentity(
  mode: PlannerStorageMode,
  userId: string | null
): CacheIdentity {
  return mode === "account" ? `account:${userId ?? "unknown"}` : "local";
}

function buildCacheKey(identity: CacheIdentity, date: Date): string {
  return `${identity}:${formatDateKey(date)}`;
}

// In-memory cache survives SPA navigations (cleared only on full page reload
// or when the active identity changes).
const dataCache = new Map<string, PlannerData>();
// Tracks in-flight account saves so a subsequent load can wait for them.
const pendingSavesByKey = new Map<string, Promise<void>>();

function clearCachesForOtherIdentities(activeIdentity: CacheIdentity): void {
  const prefix = `${activeIdentity}:`;
  for (const key of dataCache.keys()) {
    if (!key.startsWith(prefix)) {
      dataCache.delete(key);
    }
  }
  for (const key of pendingSavesByKey.keys()) {
    if (!key.startsWith(prefix)) {
      pendingSavesByKey.delete(key);
    }
  }
}

function getCachedData(
  identity: CacheIdentity,
  date: Date
): PlannerData | undefined {
  return dataCache.get(buildCacheKey(identity, date));
}

function setCachedData(
  identity: CacheIdentity,
  date: Date,
  data: PlannerData
): void {
  dataCache.set(buildCacheKey(identity, date), data);
}

function persistPlannerData(
  identity: CacheIdentity,
  mode: PlannerStorageMode,
  date: Date,
  data: PlannerData
) {
  const key = buildCacheKey(identity, date);
  setCachedData(identity, date, data);

  if (mode === "local") {
    savePlannerData(date, data);
    pendingSavesByKey.delete(key);
    return;
  }

  const savePromise = savePlannerDataToAccount(date, data)
    .catch((error) => {
      console.error("Failed to persist planner data:", error);
    })
    .finally(() => {
      if (pendingSavesByKey.get(key) === savePromise) {
        pendingSavesByKey.delete(key);
      }
    });

  pendingSavesByKey.set(key, savePromise);
}

function waitForPendingSave(
  identity: CacheIdentity,
  date: Date
): Promise<void> | undefined {
  return pendingSavesByKey.get(buildCacheKey(identity, date));
}

/**
 * Hook to manage planner data with localStorage persistence
 * Automatically loads data on mount and when date changes
 * Debounces saves to avoid excessive localStorage writes
 */
export function usePlannerStorage(date: Date | undefined) {
  const { status, data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const storageMode = getStorageMode(status);
  const identity =
    storageMode === null ? null : getCacheIdentity(storageMode, userId);

  // When the active identity changes (login/logout/user switch without full
  // reload), purge cached data for other identities up-front.
  if (identity !== null) {
    clearCachesForOtherIdentities(identity);
  }

  const cached = identity && date ? getCachedData(identity, date) : undefined;
  const [data, setData] = React.useState<PlannerData>(
    () => cached ?? getDefaultData()
  );
  const [isLoading, setIsLoading] = React.useState(!cached);
  const [autosaveStatus, setAutosaveStatus] =
    React.useState<AutosaveStatus>("idle");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const persistIdRef = useRef(0);
  const currentDateRef = useRef<Date | undefined>(date);
  const currentModeRef = useRef<PlannerStorageMode | null>(null);
  const currentIdentityRef = useRef<CacheIdentity | null>(null);
  const dataRef = useRef<PlannerData>(cached ?? getDefaultData());

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

  // Keep dataRef and module-level cache in sync with data state
  useEffect(() => {
    dataRef.current = data;
    if (identity && date) {
      setCachedData(identity, date, data);
    }
  }, [data, date, identity]);

  // Load data when component mounts or date changes
  useEffect(() => {
    const hasCachedData = !!date && !!identity && !!getCachedData(identity, date);

    if (!date || !storageMode || !identity) {
      if (!hasCachedData) {
        setIsLoading(true);
      }
      setAutosaveStatus("idle");
      clearSavedReset();
      persistIdRef.current += 1;
      return;
    }

    setAutosaveStatus("idle");
    clearSavedReset();
    persistIdRef.current += 1;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (
      currentDateRef.current &&
      currentModeRef.current &&
      currentIdentityRef.current
    ) {
      const isDateChanged = currentDateRef.current.getTime() !== date.getTime();
      const isModeChanged = currentModeRef.current !== storageMode;
      const isIdentityChanged = currentIdentityRef.current !== identity;

      // Only flush pending edits for the SAME identity. If the identity
      // changed (sign-in/out), dropping is correct: the stale buffer belongs
      // to the previous user/session.
      if ((isDateChanged || isModeChanged) && !isIdentityChanged) {
        persistPlannerData(
          currentIdentityRef.current,
          currentModeRef.current,
          currentDateRef.current,
          dataRef.current
        );
      }
    }

    if (!hasCachedData) {
      setIsLoading(true);
    }
    currentDateRef.current = date;
    currentModeRef.current = storageMode;
    currentIdentityRef.current = identity;

    let isCancelled = false;

    const loadData = async () => {
      try {
        const pendingSave = waitForPendingSave(identity, date);
        if (pendingSave) {
          await pendingSave;
        }

        if (isCancelled) {
          return;
        }

        const loaded =
          storageMode === "account"
            ? await loadPlannerDataFromAccount(date)
            : loadPlannerData(date);

        if (isCancelled) {
          return;
        }

        const nextData = loaded ?? getDefaultData();
        setData(nextData);
        dataRef.current = nextData;
      } catch (error) {
        console.error("Failed to hydrate planner data:", error);

        if (isCancelled) {
          return;
        }

        const defaultData = getDefaultData();
        setData(defaultData);
        dataRef.current = defaultData;
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [date, storageMode, identity, clearSavedReset]);

  // Debounced save function
  const debouncedSave = useCallback(() => {
    if (!date || !storageMode || !identity) {
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
      const cacheKey = buildCacheKey(identity, date);

      // Held in an object so the async IIFE's finally block can refer back to
      // its own promise identity (needed to avoid clearing a newer pending
      // entry) without relying on `let` self-assignment.
      const holder: { promise?: Promise<void> } = {};
      holder.promise = (async () => {
        try {
          if (storageMode === "local") {
            savePlannerData(date, snapshot);
          } else {
            await savePlannerDataToAccount(date, snapshot);
          }

          if (id === persistIdRef.current) {
            setAutosaveStatus("saved");
            scheduleResetToIdle();
          }
        } catch (error) {
          console.error("Failed to persist planner data:", error);

          if (id === persistIdRef.current) {
            setAutosaveStatus("error");
          }
        } finally {
          if (pendingSavesByKey.get(cacheKey) === holder.promise) {
            pendingSavesByKey.delete(cacheKey);
          }
        }
      })();

      pendingSavesByKey.set(cacheKey, holder.promise);
      saveTimeoutRef.current = null;
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [date, storageMode, identity, clearSavedReset, scheduleResetToIdle]);

  // Update data and trigger save
  const updateData = useCallback(
    (updater: PlannerData | ((prev: PlannerData) => PlannerData)) => {
      setData((prev) => {
        const newData = typeof updater === "function" ? updater(prev) : updater;
        debouncedSave();
        return newData;
      });
    },
    [debouncedSave]
  );

  const loadDataForDate = useCallback(
    async (targetDate: Date): Promise<PlannerData | null> => {
      if (!storageMode || !identity) {
        return null;
      }

      const cachedData = getCachedData(identity, targetDate);
      if (cachedData) {
        return cachedData;
      }

      const pendingSave = waitForPendingSave(identity, targetDate);
      if (pendingSave) {
        await pendingSave;
      }

      const loaded =
        storageMode === "account"
          ? await loadPlannerDataFromAccount(targetDate)
          : loadPlannerData(targetDate);

      if (loaded) {
        setCachedData(identity, targetDate, loaded);
      }

      return loaded;
    },
    [storageMode, identity]
  );

  // Cleanup timeout on unmount and save current data
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      clearSavedReset();
      if (
        currentDateRef.current &&
        currentModeRef.current &&
        currentIdentityRef.current
      ) {
        persistPlannerData(
          currentIdentityRef.current,
          currentModeRef.current,
          currentDateRef.current,
          dataRef.current
        );
      }
    };
  }, [clearSavedReset]);

  return {
    data,
    setData: updateData,
    isLoading,
    autosaveStatus,
    loadDataForDate,
  };
}
