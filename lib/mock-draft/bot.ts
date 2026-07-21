import { playerValue } from "./value";
import {
  countByPosition,
  mustFillStartersOnly,
  positionFillsStarter,
  withinCaps,
} from "./roster";
import type { Rng } from "./rng";
import type { ArchetypeId, Player, Position } from "./types";
import { KICKER_DST_EARLIEST_ROUND } from "./types";

export interface Archetype {
  id: ArchetypeId;
  positionBias: (position: Position, round: number) => number;
}

export interface BotPickInput {
  available: Player[];
  roster: Player[];
  archetype: ArchetypeId;
  round: number;
  overall: number;
  teamCount: number;
  remainingPicks: number;
  rng: Rng;
}

const SOFT_TARGETS: Record<Position, number> = {
  QB: 1,
  RB: 4,
  WR: 4,
  TE: 1,
  K: 1,
  DST: 1,
};

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  balanced: {
    id: "balanced",
    positionBias: () => 1,
  },
  rbHeavy: {
    id: "rbHeavy",
    positionBias: (position) =>
      position === "RB" ? 1.15 : position === "WR" ? 0.95 : 1,
  },
  wrHeavy: {
    id: "wrHeavy",
    positionBias: (position) =>
      position === "WR" ? 1.15 : position === "RB" ? 0.95 : 1,
  },
  zeroRb: {
    id: "zeroRb",
    positionBias: (position, round) => {
      if (position === "RB") {
        return round <= 4 ? 0.6 : 1.2;
      }

      return position === "WR" && round <= 4 ? 1.1 : 1;
    },
  },
  earlyQb: {
    id: "earlyQb",
    positionBias: (position) => (position === "QB" ? 1.3 : 1),
  },
  lateQb: {
    id: "lateQb",
    positionBias: (position) => (position === "QB" ? 0.7 : 1),
  },
  tePremium: {
    id: "tePremium",
    positionBias: (position) => (position === "TE" ? 1.3 : 1),
  },
};

export const ARCHETYPE_IDS = Object.keys(ARCHETYPES) as ArchetypeId[];

function isLegalCandidate(
  player: Player,
  input: BotPickInput,
  counts: Record<Position, number>,
  startersOnly: boolean,
): boolean {
  if (!withinCaps(input.roster, player.position)) {
    return false;
  }

  if (
    (player.position === "K" || player.position === "DST") &&
    input.round < KICKER_DST_EARLIEST_ROUND
  ) {
    return false;
  }

  if (
    input.round < 10 &&
    (player.position === "QB" || player.position === "TE") &&
    counts[player.position] >= 1
  ) {
    return false;
  }

  return (
    !startersOnly || positionFillsStarter(input.roster, player.position)
  );
}

function getNeedMultiplier(roster: Player[], position: Position): number {
  if (positionFillsStarter(roster, position)) {
    return 1;
  }

  return countByPosition(roster)[position] < SOFT_TARGETS[position]
    ? 0.75
    : 0.4;
}

function hasMatchingPositionBye(
  roster: Player[],
  candidate: Player,
): boolean {
  return roster.some(
    (player) =>
      player.position === candidate.position && player.bye === candidate.bye,
  );
}

function scoreCandidate(
  player: Player,
  input: BotPickInput,
  archetype: Archetype,
): number {
  const jitter = 0.9 + input.rng() * 0.2;
  const byeMultiplier = hasMatchingPositionBye(input.roster, player)
    ? 0.92
    : 1;

  return (
    playerValue(player.rank) *
    getNeedMultiplier(input.roster, player.position) *
    archetype.positionBias(player.position, input.round) *
    jitter *
    byeMultiplier
  );
}

export function chooseBotPick(input: BotPickInput): number {
  const counts = countByPosition(input.roster);
  const startersOnly = mustFillStartersOnly(
    input.roster,
    input.remainingPicks,
  );
  const legal = [...input.available]
    .sort((left, right) => left.rank - right.rank)
    .filter((player) =>
      isLegalCandidate(player, input, counts, startersOnly),
    );

  if (legal.length === 0) {
    throw new Error("No legal players are available");
  }

  if (legal[0].rank <= input.overall - input.teamCount) {
    return legal[0].id;
  }

  const archetype = ARCHETYPES[input.archetype];
  const scored = legal.slice(0, 8).map((player) => ({
    id: player.id,
    rank: player.rank,
    score: scoreCandidate(player, input, archetype),
  }));
  scored.sort(
    (left, right) => right.score - left.score || left.rank - right.rank,
  );

  return scored[0].id;
}

export function chooseAutopick(
  input: Omit<BotPickInput, "archetype">,
): number {
  return chooseBotPick({ ...input, archetype: "balanced" });
}
