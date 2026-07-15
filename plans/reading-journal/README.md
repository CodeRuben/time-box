# Reading Journal — Implementation Plan

A new feature module for the Timeboxing Planner app: a reading journal where the user tracks books, writes daily entries about what they read, and reviews progress.

Read `CONTEXT.md` (repo root) for the canonical domain vocabulary before implementing. Use those terms exactly — Book, Entry, Summary, Analysis, Thoughts, Book Notes, Current Page, Reading Day, Progress, Rating, Status, Cover.

## Decisions already made (do not re-litigate)

| Topic | Decision |
|---|---|
| Re-reads | Not modeled. A Book is a single read-through; dates/progress live on the Book. |
| Entry shape | One Entry per Book per day: Current Page, Summary, Analysis, Thoughts. |
| Page tracking | Entries store **current page** (where you are). Pages-read-per-day is derived by diffing entries. Current Page may go backwards; no monotonicity validation. |
| Progress | Derived: latest Entry's Current Page ÷ Book total pages. Never stored. |
| Total pages | Prefilled from Open Library on add, always manually editable. |
| Status | Explicit field: `reading` / `finished` / `abandoned`. No wishlist state. Never derived from dates. |
| Rating | Half-star increments, 0.5–5 stars, stored as integer 1–10. Settable anytime, any status. |
| Reading-days grid | **Manually tickable** month calendar. Ticking is independent of Entries (an Entry does not auto-tick the day). |
| Book Notes | Free-form text field on the Book, separate from daily Entries. |
| Persistence | **Signed-in only.** Prisma/SQLite via API routes. No guest/localStorage mode — see `docs/adr/0001-reading-journal-is-auth-only.md`. |
| Cover images | Stored as a **URL string** (from Open Library, or manually edited). Placeholder shown when absent. No uploads. |
| Book search | Open Library (no API key), proxied through a server route. Manual add form as fallback; all prefilled fields editable before saving. |
| List page | Card grid (cover + title), grouped in sections by Status: Reading, then Finished, then Abandoned. Not a table. |
| Entry writing | Book-centric only: open a book, write the entry there. No separate day view. |
| Feature flag | Key `reading-journal`, route `/reading-journal`, `guestEnabled: false`. |

## Architecture overview

Follows existing app conventions (see `app/api/tasks/route.ts`, `lib/task-api-helpers.ts`, `app/tasks/` for the reference pattern):

- **DB**: structured Prisma models (like `Task`, not the JSON-blob pattern of `PlannerDay`). Enum-like values are plain strings validated at the API boundary. Dates are local-date strings `YYYY-MM-DD`.
- **API**: REST routes under `app/api/books/`, all guarded with `requireFeatureUser("reading-journal", ...)` from `lib/auth-session.ts`.
- **UI**: `"use client"` pages wrapped in `FeatureGate`, shadcn/ui components, page logic extracted into custom hooks (per `.cursor/rules/coding-conventions.mdc`).
- **Tests**: Vitest, pure helper functions tested in `lib/__tests__/`.

### Data model (final)

```prisma
model Book {
  id             String   @id @default(cuid())
  userId         String
  title          String
  author         String   @default("")
  coverUrl       String   @default("")
  totalPages     Int?
  publishedYear  Int?
  openLibraryKey String   @default("")
  // Enum-like values validated at the API boundary: "reading" | "finished" | "abandoned".
  status         String   @default("reading")
  // Quarter-star rating stored as 1-20 (15 = 3.75 stars). Null = unrated.
  rating         Int?
  notes          String   @default("")
  // Local dates as YYYY-MM-DD strings, matching PlannerDay/WorkoutDay.
  startedOn      String?
  finishedOn     String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  entries        ReadingEntry[]
  readingDays    ReadingDay[]

  @@index([userId])
  @@index([userId, status])
}

model ReadingEntry {
  id          String   @id @default(cuid())
  bookId      String
  userId      String
  date        String
  currentPage Int?
  summary     String   @default("")
  analysis    String   @default("")
  thoughts    String   @default("")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  book        Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@unique([bookId, date])
  @@index([userId, date])
}

model ReadingDay {
  id        String   @id @default(cuid())
  bookId    String
  userId    String
  date      String
  createdAt DateTime @default(now())
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@unique([bookId, date])
  @@index([userId])
}
```

`User` gains `books Book[]`. `ReadingEntry.userId` / `ReadingDay.userId` are scalar columns (no back-relation) used for ownership checks.

### API surface (final)

| Route | Methods | Purpose |
|---|---|---|
| `/api/books` | GET, POST | List books (with derived current page for cards); create a book |
| `/api/books/[id]` | GET, PATCH, DELETE | Detail (includes entries + reading days); partial update; delete (cascades) |
| `/api/books/[id]/entries/[date]` | PUT, DELETE | Upsert / delete the Entry for a date |
| `/api/books/[id]/days/[date]` | PUT, DELETE | Tick / untick a Reading Day |
| `/api/book-search` | GET | Server-side proxy to Open Library search |

### Pages

| Route | File | Content |
|---|---|---|
| `/reading-journal` | `app/reading-journal/page.tsx` | Card grid by status + add-book dialog |
| `/reading-journal/[bookId]` | `app/reading-journal/[bookId]/page.tsx` | Book info, rating, progress bar, reading-days grid, Book Notes, entries |

## Visual design — notebook journal aesthetic

The reading journal pages should feel like a physical reading notebook, unlike the utilitarian look of the rest of the app. Reference images (follow the **general layout and mood loosely**, not literally): `plans/reading-journal/design/sample-trackers.png` (progress + reading tracker spread) and `plans/reading-journal/design/sample-reflections.png` (ruled reflections page).

**Hard rule: no cursive or handwriting fonts anywhere.** The handwritten text in the samples is content, not a style to copy.

### Design language

- **Paper surface.** Journal pages sit on a warm paper-toned background (cream/blush in light mode; a desaturated warm dark tone in dark mode — the app has a theme toggle, both must work). Add a *subtle* texture with CSS only (layered gradients or a tiny inline-SVG noise) — no texture image assets, and skip the coffee stains.
- **Typography.** Section headings in the style of the samples' "PROGRESS TRACKER" / "REFLECTIONS" headers: uppercase serif with wide letter-spacing (`font-serif uppercase tracking-[0.25em]` or similar). Body text stays the app's existing sans font. No cursive.
- **Palette.** Ink brown-gray for text on paper, dusty rose as the primary accent (filled tracker cells, progress fill, active states), muted dusty blue as the secondary accent. Define these as CSS custom properties scoped to the journal (see below) rather than repeating hex values.
- **Ruled and grid paper.** Long-form text areas mimic notebook paper: entry displays and textareas (Summary/Analysis/Thoughts) get horizontal ruled lines via `repeating-linear-gradient` with line-height matched to the ruling; Book Notes gets a faint square grid-paper background (like the "notes" panel in the sample). Lines must align with the text baseline and respect the textarea's line-height.
- **Trackers.** The reading-days grid follows the sample's tracker spirit: filled rose cells = read days, with a small key/legend ("Read" / "No read" chips with colored dots) like the sample's top-right key. The progress bar carries small milestone labels along it ("great start" ~10%, "keep going" ~40%, "almost there" ~70%, "you did it" at 100%) in plain non-cursive muted text — shown subtly, only the passed milestones emphasized.
- **Decoration budget.** At most: hairline borders, slight corner rounding, one small leaf/flower flourish per page header (inline SVG or a lucide icon like `Leaf`), and the paper texture. No skeuomorphic binding, page curls, or drop-shadow "pages".

### Implementation approach

- Scope everything under a wrapper class (e.g. `journal-paper`) applied by `app/reading-journal/layout.tsx`, with the palette as CSS custom properties defined in `app/globals.css` under that class (light + dark values via the existing theme mechanism). The rest of the app must be visually unaffected.
- Keep using shadcn/ui components; restyle via the scoped variables and utility classes rather than forking components.
- Respect `motion-reduce` and keep contrast accessible (ink-on-paper must meet WCAG AA; dusty rose fills need a readable foreground).

## Phases

Implement in order. Each phase file is self-contained, ends with verification steps, and must leave `npm run lint` and `npm run test` passing.

1. `01-schema-and-helpers.md` — Prisma models, migration, validation/formatting helpers + tests
2. `02-books-api-and-search.md` — Feature registration, books CRUD routes, Open Library search proxy
3. `03-entries-and-reading-days-api.md` — Entry upsert/delete and Reading Day tick/untick routes
4. `04-book-list-page.md` — List page with status-sectioned cards, add-book dialog with search
5. `05-book-detail.md` — Detail page: info header, rating, progress bar, reading-days grid, Book Notes
6. `06-entries-ui.md` — Entry editor and entries timeline on the detail page
