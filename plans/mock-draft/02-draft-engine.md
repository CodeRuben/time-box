# Phase 2 — Draft engine (pure logic + tests)

Prerequisites: Phase 1. Everything in this phase lives in `lib/mock-draft/` and `lib/__tests__/` — **no React, no DOM (except `storage.ts` guarding `window`), no UI**. Functions never mutate their inputs; state transitions return new objects.

## 1. Seeded PRNG — `lib/mock-draft/rng.ts`

```typescript
export type Rng = () => number; // returns [0, 1)

// mulberry32 — deterministic, good enough for draft jitter.
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(items: readonly T[], rng: Rng): T[]; // Fisher-Yates on a copy
export function pickIndexWeighted(weights: number[], rng: Rng): number; // used by bot engine
```

Per-pick generators are derived as `createRng(state.seed * 31 + overallPickNumber)` so replaying any single pick is deterministic regardless of history.

## 2. Value curve — `lib/mock-draft/value.ts`

```typescript
// Hyperbolic curve: rank 1 = 100, ~50 by rank 11, ~20 by rank 41, ~10 by rank 91.
// Captures that early picks matter far more than late ones.
export function playerValue(rank: number): number {
  return 1000 / (rank + 9);
}
```

Used by both the bot engine (this phase) and grading (Phase 5). Do not round inside the function.

## 3. Snake math — `lib/mock-draft/snake.ts`

All arguments/returns 1-based.

- `getTotalPicks(teamCount): number` — `teamCount * TOTAL_ROUNDS`.
- `getRound(overall, teamCount): number`.
- `getSlotOnClock(overall, teamCount): number` — odd rounds run slot 1→N, even rounds N→1.
- `getOverallPick(round, slot, teamCount): number` — inverse of the above.
- `getTeamOveralls(slot, teamCount): number[]` — the 14 overall picks belonging to a slot.
- `getNextOverallForSlot(currentOverall, slot, teamCount): number | null` — the team's next pick at or after `currentOverall` (used for "picks until you're on the clock").

## 4. Roster rules — `lib/mock-draft/roster.ts`

Work over `Player[]` rosters (the hook/engine resolves `playerId → Player`).

- `countByPosition(roster): Record<Position, number>`.
- `isRosterFull(roster): boolean` — length ≥ `TOTAL_ROUNDS`.
- `withinCaps(roster, position): boolean` — adding one more of `position` stays within `POSITION_CAPS`.
- `getUnfilledStarterSlots(roster): Position[]` — which required starter positions are still unfilled, expanding `STARTER_SLOTS` (FLEX counts as filled once QB/K/DST needs are set aside and there is at least one surplus RB/WR/TE beyond the dedicated slots). Returns e.g. `["QB", "K", "DST"]`. FLEX, when unfilled, is represented as the pseudo-entry `"FLEX"` — type the return as `(Position | "FLEX")[]`.
- `mustFillStartersOnly(roster, remainingPicks): boolean` — true when `remainingPicks <= getUnfilledStarterSlots(roster).length`. When true, the only legal positions are ones that fill an unfilled starter slot (FLEX accepts RB/WR/TE).
- `positionFillsStarter(roster, position): boolean`.
- `assignLineup(roster): { starters: Record<string, Player | null>; bench: Player[] }` — greedy by rank: best QB → QB; top 2 RB → RB1/RB2; top 2 WR → WR1/WR2; best TE → TE; best remaining RB/WR/TE → FLEX; best K → K; best DST → DST; everything else → bench sorted by rank. Greedy is optimal here because value is strictly decreasing in rank. Keys: `QB, RB1, RB2, WR1, WR2, TE, FLEX, K, DST`.

**User vs bot legality**: the user may pick any available player subject only to `withinCaps` and `!isRosterFull`. Bots (and user autopick) additionally obey the timing and feasibility rules in section 5.

## 5. Bot engine — `lib/mock-draft/bot.ts`

### Archetypes

```typescript
interface Archetype {
  id: ArchetypeId;
  // Multiplier applied to a candidate's score, by position and round.
  positionBias: (position: Position, round: number) => number;
}
```

| id | Bias |
|---|---|
| `balanced` | 1.0 everywhere |
| `rbHeavy` | RB ×1.15, WR ×0.95 |
| `wrHeavy` | WR ×1.15, RB ×0.95 |
| `zeroRb` | RB ×0.6 in rounds 1–4, RB ×1.2 from round 5; WR ×1.1 in rounds 1–4 |
| `earlyQb` | QB ×1.3 |
| `lateQb` | QB ×0.7 |
| `tePremium` | TE ×1.3 |

Export `ARCHETYPES: Record<ArchetypeId, Archetype>` and `ARCHETYPE_IDS`.

### `chooseBotPick(input): number` (returns a playerId)

```typescript
interface BotPickInput {
  available: Player[];        // sorted by rank ascending
  roster: Player[];           // the picking team's current roster
  archetype: ArchetypeId;
  round: number;              // 1..14
  overall: number;            // current overall pick number
  teamCount: number;
  remainingPicks: number;     // picks this team still has, including this one
  rng: Rng;
}
```

Algorithm, in order:

1. **Legality filter.** Candidates = available players where `withinCaps` passes, and:
   - K/DST excluded before round `KICKER_DST_EARLIEST_ROUND` (13).
   - If `mustFillStartersOnly`, only positions filling an unfilled starter slot.
   - A 2nd QB or 2nd TE is excluded before round 10.
2. **Faller stopper** (prevents a top player sliding absurdly): if the best legal candidate's `rank <= overall - teamCount` (fallen more than a full round), return that player immediately — no scoring, no jitter.
3. **Candidate pool.** Take the first 8 legal candidates by rank. (Pool size 8 is the "slight randomness" bound: nobody outside the top 8 available can ever be taken, so no crazy reaches either.)
4. **Score** each candidate:
   `score = playerValue(rank) × needMultiplier × archetype.positionBias(position, round) × jitter`
   - `jitter = 0.9 + rng() * 0.2` (drawn per candidate, ±10%).
   - `needMultiplier`:
     - position fills an unfilled starter slot (FLEX counts for RB/WR/TE): **1.0**
     - starters at that position filled, but roster has < soft target: **0.75** — soft targets: QB 1, RB 4, WR 4, TE 1, K 1, DST 1 (i.e. depth at RB/WR is normal, extra QB/TE is not)
     - at/above soft target (still under cap): **0.4**
   - **Bye penalty**: ×0.92 if the candidate's bye equals the bye of any already-rostered player at the same position.
5. Return the highest-scoring candidate's id.

The jitter magnitude vs. the value curve means adjacent-rank players swap often, but a rank-3 player never loses to a rank-30 player — this is the "slight randomness, nothing crazy" dial. Do not increase jitter or pool size without re-checking the invariant tests.

### `chooseAutopick(input: Omit<BotPickInput, "archetype">): number`

The user's timer-expiry pick: `chooseBotPick` with `archetype: "balanced"`. Same legality rules as bots (so autopick never builds a nonsense roster even if the user idles the whole draft).

## 6. State transitions — `lib/mock-draft/engine.ts`

- `createDraft(config: DraftConfig, seed: number): DraftState` — validates `config` (teamCount in options, 1 ≤ userSlot ≤ teamCount, timer in options; throw on violation). Uses `createRng(seed)` to: shuffle `BOT_NAMES` and take the first `teamCount − 1`; assign each bot a random archetype from `ARCHETYPE_IDS` (independent draws — duplicates across bots are fine). User team: `name: "You"`, `isUser: true`, `archetype: null`. `status: "active"`, `picks: []`, `startedAt` = now ISO.
- `getCurrentOverall(state): number` — `picks.length + 1`.
- `isComplete(state): boolean`.
- `getAvailablePlayers(state): Player[]` — `PLAYERS` minus picked ids, rank order. (Build a picked-id `Set`; called every render.)
- `getTeamRoster(state, slot): Player[]`.
- `applyPick(state, playerId): DraftState` — throws if status ≠ `"active"`, player unavailable, or the pick violates `withinCaps`/`isRosterFull` for the team on the clock. Appends the `DraftPick` (computing overall/round/slot from snake math) and flips `status` to `"complete"` when all picks are in.
- `makeBotPick(state): DraftState` — asserts the slot on the clock is a bot; builds `BotPickInput` (rng = `createRng(state.seed * 31 + overall)`), calls `chooseBotPick`, then `applyPick`.
- `makeAutopick(state): DraftState` — same but for the user slot via `chooseAutopick`.
- `pauseDraft(state)` / `resumeDraft(state)` — status flips; no-ops (return state) when not applicable.

## 7. Persistence — `lib/mock-draft/storage.ts`

Model after `lib/use-reminder-storage.ts` (guard `typeof window === "undefined"`, try/catch with `QuotaExceededError` warn).

- `saveDraft(state: DraftState): void` — `localStorage.setItem(STORAGE_KEY, JSON.stringify(state))`.
- `loadDraft(): DraftState | null` — parse, then validate with `isValidDraftState`; return null (and `clearDraft()`) on any failure. If the loaded status is `"active"`, return it as `"paused"` (refresh always lands paused).
- `clearDraft(): void`.
- `isValidDraftState(value: unknown): value is DraftState` — pure, exported for tests: version === 1; config values in the allowed options; teams array length/slots consistent with teamCount, exactly one `isUser`; every pick's playerId exists in `PLAYERS` with no duplicates; picks are contiguous overalls starting at 1 with round/slot matching snake math; status is a `DraftStatus`.

## 8. Tests

Follow existing `lib/__tests__/` style. Files and minimum coverage:

- `mock-draft-snake.test.ts` — round/slot round-trips for 8/10/12 teams; even-round reversal (overall 13 in a 12-team draft → slot 12); `getOverallPick` inverts `getSlotOnClock`+`getRound`; `getTeamOveralls` returns 14 strictly increasing picks; snake gap symmetry (slot 1 and slot N have back-to-back picks at the turn).
- `mock-draft-roster.test.ts` — caps enforcement; `getUnfilledStarterSlots` including FLEX edge cases (3 RBs = RB1/RB2 + FLEX filled; 2 RB + 2 WR + 0 TE leaves TE and FLEX unfilled); `mustFillStartersOnly` boundary (remainingPicks equal vs greater); `assignLineup` puts the best players in starting slots and the FLEX is the best leftover RB/WR/TE.
- `mock-draft-bot.test.ts` — with fixed seeds: never picks K/DST before round 13; never exceeds caps; respects `mustFillStartersOnly`; faller stopper fires (construct a state where rank 1 is still available at overall 14 in a 12-team draft and assert he's taken); jitter bound (run the same pick 100 times with different seeds and assert the chosen player is always within the top 8 available); archetype effect (earlyQb bot with an empty roster in round 3 takes a QB more often than balanced does, over 200 seeded trials).
- `mock-draft-engine.test.ts` — `createDraft` validation errors; determinism (same config+seed twice → deep-equal states after simulating the full draft); **full-draft invariant suite**: for each teamCount in [8, 10, 12] × 5 seeds, simulate a complete draft (bots pick via `makeBotPick`, the user slot via `makeAutopick`) and assert for every team: 14 players, all caps respected, zero unfilled starter slots, no K/DST drafted before round 13. Also assert the faller invariant: immediately before every pick in rounds 1–10, the best available **RB or WR** is never more than two rounds behind the board (`bestAvailableRbWr.rank > overall - 2 * teamCount`). The invariant is restricted to RB/WR because QB/TE fallers are legitimately skippable (legality rules exclude 2nd QB/TE before round 10, so a mid-rank QB sliding is realistic), and the two-round buffer allows the on-the-clock team itself to be cap-blocked. This is the automated form of "no top-5 player falls to pick 10".
- `mock-draft-storage.test.ts` — jsdom localStorage: save/load round-trip; corrupted JSON → null + cleared; tampered states rejected (bad version, duplicate playerId, non-contiguous overalls, teamCount/teams mismatch); loaded `"active"` becomes `"paused"`; `"complete"` loads as `"complete"`.

## Verification

1. `pnpm lint` and `pnpm test` pass.
2. Nothing under `app/` was touched; `lib/mock-draft/` still has zero React/Next imports (check by grepping for `react` in the folder).
3. Sanity: temporarily log one simulated 12-team draft result in a test and eyeball it — first round should be all top-~14 players, K/DST only in rounds 13–14, QBs starting late round 2 at the earliest.
