import {
  normalizeWeekdays,
  parseRecurringFocusTaskSchedule,
} from "@/lib/recurring-focus-tasks/schedule";
import type { RecurringFocusTaskInput } from "@/lib/recurring-focus-tasks/types";
import { isOptionalDateKey } from "@/lib/recurring-focus-tasks/types";

export type FieldKey =
  | "title"
  | "notes"
  | "enabled"
  | "dateRange"
  | "weekdays"
  | "schedule"
  | "anchorDate"
  | "weeks";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string; field?: FieldKey };

function validateInput(
  input: RecurringFocusTaskInput
): ValidationResult<RecurringFocusTaskInput> {
  if (!input.title.trim()) {
    return { ok: false, message: "Title is required", field: "title" };
  }

  if (input.schedule.weekdays.length === 0) {
    return {
      ok: false,
      message: "Select at least one weekday",
      field: "weekdays",
    };
  }

  if (input.startDate && input.endDate && input.startDate > input.endDate) {
    return {
      ok: false,
      message: "Start date must be on or before end date",
      field: "dateRange",
    };
  }

  if (input.schedule.type === "active_rest_weeks") {
    if (!input.schedule.anchorDate) {
      return {
        ok: false,
        message: "Anchor date is required",
        field: "anchorDate",
      };
    }
    if (input.schedule.activeWeeks < 1 || input.schedule.inactiveWeeks < 1) {
      return {
        ok: false,
        message: "Active and inactive weeks must be at least 1",
        field: "weeks",
      };
    }
  }

  return {
    ok: true,
    value: {
      title: input.title.trim(),
      notes: input.notes.trim(),
      enabled: input.enabled,
      startDate: input.startDate,
      endDate: input.endDate,
      schedule: {
        ...input.schedule,
        weekdays: normalizeWeekdays(input.schedule.weekdays),
      },
    },
  };
}

function readOptionalString(
  body: Record<string, unknown>,
  key: string
): ValidationResult<string | undefined> {
  if (!(key in body)) {
    return { ok: true, value: undefined };
  }
  if (typeof body[key] !== "string") {
    return {
      ok: false,
      message: `${key} must be a string`,
      field: key as FieldKey,
    };
  }
  return { ok: true, value: body[key] };
}

export function parseCreateBody(
  raw: unknown
): ValidationResult<RecurringFocusTaskInput> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "Invalid request body" };
  }

  const body = raw as Record<string, unknown>;

  const titleResult = readOptionalString(body, "title");
  if (!titleResult.ok) return titleResult;
  if (titleResult.value === undefined) {
    return { ok: false, message: "Title is required", field: "title" };
  }

  const notesResult = readOptionalString(body, "notes");
  if (!notesResult.ok) return notesResult;

  if ("enabled" in body && typeof body.enabled !== "boolean") {
    return { ok: false, message: "Enabled must be a boolean", field: "enabled" };
  }

  if ("startDate" in body && !isOptionalDateKey(body.startDate)) {
    return { ok: false, message: "Invalid start date", field: "dateRange" };
  }

  if ("endDate" in body && !isOptionalDateKey(body.endDate)) {
    return { ok: false, message: "Invalid end date", field: "dateRange" };
  }

  if (!("schedule" in body)) {
    return { ok: false, message: "Schedule is required", field: "schedule" };
  }

  const schedule = parseRecurringFocusTaskSchedule(body.schedule);
  if (!schedule) {
    return { ok: false, message: "Invalid schedule", field: "schedule" };
  }

  return validateInput({
    title: titleResult.value,
    notes: notesResult.value ?? "",
    enabled: typeof body.enabled === "boolean" ? body.enabled : true,
    startDate: "startDate" in body ? (body.startDate as string | null) : null,
    endDate: "endDate" in body ? (body.endDate as string | null) : null,
    schedule,
  });
}

export function parsePatchBody(
  raw: unknown
): ValidationResult<Partial<RecurringFocusTaskInput>> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "Invalid request body" };
  }

  const body = raw as Record<string, unknown>;
  const patch: Partial<RecurringFocusTaskInput> = {};

  if ("title" in body) {
    if (typeof body.title !== "string") {
      return { ok: false, message: "Title must be a string", field: "title" };
    }
    patch.title = body.title;
  }

  if ("notes" in body) {
    if (typeof body.notes !== "string") {
      return { ok: false, message: "Notes must be a string", field: "notes" };
    }
    patch.notes = body.notes;
  }

  if ("enabled" in body) {
    if (typeof body.enabled !== "boolean") {
      return { ok: false, message: "Enabled must be a boolean", field: "enabled" };
    }
    patch.enabled = body.enabled;
  }

  if ("startDate" in body) {
    if (!isOptionalDateKey(body.startDate)) {
      return { ok: false, message: "Invalid start date", field: "dateRange" };
    }
    patch.startDate = body.startDate;
  }

  if ("endDate" in body) {
    if (!isOptionalDateKey(body.endDate)) {
      return { ok: false, message: "Invalid end date", field: "dateRange" };
    }
    patch.endDate = body.endDate;
  }

  if ("schedule" in body) {
    const schedule = parseRecurringFocusTaskSchedule(body.schedule);
    if (!schedule) {
      return { ok: false, message: "Invalid schedule", field: "schedule" };
    }
    patch.schedule = schedule;
  }

  return { ok: true, value: patch };
}

export function mergeRecurringFocusTaskInput(
  existing: RecurringFocusTaskInput,
  patch: Partial<RecurringFocusTaskInput>
): ValidationResult<RecurringFocusTaskInput> {
  return validateInput({
    title: patch.title ?? existing.title,
    notes: patch.notes ?? existing.notes,
    enabled: patch.enabled ?? existing.enabled,
    startDate:
      patch.startDate !== undefined ? patch.startDate : existing.startDate,
    endDate: patch.endDate !== undefined ? patch.endDate : existing.endDate,
    schedule: patch.schedule ?? existing.schedule,
  });
}

export function validateRecurringFocusTaskInput(
  input: RecurringFocusTaskInput
): ValidationResult<RecurringFocusTaskInput> {
  return validateInput(input);
}
