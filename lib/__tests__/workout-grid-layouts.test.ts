import { describe, expect, it } from "vitest";
import {
  formatSubtaskName,
  migrateSubtaskFields,
  seedSubtaskFields,
} from "../workout-grid-layouts";

describe("seedSubtaskFields", () => {
  it("parses resistance set strings into set columns", () => {
    const fields = seedSubtaskFields("Pushups - 50-31", "resistance-sets");
    expect(fields.workoutName).toBe("Pushups");
    expect(fields.set1).toBe("50");
    expect(fields.set2).toBe("31");
  });

  it("parses hybrid strings into reps and exercise", () => {
    const fields = seedSubtaskFields("12 inverted row", "hybrid-reps-first");
    expect(fields.reps).toBe("12");
    expect(fields.workoutName).toBe("inverted row");
  });
});

describe("formatSubtaskName", () => {
  it("formats resistance set fields back to legacy string", () => {
    const name = formatSubtaskName(
      {
        workoutName: "Pushups",
        set1: "50",
        set2: "31",
        set3: "",
      },
      "resistance-sets",
    );
    expect(name).toBe("Pushups - 50-31");
  });
});

describe("migrateSubtaskFields", () => {
  it("migrates resistance sets into simple description column", () => {
    const fields = migrateSubtaskFields(
      seedSubtaskFields("Pushups - 50-31", "resistance-sets"),
      "resistance-sets",
      "simple-three-col",
    );

    expect(fields.workoutName).toBe("Pushups");
    expect(fields.description).toBe("50-31");
  });
});
