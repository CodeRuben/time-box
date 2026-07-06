# Phase 2 — Feature registration, Books API, and Open Library search proxy

Prerequisites: Phase 1 (schema + helpers). Read `plans/reading-journal/README.md` for decisions.

## 1. Register the feature — `lib/features.ts`

Add to the `FEATURES` array (after `workouts`):

```typescript
{
  key: "reading-journal",
  label: "Reading Journal",
  description: "Track books, daily reading entries, and progress.",
  href: "/reading-journal",
  kind: "page",
  defaults: {
    adminEnabled: true,
    userEnabled: true,
    guestEnabled: false, // signed-in only — see docs/adr/0001
  },
},
```

Nothing else is needed: navigation, the settings page, and `FeatureGate` all derive from `FEATURES`. Existing DB `FeatureFlag` rows are matched by key, so a missing row falls back to these defaults.

## 2. Books collection route — `app/api/books/route.ts`

Copy the structure of `app/api/tasks/route.ts`. Every handler starts with:

```typescript
const access = await requireFeatureUser("reading-journal", "Reading journal is disabled");
if (access.response) return access.response;
```

- **GET** — list the user's books for the card grid. Query:

```typescript
const books = await prisma.book.findMany({
  where: { userId: access.userId },
  orderBy: { updatedAt: "desc" },
  include: {
    entries: { select: { date: true, currentPage: true } },
  },
});
```

Map each row to a `BookSummaryView` (`lib/reading-journal-types.ts`), computing `currentPage` with `getCurrentPage` from `lib/reading-progress.ts`. Do not send entry bodies in the list response. Respond `{ data: BookSummaryView[] }`.

- **POST** — create a book. Parse JSON (400 on invalid JSON, matching the tasks route), validate with `validateBookBody(raw, { requireTitle: true })`. Create with defaults: `status` defaults to `"reading"`, `startedOn` defaults to today's local date (`format(new Date(), "yyyy-MM-dd")` from `date-fns`) when not provided. Respond `{ data }` with status 201.

## 3. Book item route — `app/api/books/[id]/route.ts`

Follow `app/api/tasks/[id]/route.ts` for the params/ownership pattern. All handlers: load the book by `id`, return 404 if missing **or** if `book.userId !== access.userId` (do not leak existence).

- **GET** — return a `BookDetailView`: include `entries` (ordered `date: "desc"`) and `readingDays` (map rows to their `date` strings, ordered ascending). Compute `currentPage` via `getCurrentPage`.
- **PATCH** — partial update. Validate with `validateBookBody(raw, { requireTitle: false })`. Only write fields present in the validated body. This route handles: status changes, rating, notes, cover URL edits, total pages, start/end dates, title/author fixes. No side effects between fields (e.g. setting status to `finished` does NOT auto-set `finishedOn` — the UI sends both explicitly if the user wants that).
- **DELETE** — delete the book; entries and reading days cascade via the schema. Respond `{ data: { id } }`.

## 4. Open Library search proxy — `app/api/book-search/route.ts`

**GET** with query param `q`. Guard with the same `requireFeatureUser` call.

- Empty/missing `q` (after trim): respond `{ data: [] }`.
- Call Open Library server-side:

```
https://openlibrary.org/search.json?q=<encoded q>&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i&limit=10
```

- Use `fetch` with `next: { revalidate: 86400 }` so repeated searches hit the Next.js data cache, and set a `User-Agent` header identifying the app (Open Library asks for this): `"time-box reading journal (personal project)"`.
- Map each doc to:

```typescript
interface BookSearchResult {
  openLibraryKey: string;   // doc.key, e.g. "/works/OL45883W"
  title: string;            // doc.title
  author: string;           // doc.author_name?.join(", ") ?? ""
  publishedYear: number | null; // doc.first_publish_year ?? null
  totalPages: number | null;    // doc.number_of_pages_median ?? null
  coverUrl: string;         // doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : ""
}
```

- Respond `{ data: BookSearchResult[] }`. If the upstream fetch fails or returns non-OK, respond 502 with `{ error: "Book search is unavailable" }` — the UI falls back to manual entry.
- Put the doc-mapping function in `lib/book-search.ts` as a pure function over a typed `OpenLibraryDoc` interface, and unit-test it in `lib/__tests__/book-search.test.ts` (missing cover, missing authors, missing pages).

## Verification

1. `npm run lint` and `npm run test` pass.
2. With the dev server running and signed in (`npm run dev`; register or use the seeded admin):
   - `GET /api/books` returns `{ data: [] }`.
   - `POST /api/books` with `{ "title": "Dune" }` returns 201 with `status: "reading"` and today's `startedOn`.
   - `PATCH` that book with `{ "rating": 9 }` then `GET /api/books/[id]` reflects it.
   - `GET /api/book-search?q=dune` returns mapped results with cover URLs.
   - All routes return 401 when signed out.
3. `/reading-journal` shows in the header nav for signed-in users and NOT for guests (feature defaults). The page itself 404s — that's expected until Phase 4.
