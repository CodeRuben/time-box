import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HOURS } from "../constants";

interface HourlyScheduleProps {
  hourlyPlans: Record<string, string>;
  onHourlyPlanChange: (hour: string, minute: string, value: string) => void;
}

export function HourlySchedule({
  hourlyPlans,
  onHourlyPlanChange,
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
          
          return (
            <div key={hour} className="flex items-center gap-4">
              <Label className="w-20 text-sm font-medium text-muted-foreground">
                {hour}
              </Label>
              <div className="flex-1 flex items-center gap-2">
                <Input
                  id={`${hour}:00`}
                  type="text"
                  placeholder={`${hourNumber}:00 ${period}`}
                  value={hourlyPlans[`${hour}:00`] || ""}
                  onChange={(e) =>
                    onHourlyPlanChange(hour, "00", e.target.value)
                  }
                  className="flex-1"
                />
                <div className="h-8 w-px bg-border"></div>
                <Input
                  id={`${hour}:30`}
                  type="text"
                  placeholder={`${hourNumber}:30 ${period}`}
                  value={hourlyPlans[`${hour}:30`] || ""}
                  onChange={(e) =>
                    onHourlyPlanChange(hour, "30", e.target.value)
                  }
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

