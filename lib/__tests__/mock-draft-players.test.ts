import { describe, expect, it } from "vitest";

import { BYE_WEEKS, PLAYERS } from "../mock-draft/players";
import type { Position } from "../mock-draft/types";

const POSITIONS: Position[] = ["QB", "RB", "WR", "TE", "K", "DST"];

describe("mock draft player data", () => {
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
      QB: 27,
      RB: 61,
      WR: 76,
      TE: 26,
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

    expect(playersWithHeadshots).toHaveLength(186);
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

  it("preserves the source board boundaries", () => {
    expect(PLAYERS[0]).toMatchObject({
      rank: 1,
      name: "Jahmyr Gibbs",
      position: "RB",
    });
    expect(PLAYERS[199]).toMatchObject({
      rank: 200,
      name: "Eddy Pineiro",
      position: "K",
    });
  });
});
