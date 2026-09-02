import { NFL_SCHEDULE_2026 } from "./nfl-schedule-2026";
import { TEAM_OFFENSE_PROJECTIONS } from "./player-signal-data";
import { NFL_TEAMS, type NflTeam, type OffenseTier } from "./types";

const HARD_SCHEDULE_MAX_RANK = 10;
const AVERAGE_SCHEDULE_MAX_RANK = 22;
const REGULAR_SEASON_WEEKS = 18;

export type DefenseScheduleDifficulty = "easy" | "average" | "hard";

export interface DefenseScheduleMatchup {
  kind: "matchup";
  week: number;
  opponent: NflTeam;
  location: "home" | "away";
  opponentOffenseTier: OffenseTier;
  difficulty: DefenseScheduleDifficulty;
}

export interface DefenseScheduleBye {
  week: number;
  kind: "bye";
}

export type DefenseScheduleWeek = DefenseScheduleMatchup | DefenseScheduleBye;

export interface DefenseSchedule {
  team: NflTeam;
  weeks: readonly DefenseScheduleWeek[];
  averageOpponentProjectedPointsPerGame: number;
  rank: number;
  difficulty: DefenseScheduleDifficulty;
}

function getMatchupDifficulty(
  offenseTier: OffenseTier,
): DefenseScheduleDifficulty {
  switch (offenseTier) {
    case "good":
      return "hard";
    case "mid":
      return "average";
    case "bad":
      return "easy";
  }
}

function getTeamScheduleWeeks(team: NflTeam): DefenseScheduleWeek[] {
  const matchupsByWeek = new Map<
    number,
    { opponent: NflTeam; location: "home" | "away" }
  >();

  for (const game of NFL_SCHEDULE_2026) {
    if (game.homeTeam === team) {
      matchupsByWeek.set(game.week, {
        opponent: game.awayTeam,
        location: "home",
      });
    }

    if (game.awayTeam === team) {
      matchupsByWeek.set(game.week, {
        opponent: game.homeTeam,
        location: "away",
      });
    }
  }

  return Array.from({ length: REGULAR_SEASON_WEEKS }, (_, index) => {
    const week = index + 1;
    const matchup = matchupsByWeek.get(week);

    if (!matchup) {
      return { week, kind: "bye" };
    }

    const opponentProjection = TEAM_OFFENSE_PROJECTIONS[matchup.opponent];

    return {
      kind: "matchup",
      week,
      opponent: matchup.opponent,
      location: matchup.location,
      opponentOffenseTier: opponentProjection.tier,
      difficulty: getMatchupDifficulty(opponentProjection.tier),
    };
  });
}

function getAverageOpponentProjectedPointsPerGame(
  weeks: readonly DefenseScheduleWeek[],
): number {
  const matchups = weeks.filter(
    (week): week is DefenseScheduleMatchup => week.kind === "matchup",
  );
  const totalProjectedPoints = matchups.reduce(
    (total, matchup) =>
      total + TEAM_OFFENSE_PROJECTIONS[matchup.opponent].projectedPointsPerGame,
    0,
  );

  return totalProjectedPoints / matchups.length;
}

function getScheduleDifficulty(rank: number): DefenseScheduleDifficulty {
  if (rank <= HARD_SCHEDULE_MAX_RANK) {
    return "hard";
  }

  if (rank <= AVERAGE_SCHEDULE_MAX_RANK) {
    return "average";
  }

  return "easy";
}

function deriveDefenseSchedules(): Record<NflTeam, DefenseSchedule> {
  const schedules = NFL_TEAMS.map((team) => {
    const weeks = getTeamScheduleWeeks(team);

    return {
      team,
      weeks,
      averageOpponentProjectedPointsPerGame:
        getAverageOpponentProjectedPointsPerGame(weeks),
    };
  }).sort(
    (left, right) =>
      right.averageOpponentProjectedPointsPerGame -
        left.averageOpponentProjectedPointsPerGame || left.team.localeCompare(right.team),
  );

  const schedulesByTeam = {} as Record<NflTeam, DefenseSchedule>;

  for (const [index, schedule] of schedules.entries()) {
    const rank = index + 1;
    schedulesByTeam[schedule.team] = {
      ...schedule,
      rank,
      difficulty: getScheduleDifficulty(rank),
    };
  }

  return schedulesByTeam;
}

export const DEFENSE_SCHEDULES_2026: Readonly<Record<NflTeam, DefenseSchedule>> =
  deriveDefenseSchedules();

export function getDefenseSchedule(team: NflTeam): DefenseSchedule {
  return DEFENSE_SCHEDULES_2026[team];
}
