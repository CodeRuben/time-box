import { NextResponse } from "next/server";
import { requireFeatureUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const access = await requireFeatureUser("workouts", "Workouts are disabled");
  if (access.response) {
    return access.response;
  }

  const workoutDays = await prisma.workoutDay.findMany({
    where: { userId: access.userId },
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
