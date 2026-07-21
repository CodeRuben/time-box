# Phase 4 — Draft room: live drafting, timers, bots, pause

Prerequisites: Phases 1–3. This phase completes `use-mock-draft.ts` and builds the real draft room UI. All decision logic already exists in `lib/mock-draft/` — this phase only schedules and renders it. If you catch yourself writing pick-selection logic in the hook or a component, it belongs in the engine.

## 1. Hook completion — `app/mock-draft/hooks/use-mock-draft.ts`

Add to the existing hook:

### Derived values (memoized)

`currentOverall`, `currentRound`, `slotOnClock`, `teamOnClock`, `isUserOnClock`, `availablePlayers`, `userRoster`, `picksUntilUserTurn` (via `getNextOverallForSlot`), `recentPicks` (last ~teamCount picks, newest first, with resolved player + team objects).

### Bot scheduling

- One `useEffect` watches `[draftState.status, picks.length]`. When status is `"active"` and the slot on the clock is a bot: `setTimeout(() => commit(makeBotPick(state)), 1000 + Math.random() * 2000)`. Clear the timeout on cleanup (re-render, pause, unmount) — stale timers must never fire against a newer state; the cleanup-on-change pattern guarantees each scheduled pick matches the state it was scheduled from.
- Pausing flips status, which unschedules via the same cleanup. Resuming re-triggers the effect and the bot picks again (fresh delay — fine).
- Because `commit` both saves and sets state, a bot pick landing right before a refresh is never lost.

### User pick timer

- Runs only while `status === "active"` and `isUserOnClock`. Store `deadline = Date.now() + timerSeconds * 1000` in a ref when the user comes on the clock; tick a `remainingSeconds` state every 250ms from it (interval math from a deadline, not decrementing a counter — avoids drift and background-tab throttling errors).
- On pause: record remaining ms in a ref; on resume: recompute the deadline from it. On refresh: not persisted — the restored draft is paused and the timer re-arms at full `timerSeconds` on resume (accepted per README).
- At 0: `commit(makeAutopick(state))`. Guard against double-fire (clear the interval before committing).
- `draftPlayer(playerId)`: only when `isUserOnClock` and status `"active"`; `commit(applyPick(state, playerId))`. Let the engine's legality throw surface as a no-op with the button already disabled (see Best Available below).

### Controls

`togglePause()` (commits `pauseDraft`/`resumeDraft`), `abandonDraft()` (from Phase 3).

## 2. Draft room layout — `app/mock-draft/components/draft-room.tsx`

Desktop-first grid (the app is desktop-oriented; see responsive pass in Phase 6):

```
+--------------------------------------------------------------+
| DraftHeader: Round 5, Pick 3 (Overall 51) | On the clock:    |
|  Kino (or YOU + countdown timer) | Pause/Resume | New draft  |
+--------------------------------------------------------------+
| PickTicker (horizontal strip of recent picks)                |
+--------------------------------+-----------------------------+
| BestAvailable (main, ~2/3)     | MyRoster (side, ~1/3)       |
|  [tabs: All QB RB WR TE K DST] |  QB  —                      |
|  [search input]                |  RB1 Jahmyr Gibbs           |
|  rank | player | pos | bye     |  ...                        |
|  [Draft] button per row        |  Bench 1-5                  |
+--------------------------------+-----------------------------+
| [Tab/toggle: Best Available <-> Full Board]                  |
+--------------------------------------------------------------+
```

### DraftHeader — `draft-header.tsx`

Round/pick/overall; team on the clock (highlight strongly when it's the user — colored border/pulse and "You're on the clock!"); countdown `MM:SS` shown only during the user's turn, turning destructive-red under 10s; Pause/Resume `Button`; "New draft" (AlertDialog confirm → `abandonDraft`). When paused, an unmissable "Paused" `Badge` and the resume affordance.

### PickTicker — `pick-ticker.tsx`

Horizontal scroll strip, newest pick first: "5.03 · Kino · Breece Hall (RB)". User's picks visually distinct. Auto-scrolls to newest.

### BestAvailable — `best-available.tsx`

This panel is always visible during the draft — it *is* the "pull up the rankings at any moment" requirement.

- Position filter tabs (All + 6 positions) and a name-search `Input`; both compose.
- Rows: overall rank, name, position `Badge`, NFL team, bye. Sorted by rank; render the top ~50 matching rows (plain slice — no virtualization dependency).
- Per-row **Draft** button: enabled only when `isUserOnClock && status === "active"` and the pick is legal for the user (`withinCaps`, roster not full). Illegal-for-user rows while on the clock show a disabled button with a `title` tooltip ("QB limit reached").
- When not on the clock the list stays fully browsable — rows just have no active Draft button (show "in 7 picks" hint text in the panel header via `picksUntilUserTurn`).

### MyRoster — `my-roster.tsx`

Renders `assignLineup(userRoster)`: all 9 starter slots always listed (QB, RB1, RB2, WR1, WR2, TE, FLEX, K, DST) with player or an empty-slot placeholder, then Bench 1–5. Show each player's bye; if two starters share a bye, mark both with a subtle warning icon (`title` explains).

### DraftBoard — `draft-board.tsx`

Toggled view (simple state in `draft-room.tsx`, e.g. two `Button`s acting as tabs): a grid of columns per team (header: name + archetype hidden — do NOT reveal bot archetypes) and rows per round, each cell the drafted player (name, pos badge) or empty. The user's column highlighted. Horizontal scroll on narrow screens.

## 3. Guardrails

- All state changes go through `commit` — no direct `saveDraft` calls in components.
- Components receive data and callbacks from the hook via props; no component reads localStorage or calls engine functions that transition state.
- Pure display helpers (e.g. `formatPickLabel(round, slot, overall)` → `"5.03"`, `formatClock(seconds)`) go in `lib/mock-draft/` with a couple of unit tests appended to `mock-draft-engine.test.ts` or a small `mock-draft-format.test.ts`.

## Verification

1. `pnpm lint` and `pnpm test` pass.
2. Manual run-through of a full 12-team draft (`pnpm dev`):
   - Bots pick with visible 1–3s delays; the ticker and board fill correctly in snake order.
   - Your timer counts down only on your turn; letting it expire auto-drafts a sensible player.
   - Pause mid-bot-wait: no pick lands while paused; resume continues. Pause during your turn: timer freezes and resumes with the same remaining time.
   - Refresh mid-draft: room restores paused at the exact same pick.
   - No bot drafts K/DST before round 13; every completed bot roster fills all starter slots; no duplicate players anywhere (watch the board).
   - Position tabs + search work; you can browse rankings while bots pick.
3. Both themes; no console errors or React key warnings.
