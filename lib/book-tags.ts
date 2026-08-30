import type { BookTag } from "@/lib/reading-journal-types";

export const MAX_BOOK_TAG_NAME_LENGTH = 80;

export type BookTagValidationResult =
  | { tag: BookTag; error?: never }
  | { tag?: never; error: string };

export function normalizeBookTag(name: string): BookTag {
  const displayName = name.trim().replace(/\s+/g, " ");

  return {
    key: displayName.toLowerCase(),
    name: displayName,
  };
}

export function validateBookTagBody(raw: unknown): BookTagValidationResult {
  if (!raw || typeof raw !== "object") {
    return { error: "Invalid request body" };
  }

  const { name } = raw as { name?: unknown };
  if (typeof name !== "string") {
    return { error: "Tag name must be a string" };
  }

  const tag = normalizeBookTag(name);
  if (!tag.name) {
    return { error: "Tag name must not be empty" };
  }

  if (tag.name.length > MAX_BOOK_TAG_NAME_LENGTH) {
    return {
      error: `Tag name must be ${MAX_BOOK_TAG_NAME_LENGTH} characters or fewer`,
    };
  }

  return { tag };
}

export function isBookTagValidationError(
  result: BookTagValidationResult
): result is { error: string } {
  return result.error !== undefined;
}
