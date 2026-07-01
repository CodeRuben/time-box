import { describe, expect, it } from "vitest";
import { getFocusItemSourceKey } from "../focus-item-source";
import { getFocusAddOptions } from "@/app/planner/components/add-to-focus-menu";

describe("getFocusItemSourceKey", () => {
  it("normalizes brain dump text for dedupe keys", () => {
    expect(
      getFocusItemSourceKey({
        type: "brain_dump",
        text: "  Ship Feature  ",
      })
    ).toBe("brain:ship feature");
  });
});

describe("getFocusAddOptions", () => {
  it("excludes sources already present in the focus list", () => {
    const existingSourceKeys = new Set([
      getFocusItemSourceKey({
        type: "brain_dump",
        text: "Already added",
      }),
      getFocusItemSourceKey({
        type: "priority",
        priorityId: "priority-1",
        label: "Priority one",
      }),
    ]);

    const result = getFocusAddOptions({
      priorities: [
        {
          id: "priority-1",
          name: "Priority one",
          completed: false,
          subtasks: [],
        },
        {
          id: "priority-2",
          name: "Priority two",
          completed: false,
          subtasks: [],
        },
      ],
      tasks: [],
      brainDumpCandidates: [
        { name: "Already added", subtasks: [] },
        { name: "New line", subtasks: [] },
      ],
      existingSourceKeys,
    });

    expect(result.availablePriorities).toHaveLength(1);
    expect(result.availablePriorities[0]?.id).toBe("priority-2");
    expect(result.availableBrainDump).toHaveLength(1);
    expect(result.availableBrainDump[0]?.name).toBe("New line");
  });
});
