import { NextResponse } from "next/server";
import { requireFeatureUser } from "@/lib/auth-session";
import {
  formatBookDetail,
  isValidationError,
  requireOwnedBookDetail,
  validateBookBody,
} from "@/lib/book-api-helpers";
import { prisma } from "@/lib/prisma";

interface BookRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: BookRouteContext) {
  const access = await requireFeatureUser(
    "reading-journal",
    "Reading journal is disabled"
  );
  if (access.response) {
    return access.response;
  }

  const { id } = await params;
  const owned = await requireOwnedBookDetail(id, access.userId);
  if (owned.response) {
    return owned.response;
  }

  return NextResponse.json({ data: formatBookDetail(owned.book) });
}

export async function PATCH(request: Request, { params }: BookRouteContext) {
  const access = await requireFeatureUser(
    "reading-journal",
    "Reading journal is disabled"
  );
  if (access.response) {
    return access.response;
  }

  const { id } = await params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = validateBookBody(raw, { requireTitle: false });
  if (isValidationError(result)) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { count } = await prisma.book.updateMany({
    where: { id, userId: access.userId },
    data: {
      ...(result.title !== undefined && { title: result.title }),
      ...(result.author !== undefined && { author: result.author }),
      ...(result.coverUrl !== undefined && { coverUrl: result.coverUrl }),
      ...(result.totalPages !== undefined && { totalPages: result.totalPages }),
      ...(result.publishedYear !== undefined && {
        publishedYear: result.publishedYear,
      }),
      ...(result.openLibraryKey !== undefined && {
        openLibraryKey: result.openLibraryKey,
      }),
      ...(result.status !== undefined && { status: result.status }),
      ...(result.rating !== undefined && { rating: result.rating }),
      ...(result.notes !== undefined && { notes: result.notes }),
      ...(result.startedOn !== undefined && { startedOn: result.startedOn }),
      ...(result.finishedOn !== undefined && { finishedOn: result.finishedOn }),
    },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const owned = await requireOwnedBookDetail(id, access.userId);
  if (owned.response) {
    return owned.response;
  }

  return NextResponse.json({ data: formatBookDetail(owned.book) });
}

export async function DELETE(_request: Request, { params }: BookRouteContext) {
  const access = await requireFeatureUser(
    "reading-journal",
    "Reading journal is disabled"
  );
  if (access.response) {
    return access.response;
  }

  const { id } = await params;
  const { count } = await prisma.book.deleteMany({
    where: { id, userId: access.userId },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  return NextResponse.json({ data: { id } });
}
