import { describe, expect, it } from "vitest";

import { repairDraftedIds, toggleDraftedId } from "../draft-rankings/drafted";

describe("toggleDraftedId", () => {
  it("marks a player taken", () => {
    expect(toggleDraftedId([1], 4)).toEqual([1, 4]);
  });

  it("marks a taken player available again", () => {
    expect(toggleDraftedId([1, 4], 1)).toEqual([4]);
  });
});

describe("repairDraftedIds", () => {
  it("drops unknown and duplicate ids", () => {
    expect(repairDraftedIds([2, 999, 2, 1], new Set([1, 2, 3]))).toEqual([
      2, 1,
    ]);
  });
});
