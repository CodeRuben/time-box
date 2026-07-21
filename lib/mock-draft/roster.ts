import type { Player, Position } from "./types";
import { POSITION_CAPS, STARTER_SLOTS, TOTAL_ROUNDS } from "./types";

export type StarterSlot = Position | "FLEX";

const POSITIONS: Position[] = ["QB", "RB", "WR", "TE", "K", "DST"];
const FLEX_POSITIONS: Position[] = ["RB", "WR", "TE"];

export interface Lineup {
  starters: Record<string, Player | null>;
  bench: Player[];
}

export function countByPosition(
  roster: Player[],
): Record<Position, number> {
  const counts: Record<Position, number> = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
    DST: 0,
  };

  for (const player of roster) {
    counts[player.position] += 1;
  }

  return counts;
}

export function isRosterFull(roster: Player[]): boolean {
  return roster.length >= TOTAL_ROUNDS;
}

export function withinCaps(roster: Player[], position: Position): boolean {
  return countByPosition(roster)[position] < POSITION_CAPS[position];
}

function dedicatedStarterDeficit(
  counts: Record<Position, number>,
  position: Position,
): number {
  if (!(position in STARTER_SLOTS)) {
    return 0;
  }

  const required = STARTER_SLOTS[position as keyof typeof STARTER_SLOTS];
  return Math.max(0, required - counts[position]);
}

function hasFilledFlex(counts: Record<Position, number>): boolean {
  const surplus = FLEX_POSITIONS.reduce((total, position) => {
    const dedicated = STARTER_SLOTS[position];
    return total + Math.max(0, counts[position] - dedicated);
  }, 0);

  return surplus >= STARTER_SLOTS.FLEX;
}

export function getUnfilledStarterSlots(roster: Player[]): StarterSlot[] {
  const counts = countByPosition(roster);
  const unfilled: StarterSlot[] = [];

  for (const position of POSITIONS) {
    const deficit = dedicatedStarterDeficit(counts, position);
    for (let index = 0; index < deficit; index += 1) {
      unfilled.push(position);
    }
  }

  if (!hasFilledFlex(counts)) {
    const kickerIndex = unfilled.indexOf("K");
    const insertionIndex = kickerIndex === -1 ? unfilled.length : kickerIndex;
    unfilled.splice(insertionIndex, 0, "FLEX");
  }

  return unfilled;
}

export function mustFillStartersOnly(
  roster: Player[],
  remainingPicks: number,
): boolean {
  return remainingPicks <= getUnfilledStarterSlots(roster).length;
}

export function positionFillsStarter(
  roster: Player[],
  position: Position,
): boolean {
  const counts = countByPosition(roster);

  if (dedicatedStarterDeficit(counts, position) > 0) {
    return true;
  }

  return FLEX_POSITIONS.includes(position) && !hasFilledFlex(counts);
}

function takeBest(
  players: Player[],
  position: Position,
): Player | null {
  const index = players.findIndex((player) => player.position === position);
  if (index === -1) {
    return null;
  }

  return players.splice(index, 1)[0];
}

function takeBestFlex(players: Player[]): Player | null {
  const index = players.findIndex((player) =>
    FLEX_POSITIONS.includes(player.position),
  );
  if (index === -1) {
    return null;
  }

  return players.splice(index, 1)[0];
}

export function assignLineup(roster: Player[]): Lineup {
  const remaining = [...roster].sort((left, right) => left.rank - right.rank);
  const starters: Record<string, Player | null> = {
    QB: takeBest(remaining, "QB"),
    RB1: takeBest(remaining, "RB"),
    RB2: takeBest(remaining, "RB"),
    WR1: takeBest(remaining, "WR"),
    WR2: takeBest(remaining, "WR"),
    TE: takeBest(remaining, "TE"),
    FLEX: null,
    K: takeBest(remaining, "K"),
    DST: takeBest(remaining, "DST"),
  };
  starters.FLEX = takeBestFlex(remaining);

  return {
    starters,
    bench: remaining.sort((left, right) => left.rank - right.rank),
  };
}
