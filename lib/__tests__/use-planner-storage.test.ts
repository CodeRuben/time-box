import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getStorageKey,
  getDefaultData,
  migrateFromLegacy,
  ensurePriorityFields,
  copyPlannerDataFromPreviousDay,
  createTopPriorityFromBrainDumpCandidate,
  hasCopyablePlannerData,
  loadPlannerData,
  savePlannerData,
  type CopyPreviousDayOptions,
  type LegacyPlannerData,
  type PlannerData,
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

  it("returns empty focus list", () => {
    const data = getDefaultData();
    expect(data.focusList).toEqual([]);
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

describe("copyPlannerDataFromPreviousDay", () => {
  const baseOptions: CopyPreviousDayOptions = {
    includeTopPriorities: true,
    includeBrainDump: false,
    includeFocusList: false,
    onlyUnfinished: true,
    mode: "merge",
  };

  it("copies unfinished items with new ids and pending statuses", () => {
    const current: PlannerData = {
      topPriorities: [],
      brainDump: "Today",
      focusList: [],
    };
    const previous: PlannerData = {
      topPriorities: [
        {
          id: "priority-1",
          name: "Follow up",
          completed: false,
          subtasks: [{ id: "subtask-1", name: "Email", completed: true }],
        },
      ],
      brainDump: "Yesterday",
      focusList: [],
    };

    const result = copyPlannerDataFromPreviousDay(
      current,
      previous,
      baseOptions
    );

    expect(result.topPriorities).toHaveLength(1);
    expect(result.topPriorities[0]).toMatchObject({
      name: "Follow up",
      completed: false,
      subtasks: [],
    });
    expect(result.topPriorities[0].id).not.toBe("priority-1");
    expect(result.brainDump).toBe("Today");
  });

  it("replaces only the selected sections", () => {
    const current: PlannerData = {
      topPriorities: [
        { id: "current-priority", name: "Current", completed: false, subtasks: [] },
      ],
      brainDump: "Today",
      focusList: [],
    };
    const previous: PlannerData = {
      topPriorities: [
        { id: "previous-priority", name: "Previous", completed: true, subtasks: [] },
      ],
      brainDump: "Yesterday",
      focusList: [],
    };

    const result = copyPlannerDataFromPreviousDay(current, previous, {
      ...baseOptions,
      includeBrainDump: true,
      onlyUnfinished: false,
      mode: "replace",
    });

    expect(result.topPriorities).toHaveLength(1);
    expect(result.topPriorities[0].name).toBe("Previous");
    expect(result.topPriorities[0].completed).toBe(false);
    expect(result.brainDump).toBe("Yesterday");
  });

  it("copies unfinished focus list items with new ids and dedupes on merge", () => {
    const current: PlannerData = {
      ...getDefaultData(),
      focusList: [
        {
          id: "current-focus",
          status: "todo",
          order: 0,
          source: { type: "brain_dump", text: "Already here" },
        },
      ],
    };
    const previous: PlannerData = {
      ...getDefaultData(),
      focusList: [
        {
          id: "todo-focus",
          status: "todo",
          order: 0,
          source: { type: "brain_dump", text: "Carry over" },
        },
        {
          id: "done-focus",
          status: "complete",
          order: 0,
          source: { type: "brain_dump", text: "Finished" },
        },
        {
          id: "duplicate-focus",
          status: "todo",
          order: 1,
          source: { type: "brain_dump", text: "Already here" },
        },
      ],
    };

    const result = copyPlannerDataFromPreviousDay(current, previous, {
      includeTopPriorities: false,
      includeBrainDump: false,
      includeFocusList: true,
      onlyUnfinished: true,
      mode: "merge",
    });

    expect(result.focusList).toHaveLength(2);
    expect(result.focusList.map((item) => item.source)).toEqual([
      { type: "brain_dump", text: "Already here" },
      { type: "brain_dump", text: "Carry over" },
    ]);
    expect(result.focusList[1]?.id).not.toBe("todo-focus");
  });

  it("replaces the focus list when mode is replace", () => {
    const current: PlannerData = {
      ...getDefaultData(),
      focusList: [
        {
          id: "current-focus",
          status: "todo",
          order: 0,
          source: { type: "brain_dump", text: "Current item" },
        },
      ],
    };
    const previous: PlannerData = {
      ...getDefaultData(),
      focusList: [
        {
          id: "previous-focus",
          status: "todo",
          order: 0,
          source: { type: "brain_dump", text: "Previous item" },
        },
      ],
    };

    const result = copyPlannerDataFromPreviousDay(current, previous, {
      includeTopPriorities: false,
      includeBrainDump: false,
      includeFocusList: true,
      onlyUnfinished: true,
      mode: "replace",
    });

    expect(result.focusList).toHaveLength(1);
    expect(result.focusList[0]?.source).toEqual({
      type: "brain_dump",
      text: "Previous item",
    });
    expect(result.focusList[0]?.id).not.toBe("previous-focus");
  });
});

describe("hasCopyablePlannerData", () => {
  const previous: PlannerData = {
    topPriorities: [
      { id: "priority-1", name: "Done", completed: true, subtasks: [] },
    ],
    brainDump: "Notes",
    focusList: [
      {
        id: "done-focus",
        status: "complete",
        order: 0,
        source: { type: "brain_dump", text: "Done item" },
      },
    ],
  };

  it("returns false when only completed work matches selected task sections", () => {
    expect(
      hasCopyablePlannerData(previous, {
        includeTopPriorities: true,
        includeBrainDump: false,
        includeFocusList: false,
        onlyUnfinished: true,
        mode: "merge",
      })
    ).toBe(false);
  });

  it("returns false when focus list has only completed items", () => {
    expect(
      hasCopyablePlannerData(previous, {
        includeTopPriorities: false,
        includeBrainDump: false,
        includeFocusList: true,
        onlyUnfinished: true,
        mode: "merge",
      })
    ).toBe(false);
  });

  it("returns true when selected focus list has todo items", () => {
    expect(
      hasCopyablePlannerData(
        {
          ...previous,
          focusList: [
            {
              id: "todo-focus",
              status: "todo",
              order: 0,
              source: { type: "brain_dump", text: "Carry over" },
            },
          ],
        },
        {
          includeTopPriorities: false,
          includeBrainDump: false,
          includeFocusList: true,
          onlyUnfinished: true,
          mode: "merge",
        }
      )
    ).toBe(true);
  });

  it("returns true when selected brain dump has content", () => {
    expect(
      hasCopyablePlannerData(previous, {
        includeTopPriorities: false,
        includeBrainDump: true,
        includeFocusList: false,
        onlyUnfinished: true,
        mode: "merge",
      })
    ).toBe(true);
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

  it("loads and parses existing planner data", () => {
    const date = new Date(2026, 0, 31);
    const testData = {
      topPriorities: [
        { id: "1", name: "Test", completed: false, subtasks: [] },
      ],
      brainDump: "Test dump",
      focusList: [],
    };
    localStorage.setItem("planner-2026-01-31", JSON.stringify(testData));

    const result = loadPlannerData(date);
    expect(result?.brainDump).toBe("Test dump");
    expect(result?.topPriorities[0].name).toBe("Test");
  });

  it("defaults missing focusList to an empty array", () => {
    const date = new Date(2026, 0, 31);
    const testData = {
      topPriorities: [],
      brainDump: "",
    };
    localStorage.setItem("planner-2026-01-31", JSON.stringify(testData));

    const result = loadPlannerData(date);
    expect(result?.focusList).toEqual([]);
  });

  it("loads persisted focus list items", () => {
    const date = new Date(2026, 0, 31);
    const testData = {
      topPriorities: [],
      brainDump: "",
      focusList: [
        {
          id: "focus-1",
          status: "todo",
          order: 0,
          source: { type: "brain_dump", text: "Ship it" },
        },
      ],
    };
    localStorage.setItem("planner-2026-01-31", JSON.stringify(testData));

    const result = loadPlannerData(date);
    expect(result?.focusList).toHaveLength(1);
    expect(result?.focusList[0]).toMatchObject({
      id: "focus-1",
      status: "todo",
      source: { type: "brain_dump", text: "Ship it" },
    });
  });

  it("migrates legacy priorities format", () => {
    const date = new Date(2026, 0, 31);
    const legacyData = {
      priorities: ["Task 1", "Task 2"],
      brainDump: "Notes",
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
      ...getDefaultData(),
      brainDump: "Test",
    };

    savePlannerData(date, data);

    const stored = localStorage.getItem("planner-2026-01-31");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.brainDump).toBe("Test");
  });

  it("adds lastSaved timestamp", () => {
    const date = new Date(2026, 0, 31);
    const data = getDefaultData();

    savePlannerData(date, data);

    const stored = localStorage.getItem("planner-2026-01-31");
    const parsed = JSON.parse(stored!);
    expect(parsed.lastSaved).toBeDefined();
    expect(new Date(parsed.lastSaved).getTime()).toBeLessThanOrEqual(
      Date.now()
    );
  });
});

describe("createTopPriorityFromBrainDumpCandidate", () => {
  it("creates a priority with subtasks from a brain dump candidate", () => {
    const priority = createTopPriorityFromBrainDumpCandidate({
      name: "Ship login flow",
      subtasks: ["Design mockups", "Write tests"],
    });

    expect(priority).toMatchObject({
      name: "Ship login flow",
      completed: false,
      subtasks: [
        { name: "Design mockups", completed: false },
        { name: "Write tests", completed: false },
      ],
    });
    expect(priority.id).toEqual(expect.any(String));
    expect(priority.subtasks.every((subtask) => subtask.id)).toBe(true);
  });
});
