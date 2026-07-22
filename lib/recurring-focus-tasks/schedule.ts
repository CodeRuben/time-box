import { dateKeyToLocalDate, isDateKey } from "@/lib/date-key";
import type {
  RecurringFocusTaskDto,
  RecurringFocusTaskSchedule,
  Weekday,
} from "@/lib/recurring-focus-tasks/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getWeekdayFromDateKey(dateKey: string): Weekday {
  return dateKeyToLocalDate(dateKey).getDay() as Weekday;
}

export function getWholeWeeksBetween(
  anchorDateKey: string,
  dateKey: string
): number {
  const anchorMs = dateKeyToLocalDate(anchorDateKey).getTime();
  const dateMs = dateKeyToLocalDate(dateKey).getTime();
  const dayDiff = Math.floor((dateMs - anchorMs) / MS_PER_DAY);
  return Math.floor(dayDiff / 7);
}

export function normalizeWeekdays(weekdays: Weekday[]): Weekday[] {
  return [...new Set(weekdays)].sort((a, b) => a - b) as Weekday[];
}

function isWeekday(value: unknown): value is Weekday {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 6
  );
}

export function parseRecurringFocusTaskSchedule(
  raw: unknown
): RecurringFocusTaskSchedule | null {
  let value = raw;

  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const schedule = value as Record<string, unknown>;

  if (!Array.isArray(schedule.weekdays)) {
    return null;
  }

  if (schedule.weekdays.length === 0 || !schedule.weekdays.every(isWeekday)) {
    return null;
  }

  const weekdays = normalizeWeekdays(schedule.weekdays);

  if (schedule.type === "weekly") {
    return { type: "weekly", weekdays };
  }

  if (schedule.type === "active_rest_weeks") {
    if (
      typeof schedule.anchorDate !== "string" ||
      !isDateKey(schedule.anchorDate)
    ) {
      return null;
    }

    if (
      typeof schedule.activeWeeks !== "number" ||
      !Number.isInteger(schedule.activeWeeks) ||
      schedule.activeWeeks < 1
    ) {
      return null;
    }

    if (
      typeof schedule.inactiveWeeks !== "number" ||
      !Number.isInteger(schedule.inactiveWeeks) ||
      schedule.inactiveWeeks < 1
    ) {
      return null;
    }

    return {
      type: "active_rest_weeks",
      weekdays,
      anchorDate: schedule.anchorDate,
      activeWeeks: schedule.activeWeeks,
      inactiveWeeks: schedule.inactiveWeeks,
    };
  }

  return null;
}

export function serializeRecurringFocusTaskSchedule(
  schedule: RecurringFocusTaskSchedule
): string {
  if (schedule.type === "weekly") {
    return JSON.stringify({
      type: "weekly",
      weekdays: normalizeWeekdays(schedule.weekdays),
    });
  }

  return JSON.stringify({
    type: "active_rest_weeks",
    weekdays: normalizeWeekdays(schedule.weekdays),
    anchorDate: schedule.anchorDate,
    activeWeeks: schedule.activeWeeks,
    inactiveWeeks: schedule.inactiveWeeks,
  });
}

function isWithinOptionalDateRange(
  dateKey: string,
  startDate: string | null,
  endDate: string | null
): boolean {
  if (startDate && dateKey < startDate) {
    return false;
  }
  if (endDate && dateKey > endDate) {
    return false;
  }
  return true;
}

function matchesScheduleOnDate(
  schedule: RecurringFocusTaskSchedule,
  dateKey: string
): boolean {
  const weekday = getWeekdayFromDateKey(dateKey);
  if (!schedule.weekdays.includes(weekday)) {
    return false;
  }

  if (schedule.type === "weekly") {
    return true;
  }

  if (dateKey < schedule.anchorDate) {
    return false;
  }

  const wholeWeeks = getWholeWeeksBetween(schedule.anchorDate, dateKey);
  const cycleLength = schedule.activeWeeks + schedule.inactiveWeeks;
  const weekInCycle = wholeWeeks % cycleLength;
  return weekInCycle < schedule.activeWeeks;
}

export function isRecurringFocusTaskActiveOnDate(
  task: Pick<
    RecurringFocusTaskDto,
    "enabled" | "startDate" | "endDate" | "schedule"
  >,
  dateKey: string
): boolean {
  if (!task.enabled) {
    return false;
  }

  if (!isWithinOptionalDateRange(dateKey, task.startDate, task.endDate)) {
    return false;
  }

  return matchesScheduleOnDate(task.schedule, dateKey);
}
