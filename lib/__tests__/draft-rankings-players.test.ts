import { describe, expect, it } from "vitest";

import { BYE_WEEKS, PLAYERS } from "../draft-rankings/players";
import type { Position } from "../draft-rankings/types";

const POSITIONS: Position[] = ["QB", "RB", "WR", "TE", "K", "DST"];

describe("draft rankings player data", () => {
  it("has contiguous ranks and stable ids", () => {
    expect(PLAYERS).toHaveLength(218);
    expect(PLAYERS.map(({ rank }) => rank)).toEqual(
      Array.from({ length: 218 }, (_, index) => index + 1),
    );
    expect(PLAYERS.every(({ id, rank }) => id === rank)).toBe(true);
  });

  it("contains the expected number of players at each position", () => {
    const counts = Object.fromEntries(
      POSITIONS.map((position) => [
        position,
        PLAYERS.filter((player) => player.position === position).length,
      ]),
    );

    expect(counts).toEqual({
      QB: 26,
      RB: 62,
      WR: 77,
      TE: 25,
      K: 14,
      DST: 14,
    });
    expect(PLAYERS.every(({ position }) => POSITIONS.includes(position))).toBe(
      true,
    );
  });

  it("maps every player to a valid 2026 bye week", () => {
    expect(Object.keys(BYE_WEEKS)).toHaveLength(32);

    for (const player of PLAYERS) {
      expect(player.nflTeam).toBeTypeOf("string");
      expect(player.nflTeam in BYE_WEEKS).toBe(true);
      expect(player.bye).toBe(BYE_WEEKS[player.nflTeam]);
      expect(player.bye).toBeGreaterThanOrEqual(5);
      expect(player.bye).toBeLessThanOrEqual(14);
      expect(player.bye).not.toBe(12);
    }
  });

  it("has unique ids and player-position pairs", () => {
    const ids = new Set(PLAYERS.map(({ id }) => id));
    const playerPositions = new Set(
      PLAYERS.map(({ name, position }) => `${name}:${position}`),
    );

    expect(ids.size).toBe(PLAYERS.length);
    expect(playerPositions.size).toBe(PLAYERS.length);
  });

  it("assigns verified ESPN headshots with safe fallbacks", () => {
    const playersWithHeadshots = PLAYERS.filter(
      ({ headshot }) => headshot !== null,
    );

    expect(playersWithHeadshots).toHaveLength(172);
    expect(
      playersWithHeadshots.every(({ headshot }) =>
        headshot?.startsWith(
          "https://a.espncdn.com/i/headshots/nfl/players/full/",
        ),
      ),
    ).toBe(true);
  });

  it("does not repeat a franchise among kickers or defenses", () => {
    for (const position of ["K", "DST"] as const) {
      const teams = PLAYERS.filter(
        (player) => player.position === position,
      ).map(({ nflTeam }) => nflTeam);

      expect(new Set(teams).size).toBe(teams.length);
    }
  });

  it("preserves the expert-rank board boundaries", () => {
    expect(PLAYERS[0]).toMatchObject({
      rank: 1,
      name: "Jahmyr Gibbs",
      position: "RB",
    });
    expect(PLAYERS[1]).toMatchObject({
      rank: 2,
      name: "Bijan Robinson",
      position: "RB",
    });
    expect(PLAYERS[2]).toMatchObject({
      rank: 3,
      name: "Ja'Marr Chase",
      position: "WR",
    });
    expect(PLAYERS[7]).toMatchObject({
      rank: 8,
      name: "Jonathan Taylor",
      position: "RB",
    });
    expect(PLAYERS[10]).toMatchObject({
      rank: 11,
      name: "Justin Jefferson",
      position: "WR",
    });
  });
});
