"use client";

import { ClearWorkoutsDialog } from "./components/clear-workouts-dialog";
import { SelectedDayCard } from "./components/selected-day-card";
import { WorkoutCalendar } from "./components/workout-calendar";
import { useWorkoutTrackerPage } from "./hooks/use-workout-tracker-page";
import { AutosaveIndicator } from "../components/autosave-indicator";
import { useSession } from "next-auth/react";

export default function WorkoutTrackerPage() {
  const { status } = useSession();
  const {
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
    goToNextMonth,
    goToPreviousMonth,
    handleAddSubtask,
    handleAddWorkout,
    handleAddWorkoutPopoverOpenChange,
    handleClearSelectedDate,
    handleCycleWorkoutType,
    handleDeleteWorkout,
    handleDeleteSubtask,
    handleSelectDate,
    handleSubtaskNameChange,
    handleTemplateSelected,
    handleToggleSubtask,
    handleWorkoutNameChange,
    isWorkoutExpanded,
    setIsAddWorkoutPopoverOpen,
    setIsClearDialogOpen,
    toggleWorkoutExpanded,
  } = useWorkoutTrackerPage();

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 lg:mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Workout Tracker
            </h1>
            <p className="text-muted-foreground mt-2">
              Track workouts by day and review past activity.
            </p>
          </div>
          {status === "authenticated" && (
            <AutosaveIndicator status={autosaveStatus} />
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-[2fr_1fr]">
          <WorkoutCalendar
            calendarDays={calendarDays}
            calendarMonth={calendarMonth}
            selectedDate={selectedDate}
            today={today}
            onSelectDate={handleSelectDate}
            onPreviousMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
            getWorkoutTypesForDate={getWorkoutTypesForDate}
          />

          <SelectedDayCard
            isAddWorkoutPopoverOpen={isAddWorkoutPopoverOpen}
            isLoading={isLoading}
            selectedDateLabel={selectedDateLabel}
            workouts={data.workouts}
            onOpenClearDialog={() => setIsClearDialogOpen(true)}
            onAddWorkoutPopoverOpenChange={handleAddWorkoutPopoverOpenChange}
            onAddBlankWorkout={() => {
              handleAddWorkout();
              setIsAddWorkoutPopoverOpen(false);
            }}
            onSelectTemplate={handleTemplateSelected}
            isWorkoutExpanded={isWorkoutExpanded}
            onToggleWorkoutExpanded={toggleWorkoutExpanded}
            onCycleWorkoutType={handleCycleWorkoutType}
            onDeleteWorkout={(workout) => handleDeleteWorkout(workout.id)}
            onWorkoutNameChange={handleWorkoutNameChange}
            onToggleSubtask={handleToggleSubtask}
            onSubtaskNameChange={handleSubtaskNameChange}
            onDeleteSubtask={handleDeleteSubtask}
            onAddSubtask={handleAddSubtask}
          />
        </div>
      </div>

      <ClearWorkoutsDialog
        isOpen={isClearDialogOpen}
        selectedDateLabel={selectedDateLabel}
        onOpenChange={setIsClearDialogOpen}
        onConfirmClear={handleClearSelectedDate}
      />
    </div>
  );
}
