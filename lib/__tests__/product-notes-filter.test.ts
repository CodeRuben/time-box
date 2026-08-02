import { describe, expect, it } from "vitest";
import { toProductNoteDto } from "../product-notes/dto";
import { formatNoteUpdatedAt } from "../product-notes/format";
import {
  filterProductNotes,
  isProductAreaFilter,
} from "../product-notes/query";
import type { ProductNoteDto } from "../product-notes/types";

const notes: ProductNoteDto[] = [
  {
    id: "1",
    title: "Add keyboard shortcut for focus board",
    description: "Cmd+K style palette entry",
    productArea: "planner",
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T12:00:00.000Z",
  },
  {
    id: "2",
    title: "Track rest days more clearly",
    description: "",
    productArea: "workouts",
    createdAt: "2026-07-30T10:00:00.000Z",
    updatedAt: "2026-07-31T09:00:00.000Z",
  },
];

describe("toProductNoteDto", () => {
  it("maps row fields to ISO timestamps", () => {
    expect(
      toProductNoteDto({
        id: "abc",
        title: "Hello",
        description: "World",
        productArea: "book_log",
        createdAt: new Date("2026-08-01T10:00:00.000Z"),
        updatedAt: new Date("2026-08-01T11:00:00.000Z"),
      })
    ).toEqual({
      id: "abc",
      title: "Hello",
      description: "World",
      productArea: "book_log",
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-01T11:00:00.000Z",
    });
  });

  it("throws when stored product area is invalid", () => {
    expect(() =>
      toProductNoteDto({
        id: "abc",
        title: "Hello",
        description: "",
        productArea: "settings",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ).toThrow(/Invalid product area/);
  });
});

describe("filterProductNotes", () => {
  it("filters by product area and case-insensitive search across title and description", () => {
    expect(
      filterProductNotes(notes, { search: "", productArea: "workouts" }).map(
        (note) => note.id
      )
    ).toEqual(["2"]);

    expect(
      filterProductNotes(notes, {
        search: "FOCUS",
        productArea: "all",
      }).map((note) => note.id)
    ).toEqual(["1"]);

    expect(
      filterProductNotes(notes, {
        search: "palette",
        productArea: "all",
      }).map((note) => note.id)
    ).toEqual(["1"]);

    expect(
      filterProductNotes(notes, {
        search: "workouts",
        productArea: "all",
      }).map((note) => note.id)
    ).toEqual(["2"]);
  });
});

describe("isProductAreaFilter", () => {
  it("accepts all and known product areas", () => {
    expect(isProductAreaFilter("all")).toBe(true);
    expect(isProductAreaFilter("planner")).toBe(true);
    expect(isProductAreaFilter("settings")).toBe(false);
  });
});

describe("formatNoteUpdatedAt", () => {
  it("returns empty string for invalid dates", () => {
    expect(formatNoteUpdatedAt("not-a-date")).toBe("");
  });

  it("formats valid ISO timestamps", () => {
    const formatted = formatNoteUpdatedAt("2026-08-01T15:30:00.000Z");
    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted).not.toBe("not-a-date");
  });
});
