import { describe, expect, it } from "vitest";
import { applyBrainDumpTransforms } from "@/lib/brain-dump-transforms";

describe("applyBrainDumpTransforms", () => {
  it("replaces -> with an arrow at the cursor", () => {
    expect(applyBrainDumpTransforms("task->", 6)).toEqual({
      text: "task→",
      cursor: 5,
    });
  });

  it("replaces -> in the middle of text using the cursor position", () => {
    expect(applyBrainDumpTransforms("a->b", 3)).toEqual({
      text: "a→b",
      cursor: 2,
    });
  });

  it("does not replace -> when the cursor is not after the trigger", () => {
    expect(applyBrainDumpTransforms("task->done", 4)).toEqual({
      text: "task->done",
      cursor: 4,
    });
  });

  it("replaces * space with a bullet at the start of the document", () => {
    expect(applyBrainDumpTransforms("* ", 2)).toEqual({
      text: "• ",
      cursor: 2,
    });
  });

  it("replaces * space with a bullet at the start of a new line", () => {
    expect(applyBrainDumpTransforms("notes\n* ", 8)).toEqual({
      text: "notes\n• ",
      cursor: 8,
    });
  });

  it("does not replace * space mid-line", () => {
    expect(applyBrainDumpTransforms("call * ", 7)).toEqual({
      text: "call * ",
      cursor: 7,
    });
  });

  it("leaves dashes alone", () => {
    expect(applyBrainDumpTransforms("- item", 6)).toEqual({
      text: "- item",
      cursor: 6,
    });
    expect(applyBrainDumpTransforms("-- sub", 6)).toEqual({
      text: "-- sub",
      cursor: 6,
    });
  });
});
