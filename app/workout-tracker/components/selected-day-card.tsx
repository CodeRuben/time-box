"use client";

import { Eraser } from "lucide-react";
import { type Workout } from "@/lib/use-workout-storage";
import type { PreviousWorkoutEntry } from "../hooks/use-previous-workouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddWorkoutPopover } from "./add-workout-popover";
import { WorkoutItem } from "./workout-item";

interface SelectedDayCardProps {
  isAddWorkoutPopoverOpen: boolean;
  isLoading: boolean;
  selectedDateLabel: string;
  workouts: Workout[];
  onOpenClearDialog: () => void;
  onAddWorkoutPopoverOpenChange: (open: boolean) => void;
  onAddBlankWorkout: () => void;
  onSelectTemplate: (templateId: string) => void;
  onCopyPrevious: (workout: Workout) => void;
  previousWorkoutEntries: PreviousWorkoutEntry[];
  isPreviousWorkoutsLoading: boolean;
  onLoadPreviousWorkouts: () => void;
  isWorkoutExpanded: (workoutId: string) => boolean;
  onToggleWorkoutExpanded: (workoutId: string) => void;
  onCycleWorkoutType: (workout: Workout) => void;
  onDeleteWorkout: (workout: Workout) => void;
  onWorkoutNameChange: (workout: Workout, name: string) => void;
  onToggleSubtask: (workout: Workout, subtaskId: string) => void;
  onSubtaskNameChange: (
    workout: Workout,
    subtaskId: string,
    name: string,
  ) => void;
  onDeleteSubtask: (workout: Workout, subtaskId: string) => void;
  onAddSubtask: (workout: Workout) => void;
}

export function SelectedDayCard({
  isAddWorkoutPopoverOpen,
  isLoading,
  selectedDateLabel,
  workouts,
  onOpenClearDialog,
  onAddWorkoutPopoverOpenChange,
  onAddBlankWorkout,
  onSelectTemplate,
  onCopyPrevious,
  previousWorkoutEntries,
  isPreviousWorkoutsLoading,
  onLoadPreviousWorkouts,
  isWorkoutExpanded,
  onToggleWorkoutExpanded,
  onCycleWorkoutType,
  onDeleteWorkout,
  onWorkoutNameChange,
  onToggleSubtask,
  onSubtaskNameChange,
  onDeleteSubtask,
  onAddSubtask,
}: SelectedDayCardProps) {
  const hasWorkouts = workouts.length > 0;

  return (
    <Card className="h-fit pb-0 gap-3">
      <CardHeader className="border-b pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-xl">Selected Day</CardTitle>
            <p className="text-muted-foreground text-sm">{selectedDateLabel}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenClearDialog}
            disabled={!hasWorkouts}
            aria-label="Clear workouts for selected date"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 py-3">
        {isLoading ? (
          <div className="text-muted-foreground text-sm">
            Loading workouts...
          </div>
        ) : (
          <>
            {!hasWorkouts && (
              <div className="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
                No workouts logged yet. Add your first workout below.
              </div>
            )}

            {hasWorkouts && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide">
                  Workout Details
                </h3>
                <ul className="space-y-2">
                  {workouts.map((workout) => (
                    <WorkoutItem
                      key={workout.id}
                      workout={workout}
                      isExpanded={isWorkoutExpanded(workout.id)}
                      onToggleExpanded={() =>
                        onToggleWorkoutExpanded(workout.id)
                      }
                      onCycleWorkoutType={() => onCycleWorkoutType(workout)}
                      onDeleteWorkout={() => onDeleteWorkout(workout)}
                      onWorkoutNameChange={(name) =>
                        onWorkoutNameChange(workout, name)
                      }
                      onToggleSubtask={(subtaskId) =>
                        onToggleSubtask(workout, subtaskId)
                      }
                      onSubtaskNameChange={(subtaskId, name) =>
                        onSubtaskNameChange(workout, subtaskId, name)
                      }
                      onDeleteSubtask={(subtaskId) =>
                        onDeleteSubtask(workout, subtaskId)
                      }
                      onAddSubtask={() => onAddSubtask(workout)}
                    />
                  ))}
                </ul>
              </div>
            )}

            <AddWorkoutPopover
              isOpen={isAddWorkoutPopoverOpen}
              onOpenChange={onAddWorkoutPopoverOpenChange}
              onAddBlankWorkout={onAddBlankWorkout}
              onSelectTemplate={onSelectTemplate}
              onCopyPrevious={onCopyPrevious}
              previousWorkoutEntries={previousWorkoutEntries}
              isPreviousWorkoutsLoading={isPreviousWorkoutsLoading}
              onLoadPreviousWorkouts={onLoadPreviousWorkouts}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
