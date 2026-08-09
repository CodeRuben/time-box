export type WorkoutType = "unknown" | "resistance" | "cardio" | "hybrid";
export type WorkoutDotType = Exclude<WorkoutType, "unknown">;
export type WorkoutSubtaskStatus = "pending" | "completed" | "error";

/** Canonical display / tie-break order for workout types. */
export const WORKOUT_TYPES = [
  "resistance",
  "cardio",
  "hybrid",
  "unknown",
] as const satisfies readonly WorkoutType[];

export interface WorkoutSubtask {
  id: string;
  name: string;
  status: WorkoutSubtaskStatus;
  fields?: Record<string, string>;
}

export interface Workout {
  id: string;
  type: WorkoutType;
  name: string;
  subtasks: WorkoutSubtask[];
  createdAt: string;
}

export interface WorkoutDayData {
  workouts: Workout[];
  lastSaved?: string;
}

export function isWorkoutSubtaskStatus(
  value: unknown,
): value is WorkoutSubtaskStatus {
  return value === "pending" || value === "completed" || value === "error";
}

export function isWorkoutType(value: unknown): value is WorkoutType {
  return (
    value === "unknown" ||
    value === "resistance" ||
    value === "cardio" ||
    value === "hybrid"
  );
}

export function normalizeWorkout(raw: unknown): Workout | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const workout = raw as Partial<Workout> & {
    name?: unknown;
    description?: unknown;
    durationMinutes?: unknown;
    subtasks?: unknown;
  };

  if (
    typeof workout.id !== "string" ||
    !isWorkoutType(workout.type) ||
    (workout.name !== undefined && typeof workout.name !== "string") ||
    (workout.description !== undefined &&
      typeof workout.description !== "string") ||
    (workout.durationMinutes !== undefined &&
      typeof workout.durationMinutes !== "number") ||
    typeof workout.createdAt !== "string"
  ) {
    return null;
  }

  const normalizedName =
    typeof workout.name === "string"
      ? workout.name
      : (workout.description ?? "").trim();

  const rawSubtasks = Array.isArray(workout.subtasks) ? workout.subtasks : [];
  const normalizedSubtasks: WorkoutSubtask[] = rawSubtasks
    .map((subtask): WorkoutSubtask | null => {
      if (!subtask || typeof subtask !== "object") {
        return null;
      }

      const parsed = subtask as Partial<WorkoutSubtask>;
      if (
        typeof parsed.id !== "string" ||
        typeof parsed.name !== "string" ||
        (!isWorkoutSubtaskStatus(parsed.status) &&
          typeof (parsed as { completed?: unknown }).completed !== "boolean")
      ) {
        return null;
      }

      return {
        id: parsed.id,
        name: parsed.name,
        status: isWorkoutSubtaskStatus(parsed.status)
          ? parsed.status
          : (parsed as { completed?: boolean }).completed
            ? "completed"
            : "pending",
        ...(parsed.fields && typeof parsed.fields === "object"
          ? { fields: parsed.fields }
          : {}),
      };
    })
    .filter((subtask): subtask is WorkoutSubtask => subtask !== null);

  // Migrate legacy description-only entries to one checklist item.
  if (normalizedSubtasks.length === 0 && workout.description?.trim()) {
    normalizedSubtasks.push({
      id: crypto.randomUUID(),
      name: workout.description.trim(),
      status: "pending",
    });
  }

  return {
    id: workout.id,
    type: workout.type,
    name: normalizedName,
    subtasks: normalizedSubtasks,
    createdAt: workout.createdAt,
  };
}

export function hydrateWorkoutDayData(raw: unknown): WorkoutDayData | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const parsed = raw as Partial<WorkoutDayData>;
  const workouts = Array.isArray(parsed.workouts)
    ? parsed.workouts
        .map(normalizeWorkout)
        .filter((workout): workout is Workout => workout !== null)
    : [];

  return {
    workouts,
    lastSaved: parsed.lastSaved,
  };
}
