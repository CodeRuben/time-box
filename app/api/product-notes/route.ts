import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-session";
import { toProductNoteDto } from "@/lib/product-notes/dto";
import { parseCreateBody } from "@/lib/product-notes/validation";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const access = await requireAdminUser();
  if (access.response) {
    return access.response;
  }

  const rows = await prisma.productNote.findMany({
    where: { userId: access.userId },
    orderBy: { updatedAt: "desc" },
  });

  try {
    return NextResponse.json({ data: rows.map(toProductNoteDto) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Stored note data is invalid" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const access = await requireAdminUser();
  if (access.response) {
    return access.response;
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = parseCreateBody(raw);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  const row = await prisma.productNote.create({
    data: {
      userId: access.userId,
      title: result.value.title,
      description: result.value.description,
      productArea: result.value.productArea,
    },
  });

  return NextResponse.json({ data: toProductNoteDto(row) }, { status: 201 });
}
