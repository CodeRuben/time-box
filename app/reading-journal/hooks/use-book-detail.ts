"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTOSAVE_DEBOUNCE_MS } from "@/lib/autosave-debounce";
import { getCurrentPage } from "@/lib/reading-progress";
import type { BookDetailView, BookEntry } from "@/lib/reading-journal-types";

function bookApiUrl(bookId: string) {
  return `/api/books/${bookId}`;
}

export interface EntryInput {
  currentPage: number | null;
  summary: string;
  analysis: string;
  thoughts: string;
}

export type BookPatch = Partial<
  Pick<
    BookDetailView,
    | "title"
    | "author"
    | "coverUrl"
    | "totalPages"
    | "publishedYear"
    | "openLibraryKey"
    | "status"
    | "rating"
    | "notes"
    | "startedOn"
    | "finishedOn"
  >
>;

async function fetchBook(
  bookId: string
): Promise<{ book: BookDetailView | null; notFound: boolean }> {
  const response = await fetch(bookApiUrl(bookId), {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (response.status === 404) {
    return { book: null, notFound: true };
  }
  if (!response.ok) throw new Error("Failed to fetch book");

  const payload = (await response.json()) as { data: BookDetailView };
  return { book: payload.data, notFound: false };
}

async function patchBookRequest(
  bookId: string,
  patch: BookPatch
): Promise<BookDetailView> {
  const response = await fetch(bookApiUrl(bookId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(patch),
  });

  if (!response.ok) throw new Error("Failed to update book");
  const payload = (await response.json()) as { data: BookDetailView };
  return payload.data;
}

async function deleteBookRequest(bookId: string): Promise<void> {
  const response = await fetch(bookApiUrl(bookId), {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("Failed to delete book");
}

async function tickDayRequest(bookId: string, date: string): Promise<void> {
  const response = await fetch(`${bookApiUrl(bookId)}/days/${date}`, {
    method: "PUT",
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("Failed to tick reading day");
}

async function untickDayRequest(bookId: string, date: string): Promise<void> {
  const response = await fetch(`${bookApiUrl(bookId)}/days/${date}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("Failed to untick reading day");
}

async function saveEntryRequest(
  bookId: string,
  date: string,
  input: EntryInput
): Promise<BookEntry> {
  const response = await fetch(`${bookApiUrl(bookId)}/entries/${date}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Failed to save entry");
  const payload = (await response.json()) as { data: BookEntry };
  return payload.data;
}

async function deleteEntryRequest(bookId: string, date: string): Promise<void> {
  const response = await fetch(`${bookApiUrl(bookId)}/entries/${date}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("Failed to delete entry");
}

function replaceOrInsertEntry(entries: BookEntry[], entry: BookEntry): BookEntry[] {
  const withoutDate = entries.filter((existing) => existing.date !== entry.date);
  return [...withoutDate, entry].sort((a, b) => b.date.localeCompare(a.date));
}

export function useBookDetail(bookId: string) {
  const router = useRouter();
  const [book, setBook] = useState<BookDetailView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // Mirrors the latest book into a ref so async callbacks (rollback,
  // debounced saves) always read the freshest state instead of a stale
  // render closure.
  const bookRef = useRef<BookDetailView | null>(null);
  const notesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bookRef.current = book;
  }, [book]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setNotFound(false);
      try {
        const result = await fetchBook(bookId);
        if (cancelled) return;
        setBook(result.book);
        setNotFound(result.notFound);
      } catch (error) {
        console.error("Failed to load book:", error);
        if (!cancelled) setBook(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  useEffect(() => {
    return () => {
      if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
    };
  }, []);

  const updateBook = useCallback(
    async (patch: BookPatch) => {
      const previous = bookRef.current;
      if (!previous) return;

      const optimistic = { ...previous, ...patch };
      bookRef.current = optimistic;
      setBook(optimistic);

      try {
        const updated = await patchBookRequest(bookId, patch);
        bookRef.current = updated;
        setBook(updated);
      } catch (error) {
        console.error("Failed to update book:", error);
        bookRef.current = previous;
        setBook(previous);
        throw error;
      }
    },
    [bookId]
  );

  const updateNotes = useCallback(
    (notes: string) => {
      setBook((prev) => (prev ? { ...prev, notes } : prev));
      if (bookRef.current) {
        bookRef.current = { ...bookRef.current, notes };
      }
      setNotesSaved(false);
      setIsSavingNotes(true);

      if (notesTimeoutRef.current) {
        clearTimeout(notesTimeoutRef.current);
      }

      notesTimeoutRef.current = setTimeout(() => {
        patchBookRequest(bookId, { notes })
          .then(() => {
            setIsSavingNotes(false);
            setNotesSaved(true);
          })
          .catch((error) => {
            console.error("Failed to save notes:", error);
            setIsSavingNotes(false);
          });
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [bookId]
  );

  const tickDay = useCallback(
    async (date: string) => {
      const previous = bookRef.current;
      if (!previous || previous.readingDays.includes(date)) return;

      const optimistic = {
        ...previous,
        readingDays: [...previous.readingDays, date].sort(),
      };
      bookRef.current = optimistic;
      setBook(optimistic);

      try {
        await tickDayRequest(bookId, date);
      } catch (error) {
        console.error("Failed to tick reading day:", error);
        bookRef.current = previous;
        setBook(previous);
      }
    },
    [bookId]
  );

  const untickDay = useCallback(
    async (date: string) => {
      const previous = bookRef.current;
      if (!previous) return;

      const optimistic = {
        ...previous,
        readingDays: previous.readingDays.filter((day) => day !== date),
      };
      bookRef.current = optimistic;
      setBook(optimistic);

      try {
        await untickDayRequest(bookId, date);
      } catch (error) {
        console.error("Failed to untick reading day:", error);
        bookRef.current = previous;
        setBook(previous);
      }
    },
    [bookId]
  );

  const deleteBook = useCallback(async () => {
    await deleteBookRequest(bookId);
    router.push("/reading-journal");
  }, [bookId, router]);

  const saveEntry = useCallback(
    async (date: string, input: EntryInput) => {
      const previous = bookRef.current;
      if (!previous) return;

      const optimisticEntry: BookEntry = {
        id: previous.entries.find((entry) => entry.date === date)?.id ?? date,
        date,
        currentPage: input.currentPage,
        summary: input.summary,
        analysis: input.analysis,
        thoughts: input.thoughts,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const optimisticEntries = replaceOrInsertEntry(previous.entries, optimisticEntry);
      const optimistic: BookDetailView = {
        ...previous,
        entries: optimisticEntries,
        currentPage: getCurrentPage(optimisticEntries),
      };
      bookRef.current = optimistic;
      setBook(optimistic);

      try {
        const saved = await saveEntryRequest(bookId, date, input);
        const current = bookRef.current ?? optimistic;
        const entries = replaceOrInsertEntry(current.entries, saved);
        const updated: BookDetailView = {
          ...current,
          entries,
          currentPage: getCurrentPage(entries),
        };
        bookRef.current = updated;
        setBook(updated);
      } catch (error) {
        console.error("Failed to save entry:", error);
        bookRef.current = previous;
        setBook(previous);
        throw error;
      }
    },
    [bookId]
  );

  const deleteEntry = useCallback(
    async (date: string) => {
      const previous = bookRef.current;
      if (!previous) return;

      const entries = previous.entries.filter((entry) => entry.date !== date);
      const optimistic: BookDetailView = {
        ...previous,
        entries,
        currentPage: getCurrentPage(entries),
      };
      bookRef.current = optimistic;
      setBook(optimistic);

      try {
        await deleteEntryRequest(bookId, date);
      } catch (error) {
        console.error("Failed to delete entry:", error);
        bookRef.current = previous;
        setBook(previous);
        throw error;
      }
    },
    [bookId]
  );

  return {
    isLoading,
    book,
    notFound,
    updateBook,
    updateNotes,
    isSavingNotes,
    notesSaved,
    tickDay,
    untickDay,
    deleteBook,
    saveEntry,
    deleteEntry,
  };
}
