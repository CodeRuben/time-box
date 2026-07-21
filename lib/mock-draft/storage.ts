import { ARCHETYPE_IDS } from "./bot";
import { PLAYERS } from "./players";
import { getRound, getSlotOnClock, getTotalPicks } from "./snake";
import type {
  ArchetypeId,
  DraftConfig,
  DraftPick,
  DraftState,
  DraftStatus,
  DraftTeam,
} from "./types";
import {
  STORAGE_KEY,
  TEAM_COUNT_OPTIONS,
  TIMER_OPTIONS,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidConfig(value: unknown): value is DraftConfig {
  if (!isRecord(value)) {
    return false;
  }

  const teamCount = value.teamCount;
  const timerSeconds = value.timerSeconds;
  const userSlot = value.userSlot;

  return (
    typeof teamCount === "number" &&
    TEAM_COUNT_OPTIONS.includes(teamCount as DraftConfig["teamCount"]) &&
    typeof timerSeconds === "number" &&
    TIMER_OPTIONS.includes(timerSeconds as DraftConfig["timerSeconds"]) &&
    typeof userSlot === "number" &&
    Number.isInteger(userSlot) &&
    userSlot >= 1 &&
    userSlot <= teamCount
  );
}

function isValidTeam(value: unknown): value is DraftTeam {
  if (!isRecord(value)) {
    return false;
  }

  const archetype = value.archetype;

  return (
    typeof value.slot === "number" &&
    Number.isInteger(value.slot) &&
    typeof value.name === "string" &&
    typeof value.isUser === "boolean" &&
    (archetype === null ||
      (typeof archetype === "string" &&
        ARCHETYPE_IDS.includes(archetype as ArchetypeId)))
  );
}

function hasValidTeams(
  teams: unknown,
  config: DraftConfig,
): teams is DraftTeam[] {
  if (
    !Array.isArray(teams) ||
    teams.length !== config.teamCount ||
    !teams.every(isValidTeam)
  ) {
    return false;
  }

  const slotsAreContiguous = teams.every(
    (team, index) => team.slot === index + 1,
  );
  const userTeams = teams.filter((team) => team.isUser);

  return (
    slotsAreContiguous &&
    userTeams.length === 1 &&
    userTeams[0].slot === config.userSlot &&
    userTeams[0].archetype === null &&
    teams
      .filter((team) => !team.isUser)
      .every((team) => team.archetype !== null)
  );
}

function isValidPick(value: unknown): value is DraftPick {
  return (
    isRecord(value) &&
    typeof value.overall === "number" &&
    Number.isInteger(value.overall) &&
    typeof value.round === "number" &&
    Number.isInteger(value.round) &&
    typeof value.slot === "number" &&
    Number.isInteger(value.slot) &&
    typeof value.playerId === "number" &&
    Number.isInteger(value.playerId)
  );
}

function hasValidPicks(
  picks: unknown,
  config: DraftConfig,
): picks is DraftPick[] {
  if (
    !Array.isArray(picks) ||
    picks.length > getTotalPicks(config.teamCount) ||
    !picks.every(isValidPick)
  ) {
    return false;
  }

  const playerIds = new Set(PLAYERS.map(({ id }) => id));
  const pickedIds = new Set<number>();

  return picks.every((pick, index) => {
    const overall = index + 1;
    const playerExists = playerIds.has(pick.playerId);
    const isDuplicate = pickedIds.has(pick.playerId);
    pickedIds.add(pick.playerId);

    return (
      playerExists &&
      !isDuplicate &&
      pick.overall === overall &&
      pick.round === getRound(overall, config.teamCount) &&
      pick.slot === getSlotOnClock(overall, config.teamCount)
    );
  });
}

function isDraftStatus(value: unknown): value is DraftStatus {
  return value === "active" || value === "paused" || value === "complete";
}

export function isValidDraftState(value: unknown): value is DraftState {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Number.isInteger(value.seed) ||
    !isValidConfig(value.config) ||
    !hasValidTeams(value.teams, value.config) ||
    !hasValidPicks(value.picks, value.config) ||
    !isDraftStatus(value.status) ||
    typeof value.startedAt !== "string" ||
    Number.isNaN(Date.parse(value.startedAt))
  ) {
    return false;
  }

  const isFull =
    value.picks.length === getTotalPicks(value.config.teamCount);
  return value.status === "complete" ? isFull : !isFull;
}

export function saveDraft(state: DraftState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "QuotaExceededError"
    ) {
      console.warn("localStorage quota exceeded. Mock draft not saved.");
      return;
    }

    console.error("Failed to save mock draft:", error);
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear mock draft:", error);
  }
}

export function loadDraft(): DraftState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed: unknown = JSON.parse(stored);
    if (!isValidDraftState(parsed)) {
      clearDraft();
      return null;
    }

    return parsed.status === "active"
      ? { ...parsed, status: "paused" }
      : parsed;
  } catch {
    clearDraft();
    return null;
  }
}
