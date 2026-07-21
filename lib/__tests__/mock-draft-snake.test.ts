import { describe, expect, it } from "vitest";

import {
  getNextOverallForSlot,
  getOverallPick,
  getRound,
  getSlotOnClock,
  getTeamOveralls,
  getTotalPicks,
} from "../mock-draft/snake";

describe("mock draft snake order", () => {
  for (const teamCount of [8, 10, 12]) {
    it(`round-trips every pick in a ${teamCount}-team draft`, () => {
      for (let overall = 1; overall <= getTotalPicks(teamCount); overall += 1) {
        const round = getRound(overall, teamCount);
        const slot = getSlotOnClock(overall, teamCount);

        expect(getOverallPick(round, slot, teamCount)).toBe(overall);
      }
    });

    it(`returns 14 increasing picks per slot with ${teamCount} teams`, () => {
      for (let slot = 1; slot <= teamCount; slot += 1) {
        const overalls = getTeamOveralls(slot, teamCount);

        expect(overalls).toHaveLength(14);
        expect(overalls).toEqual([...overalls].sort((a, b) => a - b));
      }
    });
  }

  it("reverses the order in even rounds", () => {
    expect(getRound(13, 12)).toBe(2);
    expect(getSlotOnClock(13, 12)).toBe(12);
    expect(getSlotOnClock(24, 12)).toBe(1);
  });

  it("gives turn slots back-to-back picks", () => {
    expect(getTeamOveralls(12, 12).slice(0, 2)).toEqual([12, 13]);
    expect(getTeamOveralls(1, 12).slice(1, 3)).toEqual([24, 25]);
  });

  it("finds a slot's next pick at or after the current overall", () => {
    expect(getNextOverallForSlot(13, 1, 12)).toBe(24);
    expect(getNextOverallForSlot(24, 1, 12)).toBe(24);
    expect(getNextOverallForSlot(169, 1, 12)).toBeNull();
  });
});
