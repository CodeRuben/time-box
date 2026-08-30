import { describe, expect, it } from "vitest";

import {
  MAX_BOOK_TAG_NAME_LENGTH,
  isBookTagValidationError,
  normalizeBookTag,
  validateBookTagBody,
} from "../book-tags";

describe("normalizeBookTag", () => {
  it("trims, collapses whitespace, and canonicalizes the key", () => {
    expect(normalizeBookTag("  Horror   Classics  ")).toEqual({
      key: "horror classics",
      name: "Horror Classics",
    });
  });
});

describe("validateBookTagBody", () => {
  it("returns the normalized display name and key", () => {
    const result = validateBookTagBody({ name: "  2026  " });

    expect(isBookTagValidationError(result)).toBe(false);
    if (isBookTagValidationError(result)) {
      throw new Error(result.error);
    }
    expect(result.tag).toEqual({ key: "2026", name: "2026" });
  });

  it("rejects a missing or non-string name", () => {
    expect(isBookTagValidationError(validateBookTagBody({}))).toBe(true);
    expect(isBookTagValidationError(validateBookTagBody({ name: 2026 }))).toBe(
      true
    );
  });

  it("rejects a blank name", () => {
    expect(isBookTagValidationError(validateBookTagBody({ name: "   " }))).toBe(
      true
    );
  });

  it("limits names after whitespace normalization", () => {
    const tooLongName = "a".repeat(MAX_BOOK_TAG_NAME_LENGTH + 1);

    expect(
      isBookTagValidationError(validateBookTagBody({ name: tooLongName }))
    ).toBe(true);
  });
});
