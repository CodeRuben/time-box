import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-session";
import { isDateKey } from "@/lib/date-key";
import { prisma } from "@/lib/prisma";

interface PlannerRouteContext {
  params: Promise<{
    date: string;
  }>;
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
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
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  const { date } = await params;

  if (!isDateKey(date)) {
    return badRequestResponse();
  }

  const plannerDay = await prisma.plannerDay.findUnique({
    where: {
      userId_date: {
        userId,
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
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return unauthorizedResponse();
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
        userId,
        date,
      },
    },
    update: {
      data: JSON.stringify(data),
    },
    create: {
      userId,
      date,
      data: JSON.stringify(data),
    },
  });

  return NextResponse.json({ data: parseStoredData(plannerDay.data) });
}
