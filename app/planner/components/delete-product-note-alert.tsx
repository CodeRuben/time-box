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
import type { ProductNoteDto } from "@/lib/product-notes/types";

interface DeleteProductNoteAlertProps {
  note: ProductNoteDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => void;
}

export function DeleteProductNoteAlert({
  note,
  open,
  onOpenChange,
  onConfirm,
}: DeleteProductNoteAlertProps) {
  if (!note) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete note</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete this note? This cannot
            be undone.
            <span className="mt-2 block text-foreground">{note.title}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm(note.id);
              onOpenChange(false);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
