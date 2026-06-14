import { describe, expect, it } from "vitest";
import {
  flattenWorkoutDaysToRows,
  hydrateWorkoutExportDays,
  workoutDaysToCsv,
  workoutRowsToCsv,
} from "../workout-export";

describe("hydrateWorkoutExportDays", () => {
  it("returns empty array for invalid input", () => {
    expect(hydrateWorkoutExportDays(null)).toEqual([]);
    expect(hydrateWorkoutExportDays({})).toEqual([]);
  });

  it("parses valid workout day payloads", () => {
    const days = hydrateWorkoutExportDays([
      {
        dateKey: "2026-03-01",
        data: { workouts: [{ id: "w1" }] },
      },
    ]);

    expect(days).toHaveLength(1);
    expect(days[0].dateKey).toBe("2026-03-01");
  });
});

describe("flattenWorkoutDaysToRows", () => {
  it("creates one row per subtask", () => {
    const rows = flattenWorkoutDaysToRows([
      {
        dateKey: "2026-03-02",
        data: {
          workouts: [
            {
              id: "w1",
              type: "resistance",
              name: "Push day",
              createdAt: "2026-03-02T10:00:00.000Z",
              subtasks: [
                { id: "s1", name: "Bench press", status: "completed" },
                { id: "s2", name: "Rows", status: "pending" },
              ],
            },
          ],
        },
      },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      date: "2026-03-02",
      workoutName: "Push day",
      workoutType: "resistance",
      exerciseName: "Bench press",
      exerciseStatus: "completed",
    });
    expect(rows[1].exerciseName).toBe("Rows");
  });

  it("creates a single row when a workout has no subtasks", () => {
    const rows = flattenWorkoutDaysToRows([
      {
        dateKey: "2026-03-01",
        data: {
          workouts: [
            {
              id: "w1",
              type: "cardio",
              name: "Morning run",
              createdAt: "2026-03-01T08:00:00.000Z",
              subtasks: [],
            },
          ],
        },
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      exerciseName: "",
      exerciseStatus: "",
    });
  });

  it("sorts days chronologically", () => {
    const rows = flattenWorkoutDaysToRows([
      {
        dateKey: "2026-03-03",
        data: {
          workouts: [
            {
              id: "w2",
              type: "hybrid",
              name: "Later",
              createdAt: "2026-03-03T08:00:00.000Z",
              subtasks: [],
            },
          ],
        },
      },
      {
        dateKey: "2026-03-01",
        data: {
          workouts: [
            {
              id: "w1",
              type: "cardio",
              name: "Earlier",
              createdAt: "2026-03-01T08:00:00.000Z",
              subtasks: [],
            },
          ],
        },
      },
    ]);

    expect(rows.map((row) => row.date)).toEqual(["2026-03-01", "2026-03-03"]);
  });
});

describe("workoutRowsToCsv", () => {
  it("includes headers and escapes quoted values", () => {
    const csv = workoutRowsToCsv([
      {
        date: "2026-03-01",
        workoutName: 'Leg day, "heavy"',
        workoutType: "resistance",
        workoutCreatedAt: "2026-03-01T08:00:00.000Z",
        exerciseName: "Squat",
        exerciseStatus: "completed",
      },
    ]);

    expect(csv).toContain(
      "Date,Workout Name,Workout Type,Workout Created At,Exercise Name,Exercise Status",
    );
    expect(csv).toContain('"Leg day, ""heavy"""');
  });
});

describe("workoutDaysToCsv", () => {
  it("converts workout days into csv", () => {
    const csv = workoutDaysToCsv([
      {
        dateKey: "2026-03-01",
        data: {
          workouts: [
            {
              id: "w1",
              type: "cardio",
              name: "Bike",
              createdAt: "2026-03-01T08:00:00.000Z",
              subtasks: [
                { id: "s1", name: "Intervals", status: "completed" },
              ],
            },
          ],
        },
      },
    ]);

    expect(csv.split("\r\n")).toHaveLength(2);
    expect(csv).toContain("Bike");
    expect(csv).toContain("Intervals");
  });
});
