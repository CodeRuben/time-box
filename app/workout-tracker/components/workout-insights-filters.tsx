"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { dateKeyToLocalDate } from "@/lib/date-key";
import {
  INSIGHT_WORKOUT_TYPE_META,
  WORKOUT_TYPES,
  type WorkoutType,
} from "@/lib/workout-insights";
import type { InsightPreset } from "../hooks/use-workout-insights";

const PRESETS: Array<{ id: InsightPreset; label: string; short: string }> = [
  { id: "year-to-date", label: "Year to date", short: "YTD" },
  { id: "last-90-days", label: "Last 90 days", short: "90 days" },
  { id: "last-12-months", label: "Last 12 months", short: "12 months" },
];

const SEGMENT_CLASS =
  "rounded-md px-2 py-1.5 text-xs font-medium transition-colors duration-150 ease motion-reduce:transition-none";

interface WorkoutInsightsFiltersProps {
  today: Date;
  preset: InsightPreset | null;
  startDate: string;
  endDate: string;
  selectedTypes: WorkoutType[];
  onSelectPreset: (preset: InsightPreset) => void;
  onSelectCustomRange: (
    start: Date | undefined,
    end: Date | undefined,
  ) => void;
  onToggleType: (type: WorkoutType) => void;
}

export function WorkoutInsightsFilters({
  today,
  preset,
  startDate,
  endDate,
  selectedTypes,
  onSelectPreset,
  onSelectCustomRange,
  onToggleType,
}: WorkoutInsightsFiltersProps) {
  const from = dateKeyToLocalDate(startDate);
  const to = dateKeyToLocalDate(endDate);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1 rounded-lg border border-border/70 bg-white p-1 dark:bg-secondary">
        {PRESETS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-label={option.label}
            aria-pressed={preset === option.id}
            onClick={() => onSelectPreset(option.id)}
            className={cn(
              SEGMENT_CLASS,
              preset === option.id
                ? "bg-zinc-100 text-foreground shadow-sm dark:bg-primary dark:text-primary-foreground dark:shadow-none"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.short}
          </button>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-pressed={preset === null}
              className={cn(
                SEGMENT_CLASS,
                "inline-flex items-center justify-center gap-1.5",
                preset === null
                  ? "bg-zinc-100 text-foreground shadow-sm dark:bg-primary dark:text-primary-foreground dark:shadow-none"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CalendarIcon className="size-3.5" aria-hidden />
              Custom
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={{ from, to }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  onSelectCustomRange(range.from, range.to);
                }
              }}
              disabled={{ after: today }}
              numberOfMonths={1}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {WORKOUT_TYPES.map((type) => {
          const isSelected = selectedTypes.includes(type);
          return (
            <label
              key={type}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ease motion-reduce:transition-none",
                isSelected
                  ? "border-border bg-muted/50 text-foreground"
                  : "border-border/70 bg-background text-muted-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:border-border [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground",
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleType(type)}
              />
              {INSIGHT_WORKOUT_TYPE_META[type].label}
            </label>
          );
        })}

        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {format(from, "MMM d, yyyy")} – {format(to, "MMM d, yyyy")}
        </span>
      </div>
    </div>
  );
}
