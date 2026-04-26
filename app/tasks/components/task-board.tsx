"use client";

import { useState, type DragEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/task-types";
import { TASK_STATUS_OPTIONS, TASK_TYPE_OPTIONS } from "@/lib/task-types";
import { format } from "date-fns";
import {
  CheckCircle2,
  ClipboardCheck,
  Circle,
  Copy,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

interface TaskBoardProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onCloneTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onMoveTask: (taskId: string, status: TaskStatus) => void;
}

type TaskCardProps = Omit<TaskBoardProps, "tasks" | "onMoveTask"> & {
  task: Task;
  isDragging: boolean;
  onDragStart: (event: DragEvent, task: Task) => void;
  onDragEnd: () => void;
};

function StatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "in_progress":
      return <Loader2 className="h-4 w-4 text-blue-600" />;
    case "review":
      return <ClipboardCheck className="h-4 w-4 text-amber-600" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

function typeVariant(type: string) {
  return type === "work" ? ("default" as const) : ("secondary" as const);
}

function getChecklistProgress(task: Task) {
  const total = task.checklist.length;
  const completed = task.checklist.filter((item) => item.completed).length;
  const percent = total > 0 ? (completed / total) * 100 : 0;

  return { completed, total, percent };
}

function TaskCard({
  task,
  onSelectTask,
  onEditTask,
  onCloneTask,
  onDeleteTask,
  onDragStart,
  onDragEnd,
  isDragging,
}: TaskCardProps) {
  const typeLabel =
    TASK_TYPE_OPTIONS.find((option) => option.value === task.type)?.label ??
    task.type;
  const { completed, total, percent } = getChecklistProgress(task);

  return (
    <article
      role="button"
      tabIndex={0}
      draggable
      className={cn(
        "group w-full cursor-grab rounded-lg border bg-card py-3 pl-3 pr-2 text-left shadow-sm transition-all hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing dark:border-muted-foreground/20 dark:bg-muted/80 dark:shadow-lg dark:shadow-black/25 dark:hover:bg-muted",
        task.status === "done" && "bg-card/70 dark:bg-muted/50",
        isDragging && "scale-[0.98] opacity-50"
      )}
      onClick={() => onSelectTask(task)}
      onDragStart={(event) => onDragStart(event, task)}
      onDragEnd={onDragEnd}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectTask(task);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-medium leading-snug text-card-foreground",
              task.status === "done" && "text-muted-foreground line-through"
            )}
          >
            {task.name}
          </p>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {task.description}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                onEditTask(task);
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                onCloneTask(task);
              }}
            >
              <Copy className="h-4 w-4" />
              Clone
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={(event) => {
                event.stopPropagation();
                onDeleteTask(task);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={typeVariant(task.type)} className="text-[11px]">
          {typeLabel}
        </Badge>
        <span className="text-[11px] text-muted-foreground">
          {format(new Date(task.createdAt), "MMM d")}
        </span>
      </div>

      {total > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Checklist</span>
            <span className="tabular-nums">
              {completed}/{total}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                completed === total ? "bg-green-600" : "bg-primary"
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
    </article>
  );
}

export function TaskBoard({
  tasks,
  onSelectTask,
  onEditTask,
  onCloneTask,
  onDeleteTask,
  onMoveTask,
}: TaskBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const tasksByStatus = TASK_STATUS_OPTIONS.map((status) => ({
    ...status,
    tasks: tasks.filter((task) => task.status === status.value),
  }));

  const handleDragStart = (event: DragEvent, task: Task) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-time-box-task", task.id);
    event.dataTransfer.setData("text/plain", task.id);
    setDraggedTaskId(task.id);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  const handleDrop = (event: DragEvent, status: TaskStatus) => {
    event.preventDefault();

    const taskId =
      event.dataTransfer.getData("application/x-time-box-task") ||
      event.dataTransfer.getData("text/plain");
    const task = tasks.find((item) => item.id === taskId);

    if (task && task.status !== status) {
      onMoveTask(task.id, status);
    }

    handleDragEnd();
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-6xl grid-cols-4 gap-4">
        {tasksByStatus.map((lane) => (
          <section
            key={lane.value}
            className={cn(
              "flex min-h-128 flex-col rounded-xl border bg-muted/25 transition-colors dark:border-border/70 dark:bg-background/70",
              dragOverStatus === lane.value &&
                "border-primary bg-primary/5 dark:bg-primary/10"
            )}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDragOverStatus(lane.value);
            }}
            onDragLeave={(event) => {
              const nextTarget = event.relatedTarget;
              if (
                nextTarget instanceof Node &&
                event.currentTarget.contains(nextTarget)
              ) {
                return;
              }
              setDragOverStatus(null);
            }}
            onDrop={(event) => handleDrop(event, lane.value)}
          >
            <div className="flex items-center justify-between gap-3 border-b px-3 py-3">
              <div className="flex items-center gap-2">
                <StatusIcon status={lane.value} />
                <h2 className="text-sm font-semibold">{lane.label}</h2>
              </div>
              <Badge variant="secondary" className="text-xs tabular-nums">
                {lane.tasks.length}
              </Badge>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-3">
              {lane.tasks.length === 0 ? (
                <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed bg-background/50 px-3 text-center text-xs text-muted-foreground dark:border-muted-foreground/20 dark:bg-card/40">
                  No tasks in this lane
                </div>
              ) : (
                lane.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelectTask={onSelectTask}
                    onEditTask={onEditTask}
                    onCloneTask={onCloneTask}
                    onDeleteTask={onDeleteTask}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedTaskId === task.id}
                  />
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
