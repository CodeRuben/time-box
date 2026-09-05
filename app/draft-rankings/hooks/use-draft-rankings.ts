"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { toggleDraftedId } from "@/lib/draft-rankings/drafted";
import {
  emptyHighlightFilters,
  hasActiveHighlightFilters,
  toggleSetMember,
} from "@/lib/draft-rankings/highlight-filters";
import { PLAYERS } from "@/lib/draft-rankings/players";
import { reorderIds } from "@/lib/draft-rankings/reorder";
import {
  getDefaultPlayerIds,
  loadDraftRankingsState,
  saveDraftRankingsState,
} from "@/lib/draft-rankings/storage";
import type {
  DraftRankingsView,
  LeagueSize,
  NflTeam,
  Player,
  PlayerSignalFilterId,
  Position,
} from "@/lib/draft-rankings/types";

const PLAYERS_BY_ID = new Map(PLAYERS.map((player) => [player.id, player]));

function playersFromIds(ids: number[]): Player[] {
  return ids.flatMap((id, index) => {
    const player = PLAYERS_BY_ID.get(id);
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
  const [leagueSize, setLeagueSize] = useState<LeagueSize>(
    initialState.leagueSize,
  );
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
      leagueSize,
    });
  }, [draftMode, draftedIds, isHydrated, leagueSize, playerIds, view]);

  const players = useMemo(() => playersFromIds(playerIds), [playerIds]);
  const draftedIdSet = useMemo(() => new Set(draftedIds), [draftedIds]);

  const togglePosition = useCallback((position: Position) => {
    setHighlightFilters((current) => ({
      ...current,
      positions: toggleSetMember(current.positions, position),
    }));
  }, []);

  const toggleSignalFilter = useCallback((filterId: PlayerSignalFilterId) => {
    setHighlightFilters((current) => ({
      ...current,
      signals: toggleSetMember(current.signals, filterId),
    }));
  }, []);

  const clearSignalFilters = useCallback(() => {
    setHighlightFilters((current) => ({
      ...current,
      signals: new Set(),
    }));
  }, []);

  const toggleTeam = useCallback((team: NflTeam) => {
    setHighlightFilters((current) => ({
      ...current,
      teams: toggleSetMember(current.teams, team),
    }));
  }, []);

  const clearTeamFilters = useCallback(() => {
    setHighlightFilters((current) => ({
      ...current,
      teams: new Set(),
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setHighlightFilters(emptyHighlightFilters());
  }, []);

  const reorder = useCallback((activeId: number, overId: number) => {
    setPlayerIds((current) => reorderIds(current, activeId, overId));
  }, []);

  const toggleDraftMode = useCallback(() => {
    setDraftMode((current) => !current);
  }, []);

  const toggleView = useCallback(() => {
    setView((current) => (current === "board" ? "compact" : "board"));
  }, []);

  const toggleTaken = useCallback((playerId: number) => {
    setDraftedIds((current) => toggleDraftedId(current, playerId));
  }, []);

  const resetBoard = useCallback(() => {
    setPlayerIds(getDefaultPlayerIds());
    setDraftedIds([]);
    setDraftMode(false);
  }, []);

  return {
    isHydrated,
    players,
    highlightFilters,
    activePositions: highlightFilters.positions,
    activeSignalFilters: highlightFilters.signals,
    activeTeams: highlightFilters.teams,
    draftMode,
    view,
    leagueSize,
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
    setLeagueSize,
    toggleTaken,
    resetBoard,
    hasActiveFilters: hasActiveHighlightFilters(highlightFilters),
  };
}
