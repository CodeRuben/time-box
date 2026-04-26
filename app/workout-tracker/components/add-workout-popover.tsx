"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Workout } from "@/lib/use-workout-storage";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { WORKOUT_TEMPLATES } from "../constants";
import type { PreviousWorkoutEntry } from "../hooks/use-previous-workouts";
import { TemplateSelectDialog } from "./template-select-dialog";
import { CopyWorkoutDialog } from "./copy-workout-dialog";

const menuItemClass =
  "relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pl-2 pr-2 text-left text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

interface AddWorkoutPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddBlankWorkout: () => void;
  onSelectTemplate: (templateId: string) => void;
  onCopyPrevious: (workout: Workout) => void;
  previousWorkoutEntries: PreviousWorkoutEntry[];
  isPreviousWorkoutsLoading: boolean;
  onLoadPreviousWorkouts: () => void;
}

export function AddWorkoutPopover({
  isOpen,
  onOpenChange,
  onAddBlankWorkout,
  onSelectTemplate,
  onCopyPrevious,
  previousWorkoutEntries,
  isPreviousWorkoutsLoading,
  onLoadPreviousWorkouts,
}: AddWorkoutPopoverProps) {
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);

  const handleExistingTemplateClick = () => {
    onOpenChange(false);
    setIsTemplateDialogOpen(true);
  };

  const handleCopyPreviousClick = () => {
    onOpenChange(false);
    setIsCopyDialogOpen(true);
  };

  const handleNewWorkoutClick = () => {
    onAddBlankWorkout();
    onOpenChange(false);
  };

  const handleTemplateSelect = (templateId: string) => {
    onSelectTemplate(templateId);
  };

  const handleCopySelect = (workout: Workout) => {
    onCopyPrevious(workout);
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            className={cn(
              "border-input data-placeholder:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground",
              "bg-card dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full items-center justify-center gap-2 rounded-md border px-3 text-sm font-normal shadow-xs transition-[color,box-shadow]",
              "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            )}
          >
            <Plus className="size-4 shrink-0 opacity-70" aria-hidden />
            <span>Add workout</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={4}
          className="w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <div role="listbox" className="flex flex-col gap-0.5">
            <button
              type="button"
              role="option"
              aria-selected={false}
              className={menuItemClass}
              onClick={handleExistingTemplateClick}
            >
              Existing template
            </button>
            <button
              type="button"
              role="option"
              aria-selected={false}
              className={menuItemClass}
              onClick={handleCopyPreviousClick}
            >
              Copy previous
            </button>
            <button
              type="button"
              role="option"
              aria-selected={false}
              className={menuItemClass}
              onClick={handleNewWorkoutClick}
            >
              New workout
            </button>
          </div>
        </PopoverContent>
      </Popover>
      <TemplateSelectDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        templates={WORKOUT_TEMPLATES}
        onSelectTemplate={handleTemplateSelect}
      />
      <CopyWorkoutDialog
        open={isCopyDialogOpen}
        onOpenChange={setIsCopyDialogOpen}
        entries={previousWorkoutEntries}
        isLoading={isPreviousWorkoutsLoading}
        onLoad={onLoadPreviousWorkouts}
        onSelectWorkout={handleCopySelect}
      />
    </>
  );
}
