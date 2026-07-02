"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getFocusItemSourceKey,
  type FocusItemSource,
} from "@/lib/focus-item-source";
import type { BrainDumpPriorityCandidate } from "@/lib/parse-brain-dump-priorities";
import type { TopPriority } from "@/lib/use-planner-storage";

interface FocusAddOptionsInput {
  priorities: TopPriority[];
  brainDumpCandidates: BrainDumpPriorityCandidate[];
  existingSourceKeys: Set<string>;
}

export function getFocusAddOptions({
  priorities,
  brainDumpCandidates,
  existingSourceKeys,
}: FocusAddOptionsInput) {
  const availablePriorities = priorities.filter(
    (priority) =>
      priority.name.trim() &&
      !existingSourceKeys.has(
        getFocusItemSourceKey({
          type: "priority",
          priorityId: priority.id,
          label: priority.name,
        })
      )
  );
  const availableBrainDump = brainDumpCandidates.filter(
    (candidate) =>
      !existingSourceKeys.has(
        getFocusItemSourceKey({
          type: "brain_dump",
          text: candidate.name,
        })
      )
  );

  const hasOptions =
    availablePriorities.length > 0 || availableBrainDump.length > 0;

  return {
    availablePriorities,
    availableBrainDump,
    hasOptions,
  };
}

interface AddToFocusMenuProps extends FocusAddOptionsInput {
  onAdd: (source: FocusItemSource) => void;
  children: ReactNode;
}

export function AddToFocusMenu({
  priorities,
  brainDumpCandidates,
  existingSourceKeys,
  onAdd,
  children,
}: AddToFocusMenuProps) {
  const { availablePriorities, availableBrainDump, hasOptions } =
    getFocusAddOptions({
      priorities,
      brainDumpCandidates,
      existingSourceKeys,
    });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasOptions) {
      setOpen(false);
    }
  }, [hasOptions]);

  const handleSelect =
    (source: FocusItemSource) => (event: Event) => {
      event.preventDefault();
      onAdd(source);
    };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={!hasOptions}>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64 max-h-80 overflow-y-auto">
        {availablePriorities.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Top priorities</DropdownMenuLabel>
            {availablePriorities.map((priority) => (
              <DropdownMenuItem
                key={priority.id}
                onSelect={handleSelect({
                  type: "priority",
                  priorityId: priority.id,
                  label: priority.name,
                })}
              >
                {priority.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}

        {availableBrainDump.length > 0 && (
          <>
            {availablePriorities.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              <DropdownMenuLabel>Brain dump</DropdownMenuLabel>
              {availableBrainDump.map((candidate) => (
                <DropdownMenuItem
                  key={candidate.name}
                  onSelect={handleSelect({
                    type: "brain_dump",
                    text: candidate.name,
                  })}
                >
                  {candidate.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
