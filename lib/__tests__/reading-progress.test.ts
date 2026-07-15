import { describe, expect, it } from "vitest";

import {
  formatRating,
  getCurrentPage,
  getPagesReadByDate,
  getProgressPercent,
} from "../reading-progress";

describe("getCurrentPage", () => {
  it("returns null for an empty list", () => {
    expect(getCurrentPage([])).toBeNull();
  });

  it("returns the page of a single entry", () => {
    expect(getCurrentPage([{ date: "2026-07-01", currentPage: 42 }])).toBe(42);
  });

  it("picks the latest date regardless of array order", () => {
    const entries = [
      { date: "2026-07-03", currentPage: 90 },
      { date: "2026-07-01", currentPage: 10 },
      { date: "2026-07-02", currentPage: 50 },
    ];
    expect(getCurrentPage(entries)).toBe(90);
  });

  it("skips entries with a null current page", () => {
    const entries = [
      { date: "2026-07-01", currentPage: 10 },
      { date: "2026-07-02", currentPage: null },
    ];
    expect(getCurrentPage(entries)).toBe(10);
  });

  it("still returns the latest-dated page when it moved backwards", () => {
    const entries = [
      { date: "2026-07-01", currentPage: 100 },
      { date: "2026-07-02", currentPage: 30 },
    ];
    expect(getCurrentPage(entries)).toBe(30);
  });
});

describe("getProgressPercent", () => {
  it("computes a normal percentage", () => {
    expect(getProgressPercent(50, 200)).toBe(25);
  });

  it("returns null when current page is null", () => {
    expect(getProgressPercent(null, 200)).toBeNull();
  });

  it("returns null when total pages is null", () => {
    expect(getProgressPercent(50, null)).toBeNull();
  });

  it("returns null when total pages is zero", () => {
    expect(getProgressPercent(50, 0)).toBeNull();
  });

  it("caps at 100 when current page exceeds total pages", () => {
    expect(getProgressPercent(250, 200)).toBe(100);
  });
});

describe("getPagesReadByDate", () => {
  it("uses the first entry's page as its baseline", () => {
    const result = getPagesReadByDate([{ date: "2026-07-01", currentPage: 40 }]);
    expect(result.get("2026-07-01")).toBe(40);
  });

  it("diffs consecutive entries", () => {
    const result = getPagesReadByDate([
      { date: "2026-07-01", currentPage: 40 },
      { date: "2026-07-02", currentPage: 90 },
    ]);
    expect(result.get("2026-07-01")).toBe(40);
    expect(result.get("2026-07-02")).toBe(50);
  });

  it("clamps a negative diff to 0", () => {
    const result = getPagesReadByDate([
      { date: "2026-07-01", currentPage: 90 },
      { date: "2026-07-02", currentPage: 40 },
    ]);
    expect(result.get("2026-07-02")).toBe(0);
  });

  it("skips entries with a null page and does not affect the diff baseline", () => {
    const result = getPagesReadByDate([
      { date: "2026-07-01", currentPage: 40 },
      { date: "2026-07-02", currentPage: null },
      { date: "2026-07-03", currentPage: 60 },
    ]);
    expect(result.has("2026-07-02")).toBe(false);
    expect(result.get("2026-07-03")).toBe(20);
  });
});

describe("formatRating", () => {
  it("formats a whole-star rating", () => {
    expect(formatRating(20)).toBe("5");
  });

  it("formats a quarter-star rating", () => {
    expect(formatRating(15)).toBe("3.75");
  });

  it("formats null as an empty string", () => {
    expect(formatRating(null)).toBe("");
  });
});
