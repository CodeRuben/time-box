import { describe, expect, it } from "vitest";

import { chooseBotPick } from "../mock-draft/bot";
import { PLAYERS } from "../mock-draft/players";
import { createRng } from "../mock-draft/rng";
import type { Player, Position } from "../mock-draft/types";

function candidate(rank: number, position: Position): Player {
  return {
    id: rank,
    rank,
    name: `${position} ${rank}`,
    position,
    nflTeam: rank % 2 === 0 ? "DET" : "ATL",
    bye: rank % 2 === 0 ? 6 : 11,
    headshot: null,
  };
}

describe("mock draft bot", () => {
  it("never selects a kicker or defense before round 13", () => {
    const available = [
      candidate(1, "K"),
      candidate(2, "DST"),
      candidate(3, "WR"),
    ];

    for (let seed = 0; seed < 50; seed += 1) {
      const selected = chooseBotPick({
        available,
        roster: [],
        archetype: "balanced",
        round: 12,
        overall: 1,
        teamCount: 12,
        remainingPicks: 14,
        rng: createRng(seed),
      });

      expect(selected).toBe(3);
    }
  });

  it("does not select a position already at its cap", () => {
    const roster = Array.from({ length: 6 }, (_, index) =>
      candidate(index + 20, "RB"),
    );
    const selected = chooseBotPick({
      available: [candidate(1, "RB"), candidate(2, "WR")],
      roster,
      archetype: "rbHeavy",
      round: 10,
      overall: 1,
      teamCount: 12,
      remainingPicks: 8,
      rng: createRng(1),
    });

    expect(selected).toBe(2);
  });

  it("selects only a required starter when feasibility requires it", () => {
    const roster = [
      candidate(20, "QB"),
      candidate(21, "RB"),
      candidate(22, "RB"),
      candidate(23, "RB"),
      candidate(24, "WR"),
      candidate(25, "WR"),
      candidate(26, "TE"),
      candidate(27, "K"),
      candidate(28, "RB"),
      candidate(29, "WR"),
      candidate(30, "WR"),
      candidate(31, "WR"),
      candidate(32, "WR"),
    ];
    const selected = chooseBotPick({
      available: [candidate(1, "WR"), candidate(210, "DST")],
      roster,
      archetype: "wrHeavy",
      round: 14,
      overall: 160,
      teamCount: 12,
      remainingPicks: 1,
      rng: createRng(2),
    });

    expect(selected).toBe(210);
  });

  it("immediately takes a player who has fallen by a full round", () => {
    const selected = chooseBotPick({
      available: [candidate(1, "RB"), candidate(14, "WR")],
      roster: [],
      archetype: "zeroRb",
      round: 2,
      overall: 14,
      teamCount: 12,
      remainingPicks: 14,
      rng: createRng(3),
    });

    expect(selected).toBe(1);
  });

  it("never reaches beyond the top eight legal players", () => {
    const available = PLAYERS.filter(
      ({ position }) => position !== "K" && position !== "DST",
    ).slice(20, 40);
    const topEightIds = new Set(available.slice(0, 8).map(({ id }) => id));

    for (let seed = 0; seed < 100; seed += 1) {
      const selected = chooseBotPick({
        available,
        roster: [],
        archetype: "balanced",
        round: 1,
        overall: 1,
        teamCount: 12,
        remainingPicks: 14,
        rng: createRng(seed),
      });

      expect(topEightIds.has(selected)).toBe(true);
    }
  });

  it("makes an early-QB archetype choose QB more often than balanced", () => {
    const available = [
      candidate(27, "RB"),
      candidate(28, "WR"),
      candidate(29, "QB"),
      candidate(30, "RB"),
      candidate(31, "WR"),
      candidate(32, "TE"),
      candidate(33, "RB"),
      candidate(34, "WR"),
    ];
    const countQbPicks = (archetype: "balanced" | "earlyQb") => {
      let count = 0;
      for (let seed = 0; seed < 200; seed += 1) {
        const selected = chooseBotPick({
          available,
          roster: [],
          archetype,
          round: 3,
          overall: 20,
          teamCount: 12,
          remainingPicks: 12,
          rng: createRng(seed),
        });
        if (selected === 29) {
          count += 1;
        }
      }
      return count;
    };

    expect(countQbPicks("earlyQb")).toBeGreaterThan(
      countQbPicks("balanced"),
    );
  });
});
