"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatBrainDumpSubtaskPreview,
  isPriorityNameTaken,
  type BrainDumpPriorityCandidate,
} from "@/lib/parse-brain-dump-priorities";

export function getAvailableWorkingNotesForPriorities(
  candidates: ReadonlyArray<BrainDumpPriorityCandidate>,
  existingPriorityNames: ReadonlyArray<string>
): BrainDumpPriorityCandidate[] {
  return candidates.filter(
    (candidate) => !isPriorityNameTaken(candidate.name, existingPriorityNames)
  );
}

interface AddFromWorkingNotesMenuProps {
  candidates: BrainDumpPriorityCandidate[];
  existingPriorityNames: string[];
  canAddMore: boolean;
  onAdd: (candidate: BrainDumpPriorityCandidate) => void;
  children: ReactNode;
}

export function AddFromWorkingNotesMenu({
  candidates,
  existingPriorityNames,
  canAddMore,
  onAdd,
  children,
}: AddFromWorkingNotesMenuProps) {
  const available = getAvailableWorkingNotesForPriorities(
    candidates,
    existingPriorityNames
  );
  const hasOptions = canAddMore && available.length > 0;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasOptions) {
      setOpen(false);
    }
  }, [hasOptions]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={!hasOptions}>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
        <DropdownMenuLabel>Working notes</DropdownMenuLabel>
        {available.map((candidate) => {
          const subtaskPreview = formatBrainDumpSubtaskPreview(
            candidate.subtasks
          );

          return (
            <DropdownMenuItem
              key={candidate.name}
              title={candidate.name}
              className="min-w-0"
              onSelect={(event) => {
                event.preventDefault();
                onAdd(candidate);
              }}
            >
              <span className="flex min-w-0 flex-1 flex-col items-stretch gap-0.5 overflow-hidden">
                <span className="truncate">{candidate.name}</span>
                {subtaskPreview ? (
                  <span
                    className="truncate text-xs text-muted-foreground"
                    title={subtaskPreview}
                  >
                    {subtaskPreview}
                  </span>
                ) : null}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
