import { TOTAL_ROUNDS } from "./types";

export function getTotalPicks(teamCount: number): number {
  return teamCount * TOTAL_ROUNDS;
}

export function getRound(overall: number, teamCount: number): number {
  return Math.floor((overall - 1) / teamCount) + 1;
}

export function getSlotOnClock(overall: number, teamCount: number): number {
  const round = getRound(overall, teamCount);
  const indexInRound = (overall - 1) % teamCount;

  return round % 2 === 1 ? indexInRound + 1 : teamCount - indexInRound;
}

export function getOverallPick(
  round: number,
  slot: number,
  teamCount: number,
): number {
  const roundStart = (round - 1) * teamCount;
  const indexInRound = round % 2 === 1 ? slot - 1 : teamCount - slot;

  return roundStart + indexInRound + 1;
}

export function getTeamOveralls(slot: number, teamCount: number): number[] {
  return Array.from({ length: TOTAL_ROUNDS }, (_, index) =>
    getOverallPick(index + 1, slot, teamCount),
  );
}

export function getNextOverallForSlot(
  currentOverall: number,
  slot: number,
  teamCount: number,
): number | null {
  return (
    getTeamOveralls(slot, teamCount).find(
      (overall) => overall >= currentOverall,
    ) ?? null
  );
}
