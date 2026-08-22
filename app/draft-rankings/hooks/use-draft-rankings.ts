"use client";

import { useEffect, useState } from "react";

import { toggleDraftedId } from "@/lib/draft-rankings/drafted";
import { PLAYERS } from "@/lib/draft-rankings/players";
import { reorderIds } from "@/lib/draft-rankings/reorder";
import {
  getDefaultDraftRankingsState,
  getDefaultPlayerIds,
  loadDraftRankingsState,
  saveDraftRankingsState,
} from "@/lib/draft-rankings/storage";
import type { Player, Position } from "@/lib/draft-rankings/types";

function playersFromIds(ids: number[]): Player[] {
  const byId = new Map(PLAYERS.map((player) => [player.id, player]));

  return ids.flatMap((id, index) => {
    const player = byId.get(id);
    if (!player) {
      return [];
    }

    return [{ ...player, rank: index + 1 }];
  });
}

export function useDraftRankings() {
  const [playerIds, setPlayerIds] = useState(getDefaultPlayerIds);
  const [draftedIds, setDraftedIds] = useState<number[]>([]);
  const [draftMode, setDraftMode] = useState(false);
  const [activePositions, setActivePositions] = useState<Set<Position>>(
    () => new Set()
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = loadDraftRankingsState();
    setPlayerIds(stored.ids);
    setDraftedIds(stored.draftedIds);
    setDraftMode(stored.draftMode);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveDraftRankingsState({
      ids: playerIds,
      draftedIds,
      draftMode,
    });
  }, [draftMode, draftedIds, isHydrated, playerIds]);

  const players = playersFromIds(playerIds);
  const draftedIdSet = new Set(draftedIds);

  function togglePosition(position: Position) {
    setActivePositions((current) => {
      const next = new Set(current);
      if (next.has(position)) {
        next.delete(position);
      } else {
        next.add(position);
      }
      return next;
    });
  }

  function clearFilters() {
    setActivePositions(new Set());
  }

  function reorder(activeId: number, overId: number) {
    setPlayerIds((current) => reorderIds(current, activeId, overId));
  }

  function toggleDraftMode() {
    setDraftMode((current) => !current);
  }

  function toggleTaken(playerId: number) {
    setDraftedIds((current) => toggleDraftedId(current, playerId));
  }

  function resetBoard() {
    const next = getDefaultDraftRankingsState();
    setPlayerIds(next.ids);
    setDraftedIds(next.draftedIds);
    setDraftMode(next.draftMode);
  }

  return {
    isHydrated,
    players,
    activePositions,
    draftMode,
    draftedIds: draftedIdSet,
    availableCount: players.length - draftedIds.length,
    takenCount: draftedIds.length,
    togglePosition,
    clearFilters,
    reorder,
    toggleDraftMode,
    toggleTaken,
    resetBoard,
  };
}
