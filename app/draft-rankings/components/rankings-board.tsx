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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Fragment, useCallback, useMemo } from "react";

import { isPlayerDimmed, type HighlightFilters } from "@/lib/draft-rankings/highlight-filters";
import {
  BOARD_COLUMN_MIN_WIDTH_PX,
  chunkRounds,
  toSnakeRows,
} from "@/lib/draft-rankings/snake-layout";
import type { LeagueSize, Player } from "@/lib/draft-rankings/types";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

import { TooltipProvider } from "@/components/ui/tooltip";

import { CompactPlayerRow } from "./compact-player-row";
import { SortablePlayerCard } from "./player-card";

interface RankingsBoardProps {
  players: Player[];
  highlightFilters: HighlightFilters;
  draftMode: boolean;
  compact: boolean;
  leagueSize: LeagueSize;
  draftedIds: Set<number>;
  onReorder: (activeId: number, overId: number) => void;
  onToggleTaken: (playerId: number) => void;
}

export function RankingsBoard({
  players,
  highlightFilters,
  draftMode,
  compact,
  leagueSize,
  draftedIds,
  onReorder,
  onToggleTaken,
}: RankingsBoardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rounds = useMemo(
    () => (compact ? chunkRounds(players, leagueSize) : []),
    [compact, leagueSize, players],
  );
  const snakeRows = useMemo(
    () => (compact ? [] : toSnakeRows(players, leagueSize)),
    [compact, leagueSize, players],
  );
  const sortableItems = useMemo(
    () => players.map((player) => player.id),
    [players],
  );
  const dimmedPlayerIds = useMemo(
    () =>
      new Set(
        players
          .filter((player) => isPlayerDimmed(player, highlightFilters))
          .map((player) => player.id),
      ),
    [highlightFilters, players],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    onReorder(Number(active.id), Number(over.id));
  }, [onReorder]);

  return (
    <TooltipProvider>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortableItems}
          strategy={compact ? verticalListSortingStrategy : rectSortingStrategy}
        >
          {compact ? (
          <div className="flex w-full flex-col gap-1">
            {rounds.map((round, roundIndex) => {
              const roundNumber = roundIndex + 1;
              const pickStart = roundIndex * leagueSize + 1;
              const pickEnd = pickStart + round.length - 1;

              return (
                <Fragment key={`round-${roundNumber}`}>
                  <div
                    role="separator"
                    aria-label={`Round ${roundNumber}`}
                    className="flex items-center gap-3 py-2 text-xs font-semibold text-muted-foreground"
                  >
                    <span className="h-px flex-1 bg-border" />
                    <span>
                      Round {roundNumber} · Picks {pickStart}–{pickEnd}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  {round.map((player) => (
                    <CompactPlayerRow
                      key={player.id}
                      player={player}
                      dimmed={dimmedPlayerIds.has(player.id)}
                      taken={draftedIds.has(player.id)}
                      draftMode={draftMode}
                      prefersReducedMotion={prefersReducedMotion}
                      onToggleTaken={onToggleTaken}
                    />
                  ))}
                </Fragment>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="flex flex-col gap-1.5"
              style={{ minWidth: leagueSize * BOARD_COLUMN_MIN_WIDTH_PX }}
            >
              {snakeRows.map((row, roundIndex) => (
                <div
                  key={`round-${roundIndex + 1}`}
                  className="grid gap-1.5"
                  style={{
                    gridTemplateColumns: `repeat(${leagueSize}, minmax(0, 1fr))`,
                  }}
                >
                  {row.map((player, slotIndex) =>
                    player ? (
                      <SortablePlayerCard
                        key={player.id}
                        player={player}
                        dimmed={dimmedPlayerIds.has(player.id)}
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
        )}
        </SortableContext>
      </DndContext>
    </TooltipProvider>
  );
}
