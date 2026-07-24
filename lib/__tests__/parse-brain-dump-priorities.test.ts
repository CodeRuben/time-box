import { describe, expect, it } from "vitest";
import {
  formatBrainDumpSubtaskPreview,
  isPriorityNameTaken,
  parseBrainDumpPriorityCandidates,
} from "../parse-brain-dump-priorities";

describe("parseBrainDumpPriorityCandidates", () => {
  it("returns empty array for empty brain dump", () => {
    expect(parseBrainDumpPriorityCandidates("")).toEqual([]);
  });

  it("extracts lines starting with a bullet", () => {
    const brainDump = `• First item
Some note without bullet
• Second item`;

    expect(parseBrainDumpPriorityCandidates(brainDump)).toEqual([
      { name: "First item", subtasks: [] },
      { name: "Second item", subtasks: [] },
    ]);
  });

  it("trims whitespace around bullet items", () => {
    expect(parseBrainDumpPriorityCandidates("  •   Spaced item  ")).toEqual([
      { name: "Spaced item", subtasks: [] },
    ]);
  });

  it("ignores empty bullet lines", () => {
    expect(parseBrainDumpPriorityCandidates("• \n• Valid")).toEqual([
      { name: "Valid", subtasks: [] },
    ]);
  });

  it("deduplicates case-insensitive priority matches", () => {
    expect(
      parseBrainDumpPriorityCandidates("• Task\n• task\n• TASK")
    ).toEqual([{ name: "Task", subtasks: [] }]);
  });

  it("attaches arrow lines as subtasks to the previous bullet", () => {
    const brainDump = `• Ship login flow
→ Design mockups
  → Wire up API
• Prep for standup
→ Review blockers`;

    expect(parseBrainDumpPriorityCandidates(brainDump)).toEqual([
      {
        name: "Ship login flow",
        subtasks: ["Design mockups", "Wire up API"],
      },
      {
        name: "Prep for standup",
        subtasks: ["Review blockers"],
      },
    ]);
  });

  it("ignores orphan arrow lines before any bullet", () => {
    expect(
      parseBrainDumpPriorityCandidates("→ Orphan\n• Valid\n→ Subtask")
    ).toEqual([{ name: "Valid", subtasks: ["Subtask"] }]);
  });

  it("deduplicates subtasks case-insensitively within a priority", () => {
    expect(
      parseBrainDumpPriorityCandidates("• Task\n→ Sub\n→ sub\n→ SUB")
    ).toEqual([{ name: "Task", subtasks: ["Sub"] }]);
  });

  it("does not attach subtasks to duplicate priority names", () => {
    expect(
      parseBrainDumpPriorityCandidates(
        "• Task\n→ First sub\n• task\n→ Lost sub"
      )
    ).toEqual([{ name: "Task", subtasks: ["First sub"] }]);
  });

  it("ignores legacy dash markers", () => {
    expect(
      parseBrainDumpPriorityCandidates("- Old item\n-- Old sub\n• New item")
    ).toEqual([{ name: "New item", subtasks: [] }]);
  });

  it("does not treat mid-line arrows as subtasks", () => {
    expect(
      parseBrainDumpPriorityCandidates("• Task\nnext → done")
    ).toEqual([{ name: "Task", subtasks: [] }]);
  });
});

describe("formatBrainDumpSubtaskPreview", () => {
  it("returns empty string for no subtasks", () => {
    expect(formatBrainDumpSubtaskPreview([])).toBe("");
  });

  it("returns the single subtask name", () => {
    expect(formatBrainDumpSubtaskPreview(["Only one"])).toBe("Only one");
  });

  it("joins two subtasks with a comma", () => {
    expect(formatBrainDumpSubtaskPreview(["A", "B"])).toBe("A, B");
  });

  it("summarizes three or more subtasks", () => {
    expect(formatBrainDumpSubtaskPreview(["A", "B", "C", "D"])).toBe(
      "A, B +2 more"
    );
  });
});

describe("isPriorityNameTaken", () => {
  it("matches names case-insensitively", () => {
    expect(isPriorityNameTaken("Task", ["task"])).toBe(true);
    expect(isPriorityNameTaken("Other", ["task"])).toBe(false);
  });
});
