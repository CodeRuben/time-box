import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import {
  formatTask,
  isValidationError,
  validateTaskBody,
} from "@/lib/task-api-helpers";

function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401 }
  );
}

export async function GET() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: tasks.map(formatTask) });
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const result = validateTaskBody(raw, { requireName: true });
  if (isValidationError(result)) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const task = await prisma.task.create({
    data: {
      userId,
      name: result.name!,
      description: result.description ?? "",
      checklist: JSON.stringify(result.checklist ?? []),
      status: result.status ?? "todo",
      type: result.type ?? "personal",
    },
  });

  return NextResponse.json({ data: formatTask(task) }, { status: 201 });
}
