"use client";

import { Label } from "@/components/ui/label";
import { InputWithStatus } from "@/components/ui/input-with-status";
import { HOURS } from "../constants";

interface HourlyScheduleProps {
  hourlyPlans: Record<string, string>;
  onHourlyPlanChange: (hour: string, minute: string, value: string) => void;
  completed: Record<string, boolean>;
  onToggleCompletion: (key: string) => void;
}

export function HourlySchedule({
  hourlyPlans,
  onHourlyPlanChange,
  completed,
  onToggleCompletion,
}: HourlyScheduleProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-foreground">
        Hourly Schedule
      </h2>
      <div className="space-y-3">
        {/* Header row with :00 and :30 labels */}
        <div className="flex items-center gap-4">
          <div className="w-20"></div>
          <div className="flex-1 flex items-center gap-2">
            <Label className="flex-1 text-center text-sm font-medium text-muted-foreground">
              : 00
            </Label>
            <div className="h-8 w-px bg-transparent"></div>
            <Label className="flex-1 text-center text-sm font-medium text-muted-foreground">
              : 30
            </Label>
          </div>
        </div>
        {/* Hour rows with two inputs each */}
        {HOURS.map((hour) => {
          // Extract hour number and AM/PM from hour string (e.g., "5 AM" -> "5" and "AM")
          const hourMatch = hour.match(/^(\d+)\s+(AM|PM)$/);
          const hourNumber = hourMatch ? hourMatch[1] : hour;
          const period = hourMatch ? hourMatch[2] : "";

          const key00 = `${hour}:00`;
          const key30 = `${hour}:30`;

          return (
            <div key={hour} className="flex items-center gap-4">
              <Label className="w-20 text-sm font-medium text-muted-foreground">
                {hour}
              </Label>
              <div className="flex-1 flex items-center gap-2">
                <InputWithStatus
                  id={key00}
                  value={hourlyPlans[key00] || ""}
                  onChange={(value) => onHourlyPlanChange(hour, "00", value)}
                  placeholder={`${hourNumber}:00 ${period}`}
                  completed={completed[key00] || false}
                  onToggleCompletion={() => onToggleCompletion(key00)}
                  className="flex-1"
                />
                <div className="h-8 w-px bg-border"></div>
                <InputWithStatus
                  id={key30}
                  value={hourlyPlans[key30] || ""}
                  onChange={(value) => onHourlyPlanChange(hour, "30", value)}
                  placeholder={`${hourNumber}:30 ${period}`}
                  completed={completed[key30] || false}
                  onToggleCompletion={() => onToggleCompletion(key30)}
                  className="flex-1"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
