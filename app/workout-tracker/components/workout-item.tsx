"use client";

import {
  Activity,
  Check,
  ChevronDown,
  CircleHelp,
  Dumbbell,
  Flame,
  Plus,
  Timer,
  X,
} from "lucide-react";
import { type Workout, type WorkoutType } from "@/lib/use-workout-storage";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
    <li className="group relative rounded-2xl border bg-card shadow-xs transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute -right-2 -top-2 z-20 size-6 rounded-full border bg-background opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        onClick={onDeleteWorkout}
        aria-label="Remove workout"
      >
        <X className="size-2.5" />
      </Button>
      <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
        <div className="overflow-hidden rounded-2xl">
          <div className="flex w-full items-center gap-3 p-3 transition-colors hover:bg-accent/30">
            <button
              type="button"
              className={cn(
                "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl shadow-xs transition-transform ease-out will-change-transform active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
                workout.type === "unknown"
                  ? "bg-muted text-muted-foreground"
                  : WORKOUT_TYPE_META[workout.type].calendarIconClass,
              )}
              onClick={onCycleWorkoutType}
              aria-label="Cycle workout type"
              title={`Type: ${getWorkoutTypeLabel(workout.type)}`}
            >
              <span className="relative flex size-4 items-center justify-center">
                <CircleHelp
                  className={cn(
                    "absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 transition-[opacity,filter] duration-150 ease-out will-change-[opacity,filter] motion-reduce:transition-none motion-reduce:blur-none",
                    workout.type === "unknown"
                      ? "opacity-100 blur-none"
                      : "opacity-0 blur-[2px]",
                  )}
                />
                <Dumbbell
                  className={cn(
                    "absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 transition-[opacity,filter] duration-150 ease-out will-change-[opacity,filter] motion-reduce:transition-none motion-reduce:blur-none",
                    workout.type === "resistance"
                      ? "opacity-100 blur-none"
                      : "opacity-0 blur-[2px]",
                  )}
                />
                <Activity
                  className={cn(
                    "absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 transition-[opacity,filter] duration-150 ease-out will-change-[opacity,filter] motion-reduce:transition-none motion-reduce:blur-none",
                    workout.type === "cardio"
                      ? "opacity-100 blur-none"
                      : "opacity-0 blur-[2px]",
                  )}
                />
                <Flame
                  className={cn(
                    "absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 transition-[opacity,filter] duration-150 ease-out will-change-[opacity,filter] motion-reduce:transition-none motion-reduce:blur-none",
                    workout.type === "hybrid"
                      ? "opacity-100 blur-none"
                      : "opacity-0 blur-[2px]",
                  )}
                />
              </span>
            </button>

            <CollapsibleTrigger
              type="button"
              className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-2 text-left transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-expanded={isExpanded}
              aria-label={
                isExpanded
                  ? "Collapse workout details"
                  : "Expand workout details"
              }
            >
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-muted-foreground">
                  {getWorkoutTypeLabel(workout.type)}
                </span>
                <span className="block truncate text-base font-semibold">
                  {workout.name.trim() || "Untitled workout"}
                </span>
              </span>

              <ChevronDown
                className={cn(
                  "size-5 shrink-0 text-muted-foreground transition-transform",
                  isExpanded ? "rotate-180" : "rotate-0",
                )}
                aria-hidden
              />
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="overflow-hidden border-t bg-card data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            <div className="space-y-3 p-3">
              <div>
                <Input
                  value={workout.name}
                  onChange={(event) => onWorkoutNameChange(event.target.value)}
                  placeholder="Workout name"
                  className="h-10 border-0 bg-muted/35 pl-3 pr-0 text-base font-semibold shadow-none focus-visible:ring-0 dark:bg-transparent md:text-sm"
                />
              </div>

              <div className="space-y-2">
                {workout.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="group/subtask relative flex items-center gap-2"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -right-1.5 -top-1.5 z-10 size-6 rounded-full border bg-background opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover/subtask:opacity-100 sm:group-focus-within/subtask:opacity-100"
                      onClick={() => onDeleteSubtask(subtask.id)}
                      aria-label="Delete sub item"
                    >
                      <X className="size-3" />
                    </Button>
                    <div className="flex h-8 w-full items-center overflow-hidden rounded-md border">
                      <button
                        type="button"
                        className="flex h-full w-10 shrink-0 items-center justify-center border-r bg-muted/40 transition-colors hover:bg-muted"
                        onClick={() => onToggleSubtask(subtask.id)}
                        aria-label="Cycle sub item status"
                      >
                        {subtask.status === "completed" ? (
                          <Check className="size-3.5 text-green-600 dark:text-green-400" />
                        ) : subtask.status === "error" ? (
                          <X className="size-3.5 text-red-600 dark:text-red-400" />
                        ) : (
                          <Timer className="size-3.5 text-muted-foreground" />
                        )}
                      </button>
                      <Input
                        value={subtask.name}
                        onChange={(event) =>
                          onSubtaskNameChange(subtask.id, event.target.value)
                        }
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
                  className="h-10 w-full justify-center rounded-lg border border-dashed bg-background/50 text-muted-foreground hover:bg-accent/50"
                >
                  <Plus className="size-4" />
                  Add sub item
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </li>
  );
}
