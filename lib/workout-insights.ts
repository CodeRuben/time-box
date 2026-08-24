import { format, parse } from "date-fns";
import {
  WORKOUT_TYPES,
  isWorkoutType,
  type Workout,
  type WorkoutDayData,
  type WorkoutSubtask,
  type WorkoutType,
} from "@/lib/workout-day-data";

export { WORKOUT_TYPES, isWorkoutType };
export type { WorkoutType };

/** Inclusive month-bucket cap for insight date ranges (API + client). */
export const MAX_INSIGHT_RANGE_MONTHS = 60;

export const INSIGHT_WORKOUT_TYPE_META: Record<
  WorkoutType,
  {
    label: string;
    badgeClass: string;
  }
> = {
  resistance: {
    label: "Resistance training",
    badgeClass: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  },
  cardio: {
    label: "Cardio",
    badgeClass: "bg-teal-500/20 text-teal-600",
  },
  hybrid: {
    label: "Hybrid",
    badgeClass: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
  },
  unknown: {
    label: "Uncategorized",
    badgeClass: "bg-muted text-muted-foreground",
  },
};

export interface WorkoutInsightDay {
  dateKey: string;
  data: WorkoutDayData;
}

export interface WorkoutInsightFilters {
  startDate: string;
  endDate: string;
  types: readonly WorkoutType[];
}

export interface WorkoutInsightEntry {
  dateKey: string;
  id: string;
  name: string;
  type: WorkoutType;
  createdAt: string;
  subtasks: WorkoutSubtask[];
}

export interface WorkoutInsightMonthlyCount {
  monthKey: string;
  counts: Record<WorkoutType, number>;
  total: number;
}

export interface WorkoutInsightMostActiveMonth {
  monthKey: string;
  total: number;
}

export interface WorkoutInsights {
  totalWorkoutEntries: number;
  activeDays: number;
  mostFrequentType: { type: WorkoutType; count: number } | null;
  mostActiveMonth: WorkoutInsightMostActiveMonth | null;
  monthlyCounts: WorkoutInsightMonthlyCount[];
  availableTypes: WorkoutType[];
  entries: WorkoutInsightEntry[];
}

export type WorkoutInsightsSummary = Omit<WorkoutInsights, "entries">;

export interface WorkoutInsightsPage {
  summary: WorkoutInsightsSummary;
  entries: WorkoutInsightEntry[];
  totalEntries: number;
  nextOffset: number | null;
}

export function formatMonthKey(monthKey: string, pattern: string): string {
  return format(parse(`${monthKey}-01`, "yyyy-MM-dd", new Date()), pattern);
}

export function emptyWorkoutInsightsSummary(): WorkoutInsightsSummary {
  return {
    totalWorkoutEntries: 0,
    activeDays: 0,
    mostFrequentType: null,
    mostActiveMonth: null,
    monthlyCounts: [],
    availableTypes: [...WORKOUT_TYPES],
  };
}

export function toWorkoutInsightsPage(
  insights: WorkoutInsights,
  offset: number,
  limit: number,
): WorkoutInsightsPage {
  const entries = insights.entries.slice(offset, offset + limit);
  return {
    summary: {
      totalWorkoutEntries: insights.totalWorkoutEntries,
      activeDays: insights.activeDays,
      mostFrequentType: insights.mostFrequentType,
      mostActiveMonth: insights.mostActiveMonth,
      monthlyCounts: insights.monthlyCounts,
      availableTypes: insights.availableTypes,
    },
    entries,
    totalEntries: insights.totalWorkoutEntries,
    nextOffset:
      offset + entries.length < insights.totalWorkoutEntries
        ? offset + entries.length
        : null,
  };
}

export function parseWorkoutInsightsPage(value: unknown): WorkoutInsightsPage {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid workout insights response");
  }

  const payload = value as Partial<WorkoutInsightsPage>;
  if (
    !payload.summary ||
    typeof payload.summary !== "object" ||
    !Array.isArray(payload.entries) ||
    typeof payload.totalEntries !== "number"
  ) {
    throw new Error("Invalid workout insights response");
  }

  const nextOffset =
    typeof payload.nextOffset === "number" ? payload.nextOffset : null;

  return {
    summary: {
      ...payload.summary,
      availableTypes: parseAvailableTypes(
        (payload.summary as WorkoutInsightsSummary).availableTypes,
      ),
    },
    entries: payload.entries,
    totalEntries: payload.totalEntries,
    nextOffset,
  };
}

function parseAvailableTypes(value: unknown): WorkoutType[] {
  if (!Array.isArray(value)) {
    return [...WORKOUT_TYPES];
  }

  return WORKOUT_TYPES.filter((type) => value.includes(type));
}

export function constrainSelectedWorkoutTypes(
  current: WorkoutType[],
  availableTypes: readonly WorkoutType[],
): WorkoutType[] {
  const next = WORKOUT_TYPES.filter(
    (type) => current.includes(type) && availableTypes.includes(type),
  );

  if (
    next.length === current.length &&
    next.every((type) => current.includes(type))
  ) {
    return current;
  }

  return next;
}

export function nextSelectedWorkoutTypes(
  current: WorkoutType[],
  type: WorkoutType,
  availableTypes: readonly WorkoutType[],
): WorkoutType[] {
  if (!availableTypes.includes(type)) {
    return current;
  }

  const selectedAvailable = current.filter((item) =>
    availableTypes.includes(item),
  );

  if (current.includes(type)) {
    if (selectedAvailable.length <= 1) {
      return current;
    }
    return current.filter((item) => item !== type);
  }

  return WORKOUT_TYPES.filter(
    (item) => item === type || current.includes(item),
  );
}

function emptyTypeCounts(): Record<WorkoutType, number> {
  return {
    resistance: 0,
    cardio: 0,
    hybrid: 0,
    unknown: 0,
  };
}

function toMonthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

function listMonthKeys(startDate: string, endDate: string): string[] {
  const startYear = Number(startDate.slice(0, 4));
  const startMonth = Number(startDate.slice(5, 7));
  const endYear = Number(endDate.slice(0, 4));
  const endMonth = Number(endDate.slice(5, 7));

  const keys: string[] = [];
  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return keys;
}

export function isInsightRangeWithinLimit(
  startDate: string,
  endDate: string,
  maxMonths: number = MAX_INSIGHT_RANGE_MONTHS,
): boolean {
  if (startDate > endDate) {
    return false;
  }
  return listMonthKeys(startDate, endDate).length <= maxMonths;
}

function toInsightEntry(
  dateKey: string,
  workout: Workout,
): WorkoutInsightEntry | null {
  if (!isWorkoutType(workout.type)) {
    return null;
  }

  return {
    dateKey,
    id: workout.id,
    name: workout.name,
    type: workout.type,
    createdAt: workout.createdAt,
    subtasks: workout.subtasks.map((subtask) => ({ ...subtask })),
  };
}

function pickMostActiveMonth(
  monthlyCounts: WorkoutInsightMonthlyCount[],
): WorkoutInsightMostActiveMonth | null {
  let best: WorkoutInsightMostActiveMonth | null = null;

  for (const row of monthlyCounts) {
    if (row.total <= 0) {
      continue;
    }
    if (
      !best ||
      row.total > best.total ||
      (row.total === best.total && row.monthKey > best.monthKey)
    ) {
      best = { monthKey: row.monthKey, total: row.total };
    }
  }

  return best;
}

function pickMostFrequentType(
  counts: Record<WorkoutType, number>,
): { type: WorkoutType; count: number } | null {
  let best: { type: WorkoutType; count: number } | null = null;

  for (const type of WORKOUT_TYPES) {
    const count = counts[type];
    if (count <= 0) {
      continue;
    }
    if (!best || count > best.count) {
      best = { type, count };
    }
  }

  return best;
}

export function buildWorkoutInsights(
  days: WorkoutInsightDay[],
  filters: WorkoutInsightFilters,
): WorkoutInsights {
  const selectedTypes = new Set(filters.types);
  const presentTypes = new Set<WorkoutType>();
  const typeTotals = emptyTypeCounts();
  const monthlyMap = new Map<string, Record<WorkoutType, number>>();
  const activeDayKeys = new Set<string>();
  const entries: WorkoutInsightEntry[] = [];

  for (const monthKey of listMonthKeys(filters.startDate, filters.endDate)) {
    monthlyMap.set(monthKey, emptyTypeCounts());
  }

  for (const day of days) {
    if (
      day.dateKey < filters.startDate ||
      day.dateKey > filters.endDate ||
      !Array.isArray(day.data.workouts)
    ) {
      continue;
    }

    let matchedOnDay = false;

    for (const workout of day.data.workouts) {
      const entry = toInsightEntry(day.dateKey, workout);
      if (!entry) {
        continue;
      }

      presentTypes.add(entry.type);
      if (!selectedTypes.has(entry.type)) {
        continue;
      }

      matchedOnDay = true;
      typeTotals[entry.type] += 1;
      entries.push(entry);

      const monthKey = toMonthKey(day.dateKey);
      const monthCounts = monthlyMap.get(monthKey) ?? emptyTypeCounts();
      monthCounts[entry.type] += 1;
      monthlyMap.set(monthKey, monthCounts);
    }

    if (matchedOnDay) {
      activeDayKeys.add(day.dateKey);
    }
  }

  entries.sort((a, b) => {
    const byDate = b.dateKey.localeCompare(a.dateKey);
    if (byDate !== 0) {
      return byDate;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });

  const monthlyCounts = [...monthlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, counts]) => ({
      monthKey,
      counts,
      total: WORKOUT_TYPES.reduce((sum, type) => sum + counts[type], 0),
    }));

  return {
    totalWorkoutEntries: entries.length,
    activeDays: activeDayKeys.size,
    mostFrequentType: pickMostFrequentType(typeTotals),
    mostActiveMonth: pickMostActiveMonth(monthlyCounts),
    monthlyCounts,
    availableTypes: WORKOUT_TYPES.filter((type) => presentTypes.has(type)),
    entries,
  };
}
