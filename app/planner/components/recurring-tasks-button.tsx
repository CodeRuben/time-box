"use client";

import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecurringTasksButtonProps {
  onClick: () => void;
}

export function RecurringTasksButton({ onClick }: RecurringTasksButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-9 w-9"
      aria-label="Recurring tasks"
      onClick={onClick}
    >
      <CalendarClock className="h-5 w-5" />
    </Button>
  );
}
