interface DatedPage {
  date: string;
  currentPage: number | null;
}

/**
 * Current Page is derived from the latest-dated Entry, not stored directly —
 * this lets the user move backwards between entries without special-casing.
 */
export function getCurrentPage(entries: DatedPage[]): number | null {
  let latest: DatedPage | null = null;

  for (const entry of entries) {
    if (entry.currentPage === null) continue;
    if (!latest || entry.date > latest.date) {
      latest = entry;
    }
  }

  return latest?.currentPage ?? null;
}

export function getProgressPercent(
  currentPage: number | null,
  totalPages: number | null
): number | null {
  if (currentPage === null || totalPages === null || totalPages <= 0) {
    return null;
  }

  return Math.min(100, Math.round((currentPage / totalPages) * 100));
}

/**
 * Pages read per day is a derived view over Current Page, never stored.
 * Negative diffs (the user moved backwards) read as 0 pages for that day
 * rather than a negative number.
 */
export function getPagesReadByDate(entries: DatedPage[]): Map<string, number> {
  const sorted = [...entries]
    .filter((entry) => entry.currentPage !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  const result = new Map<string, number>();
  let previousPage: number | null = null;

  for (const entry of sorted) {
    const page = entry.currentPage as number;
    const pagesRead = previousPage === null ? page : Math.max(0, page - previousPage);
    result.set(entry.date, pagesRead);
    previousPage = page;
  }

  return result;
}

export const RATING_UNITS_PER_STAR = 4;
export const MAX_RATING = 5 * RATING_UNITS_PER_STAR;

export function formatRating(rating: number | null): string {
  if (rating === null) return "";
  return (rating / RATING_UNITS_PER_STAR).toString();
}
