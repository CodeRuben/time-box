"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRecurringFocusTaskScheduleSummary } from "@/lib/recurring-focus-tasks/format";
import type { RecurringFocusTaskDto } from "@/lib/recurring-focus-tasks/types";
import type { RecurringFocusTaskInput } from "@/lib/recurring-focus-tasks/types";
import { useRecurringFocusTasks } from "@/lib/use-recurring-focus-tasks";
import { RecurringTaskFormDialog } from "./recurring-task-form-dialog";
import { DeleteRecurringTaskAlert } from "./delete-recurring-task-alert";

interface RecurringTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTasksChanged?: () => void | Promise<void>;
}

function RecurringTaskRowActions({
  task,
  onEdit,
  onToggleEnabled,
  onDelete,
}: {
  task: RecurringFocusTaskDto;
  onEdit: () => void;
  onToggleEnabled: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${task.title}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
        <DropdownMenuItem onSelect={onToggleEnabled}>
          {task.enabled ? "Disable" : "Enable"}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RecurringTasksDialog({
  open,
  onOpenChange,
  onTasksChanged,
}: RecurringTasksDialogProps) {
  const { tasks, isLoading, error, createTask, updateTask, deleteTask } =
    useRecurringFocusTasks(open);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RecurringFocusTaskDto | null>(
    null
  );
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [taskPendingDelete, setTaskPendingDelete] =
    useState<RecurringFocusTaskDto | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const notifyTasksChanged = async () => {
    await onTasksChanged?.();
  };

  const openCreateForm = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const openEditForm = (task: RecurringFocusTaskDto) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleSave = async (input: RecurringFocusTaskInput) => {
    setActionError(null);
    if (editingTask) {
      await updateTask(editingTask.id, input);
    } else {
      await createTask(input);
    }
    await notifyTasksChanged();
  };

  const handleToggleEnabled = async (task: RecurringFocusTaskDto) => {
    setActionError(null);
    try {
      await updateTask(task.id, { enabled: !task.enabled });
      await notifyTasksChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleConfirmDelete = async (id: string) => {
    setActionError(null);
    try {
      await deleteTask(id);
      setTaskPendingDelete(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Recurring tasks</DialogTitle>
            <DialogDescription>
              Create tasks that are added to today&apos;s focus list when their
              schedule is active.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={openCreateForm}
              className="active:scale-[0.97] ease-out will-change-transform motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              + Create
            </Button>
          </div>

          {(error || actionError) && (
            <p className="text-sm text-destructive" role="alert">
              {actionError || error}
            </p>
          )}

          <div className="min-h-[20rem] rounded-md border bg-muted/40 dark:bg-muted/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr:last-child]:!border-b">
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Loading tasks...
                    </TableCell>
                  </TableRow>
                ) : tasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No recurring tasks yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="max-w-[12rem] truncate pl-4 font-medium whitespace-normal">
                        {task.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {task.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[18rem] whitespace-normal text-muted-foreground">
                        {formatRecurringFocusTaskScheduleSummary(task)}
                      </TableCell>
                      <TableCell className="text-right">
                        <RecurringTaskRowActions
                          task={task}
                          onEdit={() => openEditForm(task)}
                          onToggleEnabled={() => {
                            void handleToggleEnabled(task);
                          }}
                          onDelete={() => {
                            setTaskPendingDelete(task);
                            setDeleteAlertOpen(true);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <RecurringTaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        onSave={handleSave}
      />

      <DeleteRecurringTaskAlert
        task={taskPendingDelete}
        open={deleteAlertOpen}
        onOpenChange={setDeleteAlertOpen}
        onConfirm={(id) => {
          void handleConfirmDelete(id);
        }}
      />
    </>
  );
}
