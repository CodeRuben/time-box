import { describe, expect, it } from "vitest";
import {
  getPageCount,
  getPaginationItems,
  paginateItems,
} from "@/lib/book-table-pagination";

describe("paginateItems", () => {
  it("returns the requested page of items", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    expect(paginateItems(items, 1, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(paginateItems(items, 2, 10)).toEqual([11, 12]);
  });

  it("clamps out-of-range pages", () => {
    const items = [1, 2, 3];
    expect(paginateItems(items, 0, 10)).toEqual([1, 2, 3]);
    expect(paginateItems(items, 99, 10)).toEqual([1, 2, 3]);
  });
});

describe("getPageCount", () => {
  it("computes page count from total items", () => {
    expect(getPageCount(0, 10)).toBe(1);
    expect(getPageCount(10, 10)).toBe(1);
    expect(getPageCount(11, 10)).toBe(2);
  });
});

describe("getPaginationItems", () => {
  it("lists every page when there are few pages", () => {
    expect(getPaginationItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("adds ellipses for longer ranges", () => {
    expect(getPaginationItems(1, 12)).toEqual([1, 2, 3, 4, "ellipsis", 12]);
    expect(getPaginationItems(6, 12)).toEqual([
      1,
      "ellipsis",
      5,
      6,
      7,
      "ellipsis",
      12,
    ]);
    expect(getPaginationItems(12, 12)).toEqual([
      1,
      "ellipsis",
      9,
      10,
      11,
      12,
    ]);
  });
});
