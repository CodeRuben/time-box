"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  Clock,
  MoreVertical,
  Trash2,
  Plus,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TopPriority, SubTask } from "@/lib/use-planner-storage";

const priorityCollapsibleAnimation =
  "overflow-hidden data-[state=open]:animate-[priority-collapsible-down_160ms_ease-out] data-[state=closed]:animate-[priority-collapsible-up_120ms_ease-out] motion-reduce:animate-none";

interface PriorityCardProps {
  priority: TopPriority;
  onUpdate: (priority: TopPriority) => void;
  onDelete: (id: string) => void;
}

export function PriorityCard({
  priority,
  onUpdate,
  onDelete,
}: PriorityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(priority.name === "");
  const [editName, setEditName] = useState(priority.name);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editSubtaskName, setEditSubtaskName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  const displayTotal = priority.subtasks.length;
  const displayCompleted = priority.subtasks.filter((s) => s.completed).length;

  const isComplete =
    displayTotal === 0
      ? priority.completed
      : displayCompleted === displayTotal;

  const handleToggleCompletion = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayTotal === 0) {
      onUpdate({ ...priority, completed: !priority.completed });
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (editingSubtaskId && subtaskInputRef.current) {
      subtaskInputRef.current.focus();
      subtaskInputRef.current.select();
    }
  }, [editingSubtaskId]);

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = priority.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s,
    );
    onUpdate({ ...priority, subtasks: updatedSubtasks });
  };

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(priority.name);
    setIsEditingName(true);
  };

  const handleNameBlur = () => {
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== priority.name) {
      onUpdate({ ...priority, name: trimmedName });
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNameBlur();
    } else if (e.key === "Escape") {
      setEditName(priority.name);
      setIsEditingName(false);
    }
  };

  const handleSubtaskClick = (subtask: SubTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubtaskId(subtask.id);
    setEditSubtaskName(subtask.name);
  };

  const handleSubtaskBlur = () => {
    if (editingSubtaskId) {
      const trimmedName = editSubtaskName.trim();
      if (trimmedName) {
        const updatedSubtasks = priority.subtasks.map((s) =>
          s.id === editingSubtaskId ? { ...s, name: trimmedName } : s,
        );
        onUpdate({ ...priority, subtasks: updatedSubtasks });
      } else {
        const updatedSubtasks = priority.subtasks.filter(
          (s) => s.id !== editingSubtaskId,
        );
        onUpdate({ ...priority, subtasks: updatedSubtasks });
      }
    }
    setEditingSubtaskId(null);
    setEditSubtaskName("");
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubtaskBlur();
    } else if (e.key === "Escape") {
      setEditingSubtaskId(null);
      setEditSubtaskName("");
    }
  };

  const handleAddSubtask = () => {
    const newSubtask: SubTask = {
      id: crypto.randomUUID(),
      name: "",
      completed: false,
    };
    onUpdate({ ...priority, subtasks: [...priority.subtasks, newSubtask] });
    setEditingSubtaskId(newSubtask.id);
    setEditSubtaskName("");
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = priority.subtasks.filter((s) => s.id !== subtaskId);
    onUpdate({ ...priority, subtasks: updatedSubtasks });
  };

  const handleHeaderClick = () => {
    if (displayTotal === 0) return;
    setIsExpanded(!isExpanded);
  };

  const statusIcon = (
    <span className="relative flex h-4 w-4 items-center justify-center">
      <Check
        className={cn(
          "absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-green-600 transition-[opacity,filter,scale] duration-100 ease-out will-change-[opacity,filter,scale] motion-reduce:transition-none motion-reduce:blur-none dark:text-green-400",
          isComplete ? "scale-100 opacity-100 blur-none" : "scale-0 opacity-0 blur-[2px]",
        )}
      />
      <Clock
        className={cn(
          "absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-muted-foreground transition-[opacity,filter,scale] duration-100 ease-out will-change-[opacity,filter,scale] motion-reduce:transition-none motion-reduce:blur-none",
          isComplete ? "scale-0 opacity-0 blur-[2px]" : "scale-100 opacity-100 blur-none",
        )}
      />
    </span>
  );

  return (
    <Card className="animate-in fade-in-0 slide-in-from-top-1 duration-200 ease-out-cubic py-0 gap-0 overflow-hidden motion-reduce:animate-none">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 transition-colors",
            displayTotal > 0 && "cursor-pointer hover:bg-accent/30",
          )}
          onClick={handleHeaderClick}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 active:scale-[0.97] transition-transform ease-out will-change-transform hover:bg-transparent hover:text-current motion-reduce:transition-none motion-reduce:active:scale-100"
            onClick={handleToggleCompletion}
            aria-label={isComplete ? "Completed" : "In progress"}
          >
            {statusIcon}
          </Button>

          <div className="flex-1 flex items-center gap-2 text-left min-w-0">
            {isEditingName ? (
              <Input
                ref={nameInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onBlur={handleNameBlur}
                onClick={(e) => e.stopPropagation()}
                className="h-7 text-sm"
                placeholder="Priority name"
              />
            ) : (
              <span
                onClick={handleNameClick}
                className={cn(
                  "text-sm font-medium truncate cursor-text hover:bg-accent rounded px-1 -mx-1",
                  isComplete && "opacity-60",
                )}
              >
                {priority.name || "Untitled Priority"}
              </span>
            )}
          </div>

          {displayTotal > 0 && !isEditingName && (
            <>
              <span
                className={cn(
                  "text-xs font-medium shrink-0 tabular-nums",
                  isComplete
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground",
                )}
              >
                {displayCompleted}/{displayTotal}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  isExpanded ? "rotate-180" : "rotate-0",
                )}
                aria-hidden="true"
              />
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={(e) => e.stopPropagation()}
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(priority.id)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CollapsibleContent className={priorityCollapsibleAnimation}>
          <div className="border-t px-5 py-2 space-y-1">
            {priority.subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="animate-in fade-in-0 slide-in-from-top-1 flex items-center gap-2 py-1 duration-150 ease-out-cubic motion-reduce:animate-none"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleToggleSubtask(subtask.id)}
                  aria-label={
                    subtask.completed ? "Mark as incomplete" : "Mark as complete"
                  }
                >
                  {subtask.completed ? (
                    <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>

                {editingSubtaskId === subtask.id ? (
                  <Input
                    ref={subtaskInputRef}
                    value={editSubtaskName}
                    onChange={(e) => setEditSubtaskName(e.target.value)}
                    onKeyDown={handleSubtaskKeyDown}
                    onBlur={handleSubtaskBlur}
                    className="h-7 text-sm flex-1"
                    placeholder="Subtask name"
                  />
                ) : (
                  <span
                    onClick={(e) => handleSubtaskClick(subtask, e)}
                    className={cn(
                      "text-sm flex-1 cursor-text hover:bg-accent rounded px-1 -mx-1",
                      subtask.completed && "line-through opacity-60",
                    )}
                  >
                    {subtask.name || "Untitled subtask"}
                  </span>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteSubtask(subtask.id)}
                  aria-label="Delete subtask"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddSubtask}
              className="w-full justify-center text-muted-foreground mt-1"
            >
              <Plus className="h-4 w-4" />
              Add subtask
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
