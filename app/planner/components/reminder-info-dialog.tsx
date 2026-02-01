"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import type { Reminder } from "@/lib/use-reminder-storage";
import { isReminderPastDue } from "@/lib/use-reminder-storage";

interface ReminderInfoDialogProps {
  reminder: Reminder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: (id: string) => void;
  onDelete: (reminder: Reminder) => void;
}

function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ReminderInfoDialog({
  reminder,
  open,
  onOpenChange,
  onDismiss,
  onDelete,
}: ReminderInfoDialogProps) {
  if (!reminder) return null;

  const isPastDue = isReminderPastDue(reminder);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {reminder.title}
            {isPastDue && (
              <span className="text-xs font-normal text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                Past Due
              </span>
            )}
            {reminder.dismissed && (
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Dismissed
              </span>
            )}
          </DialogTitle>
          {reminder.description && (
            <DialogDescription className="text-left">
              {reminder.description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDisplayDate(reminder.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{reminder.timeSlot}</span>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!reminder.dismissed && (
            <Button
              variant="outline"
              onClick={() => {
                onDismiss(reminder.id);
                onOpenChange(false);
              }}
              className="w-full sm:w-auto"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Dismiss
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => onDelete(reminder)}
            className="w-full sm:w-auto"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
