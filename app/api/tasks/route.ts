import { NextResponse } from "next/server";
import { requireFeatureUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import {
  formatTask,
  isValidationError,
  validateTaskBody,
} from "@/lib/task-api-helpers";

export async function GET() {
  const access = await requireFeatureUser("tasks", "Tasks are disabled");
  if (access.response) {
    return access.response;
  }

  const tasks = await prisma.task.findMany({
    where: { userId: access.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: tasks.map(formatTask) });
}

export async function POST(request: Request) {
  const access = await requireFeatureUser("tasks", "Tasks are disabled");
  if (access.response) {
    return access.response;
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
      userId: access.userId,
      name: result.name!,
      description: result.description ?? "",
      checklist: JSON.stringify(result.checklist ?? []),
      status: result.status ?? "todo",
      type: result.type ?? "personal",
    },
  });

  return NextResponse.json({ data: formatTask(task) }, { status: 201 });
}
