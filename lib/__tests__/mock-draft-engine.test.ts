import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyPick,
  createDraft,
  getAvailablePlayers,
  getCurrentOverall,
  getTeamRoster,
  makeAutopick,
  makeBotPick,
} from "../mock-draft/engine";
import { PLAYERS } from "../mock-draft/players";
import {
  countByPosition,
  getUnfilledStarterSlots,
} from "../mock-draft/roster";
import { getRound, getSlotOnClock } from "../mock-draft/snake";
import type { DraftConfig, DraftState } from "../mock-draft/types";
import { POSITION_CAPS } from "../mock-draft/types";

function makeNextPick(state: DraftState): DraftState {
  const overall = getCurrentOverall(state);
  const slot = getSlotOnClock(overall, state.config.teamCount);
  const team = state.teams.find((candidate) => candidate.slot === slot);

  if (!team) {
    throw new Error("Expected a team on the clock");
  }

  return team.isUser ? makeAutopick(state) : makeBotPick(state);
}

function simulateDraft(initialState: DraftState): DraftState {
  let state = initialState;

  while (state.status === "active") {
    state = makeNextPick(state);
  }

  return state;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("mock draft engine", () => {
  it("rejects invalid draft configurations", () => {
    expect(() =>
      createDraft(
        {
          teamCount: 6,
          timerSeconds: 60,
          userSlot: 1,
        } as unknown as DraftConfig,
        1,
      ),
    ).toThrow("team count");
    expect(() =>
      createDraft({ teamCount: 8, timerSeconds: 60, userSlot: 9 }, 1),
    ).toThrow("User slot");
    expect(() =>
      createDraft(
        {
          teamCount: 8,
          timerSeconds: 60,
          userSlot: 1.5,
        } as unknown as DraftConfig,
        1,
      ),
    ).toThrow("User slot");
    expect(() =>
      createDraft(
        {
          teamCount: 8,
          timerSeconds: 45,
          userSlot: 1,
        } as unknown as DraftConfig,
        1,
      ),
    ).toThrow("timer");
  });

  it("produces the same complete draft for the same config and seed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-18T20:00:00.000Z"));
    const config: DraftConfig = {
      teamCount: 10,
      timerSeconds: 60,
      userSlot: 4,
    };

    const first = simulateDraft(createDraft(config, 8675309));
    const second = simulateDraft(createDraft(config, 8675309));

    expect(second).toEqual(first);
  });

  it("rejects unavailable players and picks over a position cap", () => {
    let state = createDraft(
      { teamCount: 8, timerSeconds: 60, userSlot: 1 },
      11,
    );
    state = applyPick(state, PLAYERS[0].id);

    expect(() => applyPick(state, PLAYERS[0].id)).toThrow("not available");

    const userPicks = PLAYERS.filter(({ position }) => position === "RB").slice(
      -7,
    );
    state = createDraft(
      { teamCount: 8, timerSeconds: 60, userSlot: 1 },
      12,
    );
    for (let index = 0; index < userPicks.length - 1; index += 1) {
      state = applyPick(state, userPicks[index].id);
      while (
        state.status === "active" &&
        getSlotOnClock(getCurrentOverall(state), 8) !== 1
      ) {
        state = makeBotPick(state);
      }
    }

    expect(() => applyPick(state, userPicks[6].id)).toThrow("roster limits");
  });

  for (const teamCount of [8, 10, 12] as const) {
    for (let seed = 1; seed <= 5; seed += 1) {
      it(`completes a legal ${teamCount}-team draft with seed ${seed}`, () => {
        let state = createDraft(
          { teamCount, timerSeconds: 60, userSlot: seed },
          seed * 101,
        );

        while (state.status === "active") {
          const overall = getCurrentOverall(state);
          const round = getRound(overall, teamCount);
          if (round <= 10) {
            const bestRbWr = getAvailablePlayers(state).find(
              ({ position }) => position === "RB" || position === "WR",
            );
            expect(bestRbWr).toBeDefined();
            expect(bestRbWr!.rank).toBeGreaterThan(overall - 2 * teamCount);
          }

          state = makeNextPick(state);
        }

        expect(state.picks).toHaveLength(teamCount * 14);
        expect(new Set(state.picks.map(({ playerId }) => playerId)).size).toBe(
          state.picks.length,
        );

        for (const team of state.teams) {
          const roster = getTeamRoster(state, team.slot);
          const counts = countByPosition(roster);

          expect(roster).toHaveLength(14);
          expect(getUnfilledStarterSlots(roster)).toEqual([]);
          for (const position of Object.keys(POSITION_CAPS) as Array<
            keyof typeof POSITION_CAPS
          >) {
            expect(counts[position]).toBeLessThanOrEqual(
              POSITION_CAPS[position],
            );
          }
        }

        const playersById = new Map(
          PLAYERS.map((player) => [player.id, player]),
        );
        for (const pick of state.picks) {
          const player = playersById.get(pick.playerId);
          if (player?.position === "K" || player?.position === "DST") {
            expect(pick.round).toBeGreaterThanOrEqual(13);
          }
        }
      });
    }
  }
});
