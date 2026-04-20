import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-session";
import { isDateKey } from "@/lib/date-key";
import { prisma } from "@/lib/prisma";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

function extractWorkoutTypes(
  value: string
): Array<"resistance" | "cardio" | "hybrid"> {
  try {
    const parsed = JSON.parse(value) as {
      workouts?: Array<{
        type?: unknown;
      }>;
    };

    if (!Array.isArray(parsed.workouts)) {
      return [];
    }

    return parsed.workouts.flatMap((workout) => {
      if (
        workout?.type === "resistance" ||
        workout?.type === "cardio" ||
        workout?.type === "hybrid"
      ) {
        return [workout.type];
      }

      return [];
    });
  } catch (error) {
    console.error("Failed to parse workout summary data:", error);
    return [];
  }
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end || !isDateKey(start) || !isDateKey(end)) {
    return NextResponse.json(
      { error: "Valid start and end dates are required" },
      { status: 400 }
    );
  }

  const workoutDays = await prisma.workoutDay.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lte: end,
      },
    },
    select: {
      date: true,
      data: true,
    },
  });

  const summary = Object.fromEntries(
    workoutDays.map((workoutDay) => [
      workoutDay.date,
      extractWorkoutTypes(workoutDay.data),
    ])
  );

  return NextResponse.json({ summary });
}
