"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WORKOUT_TEMPLATES } from "../constants";
import { TemplateSelectDialog } from "./template-select-dialog";

interface AddWorkoutPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddBlankWorkout: () => void;
  onSelectTemplate: (templateId: string) => void;
}

export function AddWorkoutPopover({
  isOpen,
  onOpenChange,
  onAddBlankWorkout,
  onSelectTemplate,
}: AddWorkoutPopoverProps) {
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const handleExistingTemplateClick = () => {
    onOpenChange(false);
    setIsTemplateDialogOpen(true);
  };

  const handleTemplateSelect = (templateId: string) => {
    onSelectTemplate(templateId);
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4" />
            Add Workout
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExistingTemplateClick}
          >
            Existing Template
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onAddBlankWorkout}
          >
            New Workout
          </Button>
        </PopoverContent>
      </Popover>
      <TemplateSelectDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        templates={WORKOUT_TEMPLATES}
        onSelectTemplate={handleTemplateSelect}
      />
    </>
  );
}
