import { describe, expect, it } from "vitest";
import {
  mergeRecurringFocusTaskInput,
  parseCreateBody,
  parsePatchBody,
  validateRecurringFocusTaskInput,
} from "../recurring-focus-tasks/validation";

describe("parseCreateBody", () => {
  it("requires a trimmed title and schedule for create", () => {
    const result = parseCreateBody({
      title: "  Code review  ",
      notes: "  weekly  ",
      schedule: { type: "weekly", weekdays: [1, 2, 3, 4, 5] },
    });

    expect(result).toEqual({
      ok: true,
      value: {
        title: "Code review",
        notes: "weekly",
        enabled: true,
        startDate: null,
        endDate: null,
        schedule: { type: "weekly", weekdays: [1, 2, 3, 4, 5] },
      },
    });
  });

  it("rejects empty title and inverted date range", () => {
    expect(
      parseCreateBody({
        title: "   ",
        schedule: { type: "weekly", weekdays: [1] },
      }).ok
    ).toBe(false);

    expect(
      parseCreateBody({
        title: "Task",
        startDate: "2026-08-01",
        endDate: "2026-07-01",
        schedule: { type: "weekly", weekdays: [1] },
      }).ok
    ).toBe(false);
  });
});

describe("parsePatchBody", () => {
  it("allows partial patches", () => {
    expect(parsePatchBody({ enabled: false })).toEqual({
      ok: true,
      value: { enabled: false },
    });
  });
});

describe("mergeRecurringFocusTaskInput", () => {
  const existing = {
    title: "Review",
    notes: "",
    enabled: true,
    startDate: null as string | null,
    endDate: null as string | null,
    schedule: {
      type: "weekly" as const,
      weekdays: [1, 2, 3, 4, 5] as const,
    },
  };

  it("validates merged state for patches", () => {
    const result = mergeRecurringFocusTaskInput(
      {
        ...existing,
        schedule: { type: "weekly", weekdays: [1, 2, 3, 4, 5] },
      },
      {
        startDate: "2026-08-01",
        endDate: "2026-07-01",
      }
    );

    expect(result.ok).toBe(false);
  });

  it("applies valid patches", () => {
    const result = mergeRecurringFocusTaskInput(
      {
        ...existing,
        schedule: { type: "weekly", weekdays: [1, 2, 3, 4, 5] },
      },
      {
        title: "  New title ",
        enabled: false,
      }
    );

    expect(result).toMatchObject({
      ok: true,
      value: {
        title: "New title",
        enabled: false,
      },
    });
  });
});

describe("validateRecurringFocusTaskInput", () => {
  it("is usable by the form for the same rules", () => {
    const result = validateRecurringFocusTaskInput({
      title: "",
      notes: "",
      enabled: true,
      startDate: null,
      endDate: null,
      schedule: { type: "weekly", weekdays: [1] },
    });

    expect(result).toEqual({
      ok: false,
      message: "Title is required",
      field: "title",
    });
  });
});
