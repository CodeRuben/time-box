import { describe, expect, it } from "vitest";

import {
  CONTINGENT_UPSIDE_DEPENDENCY_BY_PLAYER_KEY,
  INJURY_RISK_PLAYER_KEYS,
  ROOKIE_PLAYER_KEYS,
  SEASON_OPENING_DATE,
  TEAM_OFFENSE_PROJECTED_POINTS_PER_GAME,
  TEAM_OFFENSE_PROJECTIONS,
  VETERAN_AGE_THRESHOLDS,
  VETERAN_BIRTH_DATES_BY_PLAYER_KEY,
} from "../draft-rankings/player-signal-data";
import {
  calculateAgeOnDate,
  getPlayerSignals,
} from "../draft-rankings/player-signals";
import { BYE_WEEKS, PLAYERS } from "../draft-rankings/players";

describe("draft rankings player signals", () => {
  it("calculates age at the season boundary", () => {
    expect(calculateAgeOnDate("1995-09-09", "2026-09-09")).toBe(31);
    expect(calculateAgeOnDate("1995-09-10", "2026-09-09")).toBe(30);
    expect(() => calculateAgeOnDate("1995-02-30", "2026-09-09")).toThrow(
      "Invalid calendar date",
    );
  });

  it("assigns unique stable player keys from ESPN ids and team codes", () => {
    const keys = new Set(PLAYERS.map((player) => player.key));

    expect(keys.size).toBe(PLAYERS.length);
    expect(
      PLAYERS.filter((player) => player.position === "DST").every((player) =>
        player.key.startsWith("team:"),
      ),
    ).toBe(true);
    expect(
      PLAYERS.filter((player) => player.position !== "DST").every((player) =>
        player.key.startsWith("espn:"),
      ),
    ).toBe(true);
  });

  it("derives offense rank and tier from projected points per game", () => {
    const projections = Object.values(TEAM_OFFENSE_PROJECTIONS);
    const tierCounts = projections.reduce<Record<string, number>>(
      (counts, projection) => ({
        ...counts,
        [projection.tier]: (counts[projection.tier] ?? 0) + 1,
      }),
      {},
    );

    expect(
      Object.keys(TEAM_OFFENSE_PROJECTED_POINTS_PER_GAME).sort(),
    ).toEqual(Object.keys(BYE_WEEKS).sort());
    expect(projections).toHaveLength(32);
    expect(
      projections
        .map((projection) => projection.rank)
        .sort((left, right) => left - right),
    ).toEqual(Array.from({ length: 32 }, (_, index) => index + 1));
    expect(tierCounts).toEqual({ good: 10, mid: 12, bad: 10 });
    expect(TEAM_OFFENSE_PROJECTIONS.LAR.tier).toBe("good");
    expect(TEAM_OFFENSE_PROJECTIONS.LAR.rank).toBe(1);
    expect(TEAM_OFFENSE_PROJECTIONS.KC.tier).toBe("mid");
    expect(TEAM_OFFENSE_PROJECTIONS.NO.tier).toBe("bad");
  });

  it("resolves every curated player key to an eligible Board player", () => {
    const curatedKeys = new Set([
      ...Object.keys(VETERAN_BIRTH_DATES_BY_PLAYER_KEY),
      ...INJURY_RISK_PLAYER_KEYS,
      ...ROOKIE_PLAYER_KEYS,
      ...Object.keys(CONTINGENT_UPSIDE_DEPENDENCY_BY_PLAYER_KEY),
      ...Object.values(CONTINGENT_UPSIDE_DEPENDENCY_BY_PLAYER_KEY),
    ]);

    for (const key of curatedKeys) {
      const player = PLAYERS.find((candidate) => candidate.key === key);

      expect(player, key).toBeDefined();
      expect(player?.position).not.toBe("K");
      expect(player?.position).not.toBe("DST");
    }

    expect(Object.keys(VETERAN_BIRTH_DATES_BY_PLAYER_KEY)).toHaveLength(29);
    expect(INJURY_RISK_PLAYER_KEYS.size).toBe(25);
    expect(ROOKIE_PLAYER_KEYS.size).toBe(29);
    expect(Object.keys(CONTINGENT_UPSIDE_DEPENDENCY_BY_PLAYER_KEY)).toHaveLength(
      8,
    );
  });

  it("tags expanded-board rookies, injury risks, and handcuffs", () => {
    const byName = (name: string) => {
      const player = PLAYERS.find((candidate) => candidate.name === name);
      if (!player) {
        throw new Error(`Missing board player: ${name}`);
      }
      return player;
    };

    const kinds = (name: string) =>
      new Set(byName(name).signals.map((signal) => signal.kind));

    expect(kinds("Fernando Mendoza").has("rookie")).toBe(true);
    expect(kinds("Kaelon Black").has("rookie")).toBe(true);
    expect(kinds("Calvin Austin").has("injury-risk")).toBe(true);
    expect(kinds("Aaron Rodgers").has("veteran-age")).toBe(true);

    const allen = byName("Braelon Allen").signals.find(
      (signal) => signal.kind === "contingent-upside",
    );
    expect(allen).toMatchObject({ dependencyKey: "espn:4427366" });

    const corum = byName("Blake Corum").signals.find(
      (signal) => signal.kind === "contingent-upside",
    );
    expect(corum).toMatchObject({ dependencyKey: "espn:4430737" });
  });

  it("derives veteran-age from stored birth dates and the position cutoff", () => {
    for (const [key, birthDate] of Object.entries(
      VETERAN_BIRTH_DATES_BY_PLAYER_KEY,
    )) {
      const player = PLAYERS.find((candidate) => candidate.key === key);
      if (!player || !birthDate) {
        continue;
      }

      const threshold = VETERAN_AGE_THRESHOLDS[player.position];
      const age = calculateAgeOnDate(birthDate, SEASON_OPENING_DATE);
      const hasVeteranAge = player.signals.some(
        (signal) => signal.kind === "veteran-age",
      );

      expect(hasVeteranAge, player.name).toBe(
        threshold !== undefined && age >= threshold,
      );
    }
  });

  it("hides mid-tier offense data and all signals for K and DST", () => {
    for (const player of PLAYERS) {
      const projection = TEAM_OFFENSE_PROJECTIONS[player.nflTeam];
      const offenseSignal = player.signals.find(
        (signal) => signal.kind === "offense-tier",
      );

      if (player.position === "K" || player.position === "DST") {
        expect(getPlayerSignals(player)).toEqual([]);
        continue;
      }

      if (projection.tier === "mid") {
        expect(offenseSignal).toBeUndefined();
      }
    }
  });

  it("does not duplicate a signal kind on one player", () => {
    for (const player of PLAYERS) {
      const kinds = player.signals.map((signal) => signal.kind);

      expect(new Set(kinds).size, player.name).toBe(kinds.length);
    }
  });
});
