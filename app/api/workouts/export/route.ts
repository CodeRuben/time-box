import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401 },
  );
}

export async function GET() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  const workoutDays = await prisma.workoutDay.findMany({
    where: { userId },
    orderBy: { date: "asc" },
    select: { date: true, data: true },
  });

  const days = workoutDays
    .map((day) => ({
      dateKey: day.date,
      data: JSON.parse(day.data) as { workouts?: unknown[] },
    }))
    .filter((day) => Array.isArray(day.data.workouts) && day.data.workouts.length > 0);

  return NextResponse.json({ days });
}
