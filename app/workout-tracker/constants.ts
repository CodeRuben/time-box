import type { WorkoutDotType, WorkoutType } from "@/lib/use-workout-storage";

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MAX_CALENDAR_DOTS = 4;

export const WORKOUT_TYPE_META: Record<
  WorkoutDotType,
  { label: string; dotClass: string }
> = {
  resistance: {
    label: "Resistance training",
    dotClass: "bg-violet-500",
  },
  cardio: {
    label: "Cardio",
    dotClass: "bg-teal-500",
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
    type: "resistance",
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
