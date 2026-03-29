"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Check, Loader2 } from "lucide-react";
import type { Workout } from "@/lib/use-workout-storage";
import type { PreviousWorkoutEntry } from "../hooks/use-previous-workouts";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { WORKOUT_TYPE_META } from "../constants";

interface CopyWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: PreviousWorkoutEntry[];
  isLoading: boolean;
  onLoad: () => void;
  onSelectWorkout: (workout: Workout) => void;
}

function formatEntryDateShort(dateKey: string): string {
  try {
    return format(parseISO(dateKey), "MMM d, yyyy");
  } catch {
    return dateKey;
  }
}

function workoutTypeDotClass(type: Workout["type"]): string {
  if (type === "resistance") {
    return WORKOUT_TYPE_META.resistance.dotClass;
  }
  if (type === "cardio") {
    return WORKOUT_TYPE_META.cardio.dotClass;
  }
  return "bg-muted-foreground/55";
}

export function CopyWorkoutDialog({
  open,
  onOpenChange,
  entries,
  isLoading,
  onLoad,
  onSelectWorkout,
}: CopyWorkoutDialogProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      onLoad();
    }
  }, [open, onLoad]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setExpandedId(null);
    }
    onOpenChange(isOpen);
  };

  const handleExpandChange = (workoutId: string) => (isOpen: boolean) => {
    setExpandedId(isOpen ? workoutId : null);
  };

  const handleSelect = () => {
    const entry = entries.find((e) => e.workout.id === expandedId);
    if (entry) {
      onSelectWorkout(entry.workout);
      handleOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="border-b border-border/60 bg-muted/15 px-6 py-5 dark:border-border/75 dark:bg-muted/20">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Copy a previous workout
            </DialogTitle>
          </DialogHeader>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 border-b border-border/40 bg-muted/10 px-6 py-14 dark:border-border/70 dark:bg-muted/15">
            <Loader2
              className="h-8 w-8 animate-spin text-muted-foreground"
              aria-hidden
            />
            <p className="text-sm text-muted-foreground">
              Loading your workouts…
            </p>
          </div>
        )}

        {!isLoading && entries.length === 0 && (
          <div className="border-b border-border/40 px-6 py-12 text-center dark:border-border/70">
            <p className="text-sm font-medium text-foreground">
              No past workouts yet
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Log workouts on other days to copy them here.
            </p>
          </div>
        )}

        {!isLoading && entries.length > 0 && (
          <>
            <div className="scrollbar-themed max-h-[min(52vh,22rem)] overflow-y-auto bg-muted/5 px-3 py-3 sm:px-4 dark:bg-muted/10">
              <div className="flex flex-col gap-2">
                {entries.map((entry) => {
                  const isExpanded = expandedId === entry.workout.id;
                  return (
                    <Collapsible
                      key={entry.workout.id}
                      open={isExpanded}
                      onOpenChange={handleExpandChange(entry.workout.id)}
                    >
                      <div
                        className={cn(
                          "overflow-hidden rounded-xl border shadow-sm transition-colors",
                          isExpanded
                            ? "border-emerald-500/35 bg-emerald-500/[0.07] ring-1 ring-emerald-500/15"
                            : "border-border/70 bg-card hover:border-border hover:bg-muted/25",
                        )}
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex min-w-0 items-center gap-2">
                                <span
                                  className={cn(
                                    "h-2 w-2 shrink-0 rounded-full",
                                    workoutTypeDotClass(entry.workout.type),
                                  )}
                                  aria-hidden
                                />
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {entry.workout.name || "Untitled workout"}
                                </p>
                              </div>
                              <p className="truncate pl-4 text-xs text-muted-foreground">
                                {formatEntryDateShort(entry.dateKey)}
                              </p>
                            </div>
                            {isExpanded && (
                              <Check
                                className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                                strokeWidth={2.5}
                                aria-hidden
                              />
                            )}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                          <div className="border-t border-border/60 bg-muted/25 px-4 pb-4 pt-1 dark:border-border/70 dark:bg-muted/30">
                            <p className="mb-2.5 pt-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                              Exercises
                            </p>
                            <ul className="space-y-2">
                              {entry.workout.subtasks.map((subtask, index) => (
                                <li
                                  key={subtask.id}
                                  className="flex gap-3 text-sm leading-snug"
                                >
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-border/50">
                                    {index + 1}
                                  </span>
                                  <span className="min-w-0 flex-1 pt-0.5 text-foreground/90">
                                    {subtask.name}
                                  </span>
                                </li>
                              ))}
                              {entry.workout.subtasks.length === 0 && (
                                <li className="text-sm italic text-muted-foreground">
                                  No exercises listed
                                </li>
                              )}
                            </ul>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="gap-2 border-t border-border/60 bg-muted/10 px-6 py-4 sm:justify-end dark:border-border/75 dark:bg-muted/15">
              <Button type="button" onClick={handleSelect} disabled={!expandedId}>
                Add workout
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
