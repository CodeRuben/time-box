"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTimeSlotOptions, formatDateKey, type NewReminder } from "@/lib/use-reminder-storage";

interface CreateReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (reminder: NewReminder) => void;
  defaultDate?: Date;
  defaultTimeSlot?: string;
}

export function CreateReminderDialog({
  open,
  onOpenChange,
  onSave,
  defaultDate,
  defaultTimeSlot,
}: CreateReminderDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(defaultDate);
  const [timeSlot, setTimeSlot] = useState<string>(defaultTimeSlot || "");

  const timeSlotOptions = getTimeSlotOptions();

  const handleSave = () => {
    if (!title.trim() || !date || !timeSlot) return;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      date: formatDateKey(date),
      timeSlot,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setDate(defaultDate);
    setTimeSlot(defaultTimeSlot || "");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
    setDate(defaultDate);
    setTimeSlot(defaultTimeSlot || "");
    onOpenChange(false);
  };

  const isValid = title.trim() && date && timeSlot;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Reminder</DialogTitle>
          <DialogDescription>
            Add a reminder to your schedule. It will appear in the selected time slot.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reminder-title">Title</Label>
            <Input
              id="reminder-title"
              placeholder="Enter reminder title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reminder-description">Description (optional)</Label>
            <Textarea
              id="reminder-description"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label>Date</Label>
            <DatePicker date={date} onSelect={setDate} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reminder-time">Time</Label>
            <Select value={timeSlot} onValueChange={setTimeSlot}>
              <SelectTrigger id="reminder-time" className="w-full">
                <SelectValue placeholder="Select a time slot" />
              </SelectTrigger>
              <SelectContent position="popper" className="!max-h-60">
                {timeSlotOptions.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save Reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
