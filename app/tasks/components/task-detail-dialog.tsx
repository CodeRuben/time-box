"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Check,
  Circle,
  Copy,
  ExternalLink,
  Loader2,
  OctagonAlert,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/task-types";
import { TASK_STATUS_OPTIONS, TASK_TYPE_OPTIONS } from "@/lib/task-types";
import { formatDistanceToNow } from "date-fns";

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleChecklistItem: (taskId: string, itemId: string) => void;
  // Optional actions — when omitted (or `hideActions` is set) the footer is
  // not rendered. Used by the Planner which embeds a view-only variant.
  onEdit?: (task: Task) => void;
  onClone?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  hideActions?: boolean;
  onNavigateToTask?: () => void;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "done":
      return <Check className="h-3.5 w-3.5" />;
    case "in_progress":
      return <Loader2 className="h-3.5 w-3.5" />;
    case "blocked":
      return <OctagonAlert className="h-3.5 w-3.5" />;
    default:
      return <Circle className="h-3.5 w-3.5" />;
  }
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

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onEdit,
  onClone,
  onDelete,
  onToggleChecklistItem,
  hideActions,
  onNavigateToTask,
}: TaskDetailDialogProps) {
  if (!task) return null;

  const showActions = !hideActions && (onEdit || onClone || onDelete);

  const statusLabel =
    TASK_STATUS_OPTIONS.find((s) => s.value === task.status)?.label ??
    task.status;
  const typeLabel =
    TASK_TYPE_OPTIONS.find((t) => t.value === task.type)?.label ?? task.type;
  const completedCount = task.checklist.filter((i) => i.completed).length;
  const totalCount = task.checklist.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg leading-snug pr-8">
                {task.name}
              </DialogTitle>
              <DialogDescription className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span>
                  Created{" "}
                  {formatDistanceToNow(new Date(task.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                {hideActions && onNavigateToTask && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenChange(false);
                        onNavigateToTask();
                      }}
                      className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer"
                    >
                      View in tasks
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Metadata strip */}
        <div className="px-6 pb-4 flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant(task.status)} className="gap-1">
            <StatusIcon status={task.status} />
            {statusLabel}
          </Badge>
          <Badge variant={typeVariant(task.type)}>{typeLabel}</Badge>
        </div>

        {/* Description */}
        {task.description && (
          <div className="px-6 pb-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed rounded-md bg-muted/50 px-3 py-2.5">
              {task.description}
            </p>
          </div>
        )}

        {/* Checklist */}
        {totalCount > 0 && (
          <div className="px-6 pb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Checklist</span>
              <span
                className={cn(
                  "text-xs font-medium tabular-nums",
                  completedCount === totalCount
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                )}
              >
                {completedCount}/{totalCount}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-muted mb-3 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  completedCount === totalCount
                    ? "bg-green-600 dark:bg-green-400"
                    : "bg-primary"
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="space-y-0.5">
              {task.checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-accent/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() =>
                      onToggleChecklistItem(task.id, item.id)
                    }
                  />
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      item.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {item.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Footer actions */}
        {showActions && (
          <DialogFooter className="border-t px-6 py-3 flex-row justify-end gap-2 sm:gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(task);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
            {onClone && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onClone(task);
                }}
              >
                <Copy className="h-4 w-4" />
                Clone
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onDelete(task);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
