import { describe, expect, it } from "vitest";

import {
  createDraft,
  getCurrentOverall,
  makeAutopick,
  makeBotPick,
} from "../mock-draft/engine";
import {
  getLetterGrade,
  gradeDraft,
} from "../mock-draft/grading";
import { PLAYERS } from "../mock-draft/players";
import { getSlotOnClock } from "../mock-draft/snake";
import type {
  DraftPick,
  DraftState,
  DraftTeam,
} from "../mock-draft/types";

function stateWithPicks(
  teams: DraftTeam[],
  picks: Array<Pick<DraftPick, "slot" | "playerId" | "overall">>,
): DraftState {
  return {
    version: 1,
    seed: 1,
    config: { teamCount: 8, timerSeconds: 60, userSlot: 1 },
    teams,
    picks: picks.map((pick) => ({
      ...pick,
      round: Math.floor((pick.overall - 1) / 8) + 1,
    })),
    status: "paused",
    startedAt: "2026-07-18T20:00:00.000Z",
  };
}

const TEAMS: DraftTeam[] = [
  { slot: 1, name: "You", isUser: true, archetype: null },
  { slot: 2, name: "Kino", isUser: false, archetype: "balanced" },
];

describe("mock draft grading", () => {
  it("ranks a roster of early Board players above late players", () => {
    const early = PLAYERS.slice(0, 14);
    const late = PLAYERS.slice(99, 113);
    const state = stateWithPicks(TEAMS, [
      ...early.map((player, index) => ({
        slot: 1,
        playerId: player.id,
        overall: index + 1,
      })),
      ...late.map((player, index) => ({
        slot: 2,
        playerId: player.id,
        overall: index + 15,
      })),
    ]);

    const grades = gradeDraft(state);

    expect(grades[0].slot).toBe(1);
    expect(grades[0].leagueRank).toBe(1);
    expect(grades[0].letter).toBe("A+");
    expect(grades[0].score).toBeGreaterThan(grades[1].score);
  });

  it("charges 15 points for each unfilled starter", () => {
    const state = stateWithPicks([TEAMS[0]], [
      { slot: 1, playerId: 1, overall: 1 },
    ]);

    expect(gradeDraft(state)[0].penalties.unfilledStarters).toBe(120);
  });

  it("charges four points per starter beyond the first on a bye", () => {
    const gibbs = PLAYERS.find(({ name }) => name === "Jahmyr Gibbs")!;
    const amonRa = PLAYERS.find(
      ({ name }) => name === "Amon-Ra St. Brown",
    )!;
    const goff = PLAYERS.find(({ name }) => name === "Jared Goff")!;

    const twoPlayerState = stateWithPicks([TEAMS[0]], [
      { slot: 1, playerId: gibbs.id, overall: 1 },
      { slot: 1, playerId: goff.id, overall: 2 },
    ]);
    const threePlayerState = stateWithPicks([TEAMS[0]], [
      ...twoPlayerState.picks,
      { slot: 1, playerId: amonRa.id, overall: 3 },
    ]);

    expect(gradeDraft(twoPlayerState)[0].penalties.byeStacks).toBe(4);
    expect(gradeDraft(threePlayerState)[0].penalties.byeStacks).toBe(8);
  });

  it("maps exact relative letter boundaries", () => {
    expect(getLetterGrade(98, 100)).toBe("A+");
    expect(getLetterGrade(97.99, 100)).toBe("A");
    expect(getLetterGrade(0, 100)).toBe("F");
  });

  it("identifies value picks and reaches outside a five-pick band", () => {
    const state = stateWithPicks([TEAMS[0]], [
      { slot: 1, playerId: 20, overall: 40 },
      { slot: 1, playerId: 70, overall: 41 },
    ]);
    const grade = gradeDraft(state)[0];

    expect(grade.bestValue).toMatchObject({ playerId: 20, delta: 20 });
    expect(grade.biggestReach).toMatchObject({
      playerId: 70,
      delta: -29,
    });
  });

  it("grades a complete simulated draft with unique league ranks", () => {
    let state = createDraft(
      { teamCount: 8, timerSeconds: 60, userSlot: 1 },
      222,
    );

    while (state.status === "active") {
      const slot = getSlotOnClock(getCurrentOverall(state), 8);
      state = slot === 1 ? makeAutopick(state) : makeBotPick(state);
    }

    const grades = gradeDraft(state);
    expect(grades).toHaveLength(8);
    expect(new Set(grades.map(({ leagueRank }) => leagueRank)).size).toBe(8);
    expect(grades.map(({ leagueRank }) => leagueRank)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(
      grades.every(({ letter }) =>
        ["A+", "A", "A−", "B+", "B", "B−", "C+", "C", "C−", "D", "F"].includes(
          letter,
        ),
      ),
    ).toBe(true);
  });
});
