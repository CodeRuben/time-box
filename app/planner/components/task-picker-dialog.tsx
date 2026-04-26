"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { Task } from "@/lib/task-types";
import { TASK_STATUS_OPTIONS, TASK_TYPE_OPTIONS } from "@/lib/task-types";

interface TaskPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  onSelect: (task: Task) => void;
}

// Active work first, then review, todo, and done. Within a group, newest first.
const STATUS_ORDER: Record<Task["status"], number> = {
  in_progress: 0,
  review: 1,
  todo: 2,
  done: 3,
};

export function TaskPickerDialog({
  open,
  onOpenChange,
  tasks,
  onSelect,
}: TaskPickerDialogProps) {
  const [search, setSearch] = useState("");
  const [includeDone, setIncludeDone] = useState(false);

  const filtered = useMemo(() => {
    const lower = search.trim().toLowerCase();
    const matches = tasks.filter((t) => {
      if (!includeDone && t.status === "done") return false;
      if (!lower) return true;
      return (
        t.name.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower)
      );
    });

    return matches.slice().sort((a, b) => {
      const statusDelta = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (statusDelta !== 0) return statusDelta;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [tasks, search, includeDone]);

  const hiddenDoneCount = useMemo(
    () =>
      includeDone ? 0 : tasks.filter((t) => t.status === "done").length,
    [tasks, includeDone]
  );

  const handleSelect = (task: Task) => {
    onSelect(task);
    onOpenChange(false);
    setSearch("");
    setIncludeDone(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setSearch("");
          setIncludeDone(false);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Link a Task</DialogTitle>
          <DialogDescription>
            Select a task to add as a priority. Its name and checklist will be
            used.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or description..."
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {tasks.length === 0
                ? "No tasks yet. Create tasks on the Tasks page first."
                : "No tasks match your search."}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((task) => {
                const statusLabel =
                  TASK_STATUS_OPTIONS.find((s) => s.value === task.status)
                    ?.label ?? task.status;
                const typeLabel =
                  TASK_TYPE_OPTIONS.find((t) => t.value === task.type)?.label ??
                  task.type;

                return (
                  <button
                    key={task.id}
                    type="button"
                    className="w-full text-left rounded-md border px-3 py-2.5 hover:bg-accent/50 transition-colors"
                    onClick={() => handleSelect(task)}
                  >
                    <p className="text-sm font-medium truncate">{task.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {statusLabel}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {typeLabel}
                      </Badge>
                      {task.checklist.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {task.checklist.length} items
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {hiddenDoneCount > 0 && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIncludeDone(true)}
              className="text-xs text-muted-foreground"
            >
              Show {hiddenDoneCount} completed task
              {hiddenDoneCount === 1 ? "" : "s"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
