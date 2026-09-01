"use client";

import { Button } from "@/components/ui/button";
import { POSITION_CELL_CLASS } from "@/lib/draft-rankings/position-styles";
import { POSITIONS, type Position } from "@/lib/draft-rankings/types";
import { cn } from "@/lib/utils";

interface PositionFiltersProps {
  activePositions: Set<Position>;
  onToggle: (position: Position) => void;
}

export function PositionFilters({
  activePositions,
  onToggle,
}: PositionFiltersProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Position filters">
      {POSITIONS.map((position) => {
        const isActive = activePositions.has(position);

        return (
          <Button
            key={position}
            type="button"
            size="sm"
            variant={isActive ? "default" : "outline"}
            aria-pressed={isActive}
            onClick={() => onToggle(position)}
            className={cn(
              "min-w-12 font-semibold",
              isActive && POSITION_CELL_CLASS[position],
              isActive && "hover:opacity-90",
            )}
          >
            {position}
          </Button>
        );
      })}
    </div>
  );
}
