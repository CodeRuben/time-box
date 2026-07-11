import { describe, expect, it } from "vitest";
import { sortBooks } from "@/lib/book-table-sort";
import type { BookSummaryView } from "@/lib/reading-journal-types";

function createBook(
  overrides: Partial<BookSummaryView> & Pick<BookSummaryView, "id" | "title">
): BookSummaryView {
  return {
    author: "",
    coverUrl: "",
    totalPages: null,
    status: "reading",
    rating: null,
    currentPage: null,
    startedOn: null,
    finishedOn: null,
    ...overrides,
  };
}

describe("sortBooks", () => {
  it("sorts by title ascending and descending", () => {
    const books = [
      createBook({ id: "2", title: "Zebra" }),
      createBook({ id: "1", title: "Alpha" }),
    ];

    expect(sortBooks(books, "title", "asc").map((book) => book.id)).toEqual([
      "1",
      "2",
    ]);
    expect(sortBooks(books, "title", "desc").map((book) => book.id)).toEqual([
      "2",
      "1",
    ]);
  });

  it("sorts by author", () => {
    const books = [
      createBook({ id: "2", title: "B", author: "Murakami" }),
      createBook({ id: "1", title: "A", author: "Austen" }),
    ];

    expect(sortBooks(books, "author", "asc").map((book) => book.id)).toEqual([
      "1",
      "2",
    ]);
  });

  it("sorts by progress percent and keeps nulls last", () => {
    const books = [
      createBook({
        id: "low",
        title: "Low",
        currentPage: 10,
        totalPages: 100,
      }),
      createBook({ id: "none", title: "None" }),
      createBook({
        id: "high",
        title: "High",
        currentPage: 80,
        totalPages: 100,
      }),
    ];

    expect(sortBooks(books, "progress", "asc").map((book) => book.id)).toEqual([
      "low",
      "high",
      "none",
    ]);
    expect(sortBooks(books, "progress", "desc").map((book) => book.id)).toEqual([
      "high",
      "low",
      "none",
    ]);
  });

  it("sorts by rating and keeps nulls last", () => {
    const books = [
      createBook({ id: "mid", title: "Mid", rating: 6 }),
      createBook({ id: "none", title: "None", rating: null }),
      createBook({ id: "high", title: "High", rating: 10 }),
    ];

    expect(sortBooks(books, "rating", "desc").map((book) => book.id)).toEqual([
      "high",
      "mid",
      "none",
    ]);
  });

  it("sorts by startedOn date", () => {
    const books = [
      createBook({ id: "later", title: "Later", startedOn: "2026-03-01" }),
      createBook({ id: "earlier", title: "Earlier", startedOn: "2026-01-01" }),
      createBook({ id: "none", title: "None", startedOn: null }),
    ];

    expect(sortBooks(books, "startedOn", "asc").map((book) => book.id)).toEqual([
      "earlier",
      "later",
      "none",
    ]);
  });

  it("sorts by finishedOn date", () => {
    const books = [
      createBook({ id: "later", title: "Later", finishedOn: "2026-06-01" }),
      createBook({ id: "earlier", title: "Earlier", finishedOn: "2026-02-01" }),
      createBook({ id: "none", title: "None", finishedOn: null }),
    ];

    expect(sortBooks(books, "finishedOn", "desc").map((book) => book.id)).toEqual([
      "later",
      "earlier",
      "none",
    ]);
  });
});
