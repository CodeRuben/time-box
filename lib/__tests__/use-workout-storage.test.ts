import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearWorkoutDayData,
  formatWorkoutDateKey,
  getDefaultWorkoutDayData,
  getWorkoutStorageKey,
  loadWorkoutDayData,
  loadWorkoutTypesForDate,
  saveWorkoutDayData,
} from "../use-workout-storage";

describe("formatWorkoutDateKey", () => {
  it("formats date as YYYY-MM-DD", () => {
    const date = new Date(2026, 2, 1);
    expect(formatWorkoutDateKey(date)).toBe("2026-03-01");
  });

  it("pads single-digit day and month", () => {
    const date = new Date(2026, 0, 5);
    expect(formatWorkoutDateKey(date)).toBe("2026-01-05");
  });
});

describe("getWorkoutStorageKey", () => {
  it("includes workout-tracker prefix", () => {
    const date = new Date(2026, 6, 14);
    expect(getWorkoutStorageKey(date)).toBe("workout-tracker-2026-07-14");
  });
});

describe("getDefaultWorkoutDayData", () => {
  it("returns empty workouts by default", () => {
    expect(getDefaultWorkoutDayData()).toEqual({ workouts: [] });
  });
});

describe("saveWorkoutDayData + loadWorkoutDayData", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads null when data does not exist", () => {
    const date = new Date(2026, 2, 1);
    expect(loadWorkoutDayData(date)).toBeNull();
  });

  it("saves and loads workout entries", () => {
    const date = new Date(2026, 2, 1);
    saveWorkoutDayData(date, {
      workouts: [
        {
          id: "w1",
          type: "resistance",
          name: "Push day",
          subtasks: [],
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const loaded = loadWorkoutDayData(date);
    expect(loaded?.workouts).toHaveLength(1);
    expect(loaded?.workouts[0].name).toBe("Push day");
    expect(loaded?.workouts[0].subtasks).toEqual([]);
    expect(loaded?.lastSaved).toBeDefined();
  });

  it("filters invalid workouts on load", () => {
    const date = new Date(2026, 2, 1);
    const key = getWorkoutStorageKey(date);

    localStorage.setItem(
      key,
      JSON.stringify({
        workouts: [
          {
            id: "valid",
            type: "cardio",
            name: "Bike",
            subtasks: [],
            createdAt: new Date().toISOString(),
          },
          {
            id: "invalid",
            type: "other",
            name: "Bad",
            subtasks: [],
            createdAt: new Date().toISOString(),
          },
        ],
      })
    );

    const loaded = loadWorkoutDayData(date);
    expect(loaded?.workouts).toHaveLength(1);
    expect(loaded?.workouts[0].id).toBe("valid");
  });

  it("normalizes legacy data and migrates description into subtasks", () => {
    const date = new Date(2026, 2, 1);
    const key = getWorkoutStorageKey(date);

    localStorage.setItem(
      key,
      JSON.stringify({
        workouts: [
          {
            id: "a",
            type: "resistance",
            name: "Strength",
            createdAt: new Date().toISOString(),
          },
          {
            id: "b",
            type: "cardio",
            name: "Run",
            description: "  Easy pace  ",
            createdAt: new Date().toISOString(),
          },
        ],
      })
    );

    const loaded = loadWorkoutDayData(date);
    expect(loaded?.workouts[0].name).toBe("Strength");
    expect(loaded?.workouts[1].name).toBe("Run");
    expect(loaded?.workouts[0].subtasks).toEqual([]);
    expect(loaded?.workouts[1].subtasks[0].name).toBe("Easy pace");
  });

  it("returns null for malformed JSON", () => {
    const date = new Date(2026, 2, 1);
    const key = getWorkoutStorageKey(date);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    localStorage.setItem(key, "{broken-json");
    expect(loadWorkoutDayData(date)).toBeNull();

    consoleSpy.mockRestore();
  });
});

describe("clearWorkoutDayData", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes saved data for a specific date", () => {
    const date = new Date(2026, 2, 1);
    saveWorkoutDayData(date, {
      workouts: [
        {
          id: "w1",
          type: "cardio",
          name: "Run",
          subtasks: [],
          createdAt: new Date().toISOString(),
        },
      ],
    });

    clearWorkoutDayData(date);
    expect(loadWorkoutDayData(date)).toBeNull();
  });
});

describe("loadWorkoutTypesForDate", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns workout types per workout entry for a date", () => {
    const date = new Date(2026, 2, 1);
    saveWorkoutDayData(date, {
      workouts: [
        {
          id: "w1",
          type: "unknown",
          name: "Unclassified",
          subtasks: [],
          createdAt: new Date().toISOString(),
        },
        {
          id: "w2",
          type: "cardio",
          name: "Run",
          subtasks: [],
          createdAt: new Date().toISOString(),
        },
        {
          id: "w3",
          type: "resistance",
          name: "Pull Day",
          subtasks: [],
          createdAt: new Date().toISOString(),
        },
        {
          id: "w4",
          type: "cardio",
          name: "Bike",
          subtasks: [],
          createdAt: new Date().toISOString(),
        },
      ],
    });

    expect(loadWorkoutTypesForDate(date)).toEqual([
      "cardio",
      "resistance",
      "cardio",
    ]);
  });

  it("returns empty array when there are no workouts", () => {
    const date = new Date(2026, 2, 1);
    expect(loadWorkoutTypesForDate(date)).toEqual([]);
  });
});
