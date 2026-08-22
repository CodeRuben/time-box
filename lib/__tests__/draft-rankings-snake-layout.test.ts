import { describe, expect, it } from "vitest";

import { toSnakeRows } from "../draft-rankings/snake-layout";
import type { Player } from "../draft-rankings/types";

function makePlayer(id: number): Player {
  return {
    id,
    rank: id,
    name: `Player ${id}`,
    position: "RB",
    nflTeam: "DET",
    bye: 6,
    headshot: null,
  };
}

describe("toSnakeRows", () => {
  it("keeps odd rounds left-to-right and even rounds right-to-left", () => {
    const players = Array.from({ length: 24 }, (_, index) =>
      makePlayer(index + 1),
    );
    const rows = toSnakeRows(players, 12);

    expect(rows).toHaveLength(2);
    expect(rows[0].map((player) => player?.id)).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 1),
    );
    expect(rows[1].map((player) => player?.id)).toEqual(
      Array.from({ length: 12 }, (_, index) => 24 - index),
    );
  });

  it("right-aligns a short even round with empty slots", () => {
    const players = Array.from({ length: 14 }, (_, index) =>
      makePlayer(index + 1),
    );
    const rows = toSnakeRows(players, 12);

    expect(rows[1].map((player) => player?.id ?? null)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      14,
      13,
    ]);
  });
});
