"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PriorityCard } from "./priority-card";
import type { TopPriority } from "@/lib/use-planner-storage";

const MAX_PRIORITIES = 3;

interface TopPrioritiesProps {
  priorities: TopPriority[];
  onAddPriority: () => void;
  onUpdatePriority: (priority: TopPriority) => void;
  onDeletePriority: (id: string) => void;
}

export function TopPriorities({
  priorities,
  onAddPriority,
  onUpdatePriority,
  onDeletePriority,
}: TopPrioritiesProps) {
  const canAddMore = priorities.length < MAX_PRIORITIES;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-foreground">
        Top Priorities
      </h2>

      <div className="space-y-3">
        {priorities.length === 0 ? (
          // Empty state with dashed add button
          <button
            type="button"
            onClick={onAddPriority}
            className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg py-8 text-center text-muted-foreground hover:border-muted-foreground/50 hover:bg-accent/30 transition-colors"
          >
            <Plus className="h-5 w-5 mx-auto mb-2" />
            <p className="text-sm font-medium">Add your first priority</p>
            <p className="text-xs">Up to {MAX_PRIORITIES} top priorities for today</p>
          </button>
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

      {/* Show add button at bottom when there are existing priorities but less than max */}
      {priorities.length > 0 && canAddMore && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAddPriority}
          className="w-full text-muted-foreground"
        >
          <Plus className="h-4 w-4" />
          Add item ({priorities.length}/{MAX_PRIORITIES})
        </Button>
      )}
    </div>
  );
}
