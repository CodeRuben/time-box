import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const HEADSHOT_COMPONENT = join(
  __dirname,
  "../../app/draft-rankings/components/player-headshot.tsx"
);

describe("draft rankings headshots", () => {
  it("does not request a Next image quality outside the default allowlist", () => {
    const source = readFileSync(HEADSHOT_COMPONENT, "utf8");
    const match = source.match(/quality=\{(\d+)\}/);

    if (match) {
      expect(Number(match[1])).toBe(75);
    }
  });
});
