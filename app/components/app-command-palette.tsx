"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ListPlus, Star } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { getFocusItemSourceKey } from "@/lib/focus-item-source";
import {
  formatBrainDumpSubtaskPreview,
  isPriorityNameTaken,
  type BrainDumpPriorityCandidate,
} from "@/lib/parse-brain-dump-priorities";

export type CommandPaletteView = "root" | "add-to-focus" | "add-to-priority";

export interface PlannerCommandAction {
  id: string;
  label: string;
  keywords?: string[];
  disabled?: boolean;
  icon?: ReactNode;
  onSelect: () => void;
}

interface AppCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startView?: CommandPaletteView;
  brainDumpCandidates?: BrainDumpPriorityCandidate[];
  existingFocusSourceKeys?: Set<string>;
  existingPriorityNames?: string[];
  canAddTopPriority?: boolean;
  onAddToFocusFromBrainDump?: (candidate: BrainDumpPriorityCandidate) => void;
  onAddToTopPriorityFromBrainDump?: (
    candidate: BrainDumpPriorityCandidate
  ) => void;
}

function isBrainDumpItemInFocusList(
  name: string,
  existingFocusSourceKeys: Set<string>
): boolean {
  return existingFocusSourceKeys.has(
    getFocusItemSourceKey({ type: "brain_dump", text: name })
  );
}

function BrainDumpCandidateList({
  candidates,
  heading,
  emptyMessage,
  onSelect,
}: {
  candidates: BrainDumpPriorityCandidate[];
  heading: string;
  emptyMessage: string;
  onSelect: (candidate: BrainDumpPriorityCandidate) => void;
}) {
  if (candidates.length === 0) {
    return <CommandEmpty>{emptyMessage}</CommandEmpty>;
  }

  return (
    <CommandGroup heading={heading}>
      {candidates.map((candidate) => {
        const subtaskPreview = formatBrainDumpSubtaskPreview(candidate.subtasks);

        return (
          <CommandItem
            key={candidate.name}
            value={`${candidate.name} ${candidate.subtasks.join(" ")}`}
            onSelect={() => onSelect(candidate)}
          >
            <ListPlus />
            <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
              <span>{candidate.name}</span>
              {subtaskPreview ? (
                <span className="text-xs text-muted-foreground truncate">
                  {subtaskPreview}
                </span>
              ) : null}
            </span>
            {candidate.subtasks.length > 0 ? (
              <CommandShortcut>
                {candidate.subtasks.length} subtask
                {candidate.subtasks.length === 1 ? "" : "s"}
              </CommandShortcut>
            ) : null}
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

export function AppCommandPalette({
  open,
  onOpenChange,
  startView = "root",
  brainDumpCandidates = [],
  existingFocusSourceKeys = new Set(),
  existingPriorityNames = [],
  canAddTopPriority = true,
  onAddToFocusFromBrainDump,
  onAddToTopPriorityFromBrainDump,
}: AppCommandPaletteProps) {
  const [view, setView] = useState<CommandPaletteView>("root");

  useEffect(() => {
    if (open) {
      setView(startView);
    }
  }, [open, startView]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setView("root");
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const handleSelectBrainDumpForFocus = (
    candidate: BrainDumpPriorityCandidate
  ) => {
    if (!onAddToFocusFromBrainDump) {
      return;
    }

    if (isBrainDumpItemInFocusList(candidate.name, existingFocusSourceKeys)) {
      return;
    }

    onAddToFocusFromBrainDump(candidate);
  };

  const handleSelectBrainDumpForPriority = (
    candidate: BrainDumpPriorityCandidate
  ) => {
    if (!onAddToTopPriorityFromBrainDump || !canAddTopPriority) {
      return;
    }

    if (isPriorityNameTaken(candidate.name, existingPriorityNames)) {
      return;
    }

    onAddToTopPriorityFromBrainDump(candidate);
  };

  const availableFocusCandidates = useMemo(
    () =>
      brainDumpCandidates.filter(
        (candidate) =>
          !isBrainDumpItemInFocusList(candidate.name, existingFocusSourceKeys)
      ),
    [brainDumpCandidates, existingFocusSourceKeys]
  );

  const availablePriorityCandidates = useMemo(
    () =>
      brainDumpCandidates.filter(
        (candidate) =>
          !isPriorityNameTaken(candidate.name, existingPriorityNames)
      ),
    [brainDumpCandidates, existingPriorityNames]
  );

  const canAddFromBrainDump =
    availableFocusCandidates.length > 0 &&
    onAddToFocusFromBrainDump !== undefined;
  const canAddToPriorityFromBrainDump =
    availablePriorityCandidates.length > 0 &&
    onAddToTopPriorityFromBrainDump !== undefined;
  const hasRootActions = canAddFromBrainDump || canAddToPriorityFromBrainDump;

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Command palette"
      description="Run actions on this page"
    >
      {view === "root" ? (
        <>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No actions available.</CommandEmpty>

            {hasRootActions && (
              <CommandGroup heading="Planner">
                {canAddToPriorityFromBrainDump && (
                  <CommandItem
                    value="add brain dump to top priority"
                    keywords={["brain", "dump", "priority", "top", "add"]}
                    disabled={!canAddTopPriority}
                    onSelect={() => setView("add-to-priority")}
                  >
                    <Star />
                    Add to top priority
                  </CommandItem>
                )}

                {canAddFromBrainDump && (
                  <CommandItem
                    value="add brain dump to focus list"
                    keywords={["brain", "dump", "focus", "list", "add"]}
                    onSelect={() => setView("add-to-focus")}
                  >
                    <ListPlus />
                    Add to focus list
                  </CommandItem>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </>
      ) : (
        <>
          <CommandInput placeholder="Search brain dump items..." />
          <CommandList>
            <CommandGroup heading="Brain dump items">
              <CommandItem value="back to commands" onSelect={() => setView("root")}>
                <ArrowLeft />
                Back to commands
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            {view === "add-to-focus" ? (
              <BrainDumpCandidateList
                candidates={availableFocusCandidates}
                heading="Add to focus list"
                emptyMessage="No items left to add."
                onSelect={handleSelectBrainDumpForFocus}
              />
            ) : (
              <BrainDumpCandidateList
                candidates={
                  canAddTopPriority ? availablePriorityCandidates : []
                }
                heading="Add to top priority"
                emptyMessage={
                  canAddTopPriority
                    ? "No items left to add."
                    : "Top priority list is full."
                }
                onSelect={handleSelectBrainDumpForPriority}
              />
            )}
          </CommandList>
        </>
      )}
    </CommandDialog>
  );
}
