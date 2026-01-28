"use client";

import { useState } from "react";
import { PlannerHeader } from "./planner/components/planner-header";
import { TopPriorities } from "./planner/components/top-priorities";
import { BrainDump } from "./planner/components/brain-dump";
import { DateSelector } from "./planner/components/date-selector";
import { HourlySchedule } from "./planner/components/hourly-schedule";
import { ThemeToggle } from "./planner/components/theme-toggle";
import { usePlannerStorage, type TopPriority } from "@/lib/use-planner-storage";

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { data, setData, isLoading } = usePlannerStorage(date);

  // Handle adding a new priority
  const handleAddPriority = () => {
    setData((prev) => {
      if (prev.topPriorities.length >= 3) return prev;
      const newPriority: TopPriority = {
        id: crypto.randomUUID(),
        name: "",
        completed: false,
        subtasks: [],
      };
      return { ...prev, topPriorities: [...prev.topPriorities, newPriority] };
    });
  };

  // Handle updating a priority
  const handleUpdatePriority = (updatedPriority: TopPriority) => {
    setData((prev) => ({
      ...prev,
      topPriorities: prev.topPriorities.map((p) =>
        p.id === updatedPriority.id ? updatedPriority : p
      ),
    }));
  };

  // Handle deleting a priority
  const handleDeletePriority = (id: string) => {
    setData((prev) => ({
      ...prev,
      topPriorities: prev.topPriorities.filter((p) => p.id !== id),
    }));
  };

  // Handle brain dump change
  const handleBrainDumpChange = (value: string) => {
    setData((prev) => ({ ...prev, brainDump: value }));
  };

  // Handle hourly plan change
  const handleHourlyPlanChange = (
    hour: string,
    minute: string,
    value: string
  ) => {
    setData((prev) => ({
      ...prev,
      hourlyPlans: {
        ...prev.hourlyPlans,
        [`${hour}:${minute}`]: value,
      },
    }));
  };

  // Handle hourly completion toggle
  const handleHourlyToggle = (key: string) => {
    setData((prev) => ({
      ...prev,
      hourlyCompleted: {
        ...prev.hourlyCompleted,
        [key]: !prev.hourlyCompleted[key],
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-8 px-8 pb-12 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-8 px-8 pb-12">
      <ThemeToggle />
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[calc(100vh-5rem)]">
          {/* First Column */}
          <div className="flex flex-col gap-8">
            <PlannerHeader />
            <TopPriorities
              priorities={data.topPriorities}
              onAddPriority={handleAddPriority}
              onUpdatePriority={handleUpdatePriority}
              onDeletePriority={handleDeletePriority}
            />
            <BrainDump value={data.brainDump} onChange={handleBrainDumpChange} />
          </div>

          {/* Second Column */}
          <div className="space-y-8 pt-2">
            <DateSelector value={date} onChange={setDate} />
            <HourlySchedule
              hourlyPlans={data.hourlyPlans}
              onHourlyPlanChange={handleHourlyPlanChange}
              completed={data.hourlyCompleted}
              onToggleCompletion={handleHourlyToggle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
