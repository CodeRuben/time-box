import { isDateKey } from "@/lib/date-key";

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0

export type RecurringFocusTaskSchedule =
  | {
      type: "weekly";
      weekdays: Weekday[];
    }
  | {
      type: "active_rest_weeks";
      weekdays: Weekday[];
      anchorDate: string; // YYYY-MM-DD, first day of first active window
      activeWeeks: number;
      inactiveWeeks: number;
    };

export interface RecurringFocusTaskDto {
  id: string;
  title: string;
  notes: string;
  enabled: boolean;
  startDate: string | null;
  endDate: string | null;
  schedule: RecurringFocusTaskSchedule;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringFocusTaskInput {
  title: string;
  notes: string;
  enabled: boolean;
  startDate: string | null;
  endDate: string | null;
  schedule: RecurringFocusTaskSchedule;
}

export const DEFAULT_WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5];

export function isOptionalDateKey(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && isDateKey(value));
}
