"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  applyPick,
  createDraft,
  getAvailablePlayers,
  getCurrentOverall,
  getTeamRoster,
  makeAutopick,
  makeBotPick,
  pauseDraft,
  resumeDraft,
} from "@/lib/mock-draft/engine";
import {
  getNextOverallForSlot,
  getRound,
  getSlotOnClock,
} from "@/lib/mock-draft/snake";
import {
  clearDraft,
  loadDraft,
  saveDraft,
} from "@/lib/mock-draft/storage";
import type {
  DraftConfig,
  DraftState,
  DraftTeam,
  Player,
} from "@/lib/mock-draft/types";

function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export function useMockDraft() {
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [savedDraft, setSavedDraft] = useState<DraftState | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const draftStateRef = useRef<DraftState | null>(null);
  const savedDraftRef = useRef<DraftState | null>(null);
  const timerPickRef = useRef<number | null>(null);
  const timerRemainingMsRef = useRef(0);
  const deadlineRef = useRef(0);
  const pickPendingRef = useRef(false);

  const commit = useCallback((next: DraftState) => {
    draftStateRef.current = next;
    setDraftState(next);
    saveDraft(next);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const restored = loadDraft();
      savedDraftRef.current = restored;
      setSavedDraft(restored);
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const restored = loadDraft();
      const current = draftStateRef.current;
      if (restored && current && restored.picks.length > current.picks.length) {
        draftStateRef.current = restored;
        setDraftState(restored);
        return;
      }

      if (
        restored &&
        !current &&
        restored.picks.length >
          (savedDraftRef.current?.picks.length ?? -1)
      ) {
        savedDraftRef.current = restored;
        setSavedDraft(restored);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const startDraft = useCallback(
    (config: DraftConfig) => {
      clearDraft();
      savedDraftRef.current = null;
      setSavedDraft(null);
      commit(createDraft(config, newSeed()));
    },
    [commit],
  );

  const resumeSavedDraft = useCallback(() => {
    const restored = savedDraftRef.current;
    if (!restored) {
      return;
    }

    draftStateRef.current = restored;
    setDraftState(restored);
  }, []);

  const abandonDraft = useCallback(() => {
    clearDraft();
    draftStateRef.current = null;
    savedDraftRef.current = null;
    setDraftState(null);
    setSavedDraft(null);
    pickPendingRef.current = false;
  }, []);

  const isComplete = draftState?.status === "complete";
  const currentOverall =
    draftState && !isComplete ? getCurrentOverall(draftState) : 1;
  const currentRound =
    draftState && !isComplete
      ? getRound(currentOverall, draftState.config.teamCount)
      : 1;
  const slotOnClock =
    draftState && !isComplete
      ? getSlotOnClock(currentOverall, draftState.config.teamCount)
      : 1;
  const teamOnClock =
    draftState && !isComplete
      ? (draftState.teams.find((team) => team.slot === slotOnClock) ?? null)
      : null;
  const isUserOnClock = teamOnClock?.isUser === true;

  const availablePlayers = useMemo(
    () => (draftState ? getAvailablePlayers(draftState) : []),
    [draftState],
  );
  const userRoster = useMemo(
    () =>
      draftState
        ? getTeamRoster(draftState, draftState.config.userSlot)
        : [],
    [draftState],
  );
  const picksUntilUserTurn = useMemo(() => {
    if (!draftState || draftState.status === "complete") {
      return null;
    }

    const next = getNextOverallForSlot(
      currentOverall,
      draftState.config.userSlot,
      draftState.config.teamCount,
    );
    return next === null ? null : next - currentOverall;
  }, [currentOverall, draftState]);
  useEffect(() => {
    pickPendingRef.current = false;
  }, [draftState?.picks.length]);

  useEffect(() => {
    if (
      !draftState ||
      draftState.status !== "active" ||
      isUserOnClock
    ) {
      return;
    }

    const scheduledState = draftState;
    const timeout = window.setTimeout(() => {
      if (draftStateRef.current !== scheduledState) {
        return;
      }

      commit(makeBotPick(scheduledState));
    }, 1000 + Math.random() * 2000);

    return () => window.clearTimeout(timeout);
  }, [
    commit,
    draftState,
    draftState?.picks.length,
    draftState?.status,
    isUserOnClock,
  ]);

  useEffect(() => {
    if (!draftState || !isUserOnClock) {
      timerPickRef.current = null;
      timerRemainingMsRef.current = 0;
      return;
    }

    const pickKey = draftState.picks.length;
    if (timerPickRef.current !== pickKey) {
      timerPickRef.current = pickKey;
      timerRemainingMsRef.current = draftState.config.timerSeconds * 1000;
    }

    if (draftState.status !== "active") {
      return;
    }

    const scheduledState = draftState;
    deadlineRef.current = Date.now() + timerRemainingMsRef.current;
    let didAutopick = false;

    const tick = () => {
      const remainingMs = Math.max(0, deadlineRef.current - Date.now());
      timerRemainingMsRef.current = remainingMs;
      setRemainingSeconds(Math.ceil(remainingMs / 1000));

      if (
        remainingMs === 0 &&
        !didAutopick &&
        draftStateRef.current === scheduledState
      ) {
        didAutopick = true;
        window.clearInterval(interval);
        commit(makeAutopick(scheduledState));
      }
    };

    const interval = window.setInterval(tick, 250);
    tick();

    return () => {
      window.clearInterval(interval);
      if (!didAutopick && timerPickRef.current === pickKey) {
        timerRemainingMsRef.current = Math.max(
          0,
          deadlineRef.current - Date.now(),
        );
      }
    };
  }, [
    commit,
    draftState,
    draftState?.picks.length,
    draftState?.status,
    isUserOnClock,
  ]);

  const draftPlayer = useCallback(
    (playerId: number) => {
      const current = draftStateRef.current;
      if (
        !current ||
        current.status !== "active" ||
        pickPendingRef.current
      ) {
        return;
      }

      const overall = getCurrentOverall(current);
      const slot = getSlotOnClock(overall, current.config.teamCount);
      if (slot !== current.config.userSlot) {
        return;
      }

      if (!getAvailablePlayers(current).some(({ id }) => id === playerId)) {
        return;
      }

      pickPendingRef.current = true;
      try {
        commit(applyPick(current, playerId));
      } catch {
        pickPendingRef.current = false;
      }
    },
    [commit],
  );

  const togglePause = useCallback(() => {
    const current = draftStateRef.current;
    if (!current || current.status === "complete") {
      return;
    }

    commit(
      current.status === "active"
        ? pauseDraft(current)
        : resumeDraft(current),
    );
  }, [commit]);

  const phase =
    draftState === null
      ? "setup"
      : draftState.status === "complete"
        ? "results"
        : "room";

  return {
    abandonDraft,
    availablePlayers,
    currentOverall,
    currentRound,
    draftPlayer,
    draftState,
    isHydrated,
    isUserOnClock,
    phase,
    picksUntilUserTurn,
    remainingSeconds,
    resumeSavedDraft,
    savedDraft,
    slotOnClock,
    startDraft,
    teamOnClock,
    togglePause,
    userRoster,
  };
}
