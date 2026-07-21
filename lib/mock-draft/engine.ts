import { ARCHETYPE_IDS, chooseAutopick, chooseBotPick } from "./bot";
import { PLAYERS } from "./players";
import { createRng, shuffled } from "./rng";
import { isRosterFull, withinCaps } from "./roster";
import {
  getRound,
  getSlotOnClock,
  getTotalPicks,
} from "./snake";
import type {
  DraftConfig,
  DraftState,
  DraftTeam,
  Player,
} from "./types";
import {
  BOT_NAMES,
  TEAM_COUNT_OPTIONS,
  TIMER_OPTIONS,
  TOTAL_ROUNDS,
} from "./types";

function validateConfig(config: DraftConfig): void {
  if (!TEAM_COUNT_OPTIONS.includes(config.teamCount)) {
    throw new RangeError("Unsupported team count");
  }

  if (
    !Number.isInteger(config.userSlot) ||
    config.userSlot < 1 ||
    config.userSlot > config.teamCount
  ) {
    throw new RangeError("User slot must be within the draft order");
  }

  if (!TIMER_OPTIONS.includes(config.timerSeconds)) {
    throw new RangeError("Unsupported timer duration");
  }
}

function createTeams(config: DraftConfig, seed: number): DraftTeam[] {
  const rng = createRng(seed);
  const botNames = shuffled(BOT_NAMES, rng).slice(0, config.teamCount - 1);
  let botIndex = 0;

  return Array.from({ length: config.teamCount }, (_, index) => {
    const slot = index + 1;

    if (slot === config.userSlot) {
      return {
        slot,
        name: "You",
        isUser: true,
        archetype: null,
      };
    }

    const archetypeIndex = Math.floor(rng() * ARCHETYPE_IDS.length);
    const team: DraftTeam = {
      slot,
      name: botNames[botIndex],
      isUser: false,
      archetype: ARCHETYPE_IDS[archetypeIndex],
    };
    botIndex += 1;
    return team;
  });
}

export function createDraft(config: DraftConfig, seed: number): DraftState {
  validateConfig(config);

  return {
    version: 1,
    seed,
    config: { ...config },
    teams: createTeams(config, seed),
    picks: [],
    status: "active",
    startedAt: new Date().toISOString(),
  };
}

export function getCurrentOverall(state: DraftState): number {
  return state.picks.length + 1;
}

export function isComplete(state: DraftState): boolean {
  return (
    state.status === "complete" ||
    state.picks.length >= getTotalPicks(state.config.teamCount)
  );
}

export function getAvailablePlayers(state: DraftState): Player[] {
  const pickedIds = new Set(state.picks.map(({ playerId }) => playerId));
  return PLAYERS.filter(({ id }) => !pickedIds.has(id));
}

export function getTeamRoster(state: DraftState, slot: number): Player[] {
  const playersById = new Map(PLAYERS.map((player) => [player.id, player]));

  return state.picks
    .filter((pick) => pick.slot === slot)
    .map((pick) => playersById.get(pick.playerId))
    .filter((player): player is Player => player !== undefined);
}

export function applyPick(state: DraftState, playerId: number): DraftState {
  if (state.status !== "active") {
    throw new Error("Picks can only be made while the draft is active");
  }

  const player = getAvailablePlayers(state).find(
    (candidate) => candidate.id === playerId,
  );
  if (!player) {
    throw new Error("Player is not available");
  }

  const overall = getCurrentOverall(state);
  const slot = getSlotOnClock(overall, state.config.teamCount);
  const roster = getTeamRoster(state, slot);
  if (isRosterFull(roster) || !withinCaps(roster, player.position)) {
    throw new Error("Pick violates roster limits");
  }

  const picks = [
    ...state.picks,
    {
      overall,
      round: getRound(overall, state.config.teamCount),
      slot,
      playerId,
    },
  ];
  const status =
    picks.length === getTotalPicks(state.config.teamCount)
      ? "complete"
      : state.status;

  return { ...state, picks, status };
}

function getTeamOnClock(state: DraftState): DraftTeam {
  const overall = getCurrentOverall(state);
  const slot = getSlotOnClock(overall, state.config.teamCount);
  const team = state.teams.find((candidate) => candidate.slot === slot);

  if (!team) {
    throw new Error("No team exists for the slot on the clock");
  }

  return team;
}

function getPickContext(state: DraftState) {
  const overall = getCurrentOverall(state);
  const team = getTeamOnClock(state);
  const roster = getTeamRoster(state, team.slot);

  return {
    available: getAvailablePlayers(state),
    roster,
    round: getRound(overall, state.config.teamCount),
    overall,
    teamCount: state.config.teamCount,
    remainingPicks: TOTAL_ROUNDS - roster.length,
    rng: createRng(state.seed * 31 + overall),
  };
}

export function makeBotPick(state: DraftState): DraftState {
  const team = getTeamOnClock(state);
  if (team.isUser || team.archetype === null) {
    throw new Error("The team on the clock is not a bot");
  }

  const playerId = chooseBotPick({
    ...getPickContext(state),
    archetype: team.archetype,
  });
  return applyPick(state, playerId);
}

export function makeAutopick(state: DraftState): DraftState {
  const team = getTeamOnClock(state);
  if (!team.isUser) {
    throw new Error("The team on the clock is not the user");
  }

  return applyPick(state, chooseAutopick(getPickContext(state)));
}

export function pauseDraft(state: DraftState): DraftState {
  return state.status === "active" ? { ...state, status: "paused" } : state;
}

export function resumeDraft(state: DraftState): DraftState {
  return state.status === "paused" ? { ...state, status: "active" } : state;
}
