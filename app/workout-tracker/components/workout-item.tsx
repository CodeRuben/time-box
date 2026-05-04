"use client";

import {
  Activity,
  Check,
  CircleHelp,
  Dumbbell,
  Flame,
  Plus,
  Timer,
  X,
} from "lucide-react";
import { type Workout, type WorkoutType } from "@/lib/use-workout-storage";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { WORKOUT_TYPE_META } from "../constants";

function getWorkoutTypeLabel(type: WorkoutType): string {
  if (type === "unknown") {
    return "Unknown";
  }
  return WORKOUT_TYPE_META[type].label;
}

interface WorkoutItemProps {
  workout: Workout;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onCycleWorkoutType: () => void;
  onDeleteWorkout: () => void;
  onWorkoutNameChange: (name: string) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onSubtaskNameChange: (subtaskId: string, name: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onAddSubtask: () => void;
}

export function WorkoutItem({
  workout,
  isExpanded,
  onToggleExpanded,
  onCycleWorkoutType,
  onDeleteWorkout,
  onWorkoutNameChange,
  onToggleSubtask,
  onSubtaskNameChange,
  onDeleteSubtask,
  onAddSubtask,
}: WorkoutItemProps) {
  return (
    <li className="group relative rounded-lg border bg-card">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute -top-2 -right-2 z-10 h-7 w-7 rounded-full border bg-background opacity-100 sm:opacity-0 shadow-sm transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        onClick={onDeleteWorkout}
        aria-label="Remove workout"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
      <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
        <div
          className="flex cursor-pointer items-start justify-between gap-2 rounded-lg px-4 py-4 transition-colors hover:bg-accent/30"
          onClick={onToggleExpanded}
        >
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <button
              type="button"
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-transform ease-out will-change-transform active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
                workout.type === "unknown"
                  ? "bg-muted text-muted-foreground"
                  : WORKOUT_TYPE_META[workout.type].calendarIconClass,
              )}
              onClick={(event) => {
                event.stopPropagation();
                onCycleWorkoutType();
              }}
              aria-label="Cycle workout type"
              title={`Type: ${getWorkoutTypeLabel(workout.type)}`}
            >
              <span className="relative flex h-4 w-4 items-center justify-center">
                <CircleHelp
                  className={cn(
                    "absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 transition-[opacity,filter] duration-150 ease-out will-change-[opacity,filter] motion-reduce:transition-none motion-reduce:blur-none",
                    workout.type === "unknown"
                      ? "opacity-100 blur-none"
                      : "opacity-0 blur-[2px]"
                  )}
                />
                <Dumbbell
                  className={cn(
                    "absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 transition-[opacity,filter] duration-150 ease-out will-change-[opacity,filter] motion-reduce:transition-none motion-reduce:blur-none",
                    workout.type === "resistance"
                      ? "opacity-100 blur-none"
                      : "opacity-0 blur-[2px]"
                  )}
                />
                <Activity
                  className={cn(
                    "absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 transition-[opacity,filter] duration-150 ease-out will-change-[opacity,filter] motion-reduce:transition-none motion-reduce:blur-none",
                    workout.type === "cardio"
                      ? "opacity-100 blur-none"
                      : "opacity-0 blur-[2px]"
                  )}
                />
                <Flame
                  className={cn(
                    "absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 transition-[opacity,filter] duration-150 ease-out will-change-[opacity,filter] motion-reduce:transition-none motion-reduce:blur-none",
                    workout.type === "hybrid"
                      ? "opacity-100 blur-none"
                      : "opacity-0 blur-[2px]"
                  )}
                />
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <Input
                value={workout.name}
                onChange={(event) => onWorkoutNameChange(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                placeholder="Workout name"
                className="h-8 w-full"
              />
            </div>
          </div>
        </div>

        <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
          <div className="space-y-2 px-3 pb-3">
            {workout.subtasks.map((subtask) => (
              <div key={subtask.id} className="group/subtask relative flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -top-1.5 -right-1.5 z-10 h-6 w-6 rounded-full border bg-background opacity-100 sm:opacity-0 shadow-sm transition-opacity sm:group-hover/subtask:opacity-100 sm:group-focus-within/subtask:opacity-100"
                  onClick={() => onDeleteSubtask(subtask.id)}
                  aria-label="Delete sub item"
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="flex h-8 w-full items-center overflow-hidden rounded-md border">
                  <button
                    type="button"
                    className="flex h-full w-10 shrink-0 items-center justify-center border-r bg-muted/40 transition-colors hover:bg-muted"
                    onClick={() => onToggleSubtask(subtask.id)}
                  >
                    {subtask.status === "completed" ? (
                      <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    ) : subtask.status === "error" ? (
                      <X className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                    ) : (
                      <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  <Input
                    value={subtask.name}
                    onChange={(event) => onSubtaskNameChange(subtask.id, event.target.value)}
                    placeholder="Sub-workout item"
                    className="h-full border-0 shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onAddSubtask}
              className="text-muted-foreground w-full justify-center"
            >
              <Plus className="h-4 w-4" />
              Add sub item
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}
