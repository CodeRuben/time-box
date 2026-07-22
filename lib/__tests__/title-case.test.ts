import { describe, expect, it } from "vitest";
import { toTitleCase } from "../title-case";

describe("toTitleCase", () => {
  it("title-cases words and keeps small words lowercase", () => {
    expect(toTitleCase("Watch company review video of the year")).toBe(
      "Watch Company Review Video of the Year"
    );
  });

  it("capitalizes small words at the start and end", () => {
    expect(toTitleCase("the review of")).toBe("The Review Of");
    expect(toTitleCase("of code")).toBe("Of Code");
  });

  it("normalizes mixed and upper case input", () => {
    expect(toTitleCase("WATCH COMPANY REVIEW VIDEO OF THE YEAR")).toBe(
      "Watch Company Review Video of the Year"
    );
    expect(toTitleCase("wAtCh CoMpAnY")).toBe("Watch Company");
  });

  it("preserves surrounding whitespace only via trim of content words", () => {
    expect(toTitleCase("  ship the feature  ")).toBe("Ship the Feature");
    expect(toTitleCase("")).toBe("");
    expect(toTitleCase("   ")).toBe("   ");
  });

  it("handles single-word labels", () => {
    expect(toTitleCase("review")).toBe("Review");
    expect(toTitleCase("THE")).toBe("The");
  });
});
