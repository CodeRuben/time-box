import { describe, expect, it } from "vitest";
import type { BookSummaryView } from "../reading-journal-types";
import { getBookYearRecap } from "../book-year-recap";

function makeBook(
  overrides: Partial<BookSummaryView> = {}
): BookSummaryView {
  return {
    id: "book-id",
    title: "Book",
    author: "Author",
    coverUrl: "",
    totalPages: 200,
    status: "reading",
    rating: null,
    currentPage: 50,
    startedOn: "2026-01-01",
    finishedOn: null,
    ...overrides,
  };
}

describe("getBookYearRecap", () => {
  it("excludes books finished in other years", () => {
    const books = [
      makeBook({
        id: "this-year",
        status: "finished",
        finishedOn: "2026-03-01",
      }),
      makeBook({
        id: "last-year",
        status: "finished",
        finishedOn: "2025-12-31",
      }),
    ];

    expect(getBookYearRecap(books, 2026).finishedBooks).toBe(1);
  });

  it("counts finished books without a finished date", () => {
    const books = [
      makeBook({ id: "undated", status: "finished", finishedOn: null }),
      makeBook({ id: "dated", status: "finished", finishedOn: "2026-03-01" }),
    ];

    expect(getBookYearRecap(books, 2026).finishedBooks).toBe(2);
  });

  it("totals known pages and averages rated finished books", () => {
    const books = [
      makeBook({
        id: "one",
        status: "finished",
        finishedOn: "2026-02-01",
        totalPages: 250,
        rating: 16,
      }),
      makeBook({
        id: "two",
        status: "finished",
        finishedOn: "2026-04-01",
        totalPages: 150,
        rating: 20,
      }),
      makeBook({
        id: "unrated",
        status: "finished",
        finishedOn: "2026-06-01",
        totalPages: null,
      }),
    ];

    const recap = getBookYearRecap(books, 2026);

    expect(recap.finishedPages).toBe(400);
    expect(recap.averageRating).toBe(4.5);
  });

  it("reports active books and handles a year without ratings", () => {
    const books = [
      makeBook({ id: "one" }),
      makeBook({ id: "two" }),
      makeBook({
        id: "finished",
        status: "finished",
        finishedOn: "2026-05-01",
      }),
    ];

    const recap = getBookYearRecap(books, 2026);

    expect(recap.currentlyReading).toBe(2);
    expect(recap.averageRating).toBeNull();
  });
});
