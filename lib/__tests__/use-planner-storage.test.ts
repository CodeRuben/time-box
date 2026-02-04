import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getStorageKey,
  getDefaultData,
  migrateHourlyCompleted,
  migrateToHourlySlots,
  migrateFromLegacy,
  ensurePriorityFields,
  loadPlannerData,
  savePlannerData,
  type LegacyPlannerData,
  type TopPriority,
} from "../use-planner-storage";

describe("getStorageKey", () => {
  it("generates correct format for a date", () => {
    const date = new Date(2026, 0, 31); // Jan 31, 2026
    expect(getStorageKey(date)).toBe("planner-2026-01-31");
  });

  it("pads single-digit months and days with zeros", () => {
    const date = new Date(2026, 4, 5); // May 5, 2026
    expect(getStorageKey(date)).toBe("planner-2026-05-05");
  });

  it("handles December correctly (month index 11)", () => {
    const date = new Date(2026, 11, 25); // Dec 25, 2026
    expect(getStorageKey(date)).toBe("planner-2026-12-25");
  });
});

describe("getDefaultData", () => {
  it("returns empty top priorities", () => {
    const data = getDefaultData();
    expect(data.topPriorities).toEqual([]);
  });

  it("returns empty brain dump", () => {
    const data = getDefaultData();
    expect(data.brainDump).toBe("");
  });

  it("generates hourly slots for all hours with :00 and :30 slots as empty arrays", () => {
    const data = getDefaultData();
    // Check a sample of expected keys
    expect(data.hourlySlots["7 AM:00"]).toEqual([]);
    expect(data.hourlySlots["7 AM:30"]).toEqual([]);
    expect(data.hourlySlots["12 PM:00"]).toEqual([]);
    expect(data.hourlySlots["11 PM:30"]).toEqual([]);
  });
});

describe("migrateHourlyCompleted", () => {
  it("converts true to 'completed'", () => {
    const result = migrateHourlyCompleted({ "7 AM:00": true });
    expect(result["7 AM:00"]).toBe("completed");
  });

  it("converts false to 'pending'", () => {
    const result = migrateHourlyCompleted({ "7 AM:00": false });
    expect(result["7 AM:00"]).toBe("pending");
  });

  it("handles multiple entries", () => {
    const result = migrateHourlyCompleted({
      "7 AM:00": true,
      "8 AM:00": false,
      "9 AM:30": true,
    });
    expect(result).toEqual({
      "7 AM:00": "completed",
      "8 AM:00": "pending",
      "9 AM:30": "completed",
    });
  });

  it("returns empty object for empty input", () => {
    const result = migrateHourlyCompleted({});
    expect(result).toEqual({});
  });
});

describe("migrateToHourlySlots", () => {
  it("converts hourlyPlans + hourlyStatuses to hourlySlots", () => {
    const result = migrateToHourlySlots(
      { "7 AM:00": "Meeting" },
      { "7 AM:00": "completed" }
    );
    expect(result["7 AM:00"]).toHaveLength(1);
    expect(result["7 AM:00"][0].text).toBe("Meeting");
    expect(result["7 AM:00"][0].status).toBe("completed");
    expect(result["7 AM:00"][0].id).toBeDefined();
  });

  it("uses pending status when no status exists", () => {
    const result = migrateToHourlySlots({ "7 AM:00": "Meeting" }, {});
    expect(result["7 AM:00"][0].status).toBe("pending");
  });

  it("creates empty array for empty text", () => {
    const result = migrateToHourlySlots({ "7 AM:00": "" }, {});
    expect(result["7 AM:00"]).toEqual([]);
  });

  it("trims whitespace-only text to empty array", () => {
    const result = migrateToHourlySlots({ "7 AM:00": "   " }, {});
    expect(result["7 AM:00"]).toEqual([]);
  });

  it("handles multiple slots", () => {
    const result = migrateToHourlySlots(
      { "7 AM:00": "Meeting", "8 AM:30": "Lunch", "9 AM:00": "" },
      { "7 AM:00": "completed", "8 AM:30": "error" }
    );
    expect(result["7 AM:00"][0].text).toBe("Meeting");
    expect(result["7 AM:00"][0].status).toBe("completed");
    expect(result["8 AM:30"][0].text).toBe("Lunch");
    expect(result["8 AM:30"][0].status).toBe("error");
    expect(result["9 AM:00"]).toEqual([]);
  });
});

describe("migrateFromLegacy", () => {
  it("converts legacy priorities array to TopPriority array", () => {
    const legacy: LegacyPlannerData = {
      priorities: ["Task 1", "Task 2"],
    };
    const result = migrateFromLegacy(legacy);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Task 1");
    expect(result[1].name).toBe("Task 2");
  });

  it("assigns required fields to migrated priorities", () => {
    const legacy: LegacyPlannerData = {
      priorities: ["Test Task"],
    };
    const result = migrateFromLegacy(legacy);

    expect(result[0]).toMatchObject({
      name: "Test Task",
      completed: false,
      subtasks: [],
    });
    expect(result[0].id).toBeDefined();
  });

  it("trims whitespace from priority names", () => {
    const legacy: LegacyPlannerData = {
      priorities: ["  Spaced Task  "],
    };
    const result = migrateFromLegacy(legacy);
    expect(result[0].name).toBe("Spaced Task");
  });

  it("filters out empty strings", () => {
    const legacy: LegacyPlannerData = {
      priorities: ["Task 1", "", "  ", "Task 2"],
    };
    const result = migrateFromLegacy(legacy);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Task 1");
    expect(result[1].name).toBe("Task 2");
  });

  it("returns empty array when priorities is undefined", () => {
    const legacy: LegacyPlannerData = {};
    const result = migrateFromLegacy(legacy);
    expect(result).toEqual([]);
  });

  it("returns empty array when priorities is not an array", () => {
    const legacy = {
      priorities: "not an array",
    } as unknown as LegacyPlannerData;
    const result = migrateFromLegacy(legacy);
    expect(result).toEqual([]);
  });
});

describe("ensurePriorityFields", () => {
  it("returns complete TopPriority when all fields present", () => {
    const input: TopPriority = {
      id: "123",
      name: "Test",
      completed: true,
      subtasks: [{ id: "sub1", name: "Subtask", completed: false }],
    };
    const result = ensurePriorityFields(input);
    expect(result).toEqual(input);
  });

  it("adds missing completed field with default false", () => {
    const input = { id: "123", name: "Test" };
    const result = ensurePriorityFields(input);
    expect(result.completed).toBe(false);
  });

  it("adds missing subtasks field with empty array", () => {
    const input = { id: "123", name: "Test" };
    const result = ensurePriorityFields(input);
    expect(result.subtasks).toEqual([]);
  });

  it("preserves existing completed value", () => {
    const input = { id: "123", name: "Test", completed: true };
    const result = ensurePriorityFields(input);
    expect(result.completed).toBe(true);
  });
});

describe("loadPlannerData", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no data exists", () => {
    const result = loadPlannerData(new Date(2026, 0, 31));
    expect(result).toBeNull();
  });

  it("loads and parses existing data with new hourlySlots format", () => {
    const date = new Date(2026, 0, 31);
    const testData = {
      topPriorities: [
        { id: "1", name: "Test", completed: false, subtasks: [] },
      ],
      brainDump: "Test dump",
      hourlySlots: {
        "7 AM:00": [{ id: "item1", text: "Meeting", status: "completed" }],
      },
    };
    localStorage.setItem("planner-2026-01-31", JSON.stringify(testData));

    const result = loadPlannerData(date);
    expect(result?.brainDump).toBe("Test dump");
    expect(result?.topPriorities[0].name).toBe("Test");
    expect(result?.hourlySlots["7 AM:00"][0].text).toBe("Meeting");
    expect(result?.hourlySlots["7 AM:00"][0].status).toBe("completed");
  });

  it("migrates legacy hourlyPlans + hourlyStatuses to hourlySlots", () => {
    const date = new Date(2026, 0, 31);
    const legacyData = {
      brainDump: "Test",
      hourlyPlans: { "7 AM:00": "Meeting", "8 AM:00": "Lunch" },
      hourlyStatuses: { "7 AM:00": "completed" },
    };
    localStorage.setItem("planner-2026-01-31", JSON.stringify(legacyData));

    const result = loadPlannerData(date);
    expect(result?.hourlySlots["7 AM:00"]).toHaveLength(1);
    expect(result?.hourlySlots["7 AM:00"][0].text).toBe("Meeting");
    expect(result?.hourlySlots["7 AM:00"][0].status).toBe("completed");
    expect(result?.hourlySlots["8 AM:00"][0].text).toBe("Lunch");
    expect(result?.hourlySlots["8 AM:00"][0].status).toBe("pending");
  });

  it("migrates legacy hourlyCompleted to hourlySlots", () => {
    const date = new Date(2026, 0, 31);
    const legacyData = {
      brainDump: "Test",
      hourlyPlans: { "7 AM:00": "Meeting" },
      hourlyCompleted: { "7 AM:00": true },
    };
    localStorage.setItem("planner-2026-01-31", JSON.stringify(legacyData));

    const result = loadPlannerData(date);
    expect(result?.hourlySlots["7 AM:00"][0].status).toBe("completed");
  });

  it("migrates legacy priorities format", () => {
    const date = new Date(2026, 0, 31);
    const legacyData = {
      priorities: ["Task 1", "Task 2"],
      brainDump: "Notes",
      hourlyPlans: {},
    };
    localStorage.setItem("planner-2026-01-31", JSON.stringify(legacyData));

    const result = loadPlannerData(date);
    expect(result?.topPriorities).toHaveLength(2);
    expect(result?.topPriorities[0].name).toBe("Task 1");
    expect(result?.topPriorities[1].name).toBe("Task 2");
  });

  it("returns null for malformed JSON", () => {
    const date = new Date(2026, 0, 31);
    localStorage.setItem("planner-2026-01-31", "not valid json{");

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = loadPlannerData(date);
    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });

  it("limits topPriorities to 3 items", () => {
    const date = new Date(2026, 0, 31);
    const testData = {
      topPriorities: [
        { id: "1", name: "One", completed: false, subtasks: [] },
        { id: "2", name: "Two", completed: false, subtasks: [] },
        { id: "3", name: "Three", completed: false, subtasks: [] },
        { id: "4", name: "Four", completed: false, subtasks: [] },
      ],
      brainDump: "",
      hourlySlots: {},
    };
    localStorage.setItem("planner-2026-01-31", JSON.stringify(testData));

    const result = loadPlannerData(date);
    expect(result?.topPriorities).toHaveLength(3);
  });
});

describe("savePlannerData", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves data to localStorage with correct key", () => {
    const date = new Date(2026, 0, 31);
    const data = {
      topPriorities: [],
      brainDump: "Test",
      hourlySlots: {},
    };

    savePlannerData(date, data);

    const stored = localStorage.getItem("planner-2026-01-31");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.brainDump).toBe("Test");
  });

  it("adds lastSaved timestamp", () => {
    const date = new Date(2026, 0, 31);
    const data = {
      topPriorities: [],
      brainDump: "",
      hourlySlots: {},
    };

    savePlannerData(date, data);

    const stored = localStorage.getItem("planner-2026-01-31");
    const parsed = JSON.parse(stored!);
    expect(parsed.lastSaved).toBeDefined();
    expect(new Date(parsed.lastSaved).getTime()).toBeLessThanOrEqual(
      Date.now()
    );
  });

  it("saves hourlySlots correctly", () => {
    const date = new Date(2026, 0, 31);
    const data = {
      topPriorities: [],
      brainDump: "",
      hourlySlots: {
        "7 AM:00": [{ id: "1", text: "Meeting", status: "completed" as const }],
      },
    };

    savePlannerData(date, data);

    const stored = localStorage.getItem("planner-2026-01-31");
    const parsed = JSON.parse(stored!);
    expect(parsed.hourlySlots["7 AM:00"][0].text).toBe("Meeting");
    expect(parsed.hourlySlots["7 AM:00"][0].status).toBe("completed");
  });
});
