import { NextResponse } from "next/server";
import { requireFeatureUser } from "@/lib/auth-session";
import {
  sortRecurringFocusTaskDtos,
  toRecurringFocusTaskDto,
} from "@/lib/recurring-focus-tasks/dto";
import { prisma } from "@/lib/prisma";
import { serializeRecurringFocusTaskSchedule } from "@/lib/recurring-focus-tasks/schedule";
import { parseCreateBody } from "@/lib/recurring-focus-tasks/validation";

export async function GET() {
  const access = await requireFeatureUser("planner", "Planner is disabled");
  if (access.response) {
    return access.response;
  }

  const rows = await prisma.recurringFocusTask.findMany({
    where: { userId: access.userId },
    orderBy: { updatedAt: "desc" },
  });

  try {
    const tasks = rows.map(toRecurringFocusTaskDto);
    return NextResponse.json({ data: sortRecurringFocusTaskDtos(tasks) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Stored recurring task data is invalid" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const access = await requireFeatureUser("planner", "Planner is disabled");
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

  const row = await prisma.recurringFocusTask.create({
    data: {
      userId: access.userId,
      title: result.value.title,
      notes: result.value.notes,
      enabled: result.value.enabled,
      startDate: result.value.startDate,
      endDate: result.value.endDate,
      schedule: serializeRecurringFocusTaskSchedule(result.value.schedule),
    },
  });

  return NextResponse.json(
    { data: toRecurringFocusTaskDto(row) },
    { status: 201 }
  );
}
