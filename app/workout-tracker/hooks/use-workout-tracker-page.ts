"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  type Workout,
  type WorkoutSubtaskStatus,
  type WorkoutType,
  useWorkoutStorage,
} from "@/lib/use-workout-storage";
import { WORKOUT_TEMPLATES } from "../constants";
import { usePreviousWorkouts } from "./use-previous-workouts";

function cycleSubtaskStatus(
  status: WorkoutSubtaskStatus,
): WorkoutSubtaskStatus {
  if (status === "pending") {
    return "completed";
  }
  if (status === "completed") {
    return "error";
  }
  return "pending";
}

function cycleWorkoutType(currentType: WorkoutType): WorkoutType {
  if (currentType === "unknown") {
    return "resistance";
  }
  if (currentType === "resistance") {
    return "cardio";
  }
  return "unknown";
}

function getCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export function useWorkoutTrackerPage() {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(today));
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isAddWorkoutPopoverOpen, setIsAddWorkoutPopoverOpen] = useState(false);
  const [expandedWorkouts, setExpandedWorkouts] = useState<
    Record<string, boolean>
  >({});

  const calendarDays = useMemo(
    () => getCalendarDays(calendarMonth),
    [calendarMonth],
  );
  const {
    data,
    isLoading,
    autosaveStatus,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    clearWorkouts,
    getWorkoutTypesForDate,
  } = useWorkoutStorage(selectedDate, calendarDays);

  const {
    entries: previousWorkoutEntries,
    isLoading: isPreviousWorkoutsLoading,
    load: loadPreviousWorkouts,
  } = usePreviousWorkouts(selectedDate);

  const selectedDateLabel = format(selectedDate, "EEEE, MMMM d, yyyy");
  const goToPreviousMonth = () => {
    setCalendarMonth((prev) => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCalendarMonth((prev) => addMonths(prev, 1));
  };

  const handleSelectDate = (day: Date) => {
    setSelectedDate(day);
    if (!isSameMonth(day, calendarMonth)) {
      setCalendarMonth(startOfMonth(day));
    }
  };

  const handleClearSelectedDate = () => {
    clearWorkouts();
  };

  const handleAddWorkout = () => {
    addWorkout({ type: "unknown", name: "" });
  };

  const handleAddWorkoutPopoverOpenChange = (open: boolean) => {
    setIsAddWorkoutPopoverOpen(open);
  };

  const handleTemplateSelected = (templateId: string) => {
    const template = WORKOUT_TEMPLATES.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    addWorkout({
      type: template.type,
      name: template.name,
      subtaskNames: template.exercises,
    });
    setIsAddWorkoutPopoverOpen(false);
  };

  const handleCopyPrevious = (workout: Workout) => {
    addWorkout({
      type: workout.type,
      name: workout.name,
      subtaskNames: workout.subtasks.map((s) => s.name),
    });
    setIsAddWorkoutPopoverOpen(false);
  };

  const handleWorkoutNameChange = (workout: Workout, name: string) => {
    updateWorkout(workout.id, (current) => ({ ...current, name }));
  };

  const handleCycleWorkoutType = (workout: Workout) => {
    updateWorkout(workout.id, (current) => ({
      ...current,
      type: cycleWorkoutType(current.type),
    }));
  };

  const handleAddSubtask = (workout: Workout) => {
    updateWorkout(workout.id, (current) => ({
      ...current,
      subtasks: [
        ...current.subtasks,
        {
          id: crypto.randomUUID(),
          name: "",
          status: "pending",
        },
      ],
    }));
  };

  const handleSubtaskNameChange = (
    workout: Workout,
    subtaskId: string,
    name: string,
  ) => {
    updateWorkout(workout.id, (current) => ({
      ...current,
      subtasks: current.subtasks.map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, name } : subtask,
      ),
    }));
  };

  const handleToggleSubtask = (workout: Workout, subtaskId: string) => {
    updateWorkout(workout.id, (current) => ({
      ...current,
      subtasks: current.subtasks.map((subtask) =>
        subtask.id === subtaskId
          ? { ...subtask, status: cycleSubtaskStatus(subtask.status) }
          : subtask,
      ),
    }));
  };

  const handleDeleteWorkout = (workoutId: string) => {
    deleteWorkout(workoutId);
  };

  const handleDeleteSubtask = (workout: Workout, subtaskId: string) => {
    updateWorkout(workout.id, (current) => ({
      ...current,
      subtasks: current.subtasks.filter((subtask) => subtask.id !== subtaskId),
    }));
  };

  const isWorkoutExpanded = (workoutId: string) => {
    return expandedWorkouts[workoutId] ?? true;
  };

  const toggleWorkoutExpanded = (workoutId: string) => {
    setExpandedWorkouts((prev) => ({
      ...prev,
      [workoutId]: !(prev[workoutId] ?? true),
    }));
  };

  return {
    calendarDays,
    calendarMonth,
    data,
    autosaveStatus,
    getWorkoutTypesForDate,
    isAddWorkoutPopoverOpen,
    isClearDialogOpen,
    isLoading,
    selectedDate,
    selectedDateLabel,
    today,
    handleAddSubtask,
    handleAddWorkout,
    handleAddWorkoutPopoverOpenChange,
    handleClearSelectedDate,
    handleCopyPrevious,
    handleCycleWorkoutType,
    handleDeleteWorkout,
    handleDeleteSubtask,
    handleSelectDate,
    handleSubtaskNameChange,
    handleTemplateSelected,
    handleToggleSubtask,
    handleWorkoutNameChange,
    isPreviousWorkoutsLoading,
    loadPreviousWorkouts,
    previousWorkoutEntries,
    isWorkoutExpanded,
    setIsAddWorkoutPopoverOpen,
    setIsClearDialogOpen,
    toggleWorkoutExpanded,
    goToPreviousMonth,
    goToNextMonth,
  };
}
