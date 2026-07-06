import { describe, expect, it } from "vitest";

import {
  isValidDateParam,
  isValidationError,
  validateBookBody,
  validateEntryBody,
} from "../book-api-helpers";

describe("isValidDateParam", () => {
  it("accepts a well-formed date", () => {
    expect(isValidDateParam("2026-07-04")).toBe(true);
  });

  it("rejects a malformed date", () => {
    expect(isValidDateParam("2026-7-4")).toBe(false);
  });
});

describe("validateBookBody", () => {
  it("requires a title when requireTitle is true", () => {
    const result = validateBookBody({}, { requireTitle: true });
    expect(isValidationError(result)).toBe(true);
  });

  it("allows a missing title when requireTitle is false", () => {
    const result = validateBookBody({ rating: 8 }, { requireTitle: false });
    expect(isValidationError(result)).toBe(false);
  });

  it("rejects an invalid status", () => {
    const result = validateBookBody(
      { title: "Dune", status: "wishlist" },
      { requireTitle: true }
    );
    expect(isValidationError(result)).toBe(true);
  });

  it("rejects a rating of 0", () => {
    const result = validateBookBody({ rating: 0 }, { requireTitle: false });
    expect(isValidationError(result)).toBe(true);
  });

  it("rejects a rating of 11", () => {
    const result = validateBookBody({ rating: 11 }, { requireTitle: false });
    expect(isValidationError(result)).toBe(true);
  });

  it("accepts a null rating", () => {
    const result = validateBookBody({ rating: null }, { requireTitle: false });
    expect(isValidationError(result)).toBe(false);
  });

  it("rejects a badly formatted date", () => {
    const result = validateBookBody(
      { startedOn: "07/04/2026" },
      { requireTitle: false }
    );
    expect(isValidationError(result)).toBe(true);
  });

  it("accepts a fully populated valid body", () => {
    const result = validateBookBody(
      {
        title: "Dune",
        author: "Frank Herbert",
        coverUrl: "https://covers.openlibrary.org/b/id/1-M.jpg",
        totalPages: 412,
        publishedYear: 1965,
        openLibraryKey: "/works/OL893415W",
        status: "reading",
        rating: 9,
        notes: "Great so far.",
        startedOn: "2026-07-01",
        finishedOn: null,
      },
      { requireTitle: true }
    );
    expect(isValidationError(result)).toBe(false);
  });
});

describe("validateEntryBody", () => {
  it("rejects a negative current page", () => {
    const result = validateEntryBody({ currentPage: -5 });
    expect(isValidationError(result)).toBe(true);
  });

  it("accepts an all-empty body", () => {
    const result = validateEntryBody({});
    expect(isValidationError(result)).toBe(false);
  });

  it("rejects a non-string summary", () => {
    const result = validateEntryBody({ summary: 123 });
    expect(isValidationError(result)).toBe(true);
  });
});
