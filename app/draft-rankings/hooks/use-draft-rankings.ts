"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { toggleDraftedId } from "@/lib/draft-rankings/drafted";
import {
  emptyHighlightFilters,
  hasActiveHighlightFilters,
  toggleSetMember,
} from "@/lib/draft-rankings/highlight-filters";
import { PLAYERS } from "@/lib/draft-rankings/players";
import { reorderIds } from "@/lib/draft-rankings/reorder";
import {
  getDefaultDraftRankingsState,
  loadDraftRankingsState,
  saveDraftRankingsState,
} from "@/lib/draft-rankings/storage";
import type {
  DraftRankingsView,
  NflTeam,
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
  const [highlightFilters, setHighlightFilters] = useState(
    emptyHighlightFilters,
  );
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
    setHighlightFilters((current) => ({
      ...current,
      positions: toggleSetMember(current.positions, position),
    }));
  }

  function toggleSignalFilter(filterId: PlayerSignalFilterId) {
    setHighlightFilters((current) => ({
      ...current,
      signals: toggleSetMember(current.signals, filterId),
    }));
  }

  function clearSignalFilters() {
    setHighlightFilters((current) => ({
      ...current,
      signals: new Set(),
    }));
  }

  function toggleTeam(team: NflTeam) {
    setHighlightFilters((current) => ({
      ...current,
      teams: toggleSetMember(current.teams, team),
    }));
  }

  function clearTeamFilters() {
    setHighlightFilters((current) => ({
      ...current,
      teams: new Set(),
    }));
  }

  function clearFilters() {
    setHighlightFilters(emptyHighlightFilters());
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
    highlightFilters,
    activePositions: highlightFilters.positions,
    activeSignalFilters: highlightFilters.signals,
    activeTeams: highlightFilters.teams,
    draftMode,
    view,
    draftedIds: draftedIdSet,
    availableCount: players.length - draftedIds.length,
    takenCount: draftedIds.length,
    togglePosition,
    toggleSignalFilter,
    clearSignalFilters,
    toggleTeam,
    clearTeamFilters,
    clearFilters,
    reorder,
    toggleDraftMode,
    toggleView,
    toggleTaken,
    resetBoard,
    hasActiveFilters: hasActiveHighlightFilters(highlightFilters),
  };
}
