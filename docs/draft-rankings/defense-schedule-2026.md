# 2026 defense schedule snapshot

Snapshot date: September 1, 2026

This document records how the regular-season schedule used for defense strength-of-schedule is sourced, validated, and frozen for the Draft Rankings Board.

## Decision

The schedule is imported once and checked into source control. The app does not fetch live schedule data at runtime, and there is no cron job or in-season refresh for this feature.

## Source

Primary import source: ESPN site scoreboard API, one request per regular-season week.

```
https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week={week}&dates=2026
```

Parameters:

- `seasontype=2` — regular season
- `week=1` through `week=18`
- `dates=2026` — season year scope

Each event contributes one game with `homeTeam` and `awayTeam`.

## Normalization

ESPN abbreviations are mapped to repository team codes before validation:

| ESPN | Repository |
| --- | --- |
| WSH | WAS |

All other team codes match the `NFL_TEAMS` list in `lib/draft-rankings/types.ts`.

## Validation

The importer fails unless all checks pass:

- exactly 272 unique regular-season games
- weeks 1 through 18 are all represented
- every team appears in exactly 17 games
- every team has exactly one missing week (inferred bye)
- no team plays itself

Generated output: `lib/draft-rankings/nfl-schedule-2026.ts`

## Defense schedule difficulty

The schedule snapshot is combined with the preseason offense projections in
`lib/draft-rankings/player-signal-data.ts`.

- A matchup against a Good, Mid, or Bad projected offense is respectively
  Hard, Average, or Easy for a fantasy defense.
- A team’s season strength is the mean projected points per game of its 17
  opponents. Repeat opponents count once for each scheduled game.
- The 32 schedules are ordered from highest to lowest mean opponent scoring.
  Ties use the repository team code alphabetically for a deterministic order.
  Ranks 1–10 are Hard, 11–22 Average, and 23–32 Easy.

## Manual cross-check

After generation, spot-check the snapshot against the official NFL schedule:

- [NFL.com 2026 team schedules](https://www.nfl.com/schedules/2026/by-team)
- [NFL Football Operations 2026 schedule announcement](https://nfl-ops-prod-umbraco-author.azurewebsites.net/news-updates/the-game/2026-nfl-schedule-announced/)

Recommended spot checks:

- Week 1 opening matchup: `NE @ SEA`
- bye weeks for board defenses such as `HOU`, `DEN`, and `PHI`
- Week 18 divisional opponents for a few teams

## Regeneration

Run from the repository root:

```bash
node scripts/import-2026-nfl-schedule.mjs
```

A second run should produce an identical `nfl-schedule-2026.ts` file when the source data has not changed.

If ESPN and NFL.com disagree, do not hand-edit generated games. Fix normalization or source handling in the importer, then regenerate and revalidate.
