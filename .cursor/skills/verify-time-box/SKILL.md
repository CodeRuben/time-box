---
name: verify-time-box
description: Drive the Timeboxing Planner web app locally — planner, workouts, book log, and sign-in. Use when you need to prove UI behavior end-to-end, capture verification artifacts, or debug user-facing flows in this repo.
---

# Verify Timeboxing Planner

Scripted verification for the **Timeboxing Planner** Next.js app. Primary surface is the **web UI** at a disposable local dev server. Secondary surfaces: authenticated API routes (via browser session) and Vitest unit tests (not covered here).

## Launch

Start an isolated instance (separate port and SQLite file from your normal dev session):

```bash
node .cursor/skills/verify-time-box/control-time-box.mjs launch --run-id <RUN_ID> --port 3847
```

- Default port `3847` avoids clashing with `pnpm dev` on `3000`.
- State and DB live under `.cursor/skills/verify-time-box/scratch/<RUN_ID>/`.
- Admin seed credentials default to `verify@time-box.local` / `verify-pass-12` (override with `TIME_BOX_VERIFY_ADMIN_EMAIL` / `TIME_BOX_VERIFY_ADMIN_PASSWORD`).
- Ready when `http://127.0.0.1:<port>` responds. Dev logs: `scratch/<RUN_ID>/dev.log`.

Export `TIME_BOX_VERIFY_RUN_ID=<RUN_ID>` in the shell for later commands.

**Teardown** (never kill by process name):

```bash
node .cursor/skills/verify-time-box/control-time-box.mjs stop --run-id <RUN_ID>
```

Optionally delete `scratch/<RUN_ID>/` after stop. **Do not** delete `artifacts/<RUN_ID>/` during cleanup.

## Doctor

Read-only health check before driving:

```bash
node .cursor/skills/verify-time-box/control-time-box.mjs doctor --run-id <RUN_ID>
```

Requires: state file present, dev `pid` alive, HTTP OK, HTML contains `Daily Timeboxing Planner` or `Timeboxing Planner`.

Never drive an instance you did not launch in this verification run.

## Drive

Use the **cursor-ide-browser** MCP against `baseUrl` from doctor output.

Workflow:

1. `browser_navigate` to the target route.
2. `browser_lock` before multi-step interaction.
3. `browser_snapshot` for ARIA refs before clicks/fills.
4. Prefer stable handles: `aria-label`, button/link names, `placeholder`, headings.
5. For React controlled inputs (priority name, working notes), use `browser_type` — `browser_fill` does not update React state.
5. `browser_take_screenshot` and snapshot text for evidence.
6. `browser_lock` unlock when finished.

Guest planner data persists in **browser localStorage** for the active tab profile. Reuse the same browser tab for persistence checks. Do not attach to a dev server on port `3000` while verifying — that is the user's session.

Authenticated flows: sign in at `/login` with seeded admin credentials, then drive. Signed-in planner autosaves to the verification database via `/api/planner`.

## Evidence

Store proof under `.cursor/skills/verify-time-box/artifacts/<RUN_ID>/`:

- ARIA snapshot text file (`.aria.txt` or snapshot dump).
- Screenshot (`.png`) showing app chrome (header or `Daily Timeboxing Planner` heading). `browser_take_screenshot` accepts a simple filename only; copy from the temp screenshots folder into `artifacts/<RUN_ID>/` if needed.
- Note feature ID and entry point in a sibling `proof.json` or filename.

Proof standards:

- Exercise the real user path (clicks, typing, navigation), not internal setters.
- Capture the action and resulting state (before/after refresh when persistence matters).
- For mutations, confirm side effects: visible UI state plus reload or second view when applicable.
- Read the feature map before driving; a proof that only hits one entry point is incomplete when the map lists others.

## Cleanup

After capturing evidence:

```bash
node .cursor/skills/verify-time-box/control-time-box.mjs stop --run-id <RUN_ID>
```

Confirm artifacts still exist under `artifacts/<RUN_ID>/`. Remove scratch DB and logs if disk cleanup is needed.

## Helpers

| Command | Purpose |
| --- | --- |
| `node .cursor/skills/verify-time-box/control-time-box.mjs launch --run-id <id> [--port n]` | Migrate DB, seed admin, start dev server |
| `node .cursor/skills/verify-time-box/control-time-box.mjs doctor --run-id <id>` | Health JSON |
| `node .cursor/skills/verify-time-box/control-time-box.mjs stop --run-id <id>` | Stop launched server |
| `node .cursor/skills/verify-time-box/control-time-box.mjs print-env --run-id <id>` | Instance JSON |

## Feature map

Read [features/README.md](./features/README.md) before driving. Each feature file is a recipe from the user's point of view.

Maintain the map with `/maintain-verification-skill` when UI routes or labels change.
