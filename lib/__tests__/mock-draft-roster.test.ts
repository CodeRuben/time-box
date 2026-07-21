import { describe, expect, it } from "vitest";

import {
  assignLineup,
  countByPosition,
  getUnfilledStarterSlots,
  mustFillStartersOnly,
  positionFillsStarter,
  withinCaps,
} from "../mock-draft/roster";
import type { Player, Position } from "../mock-draft/types";

function player(
  id: number,
  rank: number,
  position: Position,
  name = `${position} ${id}`,
): Player {
  return {
    id,
    rank,
    name,
    position,
    nflTeam: "DET",
    bye: 6,
    headshot: null,
  };
}

describe("mock draft roster rules", () => {
  it("counts positions and enforces hard caps", () => {
    const roster = Array.from({ length: 6 }, (_, index) =>
      player(index + 1, index + 1, "RB"),
    );

    expect(countByPosition(roster).RB).toBe(6);
    expect(withinCaps(roster, "RB")).toBe(false);
    expect(withinCaps(roster, "WR")).toBe(true);
  });

  it("treats a third running back as a filled FLEX", () => {
    const roster = [player(1, 1, "RB"), player(2, 2, "RB"), player(3, 3, "RB")];

    expect(getUnfilledStarterSlots(roster)).not.toContain("FLEX");
  });

  it("leaves TE and FLEX open without an eligible surplus", () => {
    const roster = [
      player(1, 1, "RB"),
      player(2, 2, "RB"),
      player(3, 3, "WR"),
      player(4, 4, "WR"),
    ];

    expect(getUnfilledStarterSlots(roster)).toEqual(
      expect.arrayContaining(["TE", "FLEX"]),
    );
    expect(positionFillsStarter(roster, "RB")).toBe(true);
    expect(positionFillsStarter(roster, "K")).toBe(true);
  });

  it("forces starter needs when remaining picks equal the deficit", () => {
    const roster = [
      player(1, 1, "QB"),
      player(2, 2, "RB"),
      player(3, 3, "RB"),
      player(4, 4, "RB"),
      player(5, 5, "WR"),
      player(6, 6, "WR"),
      player(7, 7, "TE"),
    ];

    expect(getUnfilledStarterSlots(roster)).toEqual(["K", "DST"]);
    expect(mustFillStartersOnly(roster, 2)).toBe(true);
    expect(mustFillStartersOnly(roster, 3)).toBe(false);
  });

  it("assigns the best players to starters and best surplus to FLEX", () => {
    const roster = [
      player(1, 20, "QB", "Worse QB"),
      player(2, 10, "QB", "Best QB"),
      player(3, 8, "RB", "RB One"),
      player(4, 15, "RB", "RB Two"),
      player(5, 30, "RB", "Flex RB"),
      player(6, 5, "WR", "WR One"),
      player(7, 12, "WR", "WR Two"),
      player(8, 40, "WR", "Bench WR"),
      player(9, 18, "TE", "TE One"),
      player(10, 50, "K"),
      player(11, 51, "DST"),
    ];

    const lineup = assignLineup(roster);

    expect(lineup.starters.QB?.name).toBe("Best QB");
    expect(lineup.starters.RB1?.name).toBe("RB One");
    expect(lineup.starters.RB2?.name).toBe("RB Two");
    expect(lineup.starters.WR1?.name).toBe("WR One");
    expect(lineup.starters.WR2?.name).toBe("WR Two");
    expect(lineup.starters.FLEX?.name).toBe("Flex RB");
    expect(lineup.bench.map(({ rank }) => rank)).toEqual([20, 40]);
  });
});
