"use client";

import { useState } from "react";
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
import { usePlannerStorage, type TopPriority } from "@/lib/use-planner-storage";
import { useReminderStorage, type Reminder, type NewReminder } from "@/lib/use-reminder-storage";

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());
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

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

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
        p.id === updatedPriority.id ? updatedPriority : p,
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
    value: string,
  ) => {
    setData((prev) => ({
      ...prev,
      hourlyPlans: {
        ...prev.hourlyPlans,
        [`${hour}:${minute}`]: value,
      },
    }));
  };

  // Handle hourly status cycle: pending -> completed -> error -> pending
  const handleHourlyCycleStatus = (key: string) => {
    setData((prev) => {
      const currentStatus = prev.hourlyStatuses[key] || "pending";
      const nextStatus =
        currentStatus === "pending"
          ? "completed"
          : currentStatus === "completed"
            ? "error"
            : "pending";
      return {
        ...prev,
        hourlyStatuses: {
          ...prev.hourlyStatuses,
          [key]: nextStatus,
        },
      };
    });
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
            <BrainDump
              value={data.brainDump}
              onChange={handleBrainDumpChange}
            />
          </div>

          {/* Second Column */}
          <div className="space-y-8 pt-2">
            <div className="flex items-center gap-4">
              <DateSelector value={date} onChange={setDate} />
              <ReminderButton
                pastDueReminders={pastDueReminders}
                upcomingReminders={upcomingReminders}
                onAddReminder={handleAddReminder}
                onViewReminder={handleViewReminder}
              />
            </div>
            <HourlySchedule
              hourlyPlans={data.hourlyPlans}
              onHourlyPlanChange={handleHourlyPlanChange}
              statuses={data.hourlyStatuses}
              onCycleStatus={handleHourlyCycleStatus}
              reminders={currentDateReminders}
              onViewReminder={handleViewReminder}
              onDeleteReminder={handleDeleteReminderClick}
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
    </div>
  );
}
