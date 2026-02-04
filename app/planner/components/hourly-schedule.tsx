"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { TimeSlotCard } from "./time-slot-card";
import { HOURS } from "../constants";
import type { HourlyItem } from "@/lib/use-planner-storage";
import type { Reminder } from "@/lib/use-reminder-storage";

interface HourlyScheduleProps {
  hourlySlots: Record<string, HourlyItem[]>;
  onUpdateSlot: (slotKey: string, items: HourlyItem[]) => void;
  reminders?: Reminder[];
  onViewReminder?: (reminder: Reminder) => void;
  maxHeight?: number;
  visibleHours?: string[];
}

export function HourlySchedule({
  hourlySlots,
  onUpdateSlot,
  reminders = [],
  onViewReminder,
  maxHeight,
  visibleHours = HOURS,
}: HourlyScheduleProps) {
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check scroll position to show/hide arrows
  const updateScrollIndicators = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollUp(container.scrollTop > 0);
      setCanScrollDown(
        container.scrollTop <
          container.scrollHeight - container.clientHeight - 1
      );
    }
  };

  // Handle scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      updateScrollIndicators();
      container.addEventListener("scroll", updateScrollIndicators);
      return () =>
        container.removeEventListener("scroll", updateScrollIndicators);
    }
  }, []);

  // Update indicators when content, maxHeight, or visible hours change
  useEffect(() => {
    updateScrollIndicators();
  }, [hourlySlots, maxHeight, visibleHours]);

  const scrollUp = () => {
    scrollContainerRef.current?.scrollBy({ top: -200, behavior: "smooth" });
  };

  const scrollDown = () => {
    scrollContainerRef.current?.scrollBy({ top: 200, behavior: "smooth" });
  };

  // Convert internal key format "5 AM:00" to reminder format "5:00 AM"
  const convertToReminderFormat = (internalKey: string): string => {
    const match = internalKey.match(/^(\d+)\s+(AM|PM):(\d+)$/);
    if (!match) return internalKey;
    return `${match[1]}:${match[3]} ${match[2]}`;
  };

  // Helper to filter reminders for a specific time slot
  const getRemindersForSlot = (internalKey: string) => {
    const reminderFormat = convertToReminderFormat(internalKey);
    return reminders.filter((r) => r.timeSlot === reminderFormat);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-foreground">
        Hourly Schedule
      </h2>
      <div className="relative">
        {/* Scroll up indicator */}
        {canScrollUp && (
          <button
            onClick={scrollUp}
            className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 p-1 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-accent transition-colors"
            aria-label="Scroll up"
          >
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="space-y-2.5 overflow-y-auto scrollbar-hide"
          style={{
            maxHeight: maxHeight ? `${maxHeight}px` : "calc(100vh - 14rem)",
          }}
        >
          {visibleHours.map((hour) => {
            const slot00Key = `${hour}:00`;
            const slot30Key = `${hour}:30`;

            return (
              <div
                key={hour}
                className="grid grid-cols-[4rem_1fr_1fr] gap-2 items-stretch"
              >
                {/* Hour label */}
                <div className="flex items-center justify-center rounded-lg bg-muted/50">
                  <span className="text-sm font-medium text-muted-foreground">
                    {hour}
                  </span>
                </div>

                {/* :00 slot */}
                <TimeSlotCard
                  items={hourlySlots[slot00Key] || []}
                  reminders={getRemindersForSlot(slot00Key)}
                  onUpdateItems={(items) => onUpdateSlot(slot00Key, items)}
                  onViewReminder={onViewReminder}
                  timeSlot={slot00Key}
                />

                {/* :30 slot */}
                <TimeSlotCard
                  items={hourlySlots[slot30Key] || []}
                  reminders={getRemindersForSlot(slot30Key)}
                  onUpdateItems={(items) => onUpdateSlot(slot30Key, items)}
                  onViewReminder={onViewReminder}
                  timeSlot={slot30Key}
                />
              </div>
            );
          })}
        </div>

        {/* Scroll down indicator */}
        {canScrollDown && (
          <button
            onClick={scrollDown}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10 p-1 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-accent transition-colors"
            aria-label="Scroll down"
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
