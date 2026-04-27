"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PlannerHeader } from "./planner/components/planner-header";
import { TopPriorities } from "./planner/components/top-priorities";
import { BrainDump } from "./planner/components/brain-dump";
import { DateSelector } from "./planner/components/date-selector";
import { HourlySchedule } from "./planner/components/hourly-schedule";
import { ReminderButton } from "./planner/components/reminder-button";
import { CreateReminderDialog } from "./planner/components/create-reminder-dialog";
import { ReminderInfoDialog } from "./planner/components/reminder-info-dialog";
import { DeleteReminderAlert } from "./planner/components/delete-reminder-alert";
import { ClearDayAlert } from "./planner/components/clear-day-alert";
import { CopyPreviousDayDialog } from "./planner/components/copy-previous-day-dialog";
import {
  copyPlannerDataFromPreviousDay,
  usePlannerStorage,
  getDefaultData,
  hasCopyablePlannerData,
  type CopyPreviousDayOptions,
  type TopPriority,
  type HourlyItem,
} from "@/lib/use-planner-storage";
import { Button } from "@/components/ui/button";
import { Copy, Eraser, Settings, SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useReminderStorage,
  type Reminder,
  type NewReminder,
} from "@/lib/use-reminder-storage";
import { useScheduleConfig } from "@/lib/use-schedule-config";
import { ScheduleConfigDialog } from "./planner/components/schedule-config-dialog";
import { getHoursInRange } from "./planner/constants";
import { AutosaveIndicator } from "./components/autosave-indicator";
import { useSession } from "next-auth/react";
import { useTaskStorage } from "@/lib/use-task-storage";
import { TaskPickerDialog } from "./planner/components/task-picker-dialog";
import { TaskDetailDialog } from "./tasks/components/task-detail-dialog";
import type { Task } from "@/lib/task-types";
import { LoadingScreen } from "@/components/ui/loading-screen";

function getPreviousDate(date: Date): Date {
  const previousDate = new Date(date);
  previousDate.setDate(previousDate.getDate() - 1);
  return previousDate;
}

export default function Home() {
  const router = useRouter();
  const { status } = useSession();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [leftColumnHeight, setLeftColumnHeight] = useState<number | null>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const { data, setData, isLoading, autosaveStatus, loadDataForDate } =
    usePlannerStorage(date);

  // Task linking
  const { tasks, updateTask: updateLinkedTask } = useTaskStorage();
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const [linkedTaskDetailOpen, setLinkedTaskDetailOpen] = useState(false);
  const [viewedLinkedTask, setViewedLinkedTask] = useState<Task | null>(null);

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
  const [copyPreviousDialogOpen, setCopyPreviousDialogOpen] = useState(false);
  const [copyPreviousLoading, setCopyPreviousLoading] = useState(false);
  const [copyPreviousError, setCopyPreviousError] = useState<string | null>(null);
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

  // Tasks indexed by id so priority cards can derive live state without O(n)
  // lookups each render.
  const tasksById = useMemo(() => {
    const map = new Map<string, Task>();
    for (const task of tasks) map.set(task.id, task);
    return map;
  }, [tasks]);

  // Tasks not already linked to a priority for the current day.
  const availableTasksForPicker = useMemo(
    () =>
      tasks.filter(
        (t) => !data.topPriorities.some((p) => p.linkedTaskId === t.id)
      ),
    [tasks, data.topPriorities]
  );

  // Link an existing task as a new priority. We deliberately keep `subtasks`
  // empty — the linked task's checklist is the source of truth and is shown
  // via the detail dialog, so storing a stale copy here would only drift.
  const handleLinkTask = (task: Task) => {
    setData((prev) => {
      if (prev.topPriorities.length >= 3) return prev;
      const newPriority: TopPriority = {
        id: crypto.randomUUID(),
        name: task.name,
        completed: false,
        subtasks: [],
        linkedTaskId: task.id,
      };
      return { ...prev, topPriorities: [...prev.topPriorities, newPriority] };
    });
  };

  const handleViewLinkedTask = (taskId: string) => {
    const task = tasksById.get(taskId);
    if (task) {
      setViewedLinkedTask(task);
      setLinkedTaskDetailOpen(true);
    }
  };

  const handleToggleLinkedChecklistItem = async (
    taskId: string,
    itemId: string
  ) => {
    const task = tasksById.get(taskId);
    if (!task) return;

    const updatedChecklist = task.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    // Optimistically update the dialog so the checkbox feels responsive. The
    // underlying task store is the source of truth for the priority card.
    setViewedLinkedTask((prev) =>
      prev?.id === taskId ? { ...prev, checklist: updatedChecklist } : prev
    );

    try {
      await updateLinkedTask(taskId, { checklist: updatedChecklist });
    } catch (error) {
      console.error("Failed to update linked task checklist:", error);
      // Roll the dialog back to the previous checklist on failure.
      setViewedLinkedTask((prev) =>
        prev?.id === taskId ? { ...prev, checklist: task.checklist } : prev
      );
    }
  };

  const handleNavigateToTask = useCallback(() => {
    router.push("/tasks");
  }, [router]);

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

  const handleCopyPreviousDay = async (
    options: CopyPreviousDayOptions,
    sourceDate: Date
  ) => {
    if (!date) {
      setCopyPreviousError("Select a date before copying planner items.");
      return;
    }

    setCopyPreviousLoading(true);
    setCopyPreviousError(null);

    try {
      const previousData = await loadDataForDate(sourceDate);

      if (!previousData) {
        setCopyPreviousError("No planner data was found for the selected day.");
        return;
      }

      if (!hasCopyablePlannerData(previousData, options)) {
        setCopyPreviousError(
          "The selected day does not have any matching items to copy."
        );
        return;
      }

      setData((current) =>
        copyPlannerDataFromPreviousDay(current, previousData, options)
      );
      setCopyPreviousDialogOpen(false);
    } catch (error) {
      console.error("Failed to copy planner data from previous day:", error);
      setCopyPreviousError("Could not load the previous day's planner data.");
    } finally {
      setCopyPreviousLoading(false);
    }
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
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* First Column */}
          <div ref={leftColumnRef} className="flex flex-col gap-6 lg:gap-8">
            <PlannerHeader />
            <TopPriorities
              priorities={data.topPriorities}
              onAddPriority={handleAddPriority}
              onUpdatePriority={handleUpdatePriority}
              onDeletePriority={handleDeletePriority}
              onLinkTask={() => setTaskPickerOpen(true)}
              onViewLinkedTask={handleViewLinkedTask}
              onToggleLinkedChecklistItem={handleToggleLinkedChecklistItem}
              tasksById={tasksById}
            />
            <BrainDump
              value={data.brainDump}
              onChange={handleBrainDumpChange}
            />
          </div>

          {/* Second Column */}
          <div className="space-y-6 lg:space-y-8 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <DateSelector value={date} onChange={setDate} />
              <ReminderButton
                pastDueReminders={pastDueReminders}
                upcomingReminders={upcomingReminders}
                onAddReminder={handleAddReminder}
                onViewReminder={handleViewReminder}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    aria-label="Planner actions"
                  >
                    <SlidersHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    disabled={!date}
                    onClick={() => {
                      setCopyPreviousError(null);
                      setCopyPreviousDialogOpen(true);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Copy from day
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setScheduleConfigDialogOpen(true)}
                  >
                    <Settings className="h-4 w-4" />
                    Schedule settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setClearDayAlertOpen(true)}
                  >
                    <Eraser className="h-4 w-4" />
                    Clear day
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {status === "authenticated" && (
                <AutosaveIndicator status={autosaveStatus} />
              )}
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

      {copyPreviousDialogOpen && (
        <CopyPreviousDayDialog
          open={copyPreviousDialogOpen}
          onOpenChange={setCopyPreviousDialogOpen}
          onCopy={handleCopyPreviousDay}
          initialSourceDate={date ? getPreviousDate(date) : undefined}
          isCopying={copyPreviousLoading}
          error={copyPreviousError}
        />
      )}

      <ScheduleConfigDialog
        open={scheduleConfigDialogOpen}
        onOpenChange={setScheduleConfigDialogOpen}
        config={scheduleConfig}
        onSave={updateScheduleConfig}
      />

      {/* Task linking dialogs */}
      <TaskPickerDialog
        open={taskPickerOpen}
        onOpenChange={setTaskPickerOpen}
        tasks={availableTasksForPicker}
        onSelect={handleLinkTask}
      />

      <TaskDetailDialog
        task={viewedLinkedTask}
        open={linkedTaskDetailOpen}
        onOpenChange={setLinkedTaskDetailOpen}
        onToggleChecklistItem={handleToggleLinkedChecklistItem}
        hideActions
        onNavigateToTask={handleNavigateToTask}
      />
    </div>
  );
}
