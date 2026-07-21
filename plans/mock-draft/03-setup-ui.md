# Phase 3 — Feature registration, page scaffold, and setup screen

Prerequisites: Phases 1–2. Model the page structure on `app/workout-tracker/` (page + layout + hooks/ + components/).

## 1. Feature registration

- `lib/features.ts`: add to `FEATURES` (before the `registration` system entry):

```typescript
{
  key: "mock-draft",
  label: "Mock Draft",
  description: "Fantasy football snake mock drafts against AI opponents.",
  href: "/mock-draft",
  kind: "page",
  defaults: { adminEnabled: true, userEnabled: true, guestEnabled: true },
},
```

- Check how the header/nav and settings pick up `PAGE_FEATURES` — no other wiring should be needed, but verify the new entry appears in navigation and in the settings feature toggles.

## 2. Page scaffold

- `app/mock-draft/layout.tsx` — metadata only (`title: "Mock Draft"`, description), copy the workout-tracker layout pattern.
- `app/mock-draft/page.tsx`:

```tsx
"use client";
function MockDraftPageContent() {
  const draft = useMockDraft();
  if (draft.phase === "setup") return <DraftSetup ... />;
  if (draft.phase === "results") return <DraftResults ... />;
  return <DraftRoom ... />;
}
export default function MockDraftPage() {
  return (
    <FeatureGate featureKey="mock-draft">
      <MockDraftPageContent />
    </FeatureGate>
  );
}
```

## 3. Orchestration hook — `app/mock-draft/hooks/use-mock-draft.ts` (first slice)

This phase implements only the setup/restore slice; Phase 4 adds timers and bot scheduling to the same hook.

State: `draftState: DraftState | null` plus derived `phase: "setup" | "room" | "results"` (`null` → setup, `status === "complete"` → results, else room).

- On mount (once, in a `useEffect` — localStorage is unavailable during SSR): `loadDraft()`; if non-null, adopt it (remember it comes back paused). Until that effect runs, render nothing or a `LoadingScreen` (see `components/ui/loading-screen.tsx`) to avoid hydration mismatch.
- `startDraft(config: DraftConfig)`: `clearDraft()`, then `createDraft(config, newSeed())` where `newSeed()` = `Math.floor(Math.random() * 2 ** 31)`, save, set state. **Starting a new draft is the only thing that clears a stored draft.**
- `abandonDraft()`: clears storage and returns to setup (used by "New draft" from room/results, behind an `AlertDialog` confirm when a draft is in progress).
- Every state transition goes through a single `commit(next: DraftState)` helper that `setState`s and `saveDraft(next)`s — one write path, no missed saves.

## 4. Setup screen — `app/mock-draft/components/draft-setup.tsx`

A centered `Card` form:

- **Teams**: `Select` with 8 / 10 / 12 (default 12).
- **Pick timer**: `Select` with 30s / 60s / 90s / 120s (default 60s).
- **Your draft spot**: `Select` of 1..teamCount (default random on first render). If teamCount changes and the chosen spot exceeds it, clamp and show the clamped value.
- **Randomize order** button (`Button` variant secondary, dice icon from lucide): rolls a uniform random user spot 1..teamCount and updates the spot select. Bot-name shuffling happens inside `createDraft` for every draft regardless, so this button only needs to roll the user spot — but label it "Randomize draft order" per the product decision.
- **Start draft** button: calls `startDraft`.
- If a stored draft exists (in-progress or complete), the setup screen instead leads with a **Resume draft** card: summary line ("Round 5 of 14 — pick 3 of 12 — 12 teams" or "Draft complete") with a Resume/View results primary button and a "Start new draft (discards saved draft)" secondary action behind an `AlertDialog` confirm. Reaching the setup form always means the old draft is gone or explicitly discarded.

Extract any non-trivial form logic into the hook or small helpers — components stay declarative (see `.cursor/rules/coding-conventions.mdc`).

## 5. Placeholder room/results

Create minimal `draft-room.tsx` and `draft-results.tsx` placeholders (a `Card` with "Draft in progress" / "Results" and an Abandon button wired to `abandonDraft`) so the page compiles and the flow is walkable end to end. Phases 4–5 replace their internals.

## Verification

1. `pnpm lint` and `pnpm test` pass (no engine changes; existing tests still green).
2. `pnpm dev`: "Mock Draft" appears in nav; `/mock-draft` renders the setup form for a guest; light and dark themes both look right.
3. Start a draft → placeholder room appears; refresh → Resume card appears with the correct summary; discard → back to a clean setup form and the `mock-draft` localStorage key is gone.
4. Feature toggle off in settings hides the page (FeatureGate behavior matches other pages).
