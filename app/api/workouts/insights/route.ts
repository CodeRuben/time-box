import { NextResponse } from "next/server";
import { requireFeatureUser } from "@/lib/auth-session";
import { isDateKey } from "@/lib/date-key";
import { prisma } from "@/lib/prisma";
import { hydrateWorkoutDayData } from "@/lib/workout-day-data";
import {
  MAX_INSIGHT_RANGE_MONTHS,
  WORKOUT_TYPES,
  buildWorkoutInsights,
  isInsightRangeWithinLimit,
  isWorkoutType,
  toWorkoutInsightsPage,
  type WorkoutInsightDay,
  type WorkoutType,
} from "@/lib/workout-insights";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseTypes(searchParams: URLSearchParams): WorkoutType[] | null {
  const rawTypes = searchParams.getAll("type");
  if (rawTypes.length === 0) {
    return [...WORKOUT_TYPES];
  }

  const types: WorkoutType[] = [];
  for (const value of rawTypes) {
    if (!isWorkoutType(value)) {
      return null;
    }
    if (!types.includes(value)) {
      types.push(value);
    }
  }

  return types;
}

function parseNonNegativeInteger(
  value: string | null,
  fallback: number,
): number | null {
  if (value === null || value === "") {
    return fallback;
  }

  if (!/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}

function hydrateInsightDays(
  rows: Array<{ date: string; data: string }>,
): WorkoutInsightDay[] {
  const days: WorkoutInsightDay[] = [];

  for (const row of rows) {
    try {
      const data = hydrateWorkoutDayData(JSON.parse(row.data));
      if (!data || data.workouts.length === 0) {
        continue;
      }

      days.push({
        dateKey: row.date,
        data,
      });
    } catch (error) {
      console.error("Failed to parse workout insights data:", error);
    }
  }

  return days;
}

export async function GET(request: Request) {
  const access = await requireFeatureUser("workouts", "Workouts are disabled");
  if (access.response) {
    return access.response;
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const types = parseTypes(searchParams);
  const offset = parseNonNegativeInteger(searchParams.get("offset"), 0);
  const rawLimit = parseNonNegativeInteger(
    searchParams.get("limit"),
    DEFAULT_LIMIT,
  );

  if (
    !start ||
    !end ||
    !isDateKey(start) ||
    !isDateKey(end) ||
    start > end ||
    types === null ||
    offset === null ||
    rawLimit === null ||
    rawLimit < 1
  ) {
    return NextResponse.json(
      { error: "Valid start, end, types, offset, and limit are required" },
      { status: 400 },
    );
  }

  if (!isInsightRangeWithinLimit(start, end)) {
    return NextResponse.json(
      {
        error: `Date range cannot exceed ${MAX_INSIGHT_RANGE_MONTHS} months`,
      },
      { status: 400 },
    );
  }

  const limit = Math.min(rawLimit, MAX_LIMIT);

  const workoutDays = await prisma.workoutDay.findMany({
    where: {
      userId: access.userId,
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { date: "desc" },
    select: {
      date: true,
      data: true,
    },
  });

  const insights = buildWorkoutInsights(hydrateInsightDays(workoutDays), {
    startDate: start,
    endDate: end,
    types,
  });

  return NextResponse.json(toWorkoutInsightsPage(insights, offset, limit));
}
