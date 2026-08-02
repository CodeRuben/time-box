import { describe, expect, it } from "vitest";
import {
  parseCreateBody,
  parsePatchBody,
} from "../product-notes/validation";

describe("parseCreateBody", () => {
  it("requires trimmed title, defaults description, and defaults product area to planner", () => {
    expect(
      parseCreateBody({
        title: "  Improve focus board drag  ",
      })
    ).toEqual({
      ok: true,
      value: {
        title: "Improve focus board drag",
        description: "",
        productArea: "planner",
      },
    });
  });

  it("trims description when provided", () => {
    expect(
      parseCreateBody({
        title: "Idea",
        description: "  More detail  ",
      })
    ).toEqual({
      ok: true,
      value: {
        title: "Idea",
        description: "More detail",
        productArea: "planner",
      },
    });
  });

  it("accepts all four product areas", () => {
    for (const productArea of [
      "planner",
      "workouts",
      "book_log",
      "new_page",
    ] as const) {
      expect(
        parseCreateBody({
          title: "Idea",
          productArea,
        })
      ).toEqual({
        ok: true,
        value: { title: "Idea", description: "", productArea },
      });
    }
  });

  it("rejects blank title, unknown areas, and invalid types", () => {
    expect(parseCreateBody({ title: "   " }).ok).toBe(false);
    expect(parseCreateBody({ title: 12 }).ok).toBe(false);
    expect(
      parseCreateBody({ title: "Idea", productArea: "settings" }).ok
    ).toBe(false);
    expect(parseCreateBody({ title: "Idea", description: 3 }).ok).toBe(false);
    expect(parseCreateBody(null).ok).toBe(false);
  });
});

describe("parsePatchBody", () => {
  it("accepts partial patches and trims title and description", () => {
    expect(parsePatchBody({ title: "  Updated idea  " })).toEqual({
      ok: true,
      value: { title: "Updated idea" },
    });

    expect(parsePatchBody({ description: "  Extra detail  " })).toEqual({
      ok: true,
      value: { description: "Extra detail" },
    });

    expect(parsePatchBody({ productArea: "workouts" })).toEqual({
      ok: true,
      value: { productArea: "workouts" },
    });
  });

  it("rejects empty patches, blank title, and invalid areas", () => {
    expect(parsePatchBody({}).ok).toBe(false);
    expect(parsePatchBody({ title: "   " }).ok).toBe(false);
    expect(parsePatchBody({ productArea: "unknown" }).ok).toBe(false);
    expect(parsePatchBody({ title: 3 }).ok).toBe(false);
    expect(parsePatchBody({ description: 3 }).ok).toBe(false);
  });
});
