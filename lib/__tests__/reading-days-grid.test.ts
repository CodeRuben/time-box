import { describe, expect, it } from "vitest";

import { getMonthGridCells } from "../reading-days-grid";

describe("getMonthGridCells", () => {
  it("pads a month so every week is complete, Sunday-start", () => {
    // July 2026 starts on a Wednesday.
    const cells = getMonthGridCells(new Date(2026, 6, 1));
    expect(cells.length % 7).toBe(0);

    const firstCurrentMonthCell = cells.find((cell) => cell.isCurrentMonth);
    expect(firstCurrentMonthCell?.date).toBe("2026-07-01");

    // Padding before the 1st belongs to June; padding after the 31st to August.
    const leadingPadding = cells.filter((cell) => cell.date < "2026-07-01");
    const trailingPadding = cells.filter((cell) => cell.date > "2026-07-31");
    expect(leadingPadding.every((cell) => !cell.isCurrentMonth)).toBe(true);
    expect(trailingPadding.every((cell) => !cell.isCurrentMonth)).toBe(true);
    expect(leadingPadding.length).toBeGreaterThan(0);
  });

  it("handles a leap February correctly", () => {
    const cells = getMonthGridCells(new Date(2028, 1, 1));
    const februaryCells = cells.filter(
      (cell) => cell.isCurrentMonth && cell.date.startsWith("2028-02")
    );
    expect(februaryCells).toHaveLength(29);
  });
});
