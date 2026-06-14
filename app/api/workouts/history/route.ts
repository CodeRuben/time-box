import { NextResponse } from "next/server";
import { requireFeatureUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

const MAX_DAYS = 30;

export async function GET() {
  const access = await requireFeatureUser("workouts", "Workouts are disabled");
  if (access.response) {
    return access.response;
  }

  const workoutDays = await prisma.workoutDay.findMany({
    where: { userId: access.userId },
    orderBy: { date: "desc" },
    take: MAX_DAYS,
    select: { date: true, data: true },
  });

  const days = workoutDays.map((day) => ({
    dateKey: day.date,
    data: JSON.parse(day.data) as unknown,
  }));

  return NextResponse.json({ days });
}
