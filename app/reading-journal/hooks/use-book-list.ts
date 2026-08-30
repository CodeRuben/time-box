"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeBookTag } from "@/lib/book-tags";
import type { BookSummaryView, BookTag } from "@/lib/reading-journal-types";

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

async function addBookTagRequest(bookId: string, name: string): Promise<BookTag> {
  const response = await fetch(`${BOOKS_API}/${bookId}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error("Failed to add tag");
  const payload = (await response.json()) as { data: BookTag };
  return payload.data;
}

async function removeBookTagRequest(bookId: string, name: string): Promise<void> {
  const response = await fetch(`${BOOKS_API}/${bookId}/tags`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error("Failed to remove tag");
}

function sortBookTags(tags: BookTag[]): BookTag[] {
  return [...tags].sort((a, b) => a.key.localeCompare(b.key));
}

function replaceBookTags(
  books: BookSummaryView[],
  bookId: string,
  tags: BookTag[]
): BookSummaryView[] {
  return books.map((book) =>
    book.id === bookId ? { ...book, tags } : book
  );
}

export function useBookList() {
  const [books, setBooks] = useState<BookSummaryView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedTagKeys, setSelectedTagKeys] = useState<string[]>([]);
  const [updatingTagBookId, setUpdatingTagBookId] = useState<string | null>(null);
  const booksRef = useRef(books);
  booksRef.current = books;

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

  const availableTags = useMemo(() => {
    const tagsByKey = new Map<string, BookTag>();

    for (const book of books) {
      for (const tag of book.tags) {
        tagsByKey.set(tag.key, tag);
      }
    }

    return [...tagsByKey.values()].sort((a, b) => a.key.localeCompare(b.key));
  }, [books]);

  const filteredBooks = useMemo(
    () =>
      selectedTagKeys.length === 0
        ? books
        : books.filter((book) =>
            selectedTagKeys.every((key) =>
              book.tags.some((tag) => tag.key === key)
            )
          ),
    [books, selectedTagKeys]
  );

  const booksByStatus = useMemo(
    () => ({
      reading: filteredBooks.filter((book) => book.status === "reading"),
      finished: filteredBooks.filter((book) => book.status === "finished"),
      abandoned: filteredBooks.filter((book) => book.status === "abandoned"),
    }),
    [filteredBooks]
  );

  const toggleTagFilter = useCallback((key: string) => {
    setSelectedTagKeys((current) =>
      current.includes(key)
        ? current.filter((selectedKey) => selectedKey !== key)
        : [...current, key]
    );
  }, []);

  const clearTagFilters = useCallback(() => {
    setSelectedTagKeys([]);
  }, []);

  const addTag = useCallback(async (bookId: string, name: string) => {
    const optimisticTag = normalizeBookTag(name);
    const previous = booksRef.current;
    const book = previous.find((item) => item.id === bookId);
    if (!book) return;

    const tags = book.tags.some((tag) => tag.key === optimisticTag.key)
      ? book.tags
      : sortBookTags([...book.tags, optimisticTag]);
    const optimistic = replaceBookTags(previous, bookId, tags);
    booksRef.current = optimistic;
    setBooks(optimistic);
    setUpdatingTagBookId(bookId);

    try {
      const saved = await addBookTagRequest(bookId, name);
      const current = booksRef.current;
      const currentBook = current.find((item) => item.id === bookId);
      if (!currentBook) return;
      const next = replaceBookTags(
        current,
        bookId,
        sortBookTags([
          ...currentBook.tags.filter((tag) => tag.key !== saved.key),
          saved,
        ])
      );
      booksRef.current = next;
      setBooks(next);
    } catch (error) {
      console.error("Failed to add tag:", error);
      booksRef.current = previous;
      setBooks(previous);
      throw error;
    } finally {
      setUpdatingTagBookId(null);
    }
  }, []);

  const removeTag = useCallback(async (bookId: string, tag: BookTag) => {
    const previous = booksRef.current;
    const book = previous.find((item) => item.id === bookId);
    if (!book) return;

    const optimistic = replaceBookTags(
      previous,
      bookId,
      book.tags.filter((existing) => existing.key !== tag.key)
    );
    booksRef.current = optimistic;
    setBooks(optimistic);
    setUpdatingTagBookId(bookId);

    try {
      await removeBookTagRequest(bookId, tag.name);
    } catch (error) {
      console.error("Failed to remove tag:", error);
      booksRef.current = previous;
      setBooks(previous);
      throw error;
    } finally {
      setUpdatingTagBookId(null);
    }
  }, []);

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
    filteredBooks,
    booksByStatus,
    availableTags,
    selectedTagKeys,
    toggleTagFilter,
    clearTagFilters,
    addTag,
    removeTag,
    updatingTagBookId,
    isCreating,
    addDialogOpen,
    setAddDialogOpen,
    createBook,
  };
}
