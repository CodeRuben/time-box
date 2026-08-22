import { describe, expect, it } from "vitest";

import { PLAYERS } from "../draft-rankings/players";
import { reorderIds } from "../draft-rankings/reorder";
import {
  getDefaultPlayerIds,
  parseDraftRankingsState,
  repairPlayerIds,
} from "../draft-rankings/storage";

describe("reorderIds", () => {
  it("moves an id before another id", () => {
    expect(reorderIds([1, 2, 3, 4], 4, 2)).toEqual([1, 4, 2, 3]);
  });

  it("returns the same array when active and over match", () => {
    const ids = [1, 2, 3];
    expect(reorderIds(ids, 2, 2)).toBe(ids);
  });

  it("returns the same array when an id is missing", () => {
    const ids = [1, 2, 3];
    expect(reorderIds(ids, 9, 2)).toBe(ids);
    expect(reorderIds(ids, 1, 9)).toBe(ids);
  });
});

describe("repairPlayerIds", () => {
  it("keeps a complete valid order", () => {
    const defaults = getDefaultPlayerIds();
    expect(repairPlayerIds(defaults)).toEqual(defaults);
  });

  it("drops unknown and duplicate ids, then appends missing ones", () => {
    const first = PLAYERS[0].id;
    const second = PLAYERS[1].id;
    const last = PLAYERS[PLAYERS.length - 1].id;

    const repaired = repairPlayerIds([second, 99999, second, first]);

    expect(repaired[0]).toBe(second);
    expect(repaired[1]).toBe(first);
    expect(repaired).toContain(last);
    expect(repaired).toHaveLength(PLAYERS.length);
    expect(new Set(repaired).size).toBe(PLAYERS.length);
  });
});

describe("parseDraftRankingsState", () => {
  it("migrates a legacy id array", () => {
    const ids = getDefaultPlayerIds().slice().reverse();
    expect(parseDraftRankingsState(ids)).toEqual({
      ids: repairPlayerIds(ids),
      draftedIds: [],
      draftMode: false,
    });
  });

  it("reads live-draft fields from the object format", () => {
    const first = PLAYERS[0].id;
    const second = PLAYERS[1].id;

    expect(
      parseDraftRankingsState({
        ids: [second, first],
        draftedIds: [first, 99999, first],
        draftMode: true,
      })
    ).toMatchObject({
      ids: expect.arrayContaining([first, second]),
      draftedIds: [first],
      draftMode: true,
    });
  });

  it("returns null for invalid payloads", () => {
    expect(parseDraftRankingsState({ ids: "nope" })).toBeNull();
    expect(parseDraftRankingsState(null)).toBeNull();
  });
});
