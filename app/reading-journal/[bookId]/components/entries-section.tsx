"use client";

import { useState } from "react";
import { format } from "date-fns";
import { PenLine, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPagesReadByDate } from "@/lib/reading-progress";
import type { BookEntry } from "@/lib/reading-journal-types";
import type { EntryInput } from "../../hooks/use-book-detail";
import { EntryCard } from "./entry-card";
import { EntryEditorDialog } from "./entry-editor-dialog";

interface EntriesSectionProps {
  entries: BookEntry[];
  latestKnownPage: number | null;
  onSave: (date: string, input: EntryInput) => Promise<void>;
  onDelete: (date: string) => Promise<void>;
}

interface EditorState {
  open: boolean;
  date: string | null;
  allowDateChange: boolean;
}

const CLOSED_EDITOR: EditorState = { open: false, date: null, allowDateChange: false };

export function EntriesSection({
  entries,
  latestKnownPage,
  onSave,
  onDelete,
}: EntriesSectionProps) {
  const [editor, setEditor] = useState<EditorState>(CLOSED_EDITOR);
  const today = format(new Date(), "yyyy-MM-dd");
  const todayEntry = entries.find((entry) => entry.date === today);
  const pagesReadByDate = getPagesReadByDate(entries);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div>
          <h2 className="journal-heading text-xs uppercase tracking-[0.2em]">
            Reflections
          </h2>
          {entries.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditor({ open: true, date: today, allowDateChange: false })}
          >
            <PenLine className="size-3.5" />
            {todayEntry ? "Edit today" : "Write today"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditor({ open: true, date: today, allowDateChange: true })}
          >
            <Plus className="size-3.5" />
            Another day
          </Button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <PenLine className="size-8 text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">No reflections yet</p>
            <p className="text-sm text-muted-foreground">
              Capture what you read and what stood out.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setEditor({ open: true, date: today, allowDateChange: false })}
          >
            Write today&rsquo;s entry
          </Button>
        </div>
      ) : (
        <div className="pt-5">
          {entries.map((entry, index) => (
            <EntryCard
              key={entry.date}
              entry={entry}
              pagesRead={pagesReadByDate.get(entry.date) ?? null}
              isLast={index === entries.length - 1}
              onEdit={() =>
                setEditor({ open: true, date: entry.date, allowDateChange: true })
              }
              onDelete={() => void onDelete(entry.date)}
            />
          ))}
        </div>
      )}

      <EntryEditorDialog
        open={editor.open}
        date={editor.date ?? today}
        allowDateChange={editor.allowDateChange}
        entries={entries}
        latestKnownPage={latestKnownPage}
        onOpenChange={(open) => setEditor(open ? editor : CLOSED_EDITOR)}
        onSave={onSave}
      />
    </section>
  );
}
