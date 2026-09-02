import { describe, expect, it } from "vitest";

import {
  DEFENSE_SCHEDULES_2026,
  getDefenseSchedule,
  type DefenseScheduleMatchup,
} from "../draft-rankings/defense-schedule";
import { BYE_WEEKS } from "../draft-rankings/nfl-bye-weeks";
import { NFL_SCHEDULE_2026 } from "../draft-rankings/nfl-schedule-2026";
import { TEAM_OFFENSE_PROJECTIONS } from "../draft-rankings/player-signal-data";
import { NFL_TEAMS } from "../draft-rankings/types";

function isMatchup(
  week: (typeof DEFENSE_SCHEDULES_2026)[keyof typeof DEFENSE_SCHEDULES_2026]["weeks"][number],
): week is DefenseScheduleMatchup {
  return week.kind === "matchup";
}

describe("defense schedules", () => {
  it("mirrors every scheduled matchup for both teams", () => {
    for (const game of NFL_SCHEDULE_2026) {
      const homeWeek = getDefenseSchedule(game.homeTeam).weeks[game.week - 1];
      const awayWeek = getDefenseSchedule(game.awayTeam).weeks[game.week - 1];

      expect(isMatchup(homeWeek)).toBe(true);
      expect(isMatchup(awayWeek)).toBe(true);

      if (isMatchup(homeWeek) && isMatchup(awayWeek)) {
        expect(homeWeek).toMatchObject({
          opponent: game.awayTeam,
          location: "home",
        });
        expect(awayWeek).toMatchObject({
          opponent: game.homeTeam,
          location: "away",
        });
      }
    }
  });

  it("gives every team 17 matchups and one derived bye", () => {
    for (const team of NFL_TEAMS) {
      const schedule = getDefenseSchedule(team);
      const matchups = schedule.weeks.filter(isMatchup);
      const byeWeeks = schedule.weeks.filter(
        (week) => week.kind === "bye",
      );

      expect(schedule.weeks).toHaveLength(18);
      expect(matchups).toHaveLength(17);
      expect(byeWeeks).toEqual([{ week: BYE_WEEKS[team], kind: "bye" }]);
    }
  });

  it("matches previously hand-maintained bye weeks for spot-check teams", () => {
    expect(BYE_WEEKS.HOU).toBe(8);
    expect(BYE_WEEKS.DEN).toBe(10);
    expect(BYE_WEEKS.PHI).toBe(10);
  });

  it("ranks all schedules by opponent projected scoring", () => {
    const schedules = Object.values(DEFENSE_SCHEDULES_2026);
    const sortedSchedules = [...schedules].sort(
      (left, right) =>
        right.averageOpponentProjectedPointsPerGame -
          left.averageOpponentProjectedPointsPerGame ||
        left.team.localeCompare(right.team),
    );

    expect(schedules).toHaveLength(32);
    expect(sortedSchedules.map((schedule) => schedule.rank)).toEqual(
      Array.from({ length: 32 }, (_, index) => index + 1),
    );
    expect(schedules.filter((schedule) => schedule.difficulty === "hard")).toHaveLength(
      10,
    );
    expect(
      schedules.filter((schedule) => schedule.difficulty === "average"),
    ).toHaveLength(12);
    expect(schedules.filter((schedule) => schedule.difficulty === "easy")).toHaveLength(
      10,
    );
  });

  it("calculates opponent scoring averages and matchup difficulty", () => {
    for (const team of NFL_TEAMS) {
      const schedule = getDefenseSchedule(team);
      const matchups = schedule.weeks.filter(isMatchup);
      const expectedAverage =
        matchups.reduce(
          (total, matchup) =>
            total +
            TEAM_OFFENSE_PROJECTIONS[matchup.opponent].projectedPointsPerGame,
          0,
        ) / matchups.length;

      expect(schedule.averageOpponentProjectedPointsPerGame).toBeCloseTo(
        expectedAverage,
      );

      for (const matchup of matchups) {
        const offenseTier =
          TEAM_OFFENSE_PROJECTIONS[matchup.opponent].tier;
        const expectedDifficulty =
          offenseTier === "good"
            ? "hard"
            : offenseTier === "mid"
              ? "average"
              : "easy";

        expect(matchup.opponentOffenseTier).toBe(offenseTier);
        expect(matchup.difficulty).toBe(expectedDifficulty);
      }
    }
  });
});
