import { describe, expect, it } from "vitest";
import {
  BOOK_TABLE_PAGE_SIZE,
  BOOK_TABLE_PAGE_SIZE_OPTIONS,
  getPageCount,
  getVisibleBookRange,
  paginateItems,
  parseBookTablePageSize,
} from "@/lib/book-table-pagination";

describe("BOOK_TABLE_PAGE_SIZE_OPTIONS", () => {
  it("includes the default page size", () => {
    expect(BOOK_TABLE_PAGE_SIZE_OPTIONS).toContain(BOOK_TABLE_PAGE_SIZE);
  });
});

describe("parseBookTablePageSize", () => {
  it("accepts known page sizes as strings", () => {
    expect(parseBookTablePageSize("25")).toBe(25);
    expect(parseBookTablePageSize("100")).toBe(100);
  });

  it("rejects unknown values", () => {
    expect(parseBookTablePageSize("15")).toBeNull();
    expect(parseBookTablePageSize("abc")).toBeNull();
  });
});

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

describe("getVisibleBookRange", () => {
  it("returns zeros when there are no books", () => {
    expect(getVisibleBookRange(0, 1, 25)).toEqual({ first: 0, last: 0 });
  });

  it("returns the inclusive range for the current page", () => {
    expect(getVisibleBookRange(87, 2, 25)).toEqual({ first: 26, last: 50 });
    expect(getVisibleBookRange(87, 4, 25)).toEqual({ first: 76, last: 87 });
  });
});
