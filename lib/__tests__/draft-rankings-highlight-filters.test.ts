import { describe, expect, it } from "vitest";

import {
  emptyHighlightFilters,
  isPlayerDimmed,
  toggleSetMember,
  type HighlightFilters,
} from "../draft-rankings/highlight-filters";
import { PLAYERS } from "../draft-rankings/players";
import type { Player } from "../draft-rankings/types";

function playerNamed(name: string): Player {
  const player = PLAYERS.find((candidate) => candidate.name === name);
  if (!player) {
    throw new Error(`Missing board player: ${name}`);
  }
  return player;
}

function filters(
  partial: Partial<HighlightFilters> = {},
): HighlightFilters {
  return { ...emptyHighlightFilters(), ...partial };
}

describe("draft rankings highlight filters", () => {
  it("toggles set membership", () => {
    const withDet = toggleSetMember(new Set(), "DET");
    expect([...withDet]).toEqual(["DET"]);
    expect([...toggleSetMember(withDet, "DET")]).toEqual([]);
  });

  it("matches any selected team and dims players on other teams", () => {
    const det = playerNamed("Jahmyr Gibbs");
    const cin = playerNamed("Ja'Marr Chase");

    expect(isPlayerDimmed(det, filters({ teams: new Set(["DET", "CIN"]) }))).toBe(
      false,
    );
    expect(isPlayerDimmed(cin, filters({ teams: new Set(["DET"]) }))).toBe(true);
  });

  it("dims players that miss either the position or signal filter", () => {
    const rookieRb = playerNamed("Jeremiyah Love");
    const veteranQb = playerNamed("Joe Burrow");

    expect(
      isPlayerDimmed(
        rookieRb,
        filters({ positions: new Set(["RB"]), signals: new Set(["rookie"]) }),
      ),
    ).toBe(false);
    expect(
      isPlayerDimmed(
        rookieRb,
        filters({ positions: new Set(["QB"]), signals: new Set(["rookie"]) }),
      ),
    ).toBe(true);
    expect(
      isPlayerDimmed(
        veteranQb,
        filters({ positions: new Set(["QB"]), signals: new Set(["rookie"]) }),
      ),
    ).toBe(true);
  });

  it("dims players that miss the team filter even when position matches", () => {
    const detRb = playerNamed("Jahmyr Gibbs");

    expect(
      isPlayerDimmed(
        detRb,
        filters({ positions: new Set(["RB"]), teams: new Set(["CIN"]) }),
      ),
    ).toBe(true);
    expect(
      isPlayerDimmed(
        detRb,
        filters({ positions: new Set(["RB"]), teams: new Set(["DET"]) }),
      ),
    ).toBe(false);
  });
});
