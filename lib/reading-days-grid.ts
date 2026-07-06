import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export interface MonthGridCell {
  date: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
}

/**
 * Builds a Sun-Sat calendar grid for the given month, padded with the
 * trailing/leading days of adjacent months so every week is complete —
 * matching the week-start convention of components/ui/calendar.tsx.
 */
export function getMonthGridCells(monthDate: Date): MonthGridCell[] {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((day) => ({
    date: format(day, "yyyy-MM-dd"),
    isCurrentMonth: isSameMonth(day, monthStart),
  }));
}
