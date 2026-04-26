"use client";

import { format, isSameDay, isSameMonth } from "date-fns";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { formatWorkoutDateKey, type WorkoutDotType } from "@/lib/use-workout-storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MAX_CALENDAR_DOTS,
  WEEKDAY_LABELS,
  WORKOUT_TYPE_META,
} from "../constants";

const CALENDAR_WORKOUT_ICONS: Record<WorkoutDotType, LucideIcon> = {
  resistance: Dumbbell,
  cardio: Activity,
  hybrid: Flame,
};

function getCalendarIndicatorType(
  workoutTypes: WorkoutDotType[],
): WorkoutDotType | null {
  if (workoutTypes.length === 0) {
    return null;
  }

  const uniqueWorkoutTypes = [...new Set(workoutTypes)];
  if (uniqueWorkoutTypes.length === 1) {
    return uniqueWorkoutTypes[0];
  }

  return "hybrid";
}

interface WorkoutCalendarProps {
  calendarDays: Date[];
  calendarMonth: Date;
  selectedDate: Date;
  today: Date;
  onSelectDate: (day: Date) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  getWorkoutTypesForDate: (day: Date) => WorkoutDotType[];
}

export function WorkoutCalendar({
  calendarDays,
  calendarMonth,
  selectedDate,
  today,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  getWorkoutTypesForDate,
}: WorkoutCalendarProps) {
  return (
    <div className="space-y-4">
      <Card className="py-0">
        <CardHeader className="border-b px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-xl sm:text-2xl font-semibold">
              {format(calendarMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={onPreviousMonth}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onNextMonth}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-2 py-3 sm:px-6 sm:py-6">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {WEEKDAY_LABELS.map((weekday) => (
              <div
                key={weekday}
                className="text-muted-foreground py-1 sm:py-2 text-center text-xs sm:text-sm font-medium"
              >
                {weekday}
              </div>
            ))}

            {calendarDays.map((day) => {
              const dateKey = formatWorkoutDateKey(day);
              const outsideMonth = !isSameMonth(day, calendarMonth);
              const workoutTypes = getWorkoutTypesForDate(day);
              const visibleWorkoutTypes = workoutTypes.slice(0, MAX_CALENDAR_DOTS);
              const hiddenWorkoutCount = Math.max(
                0,
                workoutTypes.length - MAX_CALENDAR_DOTS,
              );
              const calendarIndicatorType = getCalendarIndicatorType(workoutTypes);
              const CalendarIndicatorIcon = calendarIndicatorType
                ? CALENDAR_WORKOUT_ICONS[calendarIndicatorType]
                : null;
              const calendarIndicatorMeta = calendarIndicatorType
                ? WORKOUT_TYPE_META[calendarIndicatorType]
                : null;
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, today);

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => onSelectDate(day)}
                  className={[
                    "relative sm:aspect-square min-h-12 sm:min-h-20 lg:min-h-24 cursor-pointer rounded-lg border p-1.5 sm:p-2 text-left",
                    "transition-[background-color,border-color,box-shadow] duration-150 ease-out-cubic motion-reduce:transition-none",
                    "hover:bg-accent/30",
                    isSelected ? "border-primary bg-primary/15 ring-2 ring-primary/20 shadow-sm" : "",
                    !isSelected && isToday ? "border-primary/60" : "",
                    outsideMonth
                      ? "text-muted-foreground/70 bg-muted/20"
                      : "bg-card",
                  ].join(" ")}
                  aria-label={`Select ${format(day, "MMMM d, yyyy")}`}
                >
                  <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 text-xs sm:text-sm font-semibold">
                    {format(day, "d")}
                  </span>

                  <div className="absolute right-1.5 bottom-1.5 flex items-center gap-0.5 sm:hidden">
                    {visibleWorkoutTypes.map((type, index) => (
                      <span
                        key={`${dateKey}-${type}-${index}`}
                        className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${WORKOUT_TYPE_META[type].dotClass}`}
                        title={WORKOUT_TYPE_META[type].label}
                      />
                    ))}
                    {hiddenWorkoutCount > 0 && (
                      <span className="text-muted-foreground text-[10px] sm:text-xs font-medium">
                        +{hiddenWorkoutCount}
                      </span>
                    )}
                  </div>

                  {CalendarIndicatorIcon && calendarIndicatorMeta && (
                    <div className="absolute right-2 bottom-2 hidden sm:flex">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full shadow-sm ring-1 ring-background/80 ${calendarIndicatorMeta.badgeClass}`}
                        title={calendarIndicatorMeta.label}
                      >
                        <CalendarIndicatorIcon className="h-3 w-3" />
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-4 px-1">
        {(Object.keys(WORKOUT_TYPE_META) as WorkoutDotType[]).map((type) => (
          <div key={type} className="flex items-center gap-2 text-sm">
            <span className={`h-3 w-3 rounded-full ${WORKOUT_TYPE_META[type].dotClass}`} />
            <span>{WORKOUT_TYPE_META[type].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
