"use client";

import { Button } from "@/components/ui/button";
import { ListPlus, Plus } from "lucide-react";
import { PriorityCard } from "./priority-card";
import { AddFromWorkingNotesMenu } from "./add-from-working-notes-menu";
import type { BrainDumpPriorityCandidate } from "@/lib/parse-brain-dump-priorities";
import {
  MAX_TOP_PRIORITIES,
  type TopPriority,
} from "@/lib/use-planner-storage";

interface TopPrioritiesProps {
  priorities: TopPriority[];
  workingNotesCandidates: BrainDumpPriorityCandidate[];
  onAddPriority: () => void;
  onAddFromWorkingNotes: (candidate: BrainDumpPriorityCandidate) => void;
  onUpdatePriority: (priority: TopPriority) => void;
  onDeletePriority: (id: string) => void;
}

export function TopPriorities({
  priorities,
  workingNotesCandidates,
  onAddPriority,
  onAddFromWorkingNotes,
  onUpdatePriority,
  onDeletePriority,
}: TopPrioritiesProps) {
  const canAddMore = priorities.length < MAX_TOP_PRIORITIES;
  const existingPriorityNames = priorities.map((priority) => priority.name);

  const renderAddFromWorkingNotesButton = (label?: string) => (
    <AddFromWorkingNotesMenu
      candidates={workingNotesCandidates}
      existingPriorityNames={existingPriorityNames}
      canAddMore={canAddMore}
      onAdd={onAddFromWorkingNotes}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={label ? undefined : "px-2.5"}
        aria-label="Add priority from working notes"
      >
        <ListPlus className="h-4 w-4" />
        {label}
      </Button>
    </AddFromWorkingNotesMenu>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Top Priorities
        </h2>

        {priorities.length > 0 && canAddMore && (
          <div className="flex items-center gap-2">
            {renderAddFromWorkingNotesButton()}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddPriority}
              className="px-2.5"
              aria-label="Add blank priority"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {priorities.length === 0 ? (
          <div className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg py-6 px-4 text-center text-muted-foreground bg-card">
            <p className="text-sm font-medium">No priorities yet</p>
            <p className="text-xs mb-3">
              Up to {MAX_TOP_PRIORITIES} top priorities for today
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {renderAddFromWorkingNotesButton("Add from notes")}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddPriority}
                className="active:scale-[0.97] ease-out will-change-transform motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                <Plus className="h-4 w-4" />
                New priority
              </Button>
            </div>
          </div>
        ) : (
          priorities.map((priority) => (
            <PriorityCard
              key={priority.id}
              priority={priority}
              onUpdate={onUpdatePriority}
              onDelete={onDeletePriority}
            />
          ))
        )}
      </div>
    </div>
  );
}
