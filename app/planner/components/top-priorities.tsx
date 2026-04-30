"use client";

import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { Plus, LinkIcon } from "lucide-react";
import { PriorityCard } from "./priority-card";
import type { TopPriority } from "@/lib/use-planner-storage";
import type { NewTask, Task } from "@/lib/task-types";

const MAX_PRIORITIES = 3;

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

interface LinkTaskButtonProps {
  onClick: () => void;
  variant: ButtonVariant;
  label?: string;
  className?: string;
}

function LinkTaskButton({
  onClick,
  variant,
  label = "Link task",
  className,
}: LinkTaskButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={onClick}
      className={className}
    >
      <LinkIcon className="h-4 w-4" />
      {label}
    </Button>
  );
}

interface TopPrioritiesProps {
  priorities: TopPriority[];
  onAddPriority: () => void;
  onUpdatePriority: (priority: TopPriority) => void;
  onDeletePriority: (id: string) => void;
  onLinkTask?: () => void;
  onViewLinkedTask?: (taskId: string) => void;
  onUpdateLinkedTask?: (
    taskId: string,
    updates: Partial<NewTask>
  ) => Promise<void> | void;
  tasksById?: Map<string, Task>;
}

export function TopPriorities({
  priorities,
  onAddPriority,
  onUpdatePriority,
  onDeletePriority,
  onLinkTask,
  onViewLinkedTask,
  onUpdateLinkedTask,
  tasksById,
}: TopPrioritiesProps) {
  const canAddMore = priorities.length < MAX_PRIORITIES;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Top Priorities
        </h2>

        {priorities.length > 0 && canAddMore && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddPriority}
              className="px-2.5"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {onLinkTask && (
              <LinkTaskButton
                onClick={onLinkTask}
                variant="outline"
                label=""
                className="px-2.5"
              />
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {priorities.length === 0 ? (
          <div className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg py-6 px-4 text-center text-muted-foreground bg-accent/30">
            <p className="text-sm font-medium">No priorities yet</p>
            <p className="text-xs mb-3">
              Up to {MAX_PRIORITIES} top priorities for today
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddPriority}
                className="active:scale-[0.97] ease-out will-change-transform motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                <Plus className="h-4 w-4" />
                New priority
              </Button>
              {onLinkTask && (
                <LinkTaskButton
                  onClick={onLinkTask}
                  variant="outline"
                  className="active:scale-[0.97] ease-out will-change-transform motion-reduce:transition-none motion-reduce:active:scale-100"
                />
              )}
            </div>
          </div>
        ) : (
          priorities.map((priority) => (
            <PriorityCard
              key={priority.id}
              priority={priority}
              onUpdate={onUpdatePriority}
              onDelete={onDeletePriority}
              onViewLinkedTask={onViewLinkedTask}
              onUpdateLinkedTask={onUpdateLinkedTask}
              linkedTask={
                priority.linkedTaskId
                  ? (tasksById?.get(priority.linkedTaskId) ?? null)
                  : undefined
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
