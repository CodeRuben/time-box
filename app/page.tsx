"use client";

import { useState } from "react";
import { PlannerHeader } from "./planner/components/planner-header";
import { TopPriorities } from "./planner/components/top-priorities";
import { BrainDump } from "./planner/components/brain-dump";
import { DateSelector } from "./planner/components/date-selector";
import { HourlySchedule } from "./planner/components/hourly-schedule";
import { ThemeToggle } from "./planner/components/theme-toggle";
import { HOURS } from "./planner/constants";

export default function Home() {
  // State management
  const [priorities, setPriorities] = useState<string[]>(["", "", ""]);
  const [brainDump, setBrainDump] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [hourlyPlans, setHourlyPlans] = useState<Record<string, string>>(
    HOURS.reduce(
      (acc, hour) => ({
        ...acc,
        [`${hour}:00`]: "",
        [`${hour}:30`]: "",
      }),
      {}
    )
  );

  // Handle priority change
  const handlePriorityChange = (index: number, value: string) => {
    const newPriorities = [...priorities];
    newPriorities[index] = value;
    setPriorities(newPriorities);
  };

  // Handle hourly plan change
  const handleHourlyPlanChange = (
    hour: string,
    minute: string,
    value: string
  ) => {
    setHourlyPlans((prev) => ({
      ...prev,
      [`${hour}:${minute}`]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background pt-8 px-8 pb-12">
      <ThemeToggle />
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[calc(100vh-5rem)]">
          {/* First Column */}
          <div className="flex flex-col gap-8">
            <PlannerHeader />
            <TopPriorities
              priorities={priorities}
              onPriorityChange={handlePriorityChange}
            />
            <BrainDump value={brainDump} onChange={setBrainDump} />
          </div>

          {/* Second Column */}
          <div className="space-y-8 pt-2">
            <DateSelector value={date} onChange={setDate} />
            <HourlySchedule
              hourlyPlans={hourlyPlans}
              onHourlyPlanChange={handleHourlyPlanChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
