import type { BookSummaryView } from "./reading-journal-types";

export interface BookYearRecap {
  finishedBooks: number;
  finishedPages: number;
  averageRating: number | null;
  currentlyReading: number;
}

export function getBookYearRecap(
  books: BookSummaryView[],
  year: number
): BookYearRecap {
  const yearPrefix = `${year}-`;
  // Books finished without a recorded date can't be placed in any year, so
  // they count toward the recap rather than silently disappearing.
  const finishedThisYear = books.filter(
    (book) =>
      book.status === "finished" &&
      (book.finishedOn === null || book.finishedOn.startsWith(yearPrefix))
  );
  const ratedBooks = finishedThisYear.filter(
    (book): book is BookSummaryView & { rating: number } => book.rating !== null
  );
  const ratingTotal = ratedBooks.reduce((total, book) => total + book.rating, 0);

  return {
    finishedBooks: finishedThisYear.length,
    finishedPages: finishedThisYear.reduce(
      (total, book) => total + (book.totalPages ?? 0),
      0
    ),
    averageRating:
      ratedBooks.length > 0 ? ratingTotal / ratedBooks.length / 4 : null,
    currentlyReading: books.filter((book) => book.status === "reading").length,
  };
}
