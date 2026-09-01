"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { toggleDraftedId } from "@/lib/draft-rankings/drafted";
import { PLAYERS } from "@/lib/draft-rankings/players";
import { reorderIds } from "@/lib/draft-rankings/reorder";
import {
  getDefaultDraftRankingsState,
  loadDraftRankingsState,
  saveDraftRankingsState,
} from "@/lib/draft-rankings/storage";
import type {
  DraftRankingsView,
  Player,
  PlayerSignalFilterId,
  Position,
} from "@/lib/draft-rankings/types";

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

function subscribeToHydration() {
  return () => undefined;
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

export function useDraftRankings() {
  const [initialState] = useState(loadDraftRankingsState);
  const [playerIds, setPlayerIds] = useState(initialState.ids);
  const [draftedIds, setDraftedIds] = useState(initialState.draftedIds);
  const [draftMode, setDraftMode] = useState(initialState.draftMode);
  const [view, setView] = useState<DraftRankingsView>(initialState.view);
  const [activePositions, setActivePositions] = useState<Set<Position>>(
    () => new Set(),
  );
  const [activeSignalFilters, setActiveSignalFilters] = useState<
    Set<PlayerSignalFilterId>
  >(() => new Set());
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveDraftRankingsState({
      ids: playerIds,
      draftedIds,
      draftMode,
      view,
    });
  }, [draftMode, draftedIds, isHydrated, playerIds, view]);

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

  function toggleSignalFilter(filterId: PlayerSignalFilterId) {
    setActiveSignalFilters((current) => {
      const next = new Set(current);
      if (next.has(filterId)) {
        next.delete(filterId);
      } else {
        next.add(filterId);
      }
      return next;
    });
  }

  function clearSignalFilters() {
    setActiveSignalFilters(new Set());
  }

  function clearFilters() {
    setActivePositions(new Set());
    setActiveSignalFilters(new Set());
  }

  function reorder(activeId: number, overId: number) {
    setPlayerIds((current) => reorderIds(current, activeId, overId));
  }

  function toggleDraftMode() {
    setDraftMode((current) => !current);
  }

  function toggleView() {
    setView((current) => (current === "board" ? "compact" : "board"));
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
    activeSignalFilters,
    draftMode,
    view,
    draftedIds: draftedIdSet,
    availableCount: players.length - draftedIds.length,
    takenCount: draftedIds.length,
    togglePosition,
    toggleSignalFilter,
    clearSignalFilters,
    clearFilters,
    reorder,
    toggleDraftMode,
    toggleView,
    toggleTaken,
    resetBoard,
    hasActiveFilters:
      activePositions.size > 0 || activeSignalFilters.size > 0,
  };
}
