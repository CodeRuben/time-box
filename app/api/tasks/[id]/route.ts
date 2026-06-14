import { NextResponse } from "next/server";
import { requireFeatureUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import {
  formatTask,
  isValidationError,
  validateTaskBody,
} from "@/lib/task-api-helpers";

interface TaskRouteContext {
  params: Promise<{ id: string }>;
}

function notFoundResponse() {
  return NextResponse.json({ error: "Task not found" }, { status: 404 });
}

export async function PUT(request: Request, { params }: TaskRouteContext) {
  const access = await requireFeatureUser("tasks", "Tasks are disabled");
  if (access.response) {
    return access.response;
  }

  const { id } = await params;

  const existing = await prisma.task.findFirst({
    where: { id, userId: access.userId },
  });

  if (!existing) {
    return notFoundResponse();
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

  const result = validateTaskBody(raw, { requireName: false });
  if (isValidationError(result)) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(result.name !== undefined && { name: result.name }),
      ...(result.description !== undefined && {
        description: result.description,
      }),
      ...(result.checklist !== undefined && {
        checklist: JSON.stringify(result.checklist),
      }),
      ...(result.status !== undefined && { status: result.status }),
      ...(result.type !== undefined && { type: result.type }),
    },
  });

  return NextResponse.json({ data: formatTask(task) });
}

export async function DELETE(_request: Request, { params }: TaskRouteContext) {
  const access = await requireFeatureUser("tasks", "Tasks are disabled");
  if (access.response) {
    return access.response;
  }

  const { id } = await params;

  const existing = await prisma.task.findFirst({
    where: { id, userId: access.userId },
  });

  if (!existing) {
    return notFoundResponse();
  }

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
