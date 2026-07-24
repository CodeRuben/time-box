import { describe, expect, it } from "vitest";
import {
  getWeekdayFromDateKey,
  getWholeWeeksBetween,
  isRecurringFocusTaskActiveOnDate,
  normalizeWeekdays,
  parseRecurringFocusTaskSchedule,
  serializeRecurringFocusTaskSchedule,
} from "../recurring-focus-tasks/schedule";
import type { Weekday } from "../recurring-focus-tasks/types";

describe("normalizeWeekdays", () => {
  it("sorts and dedupes weekday values", () => {
    expect(normalizeWeekdays([5, 1, 1, 3, 2])).toEqual([1, 2, 3, 5]);
  });
});

describe("getWeekdayFromDateKey", () => {
  it("returns local weekday without UTC rollover", () => {
    // 2026-07-20 is a Monday
    expect(getWeekdayFromDateKey("2026-07-20")).toBe(1);
  });
});

describe("getWholeWeeksBetween", () => {
  it("counts whole weeks from anchor to date", () => {
    expect(getWholeWeeksBetween("2026-07-20", "2026-07-20")).toBe(0);
    expect(getWholeWeeksBetween("2026-07-20", "2026-07-26")).toBe(0);
    expect(getWholeWeeksBetween("2026-07-20", "2026-07-27")).toBe(1);
    expect(getWholeWeeksBetween("2026-07-20", "2026-08-03")).toBe(2);
  });
});

describe("parseRecurringFocusTaskSchedule", () => {
  it("parses weekly schedules and normalizes weekdays", () => {
    expect(
      parseRecurringFocusTaskSchedule({
        type: "weekly",
        weekdays: [5, 1, 1],
      })
    ).toEqual({ type: "weekly", weekdays: [1, 5] });
  });

  it("parses active/rest schedules from JSON strings", () => {
    expect(
      parseRecurringFocusTaskSchedule(
        JSON.stringify({
          type: "active_rest_weeks",
          weekdays: [1, 2, 3, 4, 5],
          anchorDate: "2026-07-20",
          activeWeeks: 2,
          inactiveWeeks: 2,
        })
      )
    ).toEqual({
      type: "active_rest_weeks",
      weekdays: [1, 2, 3, 4, 5],
      anchorDate: "2026-07-20",
      activeWeeks: 2,
      inactiveWeeks: 2,
    });
  });

  it("rejects invalid schedules", () => {
    expect(parseRecurringFocusTaskSchedule(null)).toBeNull();
    expect(parseRecurringFocusTaskSchedule({ type: "weekly", weekdays: [] })).toBeNull();
    expect(
      parseRecurringFocusTaskSchedule({
        type: "weekly",
        weekdays: [7],
      })
    ).toBeNull();
    expect(
      parseRecurringFocusTaskSchedule({
        type: "active_rest_weeks",
        weekdays: [1],
        anchorDate: "not-a-date",
        activeWeeks: 2,
        inactiveWeeks: 2,
      })
    ).toBeNull();
    expect(
      parseRecurringFocusTaskSchedule({
        type: "active_rest_weeks",
        weekdays: [1],
        anchorDate: "2026-07-20",
        activeWeeks: 0,
        inactiveWeeks: 2,
      })
    ).toBeNull();
  });
});

describe("serializeRecurringFocusTaskSchedule", () => {
  it("serializes normalized weekly schedules", () => {
    expect(
      serializeRecurringFocusTaskSchedule({
        type: "weekly",
        weekdays: [5, 1, 1],
      })
    ).toBe(JSON.stringify({ type: "weekly", weekdays: [1, 5] }));
  });
});

describe("isRecurringFocusTaskActiveOnDate", () => {
  const weeklyTask = {
    enabled: true,
    startDate: "2026-07-01" as string | null,
    endDate: "2026-07-31" as string | null,
    schedule: {
      type: "weekly" as const,
      weekdays: [1, 2, 3, 4, 5] as Weekday[],
    },
  };

  it("matches weekdays within an inclusive date range", () => {
    expect(isRecurringFocusTaskActiveOnDate(weeklyTask, "2026-07-01")).toBe(true); // Wed
    expect(isRecurringFocusTaskActiveOnDate(weeklyTask, "2026-07-31")).toBe(true); // Fri
    expect(isRecurringFocusTaskActiveOnDate(weeklyTask, "2026-07-19")).toBe(false); // Sun
    expect(isRecurringFocusTaskActiveOnDate(weeklyTask, "2026-06-30")).toBe(false);
    expect(isRecurringFocusTaskActiveOnDate(weeklyTask, "2026-08-01")).toBe(false);
  });

  it("rejects disabled tasks", () => {
    expect(
      isRecurringFocusTaskActiveOnDate(
        { ...weeklyTask, enabled: false },
        "2026-07-20"
      )
    ).toBe(false);
  });

  it("matches 2-active/2-inactive cycle boundaries", () => {
    const cycleTask = {
      enabled: true,
      startDate: null,
      endDate: null,
      schedule: {
        type: "active_rest_weeks" as const,
        weekdays: [1, 2, 3, 4, 5] as Weekday[],
        anchorDate: "2026-07-20",
        activeWeeks: 2,
        inactiveWeeks: 2,
      },
    };

    // Week 0-1 active (Jul 20–Aug 2); week 2-3 inactive (Aug 3–16)
    expect(isRecurringFocusTaskActiveOnDate(cycleTask, "2026-07-20")).toBe(true);
    expect(isRecurringFocusTaskActiveOnDate(cycleTask, "2026-07-31")).toBe(true);
    expect(isRecurringFocusTaskActiveOnDate(cycleTask, "2026-08-03")).toBe(false);
    expect(isRecurringFocusTaskActiveOnDate(cycleTask, "2026-08-14")).toBe(false);
    expect(isRecurringFocusTaskActiveOnDate(cycleTask, "2026-08-17")).toBe(true);
    expect(isRecurringFocusTaskActiveOnDate(cycleTask, "2026-07-19")).toBe(false);
  });
});
