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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Top Priorities
        </h2>

        {priorities.length > 0 && canAddMore && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddPriority}
            className="px-2.5"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {priorities.length === 0 ? (
          <div className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg py-6 px-4 text-center text-muted-foreground bg-card">
            <p className="text-sm font-medium">No priorities yet</p>
            <p className="text-xs mb-3">
              Up to {MAX_PRIORITIES} top priorities for today
            </p>
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
