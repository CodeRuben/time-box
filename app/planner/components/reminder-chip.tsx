"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/lib/use-reminder-storage";

interface ReminderChipProps {
  reminder: Reminder;
  onView: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => void;
}

export function ReminderChip({ reminder, onView, onDelete }: ReminderChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        "bg-primary/10 text-primary border border-primary/20",
        "hover:bg-primary/20 transition-colors cursor-pointer",
        "max-w-[120px] group"
      )}
    >
      <button
        type="button"
        onClick={() => onView(reminder)}
        className="truncate flex-1 text-left"
        title={reminder.title}
      >
        {reminder.title}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(reminder);
        }}
        className={cn(
          "shrink-0 rounded-full p-0.5",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-destructive/20 hover:text-destructive"
        )}
        aria-label={`Delete reminder: ${reminder.title}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
