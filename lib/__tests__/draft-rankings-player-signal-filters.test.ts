import { describe, expect, it } from "vitest";

import {
  getSignalFilterId,
  isPlayerDimmed,
  playerMatchesSignalFilters,
} from "../draft-rankings/player-signal-filters";
import { PLAYERS } from "../draft-rankings/players";
import type { Player } from "../draft-rankings/types";

function playerNamed(name: string): Player {
  const player = PLAYERS.find((candidate) => candidate.name === name);
  if (!player) {
    throw new Error(`Missing board player: ${name}`);
  }
  return player;
}

describe("draft rankings player signal filters", () => {
  it("maps offense tiers onto separate filter ids", () => {
    expect(getSignalFilterId({ kind: "injury-risk" })).toBe("injury-risk");
    expect(
      getSignalFilterId({
        kind: "offense-tier",
        tier: "good",
        projectedPointsPerGame: 26.3,
      }),
    ).toBe("offense-good");
    expect(
      getSignalFilterId({
        kind: "offense-tier",
        tier: "bad",
        projectedPointsPerGame: 18.3,
      }),
    ).toBe("offense-bad");
  });

  it("matches any selected signal and leaves unmatched players dimmed", () => {
    const rookie = playerNamed("Jeremiyah Love");
    const injuryRisk = playerNamed("Joe Burrow");
    const neither = playerNamed("Ja'Marr Chase");

    const rookieFilters = new Set(["rookie"] as const);
    expect(playerMatchesSignalFilters(rookie, rookieFilters)).toBe(true);
    expect(playerMatchesSignalFilters(injuryRisk, rookieFilters)).toBe(false);
    expect(isPlayerDimmed(neither, new Set(), rookieFilters)).toBe(true);

    const unionFilters = new Set(["rookie", "injury-risk"] as const);
    expect(playerMatchesSignalFilters(rookie, unionFilters)).toBe(true);
    expect(playerMatchesSignalFilters(injuryRisk, unionFilters)).toBe(true);
  });

  it("dims players that miss either the position or signal filter", () => {
    const rookieRb = playerNamed("Jeremiyah Love");
    const veteranQb = playerNamed("Joe Burrow");

    expect(
      isPlayerDimmed(rookieRb, new Set(["RB"]), new Set(["rookie"])),
    ).toBe(false);
    expect(
      isPlayerDimmed(rookieRb, new Set(["QB"]), new Set(["rookie"])),
    ).toBe(true);
    expect(
      isPlayerDimmed(veteranQb, new Set(["QB"]), new Set(["rookie"])),
    ).toBe(true);
  });
});
