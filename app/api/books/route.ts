import { format } from "date-fns";
import { NextResponse } from "next/server";
import { requireFeatureUser } from "@/lib/auth-session";
import {
  isValidationError,
  validateBookBody,
} from "@/lib/book-api-helpers";
import { prisma } from "@/lib/prisma";
import { getCurrentPage } from "@/lib/reading-progress";
import type { BookStatus, BookSummaryView } from "@/lib/reading-journal-types";

interface BookRowWithEntries {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  totalPages: number | null;
  status: string;
  rating: number | null;
  startedOn: string | null;
  finishedOn: string | null;
  entries: { date: string; currentPage: number | null }[];
}

function formatBookSummary(book: BookRowWithEntries): BookSummaryView {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl,
    totalPages: book.totalPages,
    status: book.status as BookStatus,
    rating: book.rating,
    currentPage: getCurrentPage(book.entries),
    startedOn: book.startedOn,
    finishedOn: book.finishedOn,
  };
}

export async function GET() {
  const access = await requireFeatureUser(
    "reading-journal",
    "Reading journal is disabled"
  );
  if (access.response) {
    return access.response;
  }

  const books = await prisma.book.findMany({
    where: { userId: access.userId },
    orderBy: { updatedAt: "desc" },
    include: {
      entries: { select: { date: true, currentPage: true } },
    },
  });

  return NextResponse.json({ data: books.map(formatBookSummary) });
}

export async function POST(request: Request) {
  const access = await requireFeatureUser(
    "reading-journal",
    "Reading journal is disabled"
  );
  if (access.response) {
    return access.response;
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = validateBookBody(raw, { requireTitle: true });
  if (isValidationError(result)) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const book = await prisma.book.create({
    data: {
      userId: access.userId,
      title: result.title!,
      author: result.author ?? "",
      coverUrl: result.coverUrl ?? "",
      totalPages: result.totalPages ?? null,
      publishedYear: result.publishedYear ?? null,
      openLibraryKey: result.openLibraryKey ?? "",
      status: result.status ?? "reading",
      rating: result.rating ?? null,
      notes: result.notes ?? "",
      startedOn: result.startedOn ?? format(new Date(), "yyyy-MM-dd"),
      finishedOn: result.finishedOn ?? null,
    },
  });

  return NextResponse.json(
    { data: formatBookSummary({ ...book, entries: [] }) },
    { status: 201 }
  );
}
