"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { endOfDay, startOfYear, subDays, subMonths } from "date-fns";
import { useSession } from "next-auth/react";
import { formatDateKey } from "@/lib/date-key";
import {
  getStorageMode,
  loadAllLocalWorkoutDays,
} from "@/lib/use-workout-storage";
import {
  MAX_INSIGHT_RANGE_MONTHS,
  WORKOUT_TYPES,
  buildWorkoutInsights,
  emptyWorkoutInsightsSummary,
  isInsightRangeWithinLimit,
  parseWorkoutInsightsPage,
  toWorkoutInsightsPage,
  type WorkoutInsightEntry,
  type WorkoutInsightsPage,
  type WorkoutInsightsSummary,
  type WorkoutType,
} from "@/lib/workout-insights";

export type InsightPreset = "year-to-date" | "last-90-days" | "last-12-months";

const PAGE_SIZE = 20;

function getPresetRange(
  preset: InsightPreset,
  today: Date,
): { startDate: string; endDate: string } {
  const endDate = formatDateKey(today);

  if (preset === "year-to-date") {
    return {
      startDate: formatDateKey(startOfYear(today)),
      endDate,
    };
  }

  if (preset === "last-90-days") {
    return {
      startDate: formatDateKey(subDays(today, 89)),
      endDate,
    };
  }

  return {
    startDate: formatDateKey(subMonths(today, 11)),
    endDate,
  };
}

function isCompleteRange(startDate: string, endDate: string) {
  return startDate <= endDate;
}

function loadLocalInsightsPage(input: {
  startDate: string;
  endDate: string;
  types: readonly WorkoutType[];
  offset: number;
  limit: number;
}): WorkoutInsightsPage {
  const insights = buildWorkoutInsights(loadAllLocalWorkoutDays(), {
    startDate: input.startDate,
    endDate: input.endDate,
    types: input.types,
  });
  return toWorkoutInsightsPage(insights, input.offset, input.limit);
}

async function loadAccountInsightsPage(input: {
  startDate: string;
  endDate: string;
  types: readonly WorkoutType[];
  offset: number;
  limit: number;
}): Promise<WorkoutInsightsPage> {
  const params = new URLSearchParams({
    start: input.startDate,
    end: input.endDate,
    offset: String(input.offset),
    limit: String(input.limit),
  });
  for (const type of input.types) {
    params.append("type", type);
  }

  const response = await fetch(`/api/workouts/insights?${params}`, {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Failed to load workout insights");
  }

  return parseWorkoutInsightsPage(await response.json());
}

async function loadInsightsPage(input: {
  mode: "local" | "account";
  startDate: string;
  endDate: string;
  types: readonly WorkoutType[];
  offset: number;
  limit: number;
}): Promise<WorkoutInsightsPage> {
  if (input.mode === "local") {
    return loadLocalInsightsPage(input);
  }
  return loadAccountInsightsPage(input);
}

export function useWorkoutInsights() {
  const { status } = useSession();
  const today = useMemo(() => endOfDay(new Date()), []);
  const defaultRange = useMemo(
    () => getPresetRange("year-to-date", today),
    [today],
  );

  const [preset, setPreset] = useState<InsightPreset | null>("year-to-date");
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [selectedTypes, setSelectedTypes] = useState<WorkoutType[]>([
    ...WORKOUT_TYPES,
  ]);
  const [summary, setSummary] = useState<WorkoutInsightsSummary>(
    emptyWorkoutInsightsSummary,
  );
  const [entries, setEntries] = useState<WorkoutInsightEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextOffsetRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
  const hasLoadedRef = useRef(false);

  const applyPage = useCallback((page: WorkoutInsightsPage) => {
    setSummary(page.summary);
    setEntries(page.entries);
    setTotalEntries(page.totalEntries);
    setNextOffset(page.nextOffset);
    nextOffsetRef.current = page.nextOffset;
    setHasLoaded(true);
    hasLoadedRef.current = true;
    setIsLoading(false);
  }, []);

  const applyPreset = useCallback(
    (nextPreset: InsightPreset) => {
      const range = getPresetRange(nextPreset, today);
      setPreset(nextPreset);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    },
    [today],
  );

  const applyCustomRange = useCallback(
    (nextStart: Date | undefined, nextEnd: Date | undefined) => {
      if (!nextStart || !nextEnd) {
        return;
      }

      const nextStartKey = formatDateKey(nextStart);
      const nextEndKey = formatDateKey(nextEnd);
      if (!isInsightRangeWithinLimit(nextStartKey, nextEndKey)) {
        setError(
          `Date range cannot exceed ${MAX_INSIGHT_RANGE_MONTHS} months.`,
        );
        return;
      }

      setError(null);
      setPreset(null);
      setStartDate(nextStartKey);
      setEndDate(nextEndKey);
    },
    [],
  );

  const toggleType = useCallback((type: WorkoutType) => {
    setSelectedTypes((current) => {
      if (current.includes(type)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((item) => item !== type);
      }
      return WORKOUT_TYPES.filter(
        (item) => item === type || current.includes(item),
      );
    });
  }, []);

  useEffect(() => {
    const storageMode = getStorageMode(status);
    if (!storageMode || !isCompleteRange(startDate, endDate)) {
      return;
    }

    if (!isInsightRangeWithinLimit(startDate, endDate)) {
      setError(`Date range cannot exceed ${MAX_INSIGHT_RANGE_MONTHS} months.`);
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    setError(null);
    setIsLoadingMore(false);

    const filter = {
      startDate,
      endDate,
      types: selectedTypes,
      offset: 0,
      limit: PAGE_SIZE,
    };

    // Local insights are sync — swap results in place with no loading flash.
    if (storageMode === "local") {
      requestIdRef.current += 1;
      try {
        applyPage(loadLocalInsightsPage(filter));
      } catch (loadError) {
        console.error("Failed to load workout insights:", loadError);
        setError("Unable to load workout insights.");
        if (!hasLoadedRef.current) {
          setSummary(emptyWorkoutInsightsSummary());
          setEntries([]);
          setTotalEntries(0);
        }
        setNextOffset(null);
        nextOffsetRef.current = null;
        setIsLoading(false);
      }
      return;
    }

    const requestId = ++requestIdRef.current;
    const keepPriorResults = hasLoadedRef.current;
    setIsLoading(true);
    if (!keepPriorResults) {
      setEntries([]);
    }
    setNextOffset(null);
    nextOffsetRef.current = null;

    const load = async () => {
      try {
        const page = await loadAccountInsightsPage(filter);

        if (requestId !== requestIdRef.current) {
          return;
        }

        applyPage(page);
      } catch (loadError) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        console.error("Failed to load workout insights:", loadError);
        setError("Unable to load workout insights.");
        if (!keepPriorResults) {
          setSummary(emptyWorkoutInsightsSummary());
          setEntries([]);
          setTotalEntries(0);
        }
        setNextOffset(null);
        nextOffsetRef.current = null;
        setIsLoading(false);
      }
    };

    void load();
  }, [startDate, endDate, selectedTypes, status, applyPage]);

  const loadMore = useCallback(async () => {
    const storageMode = getStorageMode(status);
    const offset = nextOffsetRef.current;
    if (!storageMode || isLoading || isLoadingMore || offset === null) {
      return;
    }

    const requestId = requestIdRef.current;
    setIsLoadingMore(true);

    try {
      const page = await loadInsightsPage({
        mode: storageMode,
        startDate,
        endDate,
        types: selectedTypes,
        offset,
        limit: PAGE_SIZE,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setEntries((current) => [...current, ...page.entries]);
      setNextOffset(page.nextOffset);
      nextOffsetRef.current = page.nextOffset;
    } catch (loadError) {
      console.error("Failed to load more workout insights:", loadError);
      setError("Unable to load more workouts.");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [status, isLoading, isLoadingMore, startDate, endDate, selectedTypes]);

  return {
    today,
    preset,
    startDate,
    endDate,
    selectedTypes,
    summary,
    entries,
    totalEntries,
    hasMore: nextOffset !== null,
    isLoading,
    isInitialLoading: isLoading && !hasLoaded,
    isRefreshing: isLoading && hasLoaded,
    isLoadingMore,
    error,
    applyPreset,
    applyCustomRange,
    toggleType,
    loadMore,
  };
}
