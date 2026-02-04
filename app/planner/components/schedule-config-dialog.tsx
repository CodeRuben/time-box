"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type ScheduleConfig,
  hourToDisplayFormat,
} from "@/lib/use-schedule-config";

interface ScheduleConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ScheduleConfig;
  onSave: (config: ScheduleConfig) => void;
}

// Start time options: 5 AM through 11 AM (hours 5-11)
const START_HOUR_OPTIONS = [5, 6, 7, 8, 9, 10, 11];

// End time options: 12 PM through 11 PM (hours 12-23)
const END_HOUR_OPTIONS = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

export function ScheduleConfigDialog({
  open,
  onOpenChange,
  config,
  onSave,
}: ScheduleConfigDialogProps) {
  const [startHour, setStartHour] = useState(config.startHour);
  const [endHour, setEndHour] = useState(config.endHour);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setStartHour(config.startHour);
      setEndHour(config.endHour);
    }
  }, [open, config]);

  const handleSave = () => {
    onSave({ startHour, endHour });
    onOpenChange(false);
  };

  const handleCancel = () => {
    setStartHour(config.startHour);
    setEndHour(config.endHour);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Settings</DialogTitle>
          <DialogDescription>
            Configure the visible time range for your hourly schedule. This
            setting applies to all days.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="start-time">Start Time</Label>
            <Select
              value={startHour.toString()}
              onValueChange={(value) => setStartHour(parseInt(value, 10))}
            >
              <SelectTrigger id="start-time" className="w-full">
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent position="popper">
                {START_HOUR_OPTIONS.map((hour) => (
                  <SelectItem key={hour} value={hour.toString()}>
                    {hourToDisplayFormat(hour)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="end-time">End Time</Label>
            <Select
              value={endHour.toString()}
              onValueChange={(value) => setEndHour(parseInt(value, 10))}
            >
              <SelectTrigger id="end-time" className="w-full">
                <SelectValue placeholder="Select end time" />
              </SelectTrigger>
              <SelectContent position="popper">
                {END_HOUR_OPTIONS.map((hour) => (
                  <SelectItem key={hour} value={hour.toString()}>
                    {hourToDisplayFormat(hour)}
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
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
