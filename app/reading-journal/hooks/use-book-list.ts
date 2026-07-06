"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BookSummaryView } from "@/lib/reading-journal-types";

const BOOKS_API = "/api/books";

export interface CreateBookInput {
  title: string;
  author?: string;
  coverUrl?: string;
  totalPages?: number | null;
  publishedYear?: number | null;
  openLibraryKey?: string;
}

async function fetchBooks(): Promise<BookSummaryView[]> {
  const response = await fetch(BOOKS_API, {
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("Failed to fetch books");
  const payload = (await response.json()) as { data: BookSummaryView[] };
  return payload.data;
}

async function createBookRequest(input: CreateBookInput): Promise<BookSummaryView> {
  const response = await fetch(BOOKS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Failed to create book");
  const payload = (await response.json()) as { data: BookSummaryView };
  return payload.data;
}

export function useBookList() {
  const [books, setBooks] = useState<BookSummaryView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const loaded = await fetchBooks();
        if (!cancelled) setBooks(loaded);
      } catch (error) {
        console.error("Failed to load books:", error);
        if (!cancelled) setBooks([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const booksByStatus = useMemo(
    () => ({
      reading: books.filter((book) => book.status === "reading"),
      finished: books.filter((book) => book.status === "finished"),
      abandoned: books.filter((book) => book.status === "abandoned"),
    }),
    [books]
  );

  const createBook = useCallback(
    async (input: CreateBookInput) => {
      setIsCreating(true);
      try {
        const created = await createBookRequest(input);
        const refreshed = await fetchBooks();
        setBooks(refreshed);
        setAddDialogOpen(false);
        return created;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  return {
    isLoading,
    books,
    booksByStatus,
    isCreating,
    addDialogOpen,
    setAddDialogOpen,
    createBook,
  };
}
