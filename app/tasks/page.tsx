"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskList } from "./components/task-list";
import { TaskFilters } from "./components/task-filters";
import { TaskFormDialog } from "./components/task-form-dialog";
import { TaskDetailDialog } from "./components/task-detail-dialog";
import { DeleteTaskAlert } from "./components/delete-task-alert";
import { useTasksPage } from "./hooks/use-tasks-page";

export default function TasksPage() {
  const {
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
    handleToggleChecklistItem,
    openEditDialog,
    openDetailDialog,
    openDeleteAlert,
  } = useTasksPage();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-8 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 lg:mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Task Manager
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage work and personal tasks in one place.
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <TaskFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
          />
        </div>

        {/* Task list */}
        <TaskList
          tasks={filteredTasks}
          onSelectTask={openDetailDialog}
          onEditTask={openEditDialog}
          onCloneTask={handleCloneTask}
          onDeleteTask={openDeleteAlert}
        />
      </div>

      {/* Create Dialog */}
      <TaskFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSave={handleCreateTask}
        title="Create Task"
      />

      {/* Edit Dialog */}
      <TaskFormDialog
        key={selectedTask?.id}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleEditTask}
        initialData={selectedTask ?? undefined}
        title="Edit Task"
      />

      {/* Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEdit={openEditDialog}
        onClone={handleCloneTask}
        onDelete={openDeleteAlert}
        onToggleChecklistItem={handleToggleChecklistItem}
      />

      {/* Delete confirmation */}
      <DeleteTaskAlert
        task={selectedTask}
        open={deleteAlertOpen}
        onOpenChange={setDeleteAlertOpen}
        onConfirm={handleDeleteTask}
      />
    </div>
  );
}
