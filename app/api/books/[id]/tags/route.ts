import { NextResponse } from "next/server";
import { requireFeatureUser } from "@/lib/auth-session";
import {
  isBookTagValidationError,
  validateBookTagBody,
} from "@/lib/book-tags";
import { requireOwnedBook } from "@/lib/book-api-helpers";
import { prisma } from "@/lib/prisma";

interface BookTagRouteContext {
  params: Promise<{ id: string }>;
}

async function getTagFromRequest(request: Request) {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return { response: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) };
  }

  const result = validateBookTagBody(raw);
  if (isBookTagValidationError(result)) {
    return { response: NextResponse.json({ error: result.error }, { status: 400 }) };
  }

  return { tag: result.tag };
}

export async function POST(request: Request, { params }: BookTagRouteContext) {
  const access = await requireFeatureUser(
    "reading-journal",
    "Reading journal is disabled"
  );
  if (access.response) {
    return access.response;
  }

  const { id } = await params;
  const owned = await requireOwnedBook(id, access.userId);
  if (owned.response) {
    return owned.response;
  }

  const parsed = await getTagFromRequest(request);
  if (parsed.response) {
    return parsed.response;
  }

  const tag = await prisma.bookTag.upsert({
    where: {
      bookId_key: {
        bookId: owned.book.id,
        key: parsed.tag.key,
      },
    },
    create: {
      bookId: owned.book.id,
      key: parsed.tag.key,
      name: parsed.tag.name,
    },
    update: {},
  });

  return NextResponse.json({
    data: { key: tag.key, name: tag.name },
  });
}

export async function DELETE(request: Request, { params }: BookTagRouteContext) {
  const access = await requireFeatureUser(
    "reading-journal",
    "Reading journal is disabled"
  );
  if (access.response) {
    return access.response;
  }

  const { id } = await params;
  const owned = await requireOwnedBook(id, access.userId);
  if (owned.response) {
    return owned.response;
  }

  const parsed = await getTagFromRequest(request);
  if (parsed.response) {
    return parsed.response;
  }

  await prisma.bookTag.deleteMany({
    where: {
      bookId: owned.book.id,
      key: parsed.tag.key,
    },
  });

  return NextResponse.json({ data: { key: parsed.tag.key } });
}
