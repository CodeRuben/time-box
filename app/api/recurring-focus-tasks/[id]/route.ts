import { NextResponse } from "next/server";
import { requireFeatureUser } from "@/lib/auth-session";
import { toRecurringFocusTaskDto } from "@/lib/recurring-focus-tasks/dto";
import { prisma } from "@/lib/prisma";
import { serializeRecurringFocusTaskSchedule } from "@/lib/recurring-focus-tasks/schedule";
import {
  mergeRecurringFocusTaskInput,
  parsePatchBody,
} from "@/lib/recurring-focus-tasks/validation";

interface RecurringFocusTaskRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: Request,
  { params }: RecurringFocusTaskRouteContext
) {
  const access = await requireFeatureUser("planner", "Planner is disabled");
  if (access.response) {
    return access.response;
  }

  const { id } = await params;

  const existing = await prisma.recurringFocusTask.findFirst({
    where: {
      id,
      userId: access.userId,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let existingDto;
  try {
    existingDto = toRecurringFocusTaskDto(existing);
  } catch {
    return NextResponse.json(
      { error: "Stored schedule is invalid" },
      { status: 500 }
    );
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

  const merged = mergeRecurringFocusTaskInput(
    {
      title: existingDto.title,
      notes: existingDto.notes,
      enabled: existingDto.enabled,
      startDate: existingDto.startDate,
      endDate: existingDto.endDate,
      schedule: existingDto.schedule,
    },
    patch.value
  );

  if (!merged.ok) {
    return NextResponse.json({ error: merged.message }, { status: 400 });
  }

  const row = await prisma.recurringFocusTask.update({
    where: { id: existing.id },
    data: {
      title: merged.value.title,
      notes: merged.value.notes,
      enabled: merged.value.enabled,
      startDate: merged.value.startDate,
      endDate: merged.value.endDate,
      schedule: serializeRecurringFocusTaskSchedule(merged.value.schedule),
    },
  });

  return NextResponse.json({ data: toRecurringFocusTaskDto(row) });
}

export async function DELETE(
  _request: Request,
  { params }: RecurringFocusTaskRouteContext
) {
  const access = await requireFeatureUser("planner", "Planner is disabled");
  if (access.response) {
    return access.response;
  }

  const { id } = await params;

  const existing = await prisma.recurringFocusTask.findFirst({
    where: {
      id,
      userId: access.userId,
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.recurringFocusTask.delete({
    where: { id: existing.id },
  });

  return NextResponse.json({ data: { id: existing.id } });
}
