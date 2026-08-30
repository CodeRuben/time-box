# Timeboxing Planner verification map

Maintained source for user-facing verification. Read this index before driving the app, then open the matching feature file.

## Baseline preconditions

- Launch with `control-time-box.mjs launch --run-id <RUN_ID> --port 3847`.
- Set `TIME_BOX_VERIFY_RUN_ID=<RUN_ID>` for doctor/stop commands.
- Run `control-time-box doctor` and require `ok: true`, expected `baseUrl`, and disposable `databasePath` under `scratch/<RUN_ID>/`.
- Put artifacts in `artifacts/<RUN_ID>/`.
- Never drive `http://localhost:3000` or another developer's running instance.

## Driving conventions

- Start from baseline unless a feature's preconditions say otherwise.
- Prefer ARIA roles and accessible names over CSS selectors.
- Use cursor-ide-browser: navigate → lock → snapshot → interact → screenshot.
- Guest planner state is in browser localStorage; use the same tab for reload checks.
- Signed-in flows use seeded `verify@time-box.local` / `verify-pass-12` unless overridden at launch.
- Restore mutated planner data when the feature file says to; keep proof artifacts.

## Proof and skip reporting

- Capture the user action and resulting state, not only the final screen.
- UI proof: ARIA snapshot + screenshot with header or main heading visible.
- Record feature ID and entry point with every artifact.
- Report unreachable paths with the attempted step and unmet precondition.
- Do not claim a skipped entry point was verified via a different path.

## Feature entry contract

Each feature file uses H1 title, one intro paragraph, then four H2 sections in order: `Sub-features`, `How to get to it (user POV)`, `Driving it with cursor-ide-browser`, `Gotchas`.

## Features

### Planner

- [Planner top priority](./planner-top-priority.md) — add and persist a guest priority.
- [Planner focus item](./planner-focus-item.md) — add a focus list item.
- [Working notes](./working-notes.md) — edit brain dump text for the day.

### App chrome

- [Sign in](./sign-in.md) — credentials login and account menu.
- [Navigate features](./navigate-features.md) — primary nav between Planner, Workouts, and Book log.
- [Theme controls](./theme-controls.md) — light/dark toggle and persistence.
- [Autosave](./autosave.md) — signed-in save indicators on planner, workouts, and book notes.

### Workouts

- [Workout tracker](./workout-tracker.md) — add, name, and clear workouts for a day.
- [Workout insights](./workout-insights.md) — historical insights sheet and filters.

### Book log

- [Book log](./book-log.md) — library list and add a book (signed-in).
- [Book detail](./book-detail.md) — reading days, notes, and reflections on a book page.

## Surfaces not yet mapped

- **Settings** (`/settings`) — feature flags and account preferences.
- **Workout export** — CSV export dialog on the tracker page.
- **Registration** (`/register`) — new account creation when enabled.
