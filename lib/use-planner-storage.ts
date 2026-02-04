"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { ALL_HOURS } from "@/app/planner/constants";

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
const DEBOUNCE_MS = 500;

/**
 * Generate a consistent storage key from a date
 * Format: planner-YYYY-MM-DD
 */
export function getStorageKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${STORAGE_PREFIX}${year}-${month}-${day}`;
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

    const parsed = JSON.parse(stored) as PlannerData & LegacyPlannerData;

    // Validate and merge with defaults to handle missing fields
    const defaultData = getDefaultData();

    // Check if this is legacy format (has priorities array of strings)
    const isLegacyFormat =
      Array.isArray(parsed.priorities) &&
      (parsed.priorities.length === 0 ||
        typeof parsed.priorities[0] === "string");

    let topPriorities: TopPriority[];

    if (isLegacyFormat) {
      // Migrate from legacy format
      topPriorities = migrateFromLegacy(parsed);
    } else if (Array.isArray(parsed.topPriorities)) {
      // New format - validate and ensure all fields exist (backwards compatibility)
      topPriorities = parsed.topPriorities
        .slice(0, 3)
        .map(ensurePriorityFields);
    } else {
      topPriorities = [];
    }

    // Handle hourlySlots migration from legacy hourlyPlans + hourlyStatuses
    let hourlySlots: Record<string, HourlyItem[]>;
    if (parsed.hourlySlots) {
      // New format - ensure all slots exist
      hourlySlots = { ...defaultData.hourlySlots, ...parsed.hourlySlots };
    } else if (parsed.hourlyPlans) {
      // Migrate from legacy hourlyPlans + hourlyStatuses
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
    const dataToSave: PlannerData = {
      ...data,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(dataToSave));
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded. Data not saved.");
      // Could show user notification here
    } else {
      console.error("Failed to save planner data:", error);
    }
  }
}

/**
 * Hook to manage planner data with localStorage persistence
 * Automatically loads data on mount and when date changes
 * Debounces saves to avoid excessive localStorage writes
 */
export function usePlannerStorage(date: Date | undefined) {
  const [data, setData] = React.useState<PlannerData>(getDefaultData());
  const [isLoading, setIsLoading] = React.useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentDateRef = useRef<Date | undefined>(date);
  const dataRef = useRef<PlannerData>(getDefaultData());

  // Keep dataRef in sync with data state
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Load data when component mounts or date changes
  useEffect(() => {
    if (!date) {
      setIsLoading(false);
      return;
    }

    // Save current date's data before switching dates
    if (
      currentDateRef.current &&
      currentDateRef.current.getTime() !== date.getTime()
    ) {
      // Clear any pending save for the old date
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      // Immediately save the old date's data using ref to avoid stale closure
      savePlannerData(currentDateRef.current, dataRef.current);
    }

    // Load new date's data
    setIsLoading(true);
    const loaded = loadPlannerData(date);

    if (loaded) {
      setData(loaded);
      dataRef.current = loaded;
    } else {
      const defaultData = getDefaultData();
      setData(defaultData);
      dataRef.current = defaultData;
    }

    currentDateRef.current = date;
    setIsLoading(false);
  }, [date]);

  // Debounced save function
  const debouncedSave = useCallback(
    (newData: PlannerData) => {
      if (!date) return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout
      saveTimeoutRef.current = setTimeout(() => {
        savePlannerData(date, newData);
        saveTimeoutRef.current = null;
      }, DEBOUNCE_MS);
    },
    [date]
  );

  // Update data and trigger save
  const updateData = useCallback(
    (updater: PlannerData | ((prev: PlannerData) => PlannerData)) => {
      setData((prev) => {
        const newData = typeof updater === "function" ? updater(prev) : updater;
        debouncedSave(newData);
        return newData;
      });
    },
    [debouncedSave]
  );

  // Cleanup timeout on unmount and save current data
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save immediately on unmount if date is set (use ref to avoid stale closure)
      if (currentDateRef.current) {
        savePlannerData(currentDateRef.current, dataRef.current);
      }
    };
  }, []);

  return {
    data,
    setData: updateData,
    isLoading,
  };
}
