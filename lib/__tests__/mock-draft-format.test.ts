import { describe, expect, it } from "vitest";

import {
  formatClock,
  formatOrdinal,
  formatPickLabel,
} from "../mock-draft/format";

describe("mock draft display formatting", () => {
  it("formats round and pick labels", () => {
    expect(formatPickLabel(5, 3)).toBe("5.03");
    expect(formatPickLabel(12, 10)).toBe("12.10");
  });

  it("formats countdowns without going below zero", () => {
    expect(formatClock(90)).toBe("01:30");
    expect(formatClock(9.2)).toBe("00:10");
    expect(formatClock(-1)).toBe("00:00");
  });

  it("formats ordinal standings", () => {
    expect(formatOrdinal(1)).toBe("1st");
    expect(formatOrdinal(2)).toBe("2nd");
    expect(formatOrdinal(3)).toBe("3rd");
    expect(formatOrdinal(11)).toBe("11th");
    expect(formatOrdinal(23)).toBe("23rd");
  });
});
