# Plan 001: Add actionable workout-history insights and controls

> **Executor instructions**: Follow this plan phase by phase. Run every
> verification command and confirm its expected result before continuing. Do
> not skip tests because the feature currently exists only as uncommitted work.
> If a STOP condition occurs, stop and report it instead of improvising. When
> complete, change this plan's status in `advisor-plans/README.md` to `DONE`.
>
> **Drift check (run first)**:
>
> ```powershell
> git rev-parse --short HEAD
> git status --short -- app/workout-tracker app/api/workouts/insights lib/workout-insights.ts lib/__tests__/workout-insights.test.ts
> Get-FileHash -Algorithm SHA256 "lib/workout-insights.ts"
> ```
>
> Expected starting point: HEAD is `aed027f`; the workout-insights files are
> untracked; `lib/workout-insights.ts` has SHA-256
> `288436FCDBBB191AC69EEB65A9DAB5B0B893EA52B01E5CB17A49CB490E8E2C78`.
> The current heatmap may have changed if the user continued visual
> experimentation. A heatmap-only difference is acceptable after review.
> Missing feature files or domain/API contract differences are a STOP
> condition.

## Status

- **Priority**: P1
- **Effort**: L (multi-day for a weaker executor)
- **Risk**: MED — changes the shared filtering contract, API query shape,
  pagination ordering, and several UI states
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `aed027f`, 2026-08-07, with the uncommitted
  workout-insights working tree described above

## Goal

Improve the Historical Insights sheet in three specific ways:

1. Add activity-consistency metrics: workouts per week, active days per week,
   current streak, and longest streak.
2. Add a compact monthly activity trend and a most-active-month callout while
   retaining the existing detailed monthly breakdown.
3. Add workout/exercise search, exercise-status filtering, and result sorting.

The result must work identically for guests using local storage and signed-in
users using `/api/workouts/insights`. It must not introduce new persisted data,
database columns, workout types, or third-party chart dependencies.

## Product behavior contract

These definitions are load-bearing. Implement them exactly so the UI, local
mode, account mode, and tests agree.

### Search

- Match case-insensitively against the workout name and every exercise
  (`subtask.name`).
- Trim leading/trailing whitespace before matching.
- An empty trimmed query means no search filtering.
- Limit the query to 100 characters in both the input and API validation.
- A workout matching either its own name or any exercise name is included once.

### Exercise-status filter

- Supported statuses are the existing storage values:
  - `completed` displayed as **Completed**
  - `pending` displayed as **Pending**
  - `error` displayed as **Missed**
- Default state selects all three statuses and does not narrow results.
- When all three are selected, workouts with no exercises remain included.
- When only a subset is selected, include a workout if at least one exercise has
  a selected status. Workouts with no exercises are excluded.
- Prevent deselecting the final selected status, matching the existing workout
  type filter behavior.

### Sorting

Support exactly these options:

- `newest`: date descending, then `createdAt` descending; default.
- `oldest`: date ascending, then `createdAt` ascending.
- `name`: workout name A–Z using case-insensitive locale comparison, then date
  descending, then `createdAt` descending for deterministic ties.

Sorting must happen before pagination. Search and status filtering must also
happen before summary calculations, monthly calculations, and pagination.

### Consistency metrics

All metrics reflect the complete currently filtered result set, not only the
first paginated page.

- `workoutsPerWeek`:
  `totalWorkoutEntries / max(1, inclusiveSelectedDays / 7)`, rounded to one
  decimal.
- `activeDaysPerWeek`:
  `activeDays / max(1, inclusiveSelectedDays / 7)`, rounded to one decimal.
- `currentStreak`: consecutive calendar days with at least one matching workout,
  ending exactly on the selected range's `endDate`. If `endDate` has no matching
  workout, this is `0`.
- `longestStreak`: longest run of consecutive active dates inside the selected
  date range.
- Multiple workouts on one date count once for streaks and active-day metrics.
- Search, type, and status filters all affect these metrics.

### Monthly trend

- Each trend value is the selected month's filtered workout total.
- Preserve zero-count months so inactivity remains visible.
- `mostActiveMonth` is `null` when every month is zero.
- When months tie for the highest non-zero total, choose the most recent month.
- Keep the current `WorkoutInsightsMonthlyTable` detailed breakdown below the
  trend; do not replace it.

## Current state

The feature currently consists of:

- `lib/workout-insights.ts` — pure transformation from workout days and date/type
  filters into summary, monthly counts, and sorted entries.
- `lib/__tests__/workout-insights.test.ts` — seven unit tests covering counts,
  type filtering, zero months, cross-year ranges, newest-first ordering, tie
  handling, and immutability.
- `app/api/workouts/insights/route.ts` — authenticated endpoint; loads workout
  days for the selected date range, builds all insights in memory, then slices
  entries for pagination.
- `app/workout-tracker/hooks/use-workout-insights.ts` — owns filter state,
  supports local and account storage, fetches 25 entries at a time, and resets
  state when the sheet closes.
- `app/workout-tracker/components/workout-insights-filters.tsx` — date presets,
  custom range picker, and workout-type chips.
- `app/workout-tracker/components/workout-insights-summary.tsx` — three cards:
  workout entries, active days, and most frequent type.
- `app/workout-tracker/components/workout-insights-monthly-table.tsx` — current
  detailed monthly view. At plan time this is an experimental type-by-month
  heatmap.
- `app/workout-tracker/components/workout-insights-list.tsx` — paginated,
  newest-first collapsible workout list.
- `app/workout-tracker/components/historical-insights-sheet.tsx` — composes all
  controls and results in a right-side sheet.

Current domain shapes in `lib/workout-insights.ts`:

```ts
export interface WorkoutInsightFilters {
  startDate: string;
  endDate: string;
  types: readonly InsightWorkoutType[];
}

export interface WorkoutInsights {
  totalWorkoutEntries: number;
  activeDays: number;
  mostFrequentType: { type: InsightWorkoutType; count: number } | null;
  monthlyCounts: WorkoutInsightMonthlyCount[];
  entries: WorkoutInsightEntry[];
}
```

Current API behavior in `app/api/workouts/insights/route.ts`:

```ts
const insights = buildWorkoutInsights(hydrateInsightDays(workoutDays), {
  startDate: start,
  endDate: end,
  types,
});

const entries = insights.entries.slice(offset, offset + limit);
```

Current hook behavior in
`app/workout-tracker/hooks/use-workout-insights.ts`:

```ts
const PAGE_SIZE = 25;
const [selectedTypes, setSelectedTypes] = useState<InsightWorkoutType[]>([
  ...INSIGHT_WORKOUT_TYPES,
]);
```

Repository conventions:

- Use TypeScript, React 19, Next.js App Router, Tailwind, and existing shadcn
  components.
- Use `Input` from `components/ui/input.tsx`, `Button` from
  `components/ui/button.tsx`, and the existing Select components from
  `components/ui/select.tsx`; do not build replacements.
- Keep functions single-purpose, extract reusable stateful behavior to a custom
  hook, explain only “why” in comments, and remove unused imports
  (`.cursor/rules/coding-conventions.mdc`).
- Tests use Vitest and Testing Library. Model component tests after
  `app/planner/components/date-selector.test.tsx`.
- Domain vocabulary uses “Workout”, “exercise”, “Active days”, and “Historical
  insights”. Do not invent persisted “session” or “streak record” entities.

## Commands

Run from `C:\Development\time-box`.

| Purpose | Command | Expected success |
|---|---|---|
| Focused domain tests | `pnpm exec vitest run lib/__tests__/workout-insights.test.ts` | exit 0; all tests pass |
| UI control tests | `pnpm exec vitest run app/workout-tracker/components/workout-insights-result-controls.test.tsx` | exit 0; all tests pass |
| Full tests | `pnpm test` | exit 0; all tests pass |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0; no diagnostics |
| Targeted lint | See exact command in Phase 5 | exit 0; no diagnostics |

Do not use `pnpm lint` as a phase gate: the repository currently has unrelated
pre-existing lint errors in planner/settings files. Do not fix those errors as
part of this plan.

## Scope

### In scope

- `lib/workout-insights.ts`
- `lib/__tests__/workout-insights.test.ts`
- `app/api/workouts/insights/route.ts`
- `app/workout-tracker/hooks/use-workout-insights.ts`
- `app/workout-tracker/hooks/use-debounced-value.ts` (create)
- `app/workout-tracker/components/workout-insights-filters.tsx`
- `app/workout-tracker/components/workout-insights-result-controls.tsx` (create)
- `app/workout-tracker/components/workout-insights-result-controls.test.tsx`
  (create)
- `app/workout-tracker/components/workout-insights-summary.tsx`
- `app/workout-tracker/components/workout-insights-monthly-trend.tsx` (create)
- `app/workout-tracker/components/workout-insights-monthly-table.tsx`
- `app/workout-tracker/components/historical-insights-sheet.tsx`
- `advisor-plans/README.md` (status only)

### Out of scope

- Prisma schema, migrations, or any persisted workout data changes.
- `app/api/workouts/history/route.ts` and `use-previous-workouts.ts`; that is the
  separate “copy previous workout” flow.
- Changes to the workout editor, calendar, export, or copy-to-day behavior.
- Saving filters across sheet closes or encoding them in the URL.
- New charting, search, debounce, or state-management dependencies.
- Changes to pagination size or replacing offset pagination.
- Fixing unrelated lint errors.
- Replacing the current monthly breakdown design. Only make the smallest prop or
  accessibility adjustment required to place the new trend above it.

## Git workflow

- Suggested branch: `advisor/001-workout-history-insights`
- Use small commits after each green phase. Existing history uses imperative
  messages such as `Improve registration and add workout export`.
- Do not commit, push, or open a PR unless the operator explicitly requests it.
- Preserve unrelated uncommitted files. Stage only files in this plan's scope.

## Phase 1: Extend and test the pure insights contract

This phase must be complete before touching the API or UI.

### 1.1 Add public types

In `lib/workout-insights.ts`:

1. Import `WorkoutSubtaskStatus` as a type from `use-workout-storage`.
2. Export:

```ts
export const INSIGHT_SUBTASK_STATUSES = [
  "completed",
  "pending",
  "error",
] as const satisfies readonly WorkoutSubtaskStatus[];

export type WorkoutInsightSort = "newest" | "oldest" | "name";

export interface WorkoutInsightConsistency {
  workoutsPerWeek: number;
  activeDaysPerWeek: number;
  currentStreak: number;
  longestStreak: number;
}

export interface WorkoutInsightMostActiveMonth {
  monthKey: string;
  total: number;
}
```

Extend `WorkoutInsightFilters` with required fields:

```ts
query: string;
statuses: readonly WorkoutSubtaskStatus[];
sort: WorkoutInsightSort;
```

Do not make these optional. Requiring every caller to be explicit prevents local
and account behavior from silently diverging.

Extend `WorkoutInsights` with:

```ts
consistency: WorkoutInsightConsistency;
mostActiveMonth: WorkoutInsightMostActiveMonth | null;
```

### 1.2 Separate matching, sorting, and aggregation

Refactor `buildWorkoutInsights` into small private helpers:

- `workoutMatchesQuery(entry, normalizedQuery)`
- `workoutMatchesStatuses(entry, statuses)`
- `sortInsightEntries(entries, sort)`
- `calculateConsistency(activeDayKeys, totalEntries, startDate, endDate)`
- `pickMostActiveMonth(monthlyCounts)`

Apply date and type matching first, convert to `WorkoutInsightEntry`, then apply
query and status matching. Only matched entries contribute to type totals,
active days, monthly totals, consistency, and `mostActiveMonth`.

For day arithmetic, parse `YYYY-MM-DD` in UTC or use existing date-key helpers
without local-time conversion. Do not use `new Date("YYYY-MM-DD")` with local
mutations because DST/timezone behavior can create off-by-one streaks.

Sort only after all aggregation is complete. Do not mutate input days, workouts,
subtasks, or filter arrays.

### 1.3 Expand domain tests first

In `lib/__tests__/workout-insights.test.ts`, update all existing filter objects
with defaults:

```ts
query: "",
statuses: ["completed", "pending", "error"],
sort: "newest",
```

Then add tests for:

1. Case-insensitive workout-name search.
2. Case-insensitive exercise-name search.
3. Trimmed empty query behaving as no filter.
4. Status subset matching at least one exercise.
5. All statuses retaining workouts with no exercises.
6. Status subset excluding workouts with no exercises.
7. Newest, oldest, and name sort orders with deterministic ties.
8. Search/status filters affecting summary and monthly totals, not just entries.
9. Workouts-per-week and active-days-per-week over a 14-day range.
10. A range shorter than seven days using a minimum one-week denominator.
11. Current streak ending on `endDate`.
12. Current streak returning zero when `endDate` is inactive.
13. Longest streak across a gap and across a month boundary.
14. Multiple workouts on one day counting once toward streaks.
15. Most-active-month selecting the latest month on a tie.
16. Most-active-month returning null for an all-zero range.
17. Existing immutability test still passing with the new filters.

Use fixed date keys and exact expected numbers. Do not use the system clock.

**Phase 1 verification**:

```powershell
pnpm exec vitest run lib/__tests__/workout-insights.test.ts
```

Expected: exit 0; every old and new domain test passes.

## Phase 2: Carry the contract through account and local data paths

### 2.1 Validate new API parameters

In `app/api/workouts/insights/route.ts`, parse:

- `q`: optional string, trim it, reject over 100 characters with status 400.
- repeated `status`: default to all `INSIGHT_SUBTASK_STATUSES`; reject any
  unknown value; deduplicate while preserving canonical status order.
- `sort`: default `newest`; accept only `newest`, `oldest`, or `name`.

Pass all three values into `buildWorkoutInsights`. Return `consistency` and
`mostActiveMonth` inside `summary`. Do not return internal helpers or duplicate
them at the response root.

Keep filtering and sorting inside `buildWorkoutInsights`; the route should only
validate transport values, load rows, call the domain function, and paginate.

### 2.2 Add debounced query state to the hook

Create `app/workout-tracker/hooks/use-debounced-value.ts`:

- Generic `useDebouncedValue<T>(value: T, delayMs: number): T`.
- Use an effect with `setTimeout` and cleanup with `clearTimeout`.
- State updates must happen in the timer callback, not synchronously in the
  effect body, to satisfy the repository's React lint rules.

In `use-workout-insights.ts`, add:

- `query` state, default `""`.
- `selectedStatuses` state, default all `INSIGHT_SUBTASK_STATUSES`.
- `sort` state, default `"newest"`.
- `debouncedQuery = useDebouncedValue(query, 300)`.
- `setQuery` or a single-purpose `updateQuery` callback.
- `toggleStatus`, preventing the final status from being deselected and
  restoring canonical status order when adding one.
- `setSort`.

Use `debouncedQuery`, statuses, and sort in both paths:

- Local mode: pass them to `buildWorkoutInsights`.
- Account mode: append `q` only when non-empty, append every `status`, and set
  `sort`.
- Initial account request and `loadMore` must use identical parameters.

Extend `WorkoutInsightsSummaryView` with `consistency` and `mostActiveMonth`.
Extend `emptySummary()` with zero rates/streaks and null most-active month.

When the sheet closes, reset query, statuses, and sort alongside the current
date/type reset. Do not implement filter persistence.

The data-loading effect must depend on `debouncedQuery`, statuses, and sort—not
the immediate query—so typing does not request once per keystroke. The input
must still update immediately.

### 2.3 Confirm pagination invariants

Review both account and local `loadMore` implementations:

- Changing search, status, or sort starts over at offset zero.
- `loadMore` retains the active query/status/sort.
- Returned `summary` covers all filtered entries.
- `entries` contains only the requested page.
- `totalEntries` is the filtered total.

**Phase 2 verification**:

```powershell
pnpm exec tsc --noEmit
pnpm exec vitest run lib/__tests__/workout-insights.test.ts
```

Expected: both exit 0 with no diagnostics or failed tests.

## Phase 3: Add search, status, and sort controls

### 3.1 Create a focused result-controls component

Create
`app/workout-tracker/components/workout-insights-result-controls.tsx`.
It must receive controlled props only:

```ts
query: string;
selectedStatuses: WorkoutSubtaskStatus[];
sort: WorkoutInsightSort;
onQueryChange: (value: string) => void;
onToggleStatus: (status: WorkoutSubtaskStatus) => void;
onSortChange: (sort: WorkoutInsightSort) => void;
```

Layout:

- First row: a search `Input` with visible or screen-reader label “Search
  workouts and exercises”, `type="search"`, `maxLength={100}`, and placeholder
  “Search workouts or exercises…”.
- Beside or below it: shadcn `Select` labeled “Sort workouts” with options
  Newest first, Oldest first, and Name A–Z.
- Second row: compact toggle buttons for Completed, Pending, and Missed with
  `aria-pressed`.
- Use the existing Button component for status toggles. Do not add custom
  checkbox primitives.
- Responsive behavior: stack search and sort on narrow screens; keep controls
  usable without horizontal page scrolling.

Keep date presets and workout-type controls in
`workout-insights-filters.tsx`. Do not merge both components into one large
control component.

### 3.2 Add component tests

Create
`app/workout-tracker/components/workout-insights-result-controls.test.tsx`,
modeled after `date-selector.test.tsx`.

Test:

1. Typing invokes `onQueryChange` with the complete input value.
2. Clicking each status invokes `onToggleStatus` with its storage value,
   including Missed → `error`.
3. The selected statuses expose `aria-pressed="true"`.
4. Selecting each sort option invokes `onSortChange` with the correct enum.
5. Search input has `maxLength=100` and an accessible name.

If Radix Select is unreliable in jsdom, mock only
`@/components/ui/select` with a native `<select>` in the same style as the
existing DatePicker mock. Do not remove the sort interaction test.

### 3.3 Compose the controls into the sheet

In `historical-insights-sheet.tsx`:

- Destructure the new state and callbacks from `useWorkoutInsights`.
- Render `WorkoutInsightsResultControls` immediately after
  `WorkoutInsightsFilters`.
- Keep controls visible during loading so the user can refine the query.
- Preserve existing inline error and loading regions.

Do not add duplicated local state in the sheet.

**Phase 3 verification**:

```powershell
pnpm exec vitest run app/workout-tracker/components/workout-insights-result-controls.test.tsx
pnpm exec tsc --noEmit
```

Expected: both exit 0.

## Phase 4: Add consistency cards and monthly trend

### 4.1 Extend the summary presentation

Update `workout-insights-summary.tsx` to render seven metrics:

- Workout entries
- Active days
- Workouts / week
- Active days / week
- Current streak
- Longest streak
- Most frequent type

Formatting:

- Rates: one decimal, e.g. `2.5`.
- Streaks: `1 day` or `N days`.
- Keep values as text, not progress rings or gauges.
- Use a responsive grid: two columns on small screens and enough columns on
  wider sheet sizes to avoid seven full-width rows.
- Do not hide zero values; zero is meaningful.

If the component becomes hard to read, extract a pure `formatStreak` helper in
the same file. Do not introduce a generic metrics framework.

### 4.2 Create the trend component

Create
`app/workout-tracker/components/workout-insights-monthly-trend.tsx`.
Props:

```ts
monthlyCounts: WorkoutInsightMonthlyCount[];
selectedTypes: InsightWorkoutType[];
mostActiveMonth: WorkoutInsightMostActiveMonth | null;
```

Design:

- A bordered card titled “Activity trend”.
- Header callout on the right:
  `Most active: Mar 2026 · 12 workouts`, or `No activity in this range`.
- A compact vertical bar chart using semantic HTML/CSS only—no chart package
  and no canvas.
- One neutral/primary-colored bar per month showing that month's total across
  selected types. Do not segment by type; the monthly heatmap below already
  provides type detail.
- Scale bars against the highest visible monthly total.
- Preserve zero months as empty tracks.
- Show abbreviated month labels. Include year when the range spans multiple
  years, or provide the full month/year in accessible text and `title`.
- If there are more than 12 months, use a horizontally scrollable inner region
  with a minimum width per month; never squeeze labels into illegibility.
- Every bar needs an accessible name such as “March 2026: 12 workouts”.
- Respect the existing light/dark theme classes. Do not add animation.

Use `selectedTypes.reduce(...)` rather than `row.total`, because `row.total`
could include types hidden by the active filter in future callers.

### 4.3 Place the trend without replacing detail

In `historical-insights-sheet.tsx`, render in this order after loading:

1. `WorkoutInsightsSummary`
2. `WorkoutInsightsMonthlyTrend`
3. `WorkoutInsightsMonthlyTable`
4. `WorkoutInsightsList`

Pass `summary.monthlyCounts`, `selectedTypes`, and
`summary.mostActiveMonth` to the trend.

Do not redesign the heatmap in this phase. If
`workout-insights-monthly-table.tsx` needs no contract change, leave it
untouched.

**Phase 4 verification**:

```powershell
pnpm exec tsc --noEmit
pnpm exec vitest run lib/__tests__/workout-insights.test.ts app/workout-tracker/components/workout-insights-result-controls.test.tsx
```

Expected: exit 0 with all tests passing.

## Phase 5: Integration verification and cleanup

### 5.1 Run automated gates

Run:

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm exec eslint `
  lib/workout-insights.ts `
  lib/__tests__/workout-insights.test.ts `
  app/api/workouts/insights/route.ts `
  app/workout-tracker/hooks/use-workout-insights.ts `
  app/workout-tracker/hooks/use-debounced-value.ts `
  app/workout-tracker/components/historical-insights-sheet.tsx `
  app/workout-tracker/components/workout-insights-filters.tsx `
  app/workout-tracker/components/workout-insights-result-controls.tsx `
  app/workout-tracker/components/workout-insights-result-controls.test.tsx `
  app/workout-tracker/components/workout-insights-summary.tsx `
  app/workout-tracker/components/workout-insights-monthly-trend.tsx `
  app/workout-tracker/components/workout-insights-monthly-table.tsx
```

Expected: all three commands exit 0.

### 5.2 Manually verify both storage modes

Run `pnpm dev`, then verify:

1. Guest/local mode:
   - Open Historical Insights.
   - Search by workout name and by exercise name.
   - Toggle each status and confirm results/metrics/trend change.
   - Change every sort option and load more if available.
2. Authenticated/account mode:
   - Repeat the same checks.
   - In browser network tools, confirm `q`, repeated `status`, and `sort` are
     sent, including on load-more requests.
3. Use a custom date range ending on an inactive day and confirm current streak
   is zero.
4. Use a range with zero activity and confirm the trend empty state and null
   most-active callout.
5. Close and reopen the sheet; confirm all new controls reset to defaults.
6. At narrow mobile width, confirm controls stack and chart/table content scrolls
   inside the sheet rather than widening the page.
7. Keyboard-tab through the search, sort, status toggles, date controls, and
   workout rows; confirm visible focus and accessible labels.

Do not create artificial production data to satisfy this check. Use existing
local/account records; if a required case is unavailable, report which manual
case could not be exercised.

### 5.3 Check scope

Run:

```powershell
git status --short
```

Confirm every new modification made by this implementation is listed under
“In scope”. Preserve all unrelated pre-existing changes.

Update the row in `advisor-plans/README.md` from `TODO` to `DONE`.

## Done criteria

All must hold:

- [ ] Search matches workout and exercise names case-insensitively.
- [ ] Status filtering follows the all-selected/subset semantics exactly.
- [ ] Newest, oldest, and name sorting work before pagination.
- [ ] Local and account paths produce equivalent results.
- [ ] Consistency metrics follow the stated formulas and streak boundaries.
- [ ] Most-active-month tie behavior is tested and deterministic.
- [ ] Trend preserves zero months and is accessible without relying on color.
- [ ] Existing detailed monthly breakdown remains below the trend.
- [ ] No persistence or database schema changed.
- [ ] No new dependency was added.
- [ ] Focused tests, full tests, typecheck, and targeted lint all exit 0.
- [ ] No unrelated source file was modified.
- [ ] `advisor-plans/README.md` status is `DONE`.

## STOP conditions

Stop and report back if:

- The workout-insights files are missing or their domain/API shapes differ from
  the Current state excerpts beyond the known monthly visual experiment.
- Implementing search/status filtering appears to require a Prisma migration.
- The account endpoint can no longer load the complete selected date range
  before pagination; this plan assumes filtering occurs before slicing.
- Guest and account data use different workout/subtask shapes.
- A new sort option or filter semantics are requested mid-implementation.
- The user wants filter persistence or URL sharing; those were explicitly
  excluded and need a separate plan.
- A verification command fails twice after one focused correction.
- Correct implementation requires touching an out-of-scope source file.
- Existing data contains invalid date keys that make streak calculations
  ambiguous; report examples by location/type without exposing private workout
  contents.

## Maintenance notes

- The API currently loads and parses all workout-day JSON in the selected date
  range before filtering and pagination. This is acceptable for this plan but
  should be revisited if account histories become large.
- Search and status semantics live in `buildWorkoutInsights`; do not duplicate
  them in the route or UI.
- Any future pagination redesign must preserve “filter and sort before page”.
- Any future workout status must update the canonical status constant, route
  validation, controls, and tests together.
- Reviewers should pay special attention to DST-safe streak arithmetic,
  deterministic sorting, load-more parameter parity, and whether no-exercise
  workouts remain visible when all statuses are selected.

