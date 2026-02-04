"use client";

import { Bell, Plus, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/lib/use-reminder-storage";

interface ReminderButtonProps {
  pastDueReminders: Reminder[];
  upcomingReminders: Reminder[];
  onAddReminder: () => void;
  onViewReminder: (reminder: Reminder) => void;
}

function formatReminderTime(reminder: Reminder): string {
  const date = new Date(reminder.date + "T00:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) {
    return `Today at ${reminder.timeSlot}`;
  }
  if (isTomorrow) {
    return `Tomorrow at ${reminder.timeSlot}`;
  }

  return `${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} at ${reminder.timeSlot}`;
}

export function ReminderButton({
  pastDueReminders,
  upcomingReminders,
  onAddReminder,
  onViewReminder,
}: ReminderButtonProps) {
  const hasPastDue = pastDueReminders.length > 0;
  const totalUpcoming = upcomingReminders.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className="relative inline-flex">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            aria-label={`Reminders${
              hasPastDue ? ` (${pastDueReminders.length} past due)` : ""
            }`}
          >
            <Bell className="h-5 w-5" />
          </Button>
          {/* Past due indicator - red dot */}
          {hasPastDue && (
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive animate-pulse" />
          )}
          {/* Upcoming count badge */}
          {totalUpcoming > 0 && !hasPastDue && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
              {totalUpcoming > 9 ? "9+" : totalUpcoming}
            </span>
          )}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Reminders</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddReminder}
              className="h-7 px-2 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {/* Past Due Section */}
          {pastDueReminders.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-destructive mb-2 px-1">
                <AlertCircle className="h-3 w-3" />
                Past Due
              </div>
              <div className="space-y-1">
                {pastDueReminders.map((reminder) => (
                  <button
                    key={reminder.id}
                    onClick={() => onViewReminder(reminder)}
                    className={cn(
                      "w-full text-left p-2 rounded-md text-sm",
                      "hover:bg-destructive/10 transition-colors",
                      "border border-destructive/20 bg-destructive/5"
                    )}
                  >
                    <div className="font-medium truncate">{reminder.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatReminderTime(reminder)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Section */}
          {upcomingReminders.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2 px-1">
                <Clock className="h-3 w-3" />
                Upcoming
              </div>
              <div className="space-y-1">
                {upcomingReminders.slice(0, 5).map((reminder) => (
                  <button
                    key={reminder.id}
                    onClick={() => onViewReminder(reminder)}
                    className={cn(
                      "w-full text-left p-2 rounded-md text-sm",
                      "hover:bg-accent transition-colors"
                    )}
                  >
                    <div className="font-medium truncate">{reminder.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatReminderTime(reminder)}
                    </div>
                  </button>
                ))}
                {upcomingReminders.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center py-1">
                    +{upcomingReminders.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {pastDueReminders.length === 0 && upcomingReminders.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No reminders</p>
              <p className="text-xs">Click Add to create one</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
