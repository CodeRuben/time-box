"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
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
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable, getDraggableProps } from "@/lib/use-drag-drop";
import type { TopPriority, SubTask } from "@/lib/use-planner-storage";

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
  // Inline editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(priority.name);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editSubtaskName, setEditSubtaskName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  // Calculate completion status
  const completedCount = priority.subtasks.filter((s) => s.completed).length;
  const totalCount = priority.subtasks.length;
  // If no subtasks, use the priority's own completed status
  // If subtasks exist, completion is based on all subtasks being complete
  const isComplete = totalCount === 0 ? priority.completed : completedCount === totalCount;

  // Toggle the priority's own completion status (only works when no subtasks)
  const handleToggleCompletion = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalCount === 0) {
      onUpdate({ ...priority, completed: !priority.completed });
    } else {
      // If there are subtasks, just expand to show them
      setIsExpanded(!isExpanded);
    }
  };

  // Auto-enter edit mode for new priorities (empty name)
  useEffect(() => {
    if (!hasInitialized.current && priority.name === "") {
      setIsEditingName(true);
      hasInitialized.current = true;
    }
  }, [priority.name]);

  // Focus name input when entering edit mode
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Focus subtask input when editing a subtask
  useEffect(() => {
    if (editingSubtaskId && subtaskInputRef.current) {
      subtaskInputRef.current.focus();
      subtaskInputRef.current.select();
    }
  }, [editingSubtaskId]);

  // Sync edit name with prop when not editing
  useEffect(() => {
    if (!isEditingName) {
      setEditName(priority.name);
    }
  }, [priority.name, isEditingName]);

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = priority.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    onUpdate({ ...priority, subtasks: updatedSubtasks });
  };

  // Name editing handlers
  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(priority.name);
    setIsEditingName(true);
  };

  const handleNameBlur = () => {
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== priority.name) {
      onUpdate({ ...priority, name: trimmedName });
    } else if (!trimmedName && priority.name === "") {
      // If the name is still empty, keep it but exit edit mode
      // The card will show "Untitled Priority"
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

  // Subtask editing handlers
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
          s.id === editingSubtaskId ? { ...s, name: trimmedName } : s
        );
        onUpdate({ ...priority, subtasks: updatedSubtasks });
      } else {
        // Remove subtask if name is empty
        const updatedSubtasks = priority.subtasks.filter(
          (s) => s.id !== editingSubtaskId
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
    // Start editing the new subtask
    setEditingSubtaskId(newSubtask.id);
    setEditSubtaskName("");
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = priority.subtasks.filter((s) => s.id !== subtaskId);
    onUpdate({ ...priority, subtasks: updatedSubtasks });
  };

  // Drag functionality for priority
  const priorityDragProps = useDraggable(priority.name, !isEditingName);

  // Handle header click to expand/collapse
  const handleHeaderClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="py-0 gap-0 overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {/* Compact Header - entire area is clickable */}
        <div
          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent/30 transition-colors"
          onClick={handleHeaderClick}
        >
          {/* Drag Handle for Priority */}
          <div
            {...priorityDragProps}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "shrink-0 cursor-grab active:cursor-grabbing",
              !priorityDragProps.draggable && "opacity-30 cursor-not-allowed"
            )}
            title={priority.name ? "Drag to schedule" : "Add a name first"}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Status Indicator */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleToggleCompletion}
            aria-label={isComplete ? "Completed" : "In progress"}
          >
            {isComplete ? (
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>

          {/* Priority Name Area */}
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
                  isComplete && "line-through opacity-60"
                )}
              >
                {priority.name || "Untitled Priority"}
              </span>
            )}
          </div>

          {/* Completion Counter */}
          {totalCount > 0 && !isEditingName && (
            <span
              className={cn(
                "text-xs font-medium shrink-0 tabular-nums",
                isComplete
                  ? "text-green-600 dark:text-green-400"
                  : "text-muted-foreground"
              )}
            >
              {completedCount}/{totalCount}
            </span>
          )}

          {/* Ellipsis Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
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

        {/* Expanded Content */}
        <CollapsibleContent>
          <div className="border-t px-5 py-2 space-y-1">
            {/* Subtasks List */}
            {priority.subtasks.map((subtask) => {
              const subtaskDragProps = getDraggableProps(
                subtask.name,
                editingSubtaskId !== subtask.id
              );
              return (
              <div
                key={subtask.id}
                className="flex items-center gap-2 py-1"
              >
                {/* Drag Handle for Subtask */}
                <div
                  {...subtaskDragProps}
                  className={cn(
                    "shrink-0 cursor-grab active:cursor-grabbing",
                    !subtaskDragProps.draggable && "opacity-30 cursor-not-allowed"
                  )}
                  title={subtask.name ? "Drag to schedule" : "Add a name first"}
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => handleToggleSubtask(subtask.id)}
                  aria-label={
                    subtask.completed
                      ? "Mark as incomplete"
                      : "Mark as complete"
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
                      subtask.completed && "line-through opacity-60"
                    )}
                  >
                    {subtask.name || "Untitled subtask"}
                  </span>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteSubtask(subtask.id)}
                  aria-label="Delete subtask"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
            })}

            {/* Add Subtask Button */}
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
