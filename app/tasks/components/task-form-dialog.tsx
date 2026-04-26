"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import type {
  Task,
  NewTask,
  TaskStatus,
  TaskType,
  ChecklistItem,
} from "@/lib/task-types";
import { TASK_STATUS_OPTIONS, TASK_TYPE_OPTIONS } from "@/lib/task-types";
import {
  DEFAULT_TASK_TEMPLATE_ID,
  getTaskTemplateValues,
  TASK_TEMPLATE_OPTIONS,
  type TaskTemplateId,
} from "@/lib/task-templates";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: NewTask) => void;
  initialData?: Task;
  title: string;
}

function createEmptyItem(): ChecklistItem {
  return { id: crypto.randomUUID(), name: "", completed: false };
}

export function TaskFormDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
  title,
}: TaskFormDialogProps) {
  const isEditing = Boolean(initialData);
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [status, setStatus] = useState<TaskStatus>(
    initialData?.status ?? "todo"
  );
  const [type, setType] = useState<TaskType>(initialData?.type ?? "personal");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    initialData?.checklist ?? []
  );
  const [templateId, setTemplateId] = useState<TaskTemplateId>(
    DEFAULT_TASK_TEMPLATE_ID
  );

  const resetForm = () => {
    setName(initialData?.name ?? "");
    setDescription(initialData?.description ?? "");
    setStatus(initialData?.status ?? "todo");
    setType(initialData?.type ?? "personal");
    setChecklist(initialData?.checklist ?? []);
    setTemplateId(DEFAULT_TASK_TEMPLATE_ID);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const filtered = checklist.filter((item) => item.name.trim() !== "");
    onSave({ name: name.trim(), description, status, type, checklist: filtered });
    resetForm();
    onOpenChange(false);
  };

  const handleTemplateChange = (value: string) => {
    const nextTemplateId = value as TaskTemplateId;
    const templateValues = getTaskTemplateValues(nextTemplateId);

    setTemplateId(nextTemplateId);
    setDescription(templateValues.description);
    setStatus(templateValues.status);
    setType(templateValues.type);
    setChecklist(templateValues.checklist);
  };

  const handleAddChecklistItem = () => {
    setChecklist((prev) => [...prev, createEmptyItem()]);
  };

  const handleUpdateChecklistItem = (id: string, value: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: value } : item))
    );
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleChecklistKeyDown = (
    e: React.KeyboardEvent,
    index: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index === checklist.length - 1) {
        handleAddChecklistItem();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[min(85vh,42rem)] flex-col overflow-hidden p-0 gap-0 sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Fill in the details for your task.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="scrollbar-themed min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-4 pr-1">
              {!isEditing && (
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select value={templateId} onValueChange={handleTemplateChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_TEMPLATE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="task-name">Name</Label>
                <Input
                  id="task-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Task name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as TaskStatus)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as TaskType)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Checklist</Label>
                <div className="space-y-2">
                  {checklist.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Input
                        value={item.name}
                        onChange={(e) =>
                          handleUpdateChecklistItem(item.id, e.target.value)
                        }
                        onKeyDown={(e) => handleChecklistKeyDown(e, index)}
                        placeholder={`Item ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddChecklistItem}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4" />
                    Add item
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Close
            </Button>
            <Button
              type="submit"
              disabled={!name.trim()}
              className="active:scale-[0.97] ease-out will-change-transform motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
