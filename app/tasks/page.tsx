"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskBoard } from "./components/task-board";
import { TaskFilters } from "./components/task-filters";
import { TaskFormDialog } from "./components/task-form-dialog";
import { TaskDetailDialog } from "./components/task-detail-dialog";
import { DeleteTaskAlert } from "./components/delete-task-alert";
import { useTasksPage } from "./hooks/use-tasks-page";
import { LoadingScreen } from "@/components/ui/loading-screen";

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
    handleMoveTask,
    handleToggleChecklistItem,
    openEditDialog,
    openDetailDialog,
    openDeleteAlert,
  } = useTasksPage();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 lg:mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Task Board
            </h1>
            <p className="text-muted-foreground mt-2">
              Track work and personal tasks across each status lane.
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>

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

        <TaskBoard
          tasks={filteredTasks}
          onSelectTask={openDetailDialog}
          onEditTask={openEditDialog}
          onCloneTask={handleCloneTask}
          onDeleteTask={openDeleteAlert}
          onMoveTask={handleMoveTask}
        />
      </div>

      <TaskFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSave={handleCreateTask}
        title="Create Task"
      />

      <TaskFormDialog
        key={selectedTask?.id}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleEditTask}
        initialData={selectedTask ?? undefined}
        title="Edit Task"
      />

      <TaskDetailDialog
        task={selectedTask}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEdit={openEditDialog}
        onClone={handleCloneTask}
        onDelete={openDeleteAlert}
        onToggleChecklistItem={handleToggleChecklistItem}
      />

      <DeleteTaskAlert
        task={selectedTask}
        open={deleteAlertOpen}
        onOpenChange={setDeleteAlertOpen}
        onConfirm={handleDeleteTask}
      />
    </div>
  );
}
