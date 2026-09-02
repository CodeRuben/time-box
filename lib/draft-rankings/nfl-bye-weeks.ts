import { NFL_SCHEDULE_2026 } from "./nfl-schedule-2026";
import { NFL_TEAMS, type NflTeam } from "./types";

const REGULAR_SEASON_WEEKS = 18;

function deriveByeWeeks(): Record<NflTeam, number> {
  const weeksPlayedByTeam = new Map<NflTeam, Set<number>>(
    NFL_TEAMS.map((team) => [team, new Set<number>()]),
  );

  for (const game of NFL_SCHEDULE_2026) {
    weeksPlayedByTeam.get(game.homeTeam)!.add(game.week);
    weeksPlayedByTeam.get(game.awayTeam)!.add(game.week);
  }

  const byeWeeks = {} as Record<NflTeam, number>;

  for (const team of NFL_TEAMS) {
    const playedWeeks = weeksPlayedByTeam.get(team)!;
    const missingWeeks: number[] = [];

    for (let week = 1; week <= REGULAR_SEASON_WEEKS; week += 1) {
      if (!playedWeeks.has(week)) {
        missingWeeks.push(week);
      }
    }

    if (missingWeeks.length !== 1) {
      throw new Error(
        `${team} is missing ${missingWeeks.length} weeks, expected exactly one bye`,
      );
    }

    byeWeeks[team] = missingWeeks[0]!;
  }

  return byeWeeks;
}

export const BYE_WEEKS: Readonly<Record<NflTeam, number>> = deriveByeWeeks();
