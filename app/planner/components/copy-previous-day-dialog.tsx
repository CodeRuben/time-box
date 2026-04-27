"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { CopyPreviousDayOptions } from "@/lib/use-planner-storage";

interface CopyPreviousDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopy: (options: CopyPreviousDayOptions, sourceDate: Date) => Promise<void>;
  initialSourceDate?: Date;
  isCopying: boolean;
  error?: string | null;
}

const DEFAULT_OPTIONS: CopyPreviousDayOptions = {
  includeTopPriorities: true,
  includeHourlySchedule: false,
  includeBrainDump: false,
  onlyUnfinished: true,
  mode: "merge",
};

export function CopyPreviousDayDialog({
  open,
  onOpenChange,
  onCopy,
  initialSourceDate,
  isCopying,
  error,
}: CopyPreviousDayDialogProps) {
  const [options, setOptions] =
    useState<CopyPreviousDayOptions>(DEFAULT_OPTIONS);
  const [sourceDate, setSourceDate] = useState<Date | undefined>(
    initialSourceDate
  );

  const hasSelectedSection =
    options.includeTopPriorities ||
    options.includeHourlySchedule ||
    options.includeBrainDump;

  const updateOption = <Key extends keyof CopyPreviousDayOptions>(
    key: Key,
    value: CopyPreviousDayOptions[Key]
  ) => {
    setOptions((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Copy Planner Items</DialogTitle>
          <DialogDescription>
            Choose a source day and bring its planning items into the selected
            day.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Copy from</p>
            <DatePicker
              date={sourceDate}
              onSelect={setSourceDate}
              placeholder="Select a source day"
              className="w-full sm:w-64"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">What should be copied?</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <Label className="items-start gap-3 rounded-md border bg-card p-3 cursor-pointer transition-colors hover:bg-accent/40 dark:border-muted-foreground/30 dark:bg-muted/20 dark:hover:bg-muted/30">
                <Checkbox
                  checked={options.includeTopPriorities}
                  onCheckedChange={(checked) =>
                    updateOption("includeTopPriorities", checked === true)
                  }
                />
                <span className="grid gap-1">
                  <span>Top priorities</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Up to three priorities and subtasks.
                  </span>
                </span>
              </Label>
              <Label className="items-start gap-3 rounded-md border bg-card p-3 cursor-pointer transition-colors hover:bg-accent/40 dark:border-muted-foreground/30 dark:bg-muted/20 dark:hover:bg-muted/30">
                <Checkbox
                  checked={options.includeHourlySchedule}
                  onCheckedChange={(checked) =>
                    updateOption("includeHourlySchedule", checked === true)
                  }
                />
                <span className="grid gap-1">
                  <span>Hourly schedule</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Items inside each time slot.
                  </span>
                </span>
              </Label>
              <Label className="items-start gap-3 rounded-md border bg-card p-3 cursor-pointer transition-colors hover:bg-accent/40 dark:border-muted-foreground/30 dark:bg-muted/20 dark:hover:bg-muted/30">
                <Checkbox
                  checked={options.includeBrainDump}
                  onCheckedChange={(checked) =>
                    updateOption("includeBrainDump", checked === true)
                  }
                />
                <span className="grid gap-1">
                  <span>Brain dump</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Yesterday&apos;s notes.
                  </span>
                </span>
              </Label>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">How should it be applied?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Label className="items-start gap-3 rounded-md border bg-card p-3 cursor-pointer transition-colors hover:bg-accent/40 dark:border-muted-foreground/30 dark:bg-muted/20 dark:hover:bg-muted/30">
                <input
                  type="radio"
                  name="copy-mode"
                  checked={options.mode === "merge"}
                  onChange={() => updateOption("mode", "merge")}
                  className="mt-0.5"
                />
                <span className="grid gap-1">
                  <span>Merge with current day</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Adds copied items without clearing what is already here.
                  </span>
                </span>
              </Label>
              <Label className="items-start gap-3 rounded-md border bg-card p-3 cursor-pointer transition-colors hover:bg-accent/40 dark:border-muted-foreground/30 dark:bg-muted/20 dark:hover:bg-muted/30">
                <input
                  type="radio"
                  name="copy-mode"
                  checked={options.mode === "replace"}
                  onChange={() => updateOption("mode", "replace")}
                  className="mt-0.5"
                />
                <span className="grid gap-1">
                  <span>Replace selected sections</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Clears the selected sections before copying yesterday.
                  </span>
                </span>
              </Label>
            </div>
          </div>

          <Label className="items-center gap-3 rounded-md border bg-card p-3 cursor-pointer transition-colors hover:bg-accent/40 dark:border-muted-foreground/30 dark:bg-muted/20 dark:hover:bg-muted/30">
            <Checkbox
              checked={options.onlyUnfinished}
              onCheckedChange={(checked) =>
                updateOption("onlyUnfinished", checked === true)
              }
            />
            <span className="grid gap-0.5">
              <span>Only copy unfinished items</span>
              <span className="text-xs font-normal text-muted-foreground">
                Completed priorities and completed schedule items are skipped.
              </span>
            </span>
          </Label>

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCopying}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (sourceDate) {
                void onCopy(options, sourceDate);
              }
            }}
            disabled={!sourceDate || !hasSelectedSection || isCopying}
            className="active:scale-[0.97] ease-out will-change-transform motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {isCopying ? "Copying..." : "Copy Items"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
