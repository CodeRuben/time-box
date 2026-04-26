"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/task-types";
import { TASK_STATUS_OPTIONS, TASK_TYPE_OPTIONS } from "@/lib/task-types";
import { format } from "date-fns";

interface TaskListProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onCloneTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

function statusVariant(status: string) {
  switch (status) {
    case "done":
      return "default" as const;
    case "in_progress":
      return "secondary" as const;
    case "blocked":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function typeVariant(type: string) {
  return type === "work" ? ("default" as const) : ("secondary" as const);
}

export function TaskList({
  tasks,
  onSelectTask,
  onEditTask,
  onCloneTask,
  onDeleteTask,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
        <p className="text-sm font-medium">No tasks found</p>
        <p className="text-xs mt-1">
          Create a new task or adjust your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_100px_100px_110px_44px] gap-4 items-center px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <span>Name</span>
        <span>Status</span>
        <span>Type</span>
        <span>Created</span>
        <span className="sr-only">Actions</span>
      </div>

      {/* Rows */}
      <div className="divide-y">
        {tasks.map((task) => {
          const statusLabel =
            TASK_STATUS_OPTIONS.find((s) => s.value === task.status)?.label ??
            task.status;
          const typeLabel =
            TASK_TYPE_OPTIONS.find((t) => t.value === task.type)?.label ??
            task.type;
          const checklistCount = task.checklist.length;
          const completedCount = task.checklist.filter(
            (i) => i.completed
          ).length;

          return (
            <div
              key={task.id}
              className="group grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_110px_44px] gap-2 sm:gap-4 items-center px-4 py-3 hover:bg-accent/30 cursor-pointer"
              onClick={() => onSelectTask(task)}
            >
              {/* Name + checklist progress */}
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    task.status === "done" && "line-through text-muted-foreground"
                  )}
                >
                  {task.name}
                </p>
                {checklistCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                    {completedCount}/{checklistCount} items
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <Badge variant={statusVariant(task.status)} className="text-xs">
                  {statusLabel}
                </Badge>
              </div>

              {/* Type */}
              <div>
                <Badge variant={typeVariant(task.type)} className="text-xs">
                  {typeLabel}
                </Badge>
              </div>

              {/* Created date */}
              <span className="text-xs text-muted-foreground">
                {format(new Date(task.createdAt), "MMM d, yyyy")}
              </span>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTask(task);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloneTask(task);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Clone
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </div>
  );
}
