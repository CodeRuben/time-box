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
import type { Task } from "@/lib/task-types";

interface FocusAddOptionsInput {
  priorities: TopPriority[];
  tasks: Task[];
  brainDumpCandidates: BrainDumpPriorityCandidate[];
  existingSourceKeys: Set<string>;
}

export function getFocusAddOptions({
  priorities,
  tasks,
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
  const availableTasks = tasks.filter(
    (task) =>
      !existingSourceKeys.has(
        getFocusItemSourceKey({
          type: "task",
          taskId: task.id,
          label: task.name,
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
    availablePriorities.length > 0 ||
    availableTasks.length > 0 ||
    availableBrainDump.length > 0;

  return {
    availablePriorities,
    availableTasks,
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
  tasks,
  brainDumpCandidates,
  existingSourceKeys,
  onAdd,
  children,
}: AddToFocusMenuProps) {
  const {
    availablePriorities,
    availableTasks,
    availableBrainDump,
    hasOptions,
  } = getFocusAddOptions({
    priorities,
    tasks,
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

        {availableTasks.length > 0 && (
          <>
            {availablePriorities.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              <DropdownMenuLabel>Tasks</DropdownMenuLabel>
              {availableTasks.map((task) => (
                <DropdownMenuItem
                  key={task.id}
                  onSelect={handleSelect({
                    type: "task",
                    taskId: task.id,
                    label: task.name,
                  })}
                >
                  {task.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}

        {availableBrainDump.length > 0 && (
          <>
            {(availablePriorities.length > 0 || availableTasks.length > 0) && (
              <DropdownMenuSeparator />
            )}
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
