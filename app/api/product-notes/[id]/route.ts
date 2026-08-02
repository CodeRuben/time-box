import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-session";
import { toProductNoteDto } from "@/lib/product-notes/dto";
import { parsePatchBody } from "@/lib/product-notes/validation";
import { prisma } from "@/lib/prisma";

interface ProductNoteRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: Request,
  { params }: ProductNoteRouteContext
) {
  const access = await requireAdminUser();
  if (access.response) {
    return access.response;
  }

  const { id } = await params;

  const existing = await prisma.productNote.findFirst({
    where: {
      id,
      userId: access.userId,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch = parsePatchBody(raw);
  if (!patch.ok) {
    return NextResponse.json({ error: patch.message }, { status: 400 });
  }

  const row = await prisma.productNote.update({
    where: { id: existing.id },
    data: {
      ...(patch.value.title !== undefined ? { title: patch.value.title } : {}),
      ...(patch.value.description !== undefined
        ? { description: patch.value.description }
        : {}),
      ...(patch.value.productArea !== undefined
        ? { productArea: patch.value.productArea }
        : {}),
    },
  });

  return NextResponse.json({ data: toProductNoteDto(row) });
}

export async function DELETE(
  _request: Request,
  { params }: ProductNoteRouteContext
) {
  const access = await requireAdminUser();
  if (access.response) {
    return access.response;
  }

  const { id } = await params;

  const existing = await prisma.productNote.findFirst({
    where: {
      id,
      userId: access.userId,
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.productNote.delete({
    where: { id: existing.id },
  });

  return NextResponse.json({ data: { id: existing.id } });
}
