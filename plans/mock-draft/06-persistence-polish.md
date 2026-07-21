# Phase 6 — Hardening, edge cases, and polish

Prerequisites: Phases 1–5. No new features — this phase closes gaps a first pass typically leaves.

## 1. Restore hardening

- Corrupt/tampered storage: verify `loadDraft` failures land on setup silently (no crash, key cleared). Test manually by hand-editing the `mock-draft` key in devtools.
- Restored-draft correctness: resume must recompute everything from `picks` (rosters, availability, on-the-clock) — grep for any state that lives outside `DraftState` but should not (e.g. a cached available list in the hook that isn't rebuilt on restore).
- Multi-tab: two tabs can both mutate the draft; last write wins is acceptable, but the draft must never crash from it. Cheap guard: on `visibilitychange` → visible, reload from storage if the stored `picks.length` is ahead of memory. Skip anything fancier.
- User on the clock when the last pick of the draft happens → status flips to `"complete"` and results render; also verify autopick on the final pick completes the draft cleanly.

## 2. Edge-case sweep (fix anything that fails)

- 8-team draft: only 7 bot names drawn; snake math and board render correctly.
- User slot 1 and slot N (back-to-back turn picks at the snake turn — timer must re-arm correctly for the second consecutive pick).
- Pausing during the 1–3s bot delay window, then abandoning the draft: no orphaned timeout fires afterward (would throw on a null state).
- Rapid double-click on a Draft button must not double-pick (disable the button synchronously on click / guard in `draftPlayer` by checking the player is still available).
- Search text that matches nothing → friendly empty state in Best Available.
- User drafts to the QB cap → QB rows disable with the tooltip; tab badge/count still correct.

## 3. Responsive and accessibility pass

- The draft room grid stacks on narrow viewports: header → ticker → Best Available → My Roster (board stays horizontal-scroll). Usable at 390px width.
- Timer and on-the-clock changes announced via an `aria-live="polite"` region (one region in the header, e.g. "You're on the clock").
- All icon-only buttons have `aria-label`s; Draft buttons reachable by keyboard; focus not lost when the list re-renders after a pick.
- Respect `motion-reduce` for any pulse/attention animation on the on-the-clock highlight.

## 4. Consistency checklist

- No React imports under `lib/mock-draft/` (grep).
- No `saveDraft`/`localStorage` calls outside `storage.ts` + the hook's `commit`.
- Unused imports removed; comments explain WHY only (`.cursor/rules/coding-conventions.mdc`).
- shadcn components used for all primitives; no hand-rolled buttons/selects.

## 5. Version bump

Per the add-feature workflow: if `package.json` has no uncommitted version change, bump the **minor** version (new backwards-compatible feature).

## Verification

1. `pnpm lint` and `pnpm test` pass; `pnpm build` succeeds.
2. Full manual pass: one complete 8-team and one complete 12-team draft, including a mid-draft refresh, a pause/resume, one timer expiry, and a results-screen refresh.
3. Narrow-viewport walkthrough of setup → room → results.
