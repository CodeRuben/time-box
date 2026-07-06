"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BookEntry } from "@/lib/reading-journal-types";
import type { EntryInput } from "../../hooks/use-book-detail";

interface EntryEditorDialogProps {
  open: boolean;
  date: string;
  allowDateChange: boolean;
  entries: BookEntry[];
  latestKnownPage: number | null;
  onOpenChange: (open: boolean) => void;
  onSave: (date: string, input: EntryInput) => Promise<void>;
}

const RULED_TEXTAREA_CLASSNAME =
  "min-h-24 border-border bg-background text-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-ring dark:border-border dark:bg-input/30";

function entryForDate(entries: BookEntry[], date: string): BookEntry | undefined {
  return entries.find((entry) => entry.date === date);
}

export function EntryEditorDialog({
  open,
  date,
  allowDateChange,
  entries,
  latestKnownPage,
  onOpenChange,
  onSave,
}: EntryEditorDialogProps) {
  const [selectedDate, setSelectedDate] = useState(date);
  const [currentPage, setCurrentPage] = useState("");
  const [summary, setSummary] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [thoughts, setThoughts] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const existing = entryForDate(entries, date);
    setSelectedDate(date);
    setCurrentPage(existing?.currentPage != null ? String(existing.currentPage) : "");
    setSummary(existing?.summary ?? "");
    setAnalysis(existing?.analysis ?? "");
    setThoughts(existing?.thoughts ?? "");
    // Only re-prefill when the dialog opens or the initiating date changes —
    // subsequent field edits shouldn't be clobbered by this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, date]);

  const handleDateChange = (nextDate: Date | undefined) => {
    if (!nextDate) return;
    const dateStr = format(nextDate, "yyyy-MM-dd");
    const existing = entryForDate(entries, dateStr);
    setSelectedDate(dateStr);
    setCurrentPage(existing?.currentPage != null ? String(existing.currentPage) : "");
    setSummary(existing?.summary ?? "");
    setAnalysis(existing?.analysis ?? "");
    setThoughts(existing?.thoughts ?? "");
  };

  const existingEntry = entryForDate(entries, selectedDate);
  const isAllEmpty =
    !currentPage.trim() && !summary.trim() && !analysis.trim() && !thoughts.trim();
  const disableSave = isSaving || (isAllEmpty && !existingEntry);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (disableSave) return;

    setIsSaving(true);
    try {
      await onSave(selectedDate, {
        currentPage: currentPage.trim() ? Number.parseInt(currentPage, 10) : null,
        summary,
        analysis,
        thoughts,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="journal-theme-vars flex max-h-[min(85vh,42rem)] flex-col overflow-hidden p-0 gap-0 sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>
              {existingEntry ? "Edit entry" : "New entry"}
            </DialogTitle>
            <DialogDescription>
              What did you read, and what do you make of it?
            </DialogDescription>
          </DialogHeader>

          <div className="scrollbar-themed min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  {allowDateChange ? (
                    <DatePicker
                      date={new Date(`${selectedDate}T00:00:00`)}
                      onSelect={handleDateChange}
                      disabled={{ after: new Date() }}
                    />
                  ) : (
                    <p className="flex h-9 items-center text-sm text-(color:--journal-ink)">
                      {format(new Date(`${selectedDate}T00:00:00`), "EEEE, MMMM d")}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entry-current-page">Current page</Label>
                  <Input
                    id="entry-current-page"
                    type="number"
                    min={0}
                    value={currentPage}
                    onChange={(event) => setCurrentPage(event.target.value)}
                    placeholder={
                      latestKnownPage !== null ? `last: ${latestKnownPage}` : "e.g. 143"
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entry-summary">Summary</Label>
                <p className="text-xs text-(color:--journal-muted-ink)">
                  What did you read?
                </p>
                <Textarea
                  id="entry-summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  className={RULED_TEXTAREA_CLASSNAME}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entry-analysis">Analysis</Label>
                <p className="text-xs text-(color:--journal-muted-ink)">
                  How does it tie into what came before — and where might it be
                  going?
                </p>
                <Textarea
                  id="entry-analysis"
                  value={analysis}
                  onChange={(event) => setAnalysis(event.target.value)}
                  className={RULED_TEXTAREA_CLASSNAME}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entry-thoughts">Thoughts</Label>
                <p className="text-xs text-(color:--journal-muted-ink)">
                  Anything else on your mind.
                </p>
                <Textarea
                  id="entry-thoughts"
                  value={thoughts}
                  onChange={(event) => setThoughts(event.target.value)}
                  className={RULED_TEXTAREA_CLASSNAME}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={disableSave}
              className="transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              Save entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
