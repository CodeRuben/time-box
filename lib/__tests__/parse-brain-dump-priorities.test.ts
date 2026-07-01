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

  it("extracts lines starting with dash", () => {
    const brainDump = `- First item
Some note without dash
- Second item`;

    expect(parseBrainDumpPriorityCandidates(brainDump)).toEqual([
      { name: "First item", subtasks: [] },
      { name: "Second item", subtasks: [] },
    ]);
  });

  it("trims whitespace around dash items", () => {
    expect(parseBrainDumpPriorityCandidates("  -   Spaced item  ")).toEqual([
      { name: "Spaced item", subtasks: [] },
    ]);
  });

  it("ignores empty dash lines", () => {
    expect(parseBrainDumpPriorityCandidates("- \n- Valid")).toEqual([
      { name: "Valid", subtasks: [] },
    ]);
  });

  it("deduplicates case-insensitive priority matches", () => {
    expect(
      parseBrainDumpPriorityCandidates("- Task\n- task\n- TASK")
    ).toEqual([{ name: "Task", subtasks: [] }]);
  });

  it("attaches double-dash lines as subtasks to the previous priority", () => {
    const brainDump = `- Ship login flow
-- Design mockups
-- Wire up API
- Prep for standup
-- Review blockers`;

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

  it("ignores orphan double-dash lines before any priority", () => {
    expect(
      parseBrainDumpPriorityCandidates("-- Orphan\n- Valid\n-- Subtask")
    ).toEqual([{ name: "Valid", subtasks: ["Subtask"] }]);
  });

  it("deduplicates subtasks case-insensitively within a priority", () => {
    expect(
      parseBrainDumpPriorityCandidates("- Task\n-- Sub\n-- sub\n-- SUB")
    ).toEqual([{ name: "Task", subtasks: ["Sub"] }]);
  });

  it("does not attach subtasks to duplicate priority names", () => {
    expect(
      parseBrainDumpPriorityCandidates("- Task\n-- First sub\n- task\n-- Lost sub")
    ).toEqual([{ name: "Task", subtasks: ["First sub"] }]);
  });
});

describe("formatBrainDumpSubtaskPreview", () => {
  it("returns empty string for no subtasks", () => {
    expect(formatBrainDumpSubtaskPreview([])).toBe("");
  });

  it("shows a single subtask name", () => {
    expect(formatBrainDumpSubtaskPreview(["Design mockups"])).toBe(
      "Design mockups"
    );
  });

  it("shows two subtasks joined", () => {
    expect(formatBrainDumpSubtaskPreview(["One", "Two"])).toBe("One, Two");
  });

  it("truncates previews beyond two subtasks", () => {
    expect(formatBrainDumpSubtaskPreview(["One", "Two", "Three"])).toBe(
      "One, Two +1 more"
    );
  });
});

describe("isPriorityNameTaken", () => {
  it("matches names case-insensitively", () => {
    expect(isPriorityNameTaken("Task", ["task"])).toBe(true);
    expect(isPriorityNameTaken("New", ["Task"])).toBe(false);
  });
});
