# Phase 1 — Prisma schema and domain helpers

Prerequisites: none. Read `plans/reading-journal/README.md` first for decisions and the final data model.

## 1. Prisma schema

In `prisma/schema.prisma`:

- Add `books Book[]` to the `User` model's relation list.
- Add the three models exactly as specified in the README's "Data model (final)" section: `Book`, `ReadingEntry`, `ReadingDay`.

Conventions to preserve (copy the style of the existing `Task` model):

- String IDs with `@default(cuid())`.
- Enum-like values are plain `String` columns with a comment noting valid values; validation happens at the API boundary, not in the DB.
- Dates that mean "a calendar day" are `String` in `YYYY-MM-DD` format (matches `PlannerDay.date` / `WorkoutDay.date`).
- `onDelete: Cascade` from `Book` to `User`, and from `ReadingEntry`/`ReadingDay` to `Book`.

Run the migration:

```
npx prisma migrate dev --name add_reading_journal --config ./prisma.config.ts
```

(If `DATABASE_URL` is not set, copy `.env.example` values into `.env` first.)

## 2. Types — `lib/reading-journal-types.ts`

```typescript
export type BookStatus = "reading" | "finished" | "abandoned";

export interface BookEntry {
  id: string;
  date: string; // YYYY-MM-DD
  currentPage: number | null;
  summary: string;
  analysis: string;
  thoughts: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookSummaryView {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  totalPages: number | null;
  status: BookStatus;
  rating: number | null; // 1-10 half-star scale, null = unrated
  currentPage: number | null; // derived from latest entry
  startedOn: string | null;
  finishedOn: string | null;
}

export interface BookDetailView extends BookSummaryView {
  publishedYear: number | null;
  openLibraryKey: string;
  notes: string;
  entries: BookEntry[]; // sorted by date descending
  readingDays: string[]; // YYYY-MM-DD strings, the ticked days
  createdAt: string;
  updatedAt: string;
}
```

## 3. Validation helpers — `lib/book-api-helpers.ts`

Follow the exact pattern of `lib/task-api-helpers.ts` (validate `unknown` → typed body or `{ error, status }` object; export an `isValidationError` guard).

Implement:

- `validateBookBody(raw: unknown, { requireTitle }: { requireTitle: boolean })` — accepts partial bodies with fields: `title` (non-empty trimmed string when present or required), `author` (string), `coverUrl` (string; empty string or a string starting with `http://`/`https://`), `totalPages` (positive integer or null), `publishedYear` (integer or null), `openLibraryKey` (string), `status` (one of `reading | finished | abandoned`), `rating` (integer 1–10 or null), `notes` (string), `startedOn` / `finishedOn` (`YYYY-MM-DD` string or null — validate with a regex `/^\d{4}-\d{2}-\d{2}$/`).
- `validateEntryBody(raw: unknown)` — fields: `currentPage` (non-negative integer or null), `summary`, `analysis`, `thoughts` (strings, trimmed). All optional; missing string fields default to `""`.
- `isValidDateParam(value: string)` — the `YYYY-MM-DD` regex check, exported for route handlers.

## 4. Derivation helpers — `lib/reading-progress.ts`

Pure functions (no Prisma imports):

- `getCurrentPage(entries: Array<{ date: string; currentPage: number | null }>): number | null` — the `currentPage` of the entry with the greatest `date` that has a non-null `currentPage`. Current Page may legitimately decrease between entries; do not clamp or sort-filter beyond "latest by date wins".
- `getProgressPercent(currentPage: number | null, totalPages: number | null): number | null` — `null` when either input is null or `totalPages <= 0`; otherwise `Math.min(100, Math.round((currentPage / totalPages) * 100))`.
- `getPagesReadByDate(entries: Array<{ date: string; currentPage: number | null }>): Map<string, number>` — sort entries by date ascending, diff consecutive non-null `currentPage` values; the first entry's pages-read equals its `currentPage`. Negative diffs (user moved backwards) produce `0` for that day.
- `formatRating(rating: number | null): string` — e.g. `7` → `"3.5"`, `10` → `"5"`, `null` → `""` (used for display).

## 5. Tests — `lib/__tests__/reading-progress.test.ts` and `lib/__tests__/book-api-helpers.test.ts`

Follow the style of existing tests in `lib/__tests__/`. Cover at minimum:

- `getCurrentPage`: empty list, single entry, latest-date wins regardless of array order, entries with null `currentPage` skipped, backwards movement (latest still wins).
- `getProgressPercent`: normal case, null inputs, zero total, currentPage > totalPages caps at 100.
- `getPagesReadByDate`: first-entry baseline, consecutive diffs, negative diff → 0, null pages skipped.
- `validateBookBody`: requireTitle enforcement, invalid status rejected, rating 0 and 11 rejected, rating null accepted, bad date format rejected, valid full body passes.
- `validateEntryBody`: negative currentPage rejected, all-empty body valid, non-string summary rejected.

## Verification

1. `npx prisma migrate dev` ran cleanly and `generated/prisma` contains the new models.
2. `npm run lint` passes.
3. `npm run test` passes, including the new test files.
4. No UI or API routes were touched in this phase.
