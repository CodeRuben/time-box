import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

const MAX_DAYS = 30;

export async function GET() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const workoutDays = await prisma.workoutDay.findMany({
    where: { userId },
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
