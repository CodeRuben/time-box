# Phase 1 — Types, player data, and enrichment

Prerequisites: none. Read `plans/mock-draft/README.md` first — the type definitions and constants there are final.

## 1. Types and constants — `lib/mock-draft/types.ts`

Create the file with, exactly as specified in the README:

- `Position`, `Player`, `ArchetypeId`, `DraftConfig`, `DraftTeam`, `DraftPick`, `DraftStatus`, `DraftState` types.
- `TOTAL_ROUNDS`, `STARTER_SLOTS`, `BENCH_SIZE`, `POSITION_CAPS`, `KICKER_DST_EARLIEST_ROUND` constants.
- Additional constants:

```typescript
export const TEAM_COUNT_OPTIONS = [8, 10, 12] as const;
export const TIMER_OPTIONS = [30, 60, 90, 120] as const;
export const STORAGE_KEY = "mock-draft";

export const BOT_NAMES = [
  "Kino", "Jack Torrence", "Jason Dessen", "Colin", "Odysseus",
  "Clive Linley", "Kolya Vlasov", "Todd Bowden", "Leonard Marnham",
  "Stuart Ullman", "Gordie LaChance", "Lev Beniov",
] as const;
```

No React imports anywhere in `lib/mock-draft/`.

## 2. Bye weeks — part of `lib/mock-draft/players.ts`

The 2026 bye table below is **verified against the official 2026 NFL schedule release — copy it verbatim, do not regenerate it from memory**:

```typescript
// 2026 NFL bye weeks (byes run weeks 5-14; no byes in week 12).
export const BYE_WEEKS: Record<string, number> = {
  CAR: 5, KC: 5,
  CIN: 6, DET: 6, MIA: 6, MIN: 6,
  BUF: 7, JAX: 7, LAC: 7, WAS: 7,
  HOU: 8, NO: 8, NYG: 8, SF: 8,
  PIT: 9, TEN: 9,
  CHI: 10, DEN: 10, PHI: 10, TB: 10,
  ATL: 11, CLE: 11, GB: 11, LAR: 11, NE: 11, SEA: 11,
  BAL: 13, IND: 13, LV: 13, NYJ: 13,
  ARI: 14, DAL: 14,
};
```

All 32 teams, abbreviations exactly as above. `Player.nflTeam` values must be keys of this record; `Player.bye` must equal `BYE_WEEKS[nflTeam]`.

## 3. Player pool — `lib/mock-draft/players.ts`

Export `export const PLAYERS: Player[]` containing **228 entries**: the 200 players from `docs/2026-full-ppr-top-200.md` (ranks 1–200, in that exact order, names spelled exactly as in the doc) plus 28 extension entries (ranks 201–228, section 4 below).

- `id` = `rank`.
- `position` comes from the doc's `Pos` column.
- For DST entries, `name` is the franchise name as written in the doc (e.g. `"Houston Texans"`), and `nflTeam` is that franchise's abbreviation.
- Ignore the doc's "12-team round" column — it is not stored.

### NFL team assignment — MUST be verified, not recalled

The board contains 2026 rookies and players who changed teams in the 2025–2026 offseason (for example, A.J. Brown is on **NE**, not PHI, per July 2026 rankings). **Do not assign teams from memory.** Instead:

1. Fetch the FantasyPros 2026 PPR rankings positional pages, which list every player as `Name (POS - TEAM)`:
   - `https://www.fantasypros.com/nfl/rankings/ppr-cheatsheets.php` (overall), and/or per-position pages `https://www.fantasypros.com/nfl/rankings/qb-cheatsheets.php`, `ppr-rb-cheatsheets.php`, `ppr-wr-cheatsheets.php`, `ppr-te-cheatsheets.php`, `k.php`, `dst.php`.
2. Match each of our 200 names against those listings (watch suffix variants: FantasyPros may list "James Cook III" for our "James Cook" — match on the doc's spelling, keep the doc's spelling in `name`).
3. If a player cannot be found on FantasyPros, run a targeted web search: `"<player name>" 2026 fantasy team`.
4. Normalize FantasyPros abbreviations to the `BYE_WEEKS` keys above (they already match: ARI, ATL, BAL, BUF, CAR, CHI, CIN, CLE, DAL, DEN, DET, GB, HOU, IND, JAX, KC, LAC, LAR, LV, MIA, MIN, NE, NO, NYG, NYJ, PHI, PIT, SEA, SF, TB, TEN, WAS).

If web access is unavailable during implementation, stop and report — do not fill teams from memory.

## 4. Extension entries (ranks 201–228)

A 12-team draft needs 12 K and 12 DST, but the top 200 contains only 6 K and 4 DST. Append, in this order:

- **Ranks 201–210 — 10 DST entries** (bringing DST total to 14). Use these franchises: PIT, BAL, PHI, MIN, BUF, KC, GB, DET, SF, NYJ. `name` = full franchise name (e.g. `"Pittsburgh Steelers"`).
- **Ranks 211–218 — 8 K entries** (bringing K total to 14). Use the projected 2026 starting kickers for these franchises, in this order: DET, TB, BAL, KC, CIN, DEN, LAR, MIA. Verify the actual kicker names the same way as section 3 (FantasyPros `k.php` page); do not guess.

These are late-draft filler; exact ordering among them is unimportant, but ranks must stay contiguous.

## 5. Markdown doc parsing

Do the conversion however is convenient (a throwaway script or careful manual transcription), but the checked-in artifact is the static `players.ts` — no runtime markdown parsing, no build step. Preserve exact name spellings including apostrophes and periods (`Ja'Marr Chase`, `Amon-Ra St. Brown`, `D'Andre Swift`).

## 6. Data integrity tests — `lib/__tests__/mock-draft-players.test.ts`

Follow the style of existing tests in `lib/__tests__/`. Assert:

- `PLAYERS.length === 228`; ranks are exactly `1..228` in order; `id === rank` for all.
- Every `position` is one of the six `Position` values.
- Position counts: QB 27, RB 61, WR 76, TE 26, K 14, DST 14.
- Every `nflTeam` is a key of `BYE_WEEKS`; every `bye === BYE_WEEKS[nflTeam]`; every bye is in 5–14 and ≠ 12.
- `BYE_WEEKS` has exactly 32 keys.
- All 228 `id`s are unique and all `(name, position)` pairs are unique.
- No two DST entries share an `nflTeam`, and no two K entries share an `nflTeam`. When building the section-4 extension lists, if a franchise would collide with an already-ranked K/DST entry (e.g. HOU's kicker is already rank 197), substitute a different franchise so this invariant holds, and note the substitution in a comment.
- Spot-check rank 1 is `Jahmyr Gibbs` (RB) and rank 200 is `Eddy Pineiro` (K).

## 7. Vocabulary — `CONTEXT.md`

Add a `### Mock Draft` section to the Language section defining: **Board** (the ranked player list), **Pick** (one selection: overall number, round, slot, player), **Slot** (a team's draft position, 1-based), **On the Clock** (the team whose turn it is), **Archetype** (a bot's drafting personality), **Best Available** (undrafted players ordered by rank), **Grade** (post-draft letter score). Follow the existing entry format (term, definition, `_Avoid_` line where useful).

## Verification

1. `pnpm lint` passes.
2. `pnpm test` passes, including `mock-draft-players.test.ts`.
3. No UI, no feature registration, nothing outside `lib/mock-draft/`, `lib/__tests__/`, and `CONTEXT.md` was touched.
4. Manually spot-check 5 random players' team + bye against FantasyPros.
