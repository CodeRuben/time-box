"use client";

import { useMemo, useState } from "react";
import { addMonths, format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getMonthGridCells,
} from "@/lib/reading-days-grid";

interface ReadingDaysGridProps {
  readingDays: string[];
  onTick: (date: string) => void;
  onUntick: (date: string) => void;
}

function formatCellLabel(date: string): string {
  return format(parseISO(date), "EEEE, MMMM d, yyyy");
}

export function ReadingDaysGrid({
  readingDays,
  onTick,
  onUntick,
}: ReadingDaysGridProps) {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const readingDaySet = useMemo(() => new Set(readingDays), [readingDays]);
  const cells = useMemo(() => getMonthGridCells(monthDate), [monthDate]);

  const handleToggle = (date: string) => {
    if (readingDaySet.has(date)) {
      onUntick(date);
    } else {
      onTick(date);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="text-sm font-semibold text-foreground">Days read</h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-3.5 rounded-full border border-primary bg-primary/25" />
            Read
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3.5 rounded-full border border-border" />
            No read
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {format(monthDate, "MMMM yyyy")}
        </p>
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setMonthDate((prev) => addMonths(prev, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setMonthDate((prev) => addMonths(prev, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="inline-grid grid-cols-7 gap-1.5">
        {cells.map((cell) => {
          const isChecked = readingDaySet.has(cell.date);
          const dayNumber = Number(cell.date.slice(-2));

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => handleToggle(cell.date)}
              aria-pressed={isChecked}
              aria-label={`${formatCellLabel(cell.date)}${isChecked ? ", read" : ", not read"}`}
              title={formatCellLabel(cell.date)}
              className={cn(
                "flex size-7 cursor-pointer items-center justify-center rounded-full border text-[10px] font-medium tabular-nums transition-colors duration-150 ease motion-reduce:transition-none",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1",
                !cell.isCurrentMonth && "opacity-35",
                isChecked
                  ? "border-primary bg-primary/25 text-foreground hover:bg-primary/35"
                  : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground/50 hover:bg-primary/10 hover:text-foreground"
              )}
            >
              {dayNumber}
            </button>
          );
        })}
      </div>
    </section>
  );
}
