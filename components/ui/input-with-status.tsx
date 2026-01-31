"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDropZone } from "@/lib/use-drag-drop";

export type TaskStatus = "pending" | "completed" | "error";

interface InputWithStatusProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  status: TaskStatus;
  onCycleStatus: () => void;
  className?: string;
  id?: string;
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
}: InputWithStatusProps) {
  const { isDragOver, dropZoneProps } = useDropZone({ onDrop: onChange });

  return (
    <div
      className={cn(
        "flex items-center rounded-md transition-all",
        isDragOver && "ring-2 ring-primary ring-offset-2 ring-offset-background",
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
      <Input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "flex-1 rounded-l-none",
          status === "completed" && "line-through opacity-60",
          status === "error" && "line-through opacity-60",
          isDragOver && "bg-primary/5"
        )}
      />
    </div>
  );
}
