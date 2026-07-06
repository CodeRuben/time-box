import { NextResponse } from "next/server";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentPage } from "@/lib/reading-progress";
import type {
  BookDetailView,
  BookEntry,
  BookStatus,
} from "@/lib/reading-journal-types";

const VALID_STATUSES: ReadonlySet<BookStatus> = new Set<BookStatus>([
  "reading",
  "finished",
  "abandoned",
]);

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidStatus(value: unknown): value is BookStatus {
  return typeof value === "string" && VALID_STATUSES.has(value as BookStatus);
}

function isValidCoverUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value === "" || value.startsWith("http://") || value.startsWith("https://"))
  );
}

export function isValidDateParam(value: string): boolean {
  return DATE_PATTERN.test(value);
}

interface BookBody {
  title?: string;
  author?: string;
  coverUrl?: string;
  totalPages?: number | null;
  publishedYear?: number | null;
  openLibraryKey?: string;
  status?: BookStatus;
  rating?: number | null;
  notes?: string;
  startedOn?: string | null;
  finishedOn?: string | null;
}

interface EntryBody {
  currentPage?: number | null;
  summary?: string;
  analysis?: string;
  thoughts?: string;
}

interface ValidationError {
  error: string;
  status: number;
}

function isPositiveIntegerOrNull(value: unknown): value is number | null {
  return value === null || (Number.isInteger(value) && (value as number) > 0);
}

function isIntegerOrNull(value: unknown): value is number | null {
  return value === null || Number.isInteger(value);
}

function isValidDateStringOrNull(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && isValidDateParam(value));
}

export function validateBookBody(
  raw: unknown,
  { requireTitle }: { requireTitle: boolean }
): BookBody | ValidationError {
  if (!raw || typeof raw !== "object") {
    return { error: "Invalid request body", status: 400 };
  }

  const body = raw as Record<string, unknown>;
  const result: BookBody = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return { error: "Book title must be a non-empty string", status: 400 };
    }
    result.title = body.title.trim();
  } else if (requireTitle) {
    return { error: "Book title is required", status: 400 };
  }

  if (body.author !== undefined) {
    if (typeof body.author !== "string") {
      return { error: "Author must be a string", status: 400 };
    }
    result.author = body.author.trim();
  }

  if (body.coverUrl !== undefined) {
    if (!isValidCoverUrl(body.coverUrl)) {
      return { error: "Cover URL must be a valid http(s) URL", status: 400 };
    }
    result.coverUrl = body.coverUrl;
  }

  if (body.totalPages !== undefined) {
    if (!isPositiveIntegerOrNull(body.totalPages)) {
      return { error: "Total pages must be a positive integer or null", status: 400 };
    }
    result.totalPages = body.totalPages;
  }

  if (body.publishedYear !== undefined) {
    if (!isIntegerOrNull(body.publishedYear)) {
      return { error: "Published year must be an integer or null", status: 400 };
    }
    result.publishedYear = body.publishedYear;
  }

  if (body.openLibraryKey !== undefined) {
    if (typeof body.openLibraryKey !== "string") {
      return { error: "Open Library key must be a string", status: 400 };
    }
    result.openLibraryKey = body.openLibraryKey;
  }

  if (body.status !== undefined) {
    if (!isValidStatus(body.status)) {
      return { error: "Invalid status value", status: 400 };
    }
    result.status = body.status;
  }

  if (body.rating !== undefined) {
    if (
      body.rating !== null &&
      (!Number.isInteger(body.rating) ||
        (body.rating as number) < 1 ||
        (body.rating as number) > 10)
    ) {
      return { error: "Rating must be an integer from 1 to 10, or null", status: 400 };
    }
    result.rating = body.rating as number | null;
  }

  if (body.notes !== undefined) {
    if (typeof body.notes !== "string") {
      return { error: "Notes must be a string", status: 400 };
    }
    result.notes = body.notes;
  }

  if (body.startedOn !== undefined) {
    if (!isValidDateStringOrNull(body.startedOn)) {
      return { error: "Started on must be a YYYY-MM-DD string or null", status: 400 };
    }
    result.startedOn = body.startedOn;
  }

  if (body.finishedOn !== undefined) {
    if (!isValidDateStringOrNull(body.finishedOn)) {
      return { error: "Finished on must be a YYYY-MM-DD string or null", status: 400 };
    }
    result.finishedOn = body.finishedOn;
  }

  return result;
}

export function validateEntryBody(raw: unknown): EntryBody | ValidationError {
  if (!raw || typeof raw !== "object") {
    return { error: "Invalid request body", status: 400 };
  }

  const body = raw as Record<string, unknown>;
  const result: EntryBody = {};

  if (body.currentPage !== undefined) {
    if (
      body.currentPage !== null &&
      (!Number.isInteger(body.currentPage) || (body.currentPage as number) < 0)
    ) {
      return {
        error: "Current page must be a non-negative integer or null",
        status: 400,
      };
    }
    result.currentPage = body.currentPage as number | null;
  }

  for (const field of ["summary", "analysis", "thoughts"] as const) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "string") {
        return { error: `${field} must be a string`, status: 400 };
      }
      result[field] = (body[field] as string).trim();
    }
  }

  return result;
}

export function isValidationError(
  result: BookBody | EntryBody | ValidationError
): result is ValidationError {
  return (result as ValidationError).error !== undefined;
}

interface EntryRow {
  id: string;
  date: string;
  currentPage: number | null;
  summary: string;
  analysis: string;
  thoughts: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BookDetailRow {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  totalPages: number | null;
  publishedYear: number | null;
  openLibraryKey: string;
  status: string;
  rating: number | null;
  notes: string;
  startedOn: string | null;
  finishedOn: string | null;
  createdAt: Date;
  updatedAt: Date;
  entries: EntryRow[];
  readingDays: { date: string }[];
}

export const ownedBookDetailInclude = {
  entries: { orderBy: { date: "desc" as const } },
  readingDays: { orderBy: { date: "asc" as const }, select: { date: true } },
} satisfies Prisma.BookInclude;

export type OwnedBookDetail = Prisma.BookGetPayload<{
  include: typeof ownedBookDetailInclude;
}>;

type OwnedBook = NonNullable<Awaited<ReturnType<typeof prisma.book.findFirst>>>;

export type OwnedBookAccess =
  | { book: OwnedBook; response?: never }
  | { book?: never; response: NextResponse };

export type OwnedBookDetailAccess =
  | { book: OwnedBookDetail; response?: never }
  | { book?: never; response: NextResponse };

/**
 * Loads a book scoped to its owner. A missing book and a book owned by
 * someone else both 404 identically, so the API never leaks existence.
 */
export async function requireOwnedBook(
  bookId: string,
  userId: string
): Promise<OwnedBookAccess> {
  const book = await prisma.book.findFirst({
    where: { id: bookId, userId },
  });

  if (!book) {
    return {
      response: NextResponse.json({ error: "Book not found" }, { status: 404 }),
    };
  }

  return { book };
}

export async function requireOwnedBookDetail(
  bookId: string,
  userId: string
): Promise<OwnedBookDetailAccess> {
  const book = await prisma.book.findFirst({
    where: { id: bookId, userId },
    include: ownedBookDetailInclude,
  });

  if (!book) {
    return {
      response: NextResponse.json({ error: "Book not found" }, { status: 404 }),
    };
  }

  return { book };
}

export function formatEntry(entry: EntryRow): BookEntry {
  return {
    id: entry.id,
    date: entry.date,
    currentPage: entry.currentPage,
    summary: entry.summary,
    analysis: entry.analysis,
    thoughts: entry.thoughts,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

export function formatBookDetail(book: BookDetailRow | OwnedBookDetail): BookDetailView {
  const entries = book.entries.map(formatEntry);

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl,
    totalPages: book.totalPages,
    publishedYear: book.publishedYear,
    openLibraryKey: book.openLibraryKey,
    status: book.status as BookStatus,
    rating: book.rating,
    notes: book.notes,
    startedOn: book.startedOn,
    finishedOn: book.finishedOn,
    currentPage: getCurrentPage(book.entries),
    entries,
    readingDays: book.readingDays.map((day) => day.date),
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
  };
}
