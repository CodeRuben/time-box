"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ExportWorkoutsDialogProps {
  isOpen: boolean;
  isExporting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmExport: () => void;
}

export function ExportWorkoutsDialog({
  isOpen,
  isExporting,
  onOpenChange,
  onConfirmExport,
}: ExportWorkoutsDialogProps) {
  const handleOpenChange = (open: boolean) => {
    if (isExporting) {
      return;
    }
    onOpenChange(open);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Export workouts?</AlertDialogTitle>
          <AlertDialogDescription>
            Download all your saved workouts as a CSV file.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isExporting}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            onClick={onConfirmExport}
            disabled={isExporting}
            className="active:scale-[0.97] ease-out will-change-transform motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Exporting…
              </>
            ) : (
              "Export CSV"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
