import type { WorkoutDayData } from "@/lib/use-workout-storage";

export interface WorkoutExportDay {
  dateKey: string;
  data: WorkoutDayData;
}

export interface WorkoutExportRow {
  date: string;
  workoutName: string;
  workoutType: string;
  workoutCreatedAt: string;
  exerciseName: string;
  exerciseStatus: string;
}

const CSV_HEADERS: (keyof WorkoutExportRow)[] = [
  "date",
  "workoutName",
  "workoutType",
  "workoutCreatedAt",
  "exerciseName",
  "exerciseStatus",
];

const CSV_HEADER_LABELS: Record<keyof WorkoutExportRow, string> = {
  date: "Date",
  workoutName: "Workout Name",
  workoutType: "Workout Type",
  workoutCreatedAt: "Workout Created At",
  exerciseName: "Exercise Name",
  exerciseStatus: "Exercise Status",
};

export function hydrateWorkoutExportDays(
  raw: unknown,
): WorkoutExportDay[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(
      (item): item is { dateKey: string; data: { workouts: unknown[] } } =>
        item != null &&
        typeof item === "object" &&
        typeof item.dateKey === "string" &&
        item.data != null &&
        typeof item.data === "object" &&
        Array.isArray(item.data.workouts),
    )
    .map((item) => ({
      dateKey: item.dateKey,
      data: item.data as WorkoutDayData,
    }));
}

export function flattenWorkoutDaysToRows(
  days: WorkoutExportDay[],
): WorkoutExportRow[] {
  const sortedDays = [...days].sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  return sortedDays.flatMap((day) =>
    day.data.workouts.flatMap((workout) => {
      if (workout.subtasks.length === 0) {
        return [
          {
            date: day.dateKey,
            workoutName: workout.name,
            workoutType: workout.type,
            workoutCreatedAt: workout.createdAt,
            exerciseName: "",
            exerciseStatus: "",
          },
        ];
      }

      return workout.subtasks.map((subtask) => ({
        date: day.dateKey,
        workoutName: workout.name,
        workoutType: workout.type,
        workoutCreatedAt: workout.createdAt,
        exerciseName: subtask.name,
        exerciseStatus: subtask.status,
      }));
    }),
  );
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function workoutRowsToCsv(rows: WorkoutExportRow[]): string {
  const headerLine = CSV_HEADERS.map((key) =>
    escapeCsvField(CSV_HEADER_LABELS[key]),
  ).join(",");

  const dataLines = rows.map((row) =>
    CSV_HEADERS.map((key) => escapeCsvField(row[key])).join(","),
  );

  return [headerLine, ...dataLines].join("\r\n");
}

export function workoutDaysToCsv(days: WorkoutExportDay[]): string {
  return workoutRowsToCsv(flattenWorkoutDaysToRows(days));
}

export function downloadWorkoutCsv(csv: string, filename?: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const dateStamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? `workout-export-${dateStamp}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
