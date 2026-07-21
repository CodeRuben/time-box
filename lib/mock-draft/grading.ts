import { getTeamRoster } from "./engine";
import { PLAYERS } from "./players";
import { assignLineup } from "./roster";
import type { DraftState, Player, Position } from "./types";
import { playerValue } from "./value";

export interface PickCallout {
  playerId: number;
  overall: number;
  delta: number;
}

export interface TeamGrade {
  slot: number;
  name: string;
  isUser: boolean;
  score: number;
  leagueRank: number;
  letter: string;
  starterValue: number;
  benchValue: number;
  penalties: {
    unfilledStarters: number;
    byeStacks: number;
  };
  positionValue: Record<Position, number>;
  bestValue: PickCallout | null;
  biggestReach: PickCallout | null;
}

const LETTER_THRESHOLDS = [
  [0.98, "A+"],
  [0.95, "A"],
  [0.92, "A−"],
  [0.89, "B+"],
  [0.86, "B"],
  [0.83, "B−"],
  [0.8, "C+"],
  [0.77, "C"],
  [0.74, "C−"],
  [0.68, "D"],
] as const;

export function getLetterGrade(score: number, topScore: number): string {
  if (score <= 0 || topScore <= 0) {
    return "F";
  }

  const ratio = score / topScore;
  return (
    LETTER_THRESHOLDS.find(([threshold]) => ratio >= threshold)?.[1] ?? "F"
  );
}

function sumValue(players: Player[]): number {
  return players.reduce((total, player) => total + playerValue(player.rank), 0);
}

function getByeStackPenalty(starters: Array<Player | null>): number {
  const counts = new Map<number, number>();
  for (const player of starters) {
    if (player) {
      counts.set(player.bye, (counts.get(player.bye) ?? 0) + 1);
    }
  }

  return [...counts.values()].reduce(
    (penalty, count) => penalty + Math.max(0, count - 1) * 4,
    0,
  );
}

function getPositionValue(roster: Player[]): Record<Position, number> {
  const values: Record<Position, number> = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
    DST: 0,
  };

  for (const player of roster) {
    values[player.position] += playerValue(player.rank);
  }

  return values;
}

function getCallouts(
  state: DraftState,
  slot: number,
): Pick<PickCallout, "playerId" | "overall" | "delta">[] {
  const ranksById = new Map(PLAYERS.map(({ id, rank }) => [id, rank]));

  return state.picks
    .filter((pick) => pick.slot === slot)
    .flatMap((pick) => {
      const rank = ranksById.get(pick.playerId);
      return rank === undefined
        ? []
        : [
            {
              playerId: pick.playerId,
              overall: pick.overall,
              delta: pick.overall - rank,
            },
          ];
    });
}

function getBestValue(callouts: PickCallout[]): PickCallout | null {
  const best = [...callouts].sort(
    (left, right) => right.delta - left.delta,
  )[0];
  return best && best.delta >= 5 ? best : null;
}

function getBiggestReach(callouts: PickCallout[]): PickCallout | null {
  const reach = [...callouts].sort(
    (left, right) => left.delta - right.delta,
  )[0];
  return reach && reach.delta <= -5 ? reach : null;
}

function gradeTeam(state: DraftState, slot: number): Omit<TeamGrade, "leagueRank" | "letter"> {
  const team = state.teams.find((candidate) => candidate.slot === slot);
  if (!team) {
    throw new Error(`Missing team for slot ${slot}`);
  }

  const roster = getTeamRoster(state, slot);
  const lineup = assignLineup(roster);
  const starters = Object.values(lineup.starters);
  const filledStarters = starters.filter(
    (player): player is Player => player !== null,
  );
  const starterValue = sumValue(filledStarters);
  const benchValue = sumValue(lineup.bench);
  const penalties = {
    unfilledStarters: starters.filter((player) => player === null).length * 15,
    byeStacks: getByeStackPenalty(starters),
  };
  const score = Number(
    (
      starterValue +
      benchValue * 0.25 -
      penalties.unfilledStarters -
      penalties.byeStacks
    ).toFixed(1),
  );
  const callouts = getCallouts(state, slot);

  return {
    slot,
    name: team.name,
    isUser: team.isUser,
    score,
    starterValue,
    benchValue,
    penalties,
    positionValue: getPositionValue(roster),
    bestValue: getBestValue(callouts),
    biggestReach: getBiggestReach(callouts),
  };
}

export function gradeDraft(state: DraftState): TeamGrade[] {
  const grades = state.teams
    .map((team) => gradeTeam(state, team.slot))
    .sort((left, right) => right.score - left.score || left.slot - right.slot);
  const topScore = grades[0]?.score ?? 0;

  return grades.map((grade, index) => ({
    ...grade,
    leagueRank: index + 1,
    letter: getLetterGrade(grade.score, topScore),
  }));
}
