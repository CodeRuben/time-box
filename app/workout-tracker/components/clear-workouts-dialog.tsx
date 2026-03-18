"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClearWorkoutsDialogProps {
  isOpen: boolean;
  selectedDateLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirmClear: () => void;
}

export function ClearWorkoutsDialog({
  isOpen,
  selectedDateLabel,
  onOpenChange,
  onConfirmClear,
}: ClearWorkoutsDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear all workouts for this day?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove all workout entries for {selectedDateLabel}. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmClear}>
            Clear Workouts
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
