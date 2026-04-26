"use client";

import { useState, useMemo, useCallback } from "react";
import { useTaskStorage } from "@/lib/use-task-storage";
import type { Task, NewTask, TaskStatus, TaskType } from "@/lib/task-types";

export function useTasksPage() {
  const { tasks, isLoading, addTask, updateTask, deleteTask, cloneTask } =
    useTaskStorage();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<TaskType | "all">("all");

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (search && !task.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }
      if (typeFilter !== "all" && task.type !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, search, statusFilter, typeFilter]);

  const handleCreateTask = useCallback(
    async (newTask: NewTask) => {
      await addTask(newTask);
    },
    [addTask]
  );

  const handleEditTask = useCallback(
    async (newTask: NewTask) => {
      if (!selectedTask) return;
      await updateTask(selectedTask.id, newTask);
      setSelectedTask(null);
    },
    [selectedTask, updateTask]
  );

  const handleDeleteTask = useCallback(
    async (id: string) => {
      await deleteTask(id);
      setSelectedTask(null);
    },
    [deleteTask]
  );

  const handleCloneTask = useCallback(
    async (task: Task) => {
      await cloneTask(task);
    },
    [cloneTask]
  );

  const handleMoveTask = useCallback(
    async (taskId: string, status: TaskStatus) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === status) return;

      try {
        await updateTask(taskId, { status });
      } catch (error) {
        console.error("Failed to move task:", error);
        return;
      }

      if (selectedTask?.id === taskId) {
        setSelectedTask((prev) => (prev ? { ...prev, status } : null));
      }
    },
    [tasks, updateTask, selectedTask]
  );

  const handleToggleChecklistItem = useCallback(
    async (taskId: string, itemId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const updatedChecklist = task.checklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      await updateTask(taskId, { checklist: updatedChecklist });

      if (selectedTask?.id === taskId) {
        setSelectedTask((prev) =>
          prev ? { ...prev, checklist: updatedChecklist } : null
        );
      }
    },
    [tasks, updateTask, selectedTask]
  );

  const openEditDialog = useCallback((task: Task) => {
    setSelectedTask(task);
    setEditDialogOpen(true);
  }, []);

  const openDetailDialog = useCallback((task: Task) => {
    setSelectedTask(task);
    setDetailDialogOpen(true);
  }, []);

  const openDeleteAlert = useCallback((task: Task) => {
    setSelectedTask(task);
    setDeleteAlertOpen(true);
  }, []);

  return {
    isLoading,
    filteredTasks,

    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,

    createDialogOpen,
    setCreateDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    detailDialogOpen,
    setDetailDialogOpen,
    deleteAlertOpen,
    setDeleteAlertOpen,
    selectedTask,

    handleCreateTask,
    handleEditTask,
    handleDeleteTask,
    handleCloneTask,
    handleMoveTask,
    handleToggleChecklistItem,
    openEditDialog,
    openDetailDialog,
    openDeleteAlert,
  };
}
