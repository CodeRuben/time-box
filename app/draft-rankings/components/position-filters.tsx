"use client";

import { Button } from "@/components/ui/button";
import { POSITION_CELL_CLASS } from "@/lib/draft-rankings/position-styles";
import { POSITIONS, type Position } from "@/lib/draft-rankings/types";
import { cn } from "@/lib/utils";

interface PositionFiltersProps {
  activePositions: Set<Position>;
  onToggle: (position: Position) => void;
  onClear: () => void;
  onReset: () => void;
}

export function PositionFilters({
  activePositions,
  onToggle,
  onClear,
  onReset,
}: PositionFiltersProps) {
  const hasFilters = activePositions.size > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
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

      <div className="ml-auto flex gap-2">
        {hasFilters ? (
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>
            Clear filters
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="outline" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
