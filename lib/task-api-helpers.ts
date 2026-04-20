import type { ChecklistItem, TaskStatus, TaskType } from "@/lib/task-types";

const VALID_STATUSES: ReadonlySet<TaskStatus> = new Set<TaskStatus>([
  "todo",
  "in_progress",
  "done",
]);

const VALID_TYPES: ReadonlySet<TaskType> = new Set<TaskType>([
  "work",
  "personal",
]);

export function isValidStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && VALID_STATUSES.has(value as TaskStatus);
}

export function isValidType(value: unknown): value is TaskType {
  return typeof value === "string" && VALID_TYPES.has(value as TaskType);
}

function isValidChecklistItem(value: unknown): value is ChecklistItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.completed === "boolean"
  );
}

export function isValidChecklist(value: unknown): value is ChecklistItem[] {
  return Array.isArray(value) && value.every(isValidChecklistItem);
}

export interface TaskRow {
  id: string;
  name: string;
  description: string;
  checklist: string;
  status: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

export function formatTask(task: TaskRow) {
  return {
    id: task.id,
    name: task.name,
    description: task.description,
    checklist: JSON.parse(task.checklist) as ChecklistItem[],
    status: task.status,
    type: task.type,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export interface TaskBody {
  name?: string;
  description?: string;
  checklist?: ChecklistItem[];
  status?: TaskStatus;
  type?: TaskType;
}

export interface TaskValidationError {
  error: string;
  status: number;
}

/**
 * Validate a task request body. When `requireName` is true, we also demand a
 * non-empty name (used on create + when name is present on update).
 */
export function validateTaskBody(
  raw: unknown,
  { requireName }: { requireName: boolean }
): TaskBody | TaskValidationError {
  if (!raw || typeof raw !== "object") {
    return { error: "Invalid request body", status: 400 };
  }

  const body = raw as Record<string, unknown>;
  const result: TaskBody = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return { error: "Task name must be a non-empty string", status: 400 };
    }
    result.name = body.name.trim();
  } else if (requireName) {
    return { error: "Task name is required", status: 400 };
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      return { error: "Description must be a string", status: 400 };
    }
    result.description = body.description.trim();
  }

  if (body.checklist !== undefined) {
    if (!isValidChecklist(body.checklist)) {
      return { error: "Invalid checklist payload", status: 400 };
    }
    result.checklist = body.checklist;
  }

  if (body.status !== undefined) {
    if (!isValidStatus(body.status)) {
      return { error: "Invalid status value", status: 400 };
    }
    result.status = body.status;
  }

  if (body.type !== undefined) {
    if (!isValidType(body.type)) {
      return { error: "Invalid type value", status: 400 };
    }
    result.type = body.type;
  }

  return result;
}

export function isValidationError(
  result: TaskBody | TaskValidationError
): result is TaskValidationError {
  return (result as TaskValidationError).error !== undefined;
}
