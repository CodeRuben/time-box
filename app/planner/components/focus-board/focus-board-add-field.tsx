"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createCustomFocusItemSource } from "@/lib/focus-item-source";
import type { FocusItemSource } from "@/lib/focus-item-source";
import { AddToFocusMenu } from "../add-to-focus-menu";
import type { BrainDumpPriorityCandidate } from "@/lib/parse-brain-dump-priorities";
import type { TopPriority } from "@/lib/use-planner-storage";

interface FocusBoardAddFieldProps {
  onAdd: (source: FocusItemSource) => void;
  priorities: TopPriority[];
  brainDumpCandidates: BrainDumpPriorityCandidate[];
  existingSourceKeys: Set<string>;
  hasAddOptions: boolean;
}

export function FocusBoardAddField({
  onAdd,
  priorities,
  brainDumpCandidates,
  existingSourceKeys,
  hasAddOptions,
}: FocusBoardAddFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const label = draft.trim();
    if (!label) {
      return;
    }
    onAdd(createCustomFocusItemSource(label));
    setDraft("");
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      setDraft("");
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <div className="flex items-center justify-center gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Add item
        </Button>
        {hasAddOptions ? (
          <AddToFocusMenu
            priorities={priorities}
            brainDumpCandidates={brainDumpCandidates}
            existingSourceKeys={existingSourceKeys}
            onAdd={onAdd}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-foreground dark:border-muted-foreground/70 dark:bg-card dark:hover:bg-muted"
            >
              From notes
            </Button>
          </AddToFocusMenu>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2 rounded-xl border border-input bg-card px-2 py-1.5 dark:bg-input/40"
    >
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Focus item title"
        aria-label="Focus item title"
        autoFocus
        className="h-8 min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      <Button type="submit" variant="secondary" size="sm" className="h-8">
        Add
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 text-foreground dark:border-muted-foreground/70 dark:bg-card dark:hover:bg-muted"
        onClick={() => {
          setDraft("");
          setOpen(false);
        }}
      >
        Cancel
      </Button>
    </form>
  );
}
