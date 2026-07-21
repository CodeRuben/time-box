import { afterEach, describe, expect, it } from "vitest";

import {
  applyPick,
  createDraft,
  getCurrentOverall,
  makeAutopick,
  makeBotPick,
  pauseDraft,
} from "../mock-draft/engine";
import { getSlotOnClock } from "../mock-draft/snake";
import {
  clearDraft,
  isValidDraftState,
  loadDraft,
  saveDraft,
} from "../mock-draft/storage";
import type { DraftState } from "../mock-draft/types";
import { STORAGE_KEY } from "../mock-draft/types";

function nextPick(state: DraftState): DraftState {
  const slot = getSlotOnClock(
    getCurrentOverall(state),
    state.config.teamCount,
  );
  const team = state.teams.find((candidate) => candidate.slot === slot);

  if (!team) {
    throw new Error("Expected a team on the clock");
  }

  return team.isUser ? makeAutopick(state) : makeBotPick(state);
}

function completeDraft(state: DraftState): DraftState {
  let current = state;
  while (current.status === "active") {
    current = nextPick(current);
  }
  return current;
}

afterEach(() => {
  clearDraft();
});

describe("mock draft storage", () => {
  it("saves and loads a valid draft", () => {
    const state = pauseDraft(
      createDraft({ teamCount: 8, timerSeconds: 60, userSlot: 3 }, 101),
    );

    saveDraft(state);

    expect(loadDraft()).toEqual(state);
  });

  it("clears corrupted JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not-json");

    expect(loadDraft()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it.each([
    ["bad version", (state: DraftState) => ({ ...state, version: 2 })],
    [
      "team mismatch",
      (state: DraftState) => ({ ...state, teams: state.teams.slice(1) }),
    ],
  ])("rejects a tampered state with %s", (_label, tamper) => {
    const state = createDraft(
      { teamCount: 8, timerSeconds: 60, userSlot: 1 },
      102,
    );
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(tamper(state)),
    );

    expect(loadDraft()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("rejects duplicate player ids and non-contiguous overalls", () => {
    let state = createDraft(
      { teamCount: 8, timerSeconds: 60, userSlot: 1 },
      103,
    );
    state = applyPick(state, 1);
    state = makeBotPick(state);

    const duplicate = {
      ...state,
      picks: [
        state.picks[0],
        { ...state.picks[1], playerId: state.picks[0].playerId },
      ],
    };
    expect(isValidDraftState(duplicate)).toBe(false);

    const nonContiguous = {
      ...state,
      picks: [{ ...state.picks[0], overall: 2 }, state.picks[1]],
    };
    expect(isValidDraftState(nonContiguous)).toBe(false);
  });

  it("restores an active draft as paused", () => {
    const state = createDraft(
      { teamCount: 8, timerSeconds: 30, userSlot: 4 },
      104,
    );
    saveDraft(state);

    expect(loadDraft()).toEqual({ ...state, status: "paused" });
  });

  it("preserves complete status", () => {
    const state = completeDraft(
      createDraft({ teamCount: 8, timerSeconds: 90, userSlot: 5 }, 105),
    );
    saveDraft(state);

    expect(loadDraft()).toEqual(state);
    expect(loadDraft()?.status).toBe("complete");
  });
});
