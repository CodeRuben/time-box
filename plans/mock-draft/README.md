# Mock Draft Simulator — Implementation Plan

A new feature module for the Timeboxing Planner app: a fantasy football mock draft simulator. The user drafts against AI bots in a snake draft, using the 2026 Full-PPR Top 200 board (`docs/2026-full-ppr-top-200.md`) as the player universe. At the end, every team is graded and ranked.

Read `CONTEXT.md` (repo root) for domain vocabulary conventions. Phase 01 adds a Mock Draft vocabulary section to it — use those terms exactly.

## Decisions already made (do not re-litigate)

| Topic | Decision |
|---|---|
| Opponents | Always 1 human (the user) vs bots. Bot names come from a fixed list of 12 (see below). |
| League sizes | 8, 10, or 12 teams. Configurable at setup. |
| Roster / rounds | Hard-coded: 1 QB, 2 RB, 2 WR, 1 TE, 1 FLEX (RB/WR/TE), 1 K, 1 DST + 5 bench = **14 rounds**. Not configurable. |
| Format | Snake. Round 1 = slot 1→N, round 2 = slot N→1, etc. |
| Pick timer | 30 / 60 / 90 / 120 seconds, user-configurable. Applies to the **user only**. On expiry, the app auto-picks for the user using the bot engine (balanced archetype). |
| Bot pacing | Bots pick after a randomized 1–3 second delay. No fast-forward button in v1. |
| Bot strategy | Value × need × archetype × jitter scoring over a top-8 candidate pool, with hard rules preventing nonsense rosters and big fallers. Each bot gets a personality archetype assigned **randomly at draft start** (not fixed per name). Exact algorithm in `02-draft-engine.md`. |
| Player data | The 200-player board converted to a typed TS file, **enriched with NFL team abbreviation and 2026 bye week** per player, and **extended with extra K/DST entries** (the top 200 has only 6 K and 4 DST — not enough for 12 teams). Bots mildly avoid bye-week stacking. |
| Grading | Rank-derived value curve. Optimal starting lineup value + 0.25× bench value − penalties (unfilled starters, bye stacks). Teams ranked 1–N with letter grades A+…F, per-position breakdown, best value pick and biggest reach callouts. |
| Randomize order | Setup button shuffles bot-name→slot assignment AND rolls a random user slot (user can still manually re-adjust the slot afterward). Bots are always randomly assigned to non-user slots at draft start regardless. |
| Draft room layout | Persistent **Best Available** panel (position filter tabs + search, always visible = "pull up the rankings at any moment"), **My Roster** panel, pick ticker, and a full **Board** view as a tab/toggle. |
| Pause | Pause/resume button freezes the user timer and stops bot picks. |
| Persistence | localStorage only (no DB, even signed in). Key `mock-draft`. Saved after every pick/state change. On page refresh the draft restores **paused**; the user timer resets to full for the current pick (remaining time is not persisted). Cleared/overwritten only when a new draft is started. Completed-draft results persist until a new draft starts. |
| Feature flag | Key `mock-draft`, label "Mock Draft", route `/mock-draft`, `guestEnabled: true`. |
| Testing | All draft logic lives in pure functions under `lib/mock-draft/` with vitest unit tests — the engine must run without any UI. UI components get no automated tests (repo norm). |

### Bot names (exactly these, in this constant order)

```
Kino, Jack Torrence, Jason Dessen, Colin, Odysseus, Clive Linley,
Kolya Vlasov, Todd Bowden, Leonard Marnham, Stuart Ullman,
Gordie LaChance, Lev Beniov
```

For an N-team draft, N−1 names are drawn at random (seeded shuffle) from this list.

## Architecture overview

Follows existing app conventions (model after `app/workout-tracker/` and the reminders storage hook `lib/use-reminder-storage.ts`):

- **No API routes, no Prisma.** Everything is client-side.
- **Pure engine**: `lib/mock-draft/` holds types, data, and pure functions (snake math, roster rules, bot brain, grading, serialization). No React imports there.
- **One orchestration hook**: `app/mock-draft/hooks/use-mock-draft.ts` owns state, timers, bot scheduling, and persistence side-effects.
- **UI**: `"use client"` page wrapped in `FeatureGate`, shadcn/ui components (`Button`, `Card`, `Select`, `Input`, `Badge`, `Dialog`, `AlertDialog` are already installed), Tailwind v4, both themes must work.

### File map (final)

```
lib/mock-draft/
  types.ts          # all shared types + constants (Phase 1)
  players.ts        # PLAYERS data + BYE_WEEKS (Phase 1)
  rng.ts            # seeded PRNG (Phase 2)
  value.ts          # playerValue curve (Phase 2)
  snake.ts          # snake order math (Phase 2)
  roster.ts         # caps, lineup assignment, needs (Phase 2)
  bot.ts            # bot pick engine + archetypes (Phase 2)
  engine.ts         # state transitions (Phase 2)
  storage.ts        # localStorage serialize/restore (Phase 2)
  grading.ts        # post-draft grading (Phase 5)
lib/__tests__/
  mock-draft-players.test.ts   (Phase 1)
  mock-draft-snake.test.ts     (Phase 2)
  mock-draft-roster.test.ts    (Phase 2)
  mock-draft-bot.test.ts       (Phase 2)
  mock-draft-engine.test.ts    (Phase 2)
  mock-draft-storage.test.ts   (Phase 2)
  mock-draft-grading.test.ts   (Phase 5)
app/mock-draft/
  page.tsx          # FeatureGate wrapper + phase router (setup/room/results)
  layout.tsx        # metadata only
  hooks/
    use-mock-draft.ts
  components/
    draft-setup.tsx
    draft-room.tsx
    draft-header.tsx      # round/pick, on-the-clock, timer, pause
    pick-ticker.tsx
    best-available.tsx
    my-roster.tsx
    draft-board.tsx
    draft-results.tsx
    team-grade-card.tsx
```

### Core state shape (final — do not change field names)

```typescript
export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "DST";

export interface Player {
  id: number;        // === rank; stable identifier
  rank: number;      // 1-based overall rank
  name: string;
  position: Position;
  nflTeam: string;   // abbreviation, must be a key of BYE_WEEKS
  bye: number;       // 2026 bye week
}

export type ArchetypeId =
  | "balanced" | "rbHeavy" | "wrHeavy" | "zeroRb"
  | "earlyQb" | "lateQb" | "tePremium";

export interface DraftConfig {
  teamCount: 8 | 10 | 12;
  timerSeconds: 30 | 60 | 90 | 120;
  userSlot: number;  // 1-based, 1..teamCount
}

export interface DraftTeam {
  slot: number;              // 1-based draft position
  name: string;              // "You" for the user, else a bot name
  isUser: boolean;
  archetype: ArchetypeId | null; // null for the user
}

export interface DraftPick {
  overall: number;   // 1-based overall pick number
  round: number;     // 1..14
  slot: number;      // slot of the team that picked
  playerId: number;
}

export type DraftStatus = "active" | "paused" | "complete";

export interface DraftState {
  version: 1;
  seed: number;      // integer, drives all engine randomness
  config: DraftConfig;
  teams: DraftTeam[];   // ordered by slot ascending
  picks: DraftPick[];   // ordered by overall ascending
  status: DraftStatus;
  startedAt: string;    // ISO timestamp
}
```

Derived (never stored): current overall pick = `picks.length + 1`; available players = all players minus picked ids; each team's roster = picks filtered by slot.

### Roster constants (final)

```typescript
export const TOTAL_ROUNDS = 14;
export const STARTER_SLOTS = { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DST: 1 } as const; // 9 starters
export const BENCH_SIZE = 5;
export const POSITION_CAPS: Record<Position, number> = { QB: 2, RB: 6, WR: 7, TE: 2, K: 1, DST: 1 };
export const KICKER_DST_EARLIEST_ROUND = 13; // bots only
```

### Determinism and randomness

All engine randomness uses a seeded PRNG (mulberry32) so tests are reproducible. `state.seed` is generated once at draft start (`Math.floor(Math.random() * 2 ** 31)`). Every per-pick decision derives a fresh generator: `createRng(state.seed * 31 + overallPickNumber)`. Bot "thinking" delays (1–3 s) are UI-only and may use plain `Math.random()`.

## Phases

Implement in order. Each phase file is self-contained, ends with verification steps, and must leave `pnpm lint` and `pnpm test` passing.

1. `01-player-data.md` — types, player data with NFL team + bye enrichment, extra K/DST, data-integrity tests, CONTEXT.md vocabulary
2. `02-draft-engine.md` — snake math, roster rules, bot engine, state transitions, storage; the bulk of the unit tests
3. `03-setup-ui.md` — feature registration, page scaffold, setup screen with randomize, resume-draft detection
4. `04-draft-room.md` — draft room UI, timers, bot scheduling, pause/resume, autopick
5. `05-results.md` — grading engine + tests, results screen
6. `06-persistence-polish.md` — restore hardening, edge cases, responsive/a11y pass, version bump

## Known risks (read before Phase 1)

- **Player→NFL-team accuracy.** The board includes 2026 rookies and offseason movers. Phase 1 mandates verifying team assignments against a live rankings source rather than trusting model memory. The bye table itself is verified (2026 schedule release) and is included verbatim in Phase 1.
- **K/DST scarcity.** 12 teams each need 1 K + 1 DST but the top 200 has 6 K / 4 DST. Phase 1 extends the pool to 14 of each (ranks 201+). Do not skip this or 12-team drafts will strand teams with unfillable slots.
- **Engine/UI separation.** If you find yourself putting draft logic in a component, stop and move it to `lib/mock-draft/`. The reducer-style engine functions must be testable headlessly.
