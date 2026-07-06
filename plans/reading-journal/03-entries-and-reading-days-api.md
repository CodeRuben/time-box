# Phase 3 — Entries and Reading Days API

Prerequisites: Phases 1–2. Read `plans/reading-journal/README.md` for decisions.

Both routes follow the same skeleton as `app/api/books/[id]/route.ts`: `requireFeatureUser("reading-journal", ...)` first, then load the parent book and 404 when missing or owned by another user. Validate the `date` route param with `isValidDateParam` from `lib/book-api-helpers.ts` (400 on bad format).

## 1. Entry route — `app/api/books/[id]/entries/[date]/route.ts`

At most one Entry exists per Book per date (`@@unique([bookId, date])`), so the API is an upsert keyed by date — no entry IDs in URLs.

- **PUT** — upsert the Entry for that date. Validate body with `validateEntryBody`. Upsert:

```typescript
const entry = await prisma.readingEntry.upsert({
  where: { bookId_date: { bookId: book.id, date } },
  update: validated,
  create: {
    bookId: book.id,
    userId: access.userId,
    date,
    currentPage: validated.currentPage ?? null,
    summary: validated.summary ?? "",
    analysis: validated.analysis ?? "",
    thoughts: validated.thoughts ?? "",
  },
});
```

Respond `{ data: BookEntry }` (format dates to ISO strings like `formatTask` does).

Notes:
- Do NOT validate `currentPage` against other entries or `totalPages` — backwards movement and overshoot are allowed by design.
- Do NOT touch `ReadingDay` — writing an Entry never ticks the day (see CONTEXT.md "Reading Day").

- **DELETE** — delete the Entry for that date. If none exists, respond 404 `{ error: "Entry not found" }`. Otherwise `{ data: { date } }`.

## 2. Reading Day route — `app/api/books/[id]/days/[date]/route.ts`

A Reading Day is a bare tick — the row's existence is the fact.

- **PUT** — tick the day. Use `upsert` with an empty `update: {}` so repeat ticks are idempotent (200 both times). Respond `{ data: { date } }`.
- **DELETE** — untick. Use `deleteMany({ where: { bookId: book.id, date } })` so unticking a never-ticked day is also idempotent — respond `{ data: { date } }` regardless of count.

No date-range restrictions: the user may tick days before `startedOn` or after `finishedOn`; the UI decides what range to show.

## 3. Shared route helper (optional but preferred)

Both files (and `app/api/books/[id]/route.ts`) repeat "auth → load book → check ownership". Extract `requireOwnedBook(bookId: string)` into `lib/book-api-helpers.ts` returning `{ book } | { response }` in the style of `requireFeatureUser`, and refactor all three route files to use it. Keep it free of validation logic (single responsibility).

## Verification

1. `npm run lint` and `npm run test` pass.
2. Manual API checks while signed in (create a book first via `POST /api/books`):
   - `PUT /api/books/[id]/entries/2026-07-04` with `{ "currentPage": 50, "summary": "..." }` → 200; repeat with `{ "currentPage": 30 }` → 200 and overwrites (backwards allowed).
   - `PUT` with date param `2026-7-4` → 400.
   - `GET /api/books/[id]` shows the entry, `currentPage: 30`.
   - `DELETE` the entry twice → 200 then 404.
   - `PUT /api/books/[id]/days/2026-07-04` twice → 200 both times; `DELETE` twice → 200 both times.
   - Ticking a day does not create an Entry; `GET /api/books/[id]` shows `readingDays: ["2026-07-04"]` with `entries` unchanged.
   - All of the above against a book ID owned by another user (or a random cuid) → 404.
