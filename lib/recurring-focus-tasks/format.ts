import { dateKeyToLocalDate } from "@/lib/date-key";
import { normalizeWeekdays } from "@/lib/recurring-focus-tasks/schedule";
import type {
  RecurringFocusTaskSchedule,
  Weekday,
} from "@/lib/recurring-focus-tasks/types";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function formatWeekdayList(weekdays: Weekday[]): string {
  const sorted = normalizeWeekdays(weekdays);
  if (sorted.length === 0) {
    return "";
  }

  const isConsecutive =
    sorted.length > 1 &&
    sorted.every((day, index) => index === 0 || day === sorted[index - 1]! + 1);

  if (isConsecutive && sorted.length >= 3) {
    return `${WEEKDAY_LABELS[sorted[0]!]}-${WEEKDAY_LABELS[sorted[sorted.length - 1]!]}`;
  }

  if (sorted.length === 1) {
    return WEEKDAY_LABELS[sorted[0]!]!;
  }

  if (sorted.length === 2) {
    return `${WEEKDAY_LABELS[sorted[0]!]} and ${WEEKDAY_LABELS[sorted[1]!]}`;
  }

  const labels = sorted.map((day) => WEEKDAY_LABELS[day]!);
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

function formatShortDate(dateKey: string): string {
  return dateKeyToLocalDate(dateKey).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatRecurringFocusTaskScheduleSummary(task: {
  startDate: string | null;
  endDate: string | null;
  schedule: RecurringFocusTaskSchedule;
}): string {
  const weekdayPart = formatWeekdayList(task.schedule.weekdays);
  const parts: string[] = [];

  if (task.schedule.type === "weekly") {
    parts.push(`Every ${weekdayPart}`);
  } else {
    parts.push(
      `${task.schedule.activeWeeks} weeks on / ${task.schedule.inactiveWeeks} weeks off, ${weekdayPart}`
    );
    parts.push(`anchored ${formatShortDate(task.schedule.anchorDate)}`);
  }

  if (task.startDate && task.endDate) {
    parts.push(
      `${formatShortDate(task.startDate)}-${formatShortDate(task.endDate)}`
    );
  } else if (task.startDate) {
    parts.push(`from ${formatShortDate(task.startDate)}`);
  } else if (task.endDate) {
    parts.push(`until ${formatShortDate(task.endDate)}`);
  }

  return parts.join(", ");
}
