import { NextResponse } from "next/server";
import { requireFeatureUser } from "@/lib/auth-session";
import { isValidDateParam, requireOwnedBook } from "@/lib/book-api-helpers";
import { prisma } from "@/lib/prisma";

interface DayRouteContext {
  params: Promise<{ id: string; date: string }>;
}

export async function PUT(_request: Request, { params }: DayRouteContext) {
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

  await prisma.readingDay.upsert({
    where: { bookId_date: { bookId: owned.book.id, date } },
    update: {},
    create: {
      bookId: owned.book.id,
      userId: access.userId,
      date,
    },
  });

  return NextResponse.json({ data: { date } });
}

export async function DELETE(_request: Request, { params }: DayRouteContext) {
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

  await prisma.readingDay.deleteMany({
    where: { bookId: owned.book.id, date },
  });

  return NextResponse.json({ data: { date } });
}
