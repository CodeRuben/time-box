import type { WorkoutDotType, WorkoutType } from "@/lib/use-workout-storage";

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MAX_CALENDAR_DOTS = 4;

export const WORKOUT_TYPE_META: Record<
  WorkoutDotType,
  {
    label: string;
    dotClass: string;
    badgeClass: string;
    calendarIconClass: string;
  }
> = {
  resistance: {
    label: "Resistance training",
    dotClass: "bg-violet-500",
    badgeClass: "bg-violet-500/20 text-violet-600",
    calendarIconClass: "bg-violet-100 text-violet-500 dark:bg-violet-950 dark:text-violet-200",
  },
  cardio: {
    label: "Cardio",
    dotClass: "bg-teal-500",
    badgeClass: "bg-teal-500/20 text-teal-600",
    calendarIconClass: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  },
  hybrid: {
    label: "Hybrid",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-500/20 text-amber-700 dark:text-amber-500",
    calendarIconClass: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
};

export interface WorkoutTemplate {
  id: string;
  name: string;
  type: WorkoutType;
  exercises: string[];
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "basic-strength-foundation",
    name: "Basic Strength Foundation",
    type: "resistance",
    exercises: [
      "12 Pushups",
      "12 Bodyweight Squats",
      "10 Sumo Squats",
      "10 Inverted Rows",
      "10 Romanian Deadlifts",
    ],
  },
  {
    id: "hiit-circuit",
    name: "HIIT Circuit",
    type: "hybrid",
    exercises: [
      "12 Inverted row",
      "8 Sumo squats",
      "12 Pushups",
      "10 Bodyweight Squat",
      "10 Snatch & press",
    ],
  },
  {
    id: "upper-body-routine",
    name: "Upper Body Routine",
    type: "resistance",
    exercises: [
      "Pushups - 48-28",
      "Pushups - 36-25",
      "Tricep extensions - 40-25-16",
      "Inverse row - 36-24",
      "Inverse row - 33-23",
    ],
  },
];
