"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import {
  BOARD_COLUMNS,
  toSnakeRows,
} from "@/lib/draft-rankings/snake-layout";
import type { Player, Position } from "@/lib/draft-rankings/types";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

import { SortablePlayerCard } from "./player-card";

interface RankingsBoardProps {
  players: Player[];
  activePositions: Set<Position>;
  draftMode: boolean;
  draftedIds: Set<number>;
  onReorder: (activeId: number, overId: number) => void;
  onToggleTaken: (playerId: number) => void;
}

function isDimmed(
  player: Player,
  activePositions: Set<Position>,
): boolean {
  return activePositions.size > 0 && !activePositions.has(player.position);
}

export function RankingsBoard({
  players,
  activePositions,
  draftMode,
  draftedIds,
  onReorder,
  onToggleTaken,
}: RankingsBoardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const snakeRows = toSnakeRows(players);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    onReorder(Number(active.id), Number(over.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={players.map((player) => player.id)}
        strategy={rectSortingStrategy}
      >
        <div className="overflow-x-auto">
          <div className="flex min-w-[1200px] flex-col gap-1.5">
            {snakeRows.map((row, roundIndex) => (
              <div
                key={`round-${roundIndex + 1}`}
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${BOARD_COLUMNS}, minmax(0, 1fr))` }}
              >
                {row.map((player, slotIndex) =>
                  player ? (
                    <SortablePlayerCard
                      key={player.id}
                      player={player}
                      dimmed={isDimmed(player, activePositions)}
                      taken={draftedIds.has(player.id)}
                      draftMode={draftMode}
                      prefersReducedMotion={prefersReducedMotion}
                      onToggleTaken={onToggleTaken}
                    />
                  ) : (
                    <div
                      key={`empty-${roundIndex}-${slotIndex}`}
                      aria-hidden
                    />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
}
