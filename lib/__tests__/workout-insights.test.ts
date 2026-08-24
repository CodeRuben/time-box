import { describe, expect, it } from "vitest";
import {
  buildWorkoutInsights,
  constrainSelectedWorkoutTypes,
  isInsightRangeWithinLimit,
  nextSelectedWorkoutTypes,
  type WorkoutInsightDay,
} from "../workout-insights";
import { hydrateWorkoutDayData } from "../workout-day-data";

function day(
  dateKey: string,
  workouts: WorkoutInsightDay["data"]["workouts"],
): WorkoutInsightDay {
  return { dateKey, data: { workouts } };
}

function workout(
  id: string,
  type: WorkoutInsightDay["data"]["workouts"][number]["type"],
  name: string,
  createdAt: string,
  subtasks: WorkoutInsightDay["data"]["workouts"][number]["subtasks"] = [],
): WorkoutInsightDay["data"]["workouts"][number] {
  return { id, type, name, createdAt, subtasks };
}

describe("buildWorkoutInsights", () => {
  it("counts multiple workouts on one date as separate entries and one active day", () => {
    const insights = buildWorkoutInsights(
      [
        day("2026-03-01", [
          workout("w1", "resistance", "Push", "2026-03-01T08:00:00.000Z"),
          workout("w2", "cardio", "Run", "2026-03-01T09:00:00.000Z"),
        ]),
      ],
      {
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        types: ["resistance", "cardio", "hybrid", "unknown"],
      },
    );

    expect(insights.totalWorkoutEntries).toBe(2);
    expect(insights.activeDays).toBe(1);
  });

  it("filters by selected types and includes unknown as Uncategorized", () => {
    const insights = buildWorkoutInsights(
      [
        day("2026-02-01", [
          workout("w1", "resistance", "Lift", "2026-02-01T08:00:00.000Z"),
          workout("w2", "unknown", "Misc", "2026-02-01T09:00:00.000Z"),
          workout("w3", "cardio", "Bike", "2026-02-01T10:00:00.000Z"),
        ]),
      ],
      {
        startDate: "2026-02-01",
        endDate: "2026-02-28",
        types: ["unknown", "cardio"],
      },
    );

    expect(insights.totalWorkoutEntries).toBe(2);
    expect(insights.entries.map((entry) => entry.type)).toEqual([
      "cardio",
      "unknown",
    ]);
    expect(insights.monthlyCounts[0]?.counts.unknown).toBe(1);
    expect(insights.monthlyCounts[0]?.counts.cardio).toBe(1);
    expect(insights.monthlyCounts[0]?.counts.resistance).toBe(0);
  });

  it("includes zero-count months across the selected range", () => {
    const insights = buildWorkoutInsights(
      [
        day("2026-01-15", [
          workout("w1", "cardio", "Run", "2026-01-15T08:00:00.000Z"),
        ]),
      ],
      {
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        types: ["resistance", "cardio", "hybrid", "unknown"],
      },
    );

    expect(insights.monthlyCounts.map((row) => row.monthKey)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
    ]);
    expect(insights.monthlyCounts[1]?.total).toBe(0);
    expect(insights.monthlyCounts[2]?.total).toBe(0);
  });

  it("supports ranges that cross a year boundary", () => {
    const insights = buildWorkoutInsights(
      [
        day("2025-12-20", [
          workout("w1", "hybrid", "Circuit", "2025-12-20T08:00:00.000Z"),
        ]),
        day("2026-01-05", [
          workout("w2", "resistance", "Push", "2026-01-05T08:00:00.000Z"),
        ]),
      ],
      {
        startDate: "2025-12-01",
        endDate: "2026-01-31",
        types: ["resistance", "cardio", "hybrid", "unknown"],
      },
    );

    expect(insights.monthlyCounts.map((row) => row.monthKey)).toEqual([
      "2025-12",
      "2026-01",
    ]);
    expect(insights.totalWorkoutEntries).toBe(2);
  });

  it("sorts entries newest-first and keeps workouts with no subtasks", () => {
    const insights = buildWorkoutInsights(
      [
        day("2026-03-01", [
          workout("older", "cardio", "Earlier", "2026-03-01T08:00:00.000Z"),
          workout("newer", "cardio", "Later", "2026-03-01T10:00:00.000Z"),
        ]),
        day("2026-03-02", [
          workout("next-day", "resistance", "Push", "2026-03-02T08:00:00.000Z"),
        ]),
      ],
      {
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        types: ["resistance", "cardio", "hybrid", "unknown"],
      },
    );

    expect(insights.entries.map((entry) => entry.id)).toEqual([
      "next-day",
      "newer",
      "older",
    ]);
    expect(insights.entries[0]?.subtasks).toEqual([]);
  });

  it("breaks most-frequent-type ties with WORKOUT_TYPES order", () => {
    const insights = buildWorkoutInsights(
      [
        day("2026-04-01", [
          workout("w1", "hybrid", "A", "2026-04-01T08:00:00.000Z"),
          workout("w2", "cardio", "B", "2026-04-01T09:00:00.000Z"),
        ]),
      ],
      {
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        types: ["resistance", "cardio", "hybrid", "unknown"],
      },
    );

    expect(insights.mostFrequentType).toEqual({ type: "cardio", count: 1 });
  });

  it("does not mutate input days or workouts", () => {
    const input: WorkoutInsightDay[] = [
      day("2026-05-01", [
        workout("w1", "resistance", "Push", "2026-05-01T08:00:00.000Z", [
          { id: "s1", name: "Bench", status: "completed" },
        ]),
      ]),
    ];
    const snapshot = structuredClone(input);

    buildWorkoutInsights(input, {
      startDate: "2026-05-01",
      endDate: "2026-05-31",
      types: ["resistance", "cardio", "hybrid", "unknown"],
    });

    expect(input).toEqual(snapshot);
  });

  it("picks the most recent month when most-active totals tie", () => {
    const insights = buildWorkoutInsights(
      [
        day("2026-01-10", [
          workout("w1", "resistance", "A", "2026-01-10T08:00:00.000Z"),
        ]),
        day("2026-03-10", [
          workout("w2", "cardio", "B", "2026-03-10T08:00:00.000Z"),
        ]),
      ],
      {
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        types: ["resistance", "cardio", "hybrid", "unknown"],
      },
    );

    expect(insights.mostActiveMonth).toEqual({
      monthKey: "2026-03",
      total: 1,
    });
  });

  it("returns null most-active-month for an all-zero range", () => {
    const insights = buildWorkoutInsights(
      [],
      {
        startDate: "2026-01-01",
        endDate: "2026-02-28",
        types: ["resistance", "cardio", "hybrid", "unknown"],
      },
    );

    expect(insights.mostActiveMonth).toBeNull();
    expect(insights.monthlyCounts.every((row) => row.total === 0)).toBe(true);
    expect(insights.availableTypes).toEqual([]);
  });

  it("lists available types for the date range even when they are filtered out", () => {
    const insights = buildWorkoutInsights(
      [
        day("2026-06-01", [
          workout("w1", "resistance", "Lift", "2026-06-01T08:00:00.000Z"),
          workout("w2", "cardio", "Run", "2026-06-01T09:00:00.000Z"),
        ]),
      ],
      {
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        types: ["cardio"],
      },
    );

    expect(insights.availableTypes).toEqual(["resistance", "cardio"]);
    expect(insights.totalWorkoutEntries).toBe(1);
  });

});

describe("nextSelectedWorkoutTypes", () => {
  it("ignores types that have no workouts in range", () => {
    expect(
      nextSelectedWorkoutTypes(
        ["resistance", "cardio"],
        "hybrid",
        ["resistance", "cardio"],
      ),
    ).toEqual(["resistance", "cardio"]);
  });

  it("keeps the last available type selected", () => {
    expect(
      nextSelectedWorkoutTypes(
        ["resistance", "hybrid"],
        "resistance",
        ["resistance"],
      ),
    ).toEqual(["resistance", "hybrid"]);
  });
});

describe("constrainSelectedWorkoutTypes", () => {
  it("unchecks types that have no workouts in range", () => {
    expect(
      constrainSelectedWorkoutTypes(
        ["resistance", "cardio", "hybrid", "unknown"],
        ["resistance", "cardio"],
      ),
    ).toEqual(["resistance", "cardio"]);
  });

  it("unchecks every type when the range has no workouts", () => {
    expect(
      constrainSelectedWorkoutTypes(
        ["resistance", "cardio", "hybrid", "unknown"],
        [],
      ),
    ).toEqual([]);
  });
});

describe("isInsightRangeWithinLimit", () => {
  it("allows ranges within the month cap", () => {
    expect(isInsightRangeWithinLimit("2021-01-01", "2025-12-31")).toBe(true);
  });

  it("rejects ranges beyond the month cap", () => {
    expect(isInsightRangeWithinLimit("2000-01-01", "2026-08-08")).toBe(false);
  });
});

describe("hydrateWorkoutDayData for insights", () => {
  it("normalizes legacy workouts without subtasks", () => {
    const data = hydrateWorkoutDayData({
      workouts: [
        {
          id: "a",
          type: "resistance",
          name: "Strength",
          createdAt: "2026-03-01T08:00:00.000Z",
        },
      ],
    });

    expect(data?.workouts).toHaveLength(1);
    expect(data?.workouts[0]?.subtasks).toEqual([]);
  });
});
