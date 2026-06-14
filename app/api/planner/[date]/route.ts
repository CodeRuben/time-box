import { NextResponse } from "next/server";
import { requireFeatureUser } from "@/lib/auth-session";
import { isDateKey } from "@/lib/date-key";
import { prisma } from "@/lib/prisma";

interface PlannerRouteContext {
  params: Promise<{
    date: string;
  }>;
}

function badRequestResponse() {
  return NextResponse.json({ error: "Invalid date" }, { status: 400 });
}

function parseStoredData(value: string) {
  return JSON.parse(value) as Record<string, unknown>;
}

export async function GET(
  _request: Request,
  { params }: PlannerRouteContext
) {
  const access = await requireFeatureUser("planner", "Planner is disabled");
  if (access.response) {
    return access.response;
  }

  const { date } = await params;

  if (!isDateKey(date)) {
    return badRequestResponse();
  }

  const plannerDay = await prisma.plannerDay.findUnique({
    where: {
      userId_date: {
        userId: access.userId,
        date,
      },
    },
  });

  if (!plannerDay) {
    return NextResponse.json({ data: null }, { status: 404 });
  }

  return NextResponse.json({ data: parseStoredData(plannerDay.data) });
}

export async function PUT(
  request: Request,
  { params }: PlannerRouteContext
) {
  const access = await requireFeatureUser("planner", "Planner is disabled");
  if (access.response) {
    return access.response;
  }

  const { date } = await params;

  if (!isDateKey(date)) {
    return badRequestResponse();
  }

  const body = (await request.json()) as {
    data?: Record<string, unknown>;
  };

  if (!body.data || typeof body.data !== "object") {
    return NextResponse.json({ error: "Invalid planner payload" }, { status: 400 });
  }

  const data = {
    ...body.data,
    lastSaved: new Date().toISOString(),
  };

  const plannerDay = await prisma.plannerDay.upsert({
    where: {
      userId_date: {
        userId: access.userId,
        date,
      },
    },
    update: {
      data: JSON.stringify(data),
    },
    create: {
      userId: access.userId,
      date,
      data: JSON.stringify(data),
    },
  });

  return NextResponse.json({ data: parseStoredData(plannerDay.data) });
}
