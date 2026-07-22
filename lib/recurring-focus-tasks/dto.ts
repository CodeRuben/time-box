import { parseRecurringFocusTaskSchedule } from "@/lib/recurring-focus-tasks/schedule";
import type { RecurringFocusTaskDto } from "@/lib/recurring-focus-tasks/types";

export function toRecurringFocusTaskDto(row: {
  id: string;
  title: string;
  notes: string;
  enabled: boolean;
  startDate: string | null;
  endDate: string | null;
  schedule: string;
  createdAt: Date;
  updatedAt: Date;
}): RecurringFocusTaskDto {
  const schedule = parseRecurringFocusTaskSchedule(row.schedule);
  if (!schedule) {
    throw new Error(`Invalid schedule stored for recurring task ${row.id}`);
  }

  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    enabled: row.enabled,
    startDate: row.startDate,
    endDate: row.endDate,
    schedule,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function sortRecurringFocusTaskDtos(
  tasks: RecurringFocusTaskDto[]
): RecurringFocusTaskDto[] {
  return [...tasks].sort((a, b) => {
    if (a.enabled !== b.enabled) {
      return a.enabled ? -1 : 1;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}
