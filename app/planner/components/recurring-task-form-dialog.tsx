"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dateKeyToLocalDate, formatDateKey } from "@/lib/date-key";
import type {
  RecurringFocusTaskDto,
  RecurringFocusTaskInput,
  RecurringFocusTaskSchedule,
  Weekday,
} from "@/lib/recurring-focus-tasks/types";
import { DEFAULT_WEEKDAYS } from "@/lib/recurring-focus-tasks/types";
import {
  type FieldKey,
  validateRecurringFocusTaskInput,
} from "@/lib/recurring-focus-tasks/validation";

const WEEKDAY_OPTIONS: { value: Weekday; label: string }[] = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

interface RecurringTaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: RecurringFocusTaskDto | null;
  onSave: (input: RecurringFocusTaskInput) => Promise<void>;
}

interface FormState {
  title: string;
  notes: string;
  enabled: boolean;
  startDate: Date | undefined;
  endDate: Date | undefined;
  schedule: RecurringFocusTaskSchedule;
}

function optionalDateFromKey(dateKey: string | null): Date | undefined {
  return dateKey ? dateKeyToLocalDate(dateKey) : undefined;
}

function defaultWeeklySchedule(): RecurringFocusTaskSchedule {
  return { type: "weekly", weekdays: [...DEFAULT_WEEKDAYS] };
}

function buildDefaultFormState(task?: RecurringFocusTaskDto | null): FormState {
  if (!task) {
    return {
      title: "",
      notes: "",
      enabled: true,
      startDate: undefined,
      endDate: undefined,
      schedule: defaultWeeklySchedule(),
    };
  }

  return {
    title: task.title,
    notes: task.notes,
    enabled: task.enabled,
    startDate: optionalDateFromKey(task.startDate),
    endDate: optionalDateFromKey(task.endDate),
    schedule: task.schedule,
  };
}

function toInput(state: FormState): RecurringFocusTaskInput {
  return {
    title: state.title,
    notes: state.notes,
    enabled: state.enabled,
    startDate: state.startDate ? formatDateKey(state.startDate) : null,
    endDate: state.endDate ? formatDateKey(state.endDate) : null,
    schedule: state.schedule,
  };
}

export function RecurringTaskFormDialog({
  open,
  onOpenChange,
  task,
  onSave,
}: RecurringTaskFormDialogProps) {
  const [form, setForm] = useState<FormState>(buildDefaultFormState());
  const [showValidation, setShowValidation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(buildDefaultFormState(task));
    setShowValidation(false);
    setSubmitError(null);
    setIsSaving(false);
  }, [open, task]);

  const validation = validateRecurringFocusTaskInput(toInput(form));
  const fieldError = (field: FieldKey) =>
    showValidation && !validation.ok && validation.field === field
      ? validation.message
      : undefined;

  const titleError = fieldError("title");
  const dateRangeError = fieldError("dateRange");
  const weekdaysError = fieldError("weekdays");
  const anchorDateError = fieldError("anchorDate");
  const weeksError = fieldError("weeks");

  const toggleWeekday = (day: Weekday, checked: boolean) => {
    setForm((current) => {
      const weekdays = checked
        ? ([...new Set([...current.schedule.weekdays, day])].sort(
            (a, b) => a - b
          ) as Weekday[])
        : current.schedule.weekdays.filter((value) => value !== day);

      return {
        ...current,
        schedule: { ...current.schedule, weekdays },
      };
    });
  };

  const setScheduleType = (type: RecurringFocusTaskSchedule["type"]) => {
    setForm((current) => {
      if (current.schedule.type === type) {
        return current;
      }

      const weekdays = current.schedule.weekdays;
      return {
        ...current,
        schedule:
          type === "weekly"
            ? { type: "weekly", weekdays }
            : {
                type: "active_rest_weeks",
                weekdays,
                anchorDate: formatDateKey(new Date()),
                activeWeeks: 2,
                inactiveWeeks: 2,
              },
      };
    });
  };

  const handleSave = async () => {
    const result = validateRecurringFocusTaskInput(toInput(form));
    if (!result.ok) {
      setShowValidation(true);
      return;
    }

    setIsSaving(true);
    setSubmitError(null);

    try {
      await onSave(result.value);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {task ? "Edit recurring task" : "Create recurring task"}
          </DialogTitle>
          <DialogDescription>
            Schedule a task that is added to today&apos;s focus list when active.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="recurring-task-title">Title</Label>
            <Input
              id="recurring-task-title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Code review"
              autoFocus
              aria-invalid={!!titleError}
            />
            {titleError && (
              <p className="text-sm text-destructive" role="alert">
                {titleError}
              </p>
            )}
            {submitError && (
              <p className="text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="recurring-task-notes">Notes (optional)</Label>
            <Textarea
              id="recurring-task-notes"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              rows={3}
              placeholder="Extra context for yourself"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.enabled}
              onCheckedChange={(checked) =>
                setForm((current) => ({
                  ...current,
                  enabled: checked === true,
                }))
              }
            />
            Enabled
          </label>

          <div className="grid gap-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Start date (optional)</Label>
                <DatePicker
                  date={form.startDate}
                  onSelect={(startDate) =>
                    setForm((current) => ({ ...current, startDate }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>End date (optional)</Label>
                <DatePicker
                  date={form.endDate}
                  onSelect={(endDate) =>
                    setForm((current) => ({ ...current, endDate }))
                  }
                />
              </div>
            </div>
            {dateRangeError && (
              <p className="text-sm text-destructive" role="alert">
                {dateRangeError}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="recurring-schedule-type">Schedule type</Label>
            <Select
              value={form.schedule.type}
              onValueChange={(value) =>
                setScheduleType(value as RecurringFocusTaskSchedule["type"])
              }
            >
              <SelectTrigger id="recurring-schedule-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="active_rest_weeks">Active-rest cycle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Weekdays</Label>
            <div className="flex flex-wrap gap-3">
              {WEEKDAY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={form.schedule.weekdays.includes(option.value)}
                    onCheckedChange={(checked) =>
                      toggleWeekday(option.value, checked === true)
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {weekdaysError && (
              <p className="text-sm text-destructive" role="alert">
                {weekdaysError}
              </p>
            )}
          </div>

          {form.schedule.type === "active_rest_weeks" && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Anchor date</Label>
                <DatePicker
                  date={dateKeyToLocalDate(form.schedule.anchorDate)}
                  onSelect={(date) => {
                    if (!date || form.schedule.type !== "active_rest_weeks") {
                      return;
                    }
                    setForm((current) => ({
                      ...current,
                      schedule: {
                        ...current.schedule,
                        type: "active_rest_weeks",
                        anchorDate: formatDateKey(date),
                      },
                    }));
                  }}
                />
                {anchorDateError && (
                  <p className="text-sm text-destructive" role="alert">
                    {anchorDateError}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="active-weeks">Active weeks</Label>
                    <Input
                      id="active-weeks"
                      type="number"
                      min={1}
                      value={form.schedule.activeWeeks}
                      onChange={(event) =>
                        setForm((current) => {
                          if (current.schedule.type !== "active_rest_weeks") {
                            return current;
                          }
                          return {
                            ...current,
                            schedule: {
                              ...current.schedule,
                              activeWeeks: Number(event.target.value) || 0,
                            },
                          };
                        })
                      }
                      aria-invalid={!!weeksError}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="inactive-weeks">Inactive weeks</Label>
                    <Input
                      id="inactive-weeks"
                      type="number"
                      min={1}
                      value={form.schedule.inactiveWeeks}
                      onChange={(event) =>
                        setForm((current) => {
                          if (current.schedule.type !== "active_rest_weeks") {
                            return current;
                          }
                          return {
                            ...current,
                            schedule: {
                              ...current.schedule,
                              inactiveWeeks: Number(event.target.value) || 0,
                            },
                          };
                        })
                      }
                      aria-invalid={!!weeksError}
                    />
                  </div>
                </div>
                {weeksError && (
                  <p className="text-sm text-destructive" role="alert">
                    {weeksError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="active:scale-[0.97] ease-out will-change-transform motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
