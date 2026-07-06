import { NextResponse } from "next/server";
import { requireFeatureUser } from "@/lib/auth-session";
import {
  formatEntry,
  isValidDateParam,
  isValidationError,
  requireOwnedBook,
  validateEntryBody,
} from "@/lib/book-api-helpers";
import { prisma } from "@/lib/prisma";

interface EntryRouteContext {
  params: Promise<{ id: string; date: string }>;
}

export async function PUT(request: Request, { params }: EntryRouteContext) {
  const access = await requireFeatureUser(
    "reading-journal",
    "Reading journal is disabled"
  );
  if (access.response) {
    return access.response;
  }

  const { id, date } = await params;
  if (!isValidDateParam(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const owned = await requireOwnedBook(id, access.userId);
  if (owned.response) {
    return owned.response;
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = validateEntryBody(raw);
  if (isValidationError(result)) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const entry = await prisma.readingEntry.upsert({
    where: { bookId_date: { bookId: owned.book.id, date } },
    update: result,
    create: {
      bookId: owned.book.id,
      userId: access.userId,
      date,
      currentPage: result.currentPage ?? null,
      summary: result.summary ?? "",
      analysis: result.analysis ?? "",
      thoughts: result.thoughts ?? "",
    },
  });

  return NextResponse.json({ data: formatEntry(entry) });
}

export async function DELETE(_request: Request, { params }: EntryRouteContext) {
  const access = await requireFeatureUser(
    "reading-journal",
    "Reading journal is disabled"
  );
  if (access.response) {
    return access.response;
  }

  const { id, date } = await params;
  if (!isValidDateParam(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const owned = await requireOwnedBook(id, access.userId);
  if (owned.response) {
    return owned.response;
  }

  const existing = await prisma.readingEntry.findUnique({
    where: { bookId_date: { bookId: owned.book.id, date } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  await prisma.readingEntry.delete({ where: { id: existing.id } });

  return NextResponse.json({ data: { date } });
}
