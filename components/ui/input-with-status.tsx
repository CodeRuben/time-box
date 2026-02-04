"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDropZone } from "@/lib/use-drag-drop";
import { ReminderChip } from "@/app/planner/components/reminder-chip";
import type { Reminder } from "@/lib/use-reminder-storage";
import type { TaskStatus } from "@/lib/use-planner-storage";

// Re-export for backwards compatibility (deprecated - use import from use-planner-storage)
export type { TaskStatus };

interface InputWithStatusProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  status: TaskStatus;
  onCycleStatus: () => void;
  className?: string;
  id?: string;
  reminders?: Reminder[];
  onViewReminder?: (reminder: Reminder) => void;
  onDeleteReminder?: (reminder: Reminder) => void;
}

const statusLabels: Record<TaskStatus, string> = {
  pending: "Mark as complete",
  completed: "Mark as error",
  error: "Mark as pending",
};

const StatusIcon = ({ status }: { status: TaskStatus }) => {
  switch (status) {
    case "completed":
      return <Check className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case "error":
      return <X className="h-4 w-4 text-red-600 dark:text-red-400" />;
    case "pending":
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

export function InputWithStatus({
  value,
  onChange,
  placeholder,
  status,
  onCycleStatus,
  className,
  id,
  reminders = [],
  onViewReminder,
  onDeleteReminder,
}: InputWithStatusProps) {
  const { isDragOver, dropZoneProps } = useDropZone({ onDrop: onChange });
  const hasReminders = reminders.length > 0;

  return (
    <div
      className={cn(
        "flex items-center rounded-md transition-all",
        isDragOver &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background",
        className
      )}
      {...dropZoneProps}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 rounded-r-none border border-r-0 border-input shrink-0 cursor-pointer",
          "hover:bg-accent focus-visible:ring-0 focus-visible:ring-offset-0"
        )}
        onClick={onCycleStatus}
        aria-label={statusLabels[status]}
      >
        <StatusIcon status={status} />
      </Button>
      {/* Reminder chips */}
      {hasReminders && (
        <div className="flex items-center gap-1 px-1 border-y border-input bg-background">
          {reminders.map((reminder) => (
            <ReminderChip
              key={reminder.id}
              reminder={reminder}
              onView={onViewReminder || (() => {})}
              onDelete={onDeleteReminder || (() => {})}
            />
          ))}
        </div>
      )}
      <Input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "flex-1",
          !hasReminders && "rounded-l-none",
          hasReminders && "rounded-none border-l-0",
          status === "completed" && "line-through opacity-60",
          status === "error" && "line-through opacity-60",
          isDragOver && "bg-primary/5"
        )}
      />
    </div>
  );
}
