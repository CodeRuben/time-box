const SMALL_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "in",
  "nor",
  "of",
  "on",
  "or",
  "the",
  "to",
  "up",
  "yet",
]);

function capitalizeWord(word: string): string {
  if (!word) {
    return word;
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Title-cases text: capitalize each word, leave small words lowercase
 * unless they are the first or last word.
 */
export function toTitleCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  const words = trimmed.split(/\s+/);

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      const isEdge = index === 0 || index === words.length - 1;

      if (!isEdge && SMALL_WORDS.has(lower)) {
        return lower;
      }

      return capitalizeWord(word);
    })
    .join(" ");
}
