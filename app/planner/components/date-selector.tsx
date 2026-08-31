"use client";

import { addDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { formatDateKey } from "@/lib/date-key";

interface DateSelectorProps {
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
}

export function DateSelector({ value, onChange }: DateSelectorProps) {
  const handleSelect = (nextDate: Date | undefined) => {
    if (!nextDate) {
      return;
    }

    if (value && formatDateKey(value) === formatDateKey(nextDate)) {
      return;
    }

    onChange(nextDate);
  };

  const shiftByDays = (days: number) => {
    if (!value) {
      return;
    }

    handleSelect(addDays(value, days));
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="date" className="text-lg font-semibold whitespace-nowrap">
        Date:
      </Label>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={!value}
        onClick={() => shiftByDays(-1)}
        aria-label="Previous day"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <DatePicker
        date={value}
        onSelect={handleSelect}
        className="w-auto sm:w-56"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={!value}
        onClick={() => shiftByDays(1)}
        aria-label="Next day"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
