import { getProgressPercent } from "@/lib/reading-progress";
import type { BookSummaryView } from "@/lib/reading-journal-types";

export type BookSortColumn =
  | "title"
  | "author"
  | "progress"
  | "rating"
  | "startedOn"
  | "finishedOn";

export type BookSortDirection = "asc" | "desc";

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function compareNullableNumbers(
  a: number | null,
  b: number | null,
  direction: BookSortDirection
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direction === "asc" ? a - b : b - a;
}

function compareNullableStrings(
  a: string | null,
  b: string | null,
  direction: BookSortDirection
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  const result = compareStrings(a, b);
  return direction === "asc" ? result : -result;
}

function getProgressSortValue(book: BookSummaryView): number | null {
  const percent = getProgressPercent(book.currentPage, book.totalPages);
  if (percent !== null) return percent;
  return book.currentPage;
}

export function sortBooks(
  books: BookSummaryView[],
  column: BookSortColumn,
  direction: BookSortDirection
): BookSummaryView[] {
  const sorted = [...books];

  sorted.sort((a, b) => {
    switch (column) {
      case "title": {
        const result = compareStrings(a.title, b.title);
        return direction === "asc" ? result : -result;
      }
      case "author": {
        const result = compareStrings(
          a.author || "Author unknown",
          b.author || "Author unknown"
        );
        return direction === "asc" ? result : -result;
      }
      case "progress":
        return compareNullableNumbers(
          getProgressSortValue(a),
          getProgressSortValue(b),
          direction
        );
      case "rating":
        return compareNullableNumbers(a.rating, b.rating, direction);
      case "startedOn":
        return compareNullableStrings(a.startedOn, b.startedOn, direction);
      case "finishedOn":
        return compareNullableStrings(a.finishedOn, b.finishedOn, direction);
    }
  });

  return sorted;
}
