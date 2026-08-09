# Workout Insights Implementation Plans

Generated on 2026-08-07. This directory is used because the repository's existing
`plans/` directory contains unrelated product plans.

Read the selected plan completely before editing source code. Follow every phase
in order, run each verification gate, and stop on the listed STOP conditions
instead of expanding scope.

## Execution order and status

| Plan | Title | Priority | Effort | Depends on | Status |
|---|---|---:|---:|---|---|
| 001 | Add actionable workout-history insights and controls | P1 | L | — | DONE |

Status values: TODO, IN PROGRESS, DONE, BLOCKED, or REJECTED.

## Dependency notes

Plan 001 is intentionally phased. Its pure calculation and filtering contracts
must land before the API, hook, and UI phases that consume them.

