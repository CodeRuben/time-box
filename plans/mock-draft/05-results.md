# Phase 5 — Grading engine and results screen

Prerequisites: Phases 1–4.

## 1. Grading — `lib/mock-draft/grading.ts`

Pure functions over a completed (or even partial) `DraftState`. Reuses `playerValue` and `assignLineup`.

### Types

```typescript
export interface PickCallout {
  playerId: number;
  overall: number; // where they were picked
  delta: number;   // overall - rank; positive = value (fell), negative = reach
}

export interface TeamGrade {
  slot: number;
  name: string;
  isUser: boolean;
  score: number;          // final numeric score, 1 decimal
  leagueRank: number;     // 1 = best
  letter: string;         // "A+" ... "F"
  starterValue: number;
  benchValue: number;
  penalties: { unfilledStarters: number; byeStacks: number }; // positive numbers, already subtracted
  positionValue: Record<Position, number>; // summed playerValue of all rostered players by position
  bestValue: PickCallout | null;   // largest positive delta, only if delta >= 5
  biggestReach: PickCallout | null; // most negative delta, only if delta <= -5
}
```

### `gradeDraft(state: DraftState): TeamGrade[]` (sorted by leagueRank)

Per team:

1. `lineup = assignLineup(roster)`. `starterValue` = Σ `playerValue(rank)` over filled starter slots. `benchValue` = Σ over bench.
2. Penalties:
   - **Unfilled starters**: 15 per empty starter slot (can only happen to the user, who may draft freely).
   - **Bye stacks**: starters only — for each bye week shared by ≥2 starters, 4 per starter beyond the first. (Two starters on the same bye = 4, three = 8.)
3. `score = starterValue + 0.25 × benchValue − penalties`, rounded to 1 decimal. The 0.25 bench weight is deliberate: starters dominate, depth breaks ties.
4. `leagueRank` by score descending (ties broken by earlier `slot`).
5. Letter on a relative curve vs. the league's top score, `ratio = score / topScore`:
   `≥0.98 A+ · ≥0.95 A · ≥0.92 A− · ≥0.89 B+ · ≥0.86 B · ≥0.83 B− · ≥0.80 C+ · ≥0.77 C · ≥0.74 C− · ≥0.68 D · else F` (top team is always A+; negative or zero scores are F).
6. Callouts from the team's own picks: `delta = overall − rank`. `bestValue` = max delta if ≥ 5; `biggestReach` = min delta if ≤ −5; else null.

## 2. Tests — `lib/__tests__/mock-draft-grading.test.ts`

- Hand-built rosters: a team of ranks 1–14 outscores a team of ranks 100–113; the rank 1–14 team is leagueRank 1 with letter A+.
- Unfilled starter (no K drafted) scores exactly 15 less than the same roster with a K of value ~0 — build with a stubbed roster, assert `penalties.unfilledStarters === 15`.
- Bye stack: two starters sharing a bye → `penalties.byeStacks === 4`; three sharing → 8; bench players sharing byes → 0.
- Letter boundaries: ratios 0.98 / 0.9799 map to A+ / A.
- Callouts: pick at overall 40 of rank 20 → bestValue delta 20; overall 40 of rank 70 → biggestReach delta −30; deltas within ±4 → both null.
- Integration: grade a full simulated draft (reuse the Phase 2 simulation helper) — returns `teamCount` entries, ranks 1..teamCount unique, all letters valid.

## 3. Results screen — `app/mock-draft/components/draft-results.tsx` + `team-grade-card.tsx`

Replaces the Phase 3 placeholder. Rendered when `status === "complete"`; also reachable after refresh (completed drafts persist until a new one starts).

- Header: "Draft Results" + the final standings intro line ("You finished 3rd of 12").
- Ordered list of `TeamGradeCard`s by `leagueRank`. Each card (use `Card` + `Collapsible`, collapsed by default except the user's):
  - Rank medal/number, team name ("You" highlighted with the accent color), letter grade `Badge` (color-coded: A green, B lime/neutral, C yellow, D orange, F red — ensure both themes), numeric score.
  - Expanded: starting lineup (reuse/adapt the `MyRoster` presentation for any roster), bench list, per-position value bars (simple horizontal bars scaled to the league max per position — plain divs, no chart lib), penalty line items when nonzero, and the Best Value / Biggest Reach callouts ("Best value: Breece Hall — rank 30, picked 51st").
- Footer actions: **Start new draft** (AlertDialog confirm → `abandonDraft`) and a **View board** toggle showing the final `DraftBoard`.
- Do not reveal bot archetypes anywhere.

## Verification

1. `pnpm lint` and `pnpm test` pass.
2. Complete a real draft in the browser: results render immediately when the last pick lands; standings look sane (teams that lucked into value rank higher); your card is expanded and highlighted.
3. Refresh on the results screen → results still there. Start new draft → storage cleared, setup shown.
4. Grade colors readable in both themes.
