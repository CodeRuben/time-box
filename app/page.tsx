"use client";

import { useState, useRef, useEffect } from "react";
import { PlannerHeader } from "./planner/components/planner-header";
import { TopPriorities } from "./planner/components/top-priorities";
import { BrainDump } from "./planner/components/brain-dump";
import { DateSelector } from "./planner/components/date-selector";
import { HourlySchedule } from "./planner/components/hourly-schedule";
import { ThemeToggle } from "./planner/components/theme-toggle";
import { ReminderButton } from "./planner/components/reminder-button";
import { CreateReminderDialog } from "./planner/components/create-reminder-dialog";
import { ReminderInfoDialog } from "./planner/components/reminder-info-dialog";
import { DeleteReminderAlert } from "./planner/components/delete-reminder-alert";
import { ClearDayAlert } from "./planner/components/clear-day-alert";
import {
  usePlannerStorage,
  getDefaultData,
  type TopPriority,
  type HourlyItem,
} from "@/lib/use-planner-storage";
import { Button } from "@/components/ui/button";
import { Eraser, Settings } from "lucide-react";
import {
  useReminderStorage,
  type Reminder,
  type NewReminder,
} from "@/lib/use-reminder-storage";
import { useScheduleConfig } from "@/lib/use-schedule-config";
import { ScheduleConfigDialog } from "./planner/components/schedule-config-dialog";
import { getHoursInRange } from "./planner/constants";

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [leftColumnHeight, setLeftColumnHeight] = useState<number | null>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const { data, setData, isLoading } = usePlannerStorage(date);

  // Reminder state and hooks
  const {
    addReminder,
    deleteReminder,
    dismissReminder,
    getRemindersForDate,
    getPastDueReminders,
    getUpcomingReminders,
  } = useReminderStorage();

  // Schedule config
  const { config: scheduleConfig, updateConfig: updateScheduleConfig } =
    useScheduleConfig();
  const visibleHours = getHoursInRange(
    scheduleConfig.startHour,
    scheduleConfig.endHour
  );

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(
    null
  );
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [clearDayAlertOpen, setClearDayAlertOpen] = useState(false);
  const [scheduleConfigDialogOpen, setScheduleConfigDialogOpen] =
    useState(false);

  // Get reminders for current date
  const currentDateReminders = date ? getRemindersForDate(date) : [];
  const pastDueReminders = getPastDueReminders();
  const upcomingReminders = getUpcomingReminders();

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

  // Handle hourly slot update
  const handleUpdateSlot = (slotKey: string, items: HourlyItem[]) => {
    setData((prev) => ({
      ...prev,
      hourlySlots: {
        ...prev.hourlySlots,
        [slotKey]: items,
      },
    }));
  };

  // Reminder handlers
  const handleAddReminder = () => {
    setCreateDialogOpen(true);
  };

  const handleSaveReminder = (newReminder: NewReminder) => {
    addReminder(newReminder);
  };

  const handleViewReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setInfoDialogOpen(true);
  };

  const handleDeleteReminderClick = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setInfoDialogOpen(false);
    setDeleteAlertOpen(true);
  };

  const handleConfirmDelete = (id: string) => {
    deleteReminder(id);
    setSelectedReminder(null);
  };

  const handleDismissReminder = (id: string) => {
    dismissReminder(id);
  };

  // Handle clearing all data for the current day
  const handleClearDay = () => {
    setData(getDefaultData());
  };

  // Measure left column height to sync with hourly schedule
  useEffect(() => {
    const updateHeight = () => {
      if (leftColumnRef.current) {
        setLeftColumnHeight(leftColumnRef.current.offsetHeight);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    // Use ResizeObserver for content changes
    const resizeObserver = new ResizeObserver(updateHeight);
    if (leftColumnRef.current) {
      resizeObserver.observe(leftColumnRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateHeight);
      resizeObserver.disconnect();
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-8 px-8 pb-8 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-8 px-8 pb-8">
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* First Column */}
          <div ref={leftColumnRef} className="flex flex-col gap-8">
            <PlannerHeader />
            <TopPriorities
              priorities={data.topPriorities}
              onAddPriority={handleAddPriority}
              onUpdatePriority={handleUpdatePriority}
              onDeletePriority={handleDeletePriority}
            />
            <BrainDump
              value={data.brainDump}
              onChange={handleBrainDumpChange}
            />
          </div>

          {/* Second Column */}
          <div className="space-y-8 pt-2">
            <div className="flex items-center gap-2">
              <DateSelector value={date} onChange={setDate} />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setClearDayAlertOpen(true)}
                aria-label="Clear today's planner"
              >
                <Eraser className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setScheduleConfigDialogOpen(true)}
                aria-label="Schedule settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <ReminderButton
                pastDueReminders={pastDueReminders}
                upcomingReminders={upcomingReminders}
                onAddReminder={handleAddReminder}
                onViewReminder={handleViewReminder}
              />
            </div>
            <HourlySchedule
              hourlySlots={data.hourlySlots}
              onUpdateSlot={handleUpdateSlot}
              reminders={currentDateReminders}
              onViewReminder={handleViewReminder}
              maxHeight={leftColumnHeight ? leftColumnHeight - 80 : undefined}
              visibleHours={visibleHours}
            />
          </div>
        </div>
      </div>

      {/* Reminder Dialogs */}
      <CreateReminderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSave={handleSaveReminder}
        defaultDate={date}
      />

      <ReminderInfoDialog
        reminder={selectedReminder}
        open={infoDialogOpen}
        onOpenChange={setInfoDialogOpen}
        onDismiss={handleDismissReminder}
        onDelete={handleDeleteReminderClick}
      />

      <DeleteReminderAlert
        reminder={selectedReminder}
        open={deleteAlertOpen}
        onOpenChange={setDeleteAlertOpen}
        onConfirm={handleConfirmDelete}
      />

      <ClearDayAlert
        open={clearDayAlertOpen}
        onOpenChange={setClearDayAlertOpen}
        onConfirm={handleClearDay}
      />

      <ScheduleConfigDialog
        open={scheduleConfigDialogOpen}
        onOpenChange={setScheduleConfigDialogOpen}
        config={scheduleConfig}
        onSave={updateScheduleConfig}
      />
    </div>
  );
}
