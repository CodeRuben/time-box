# Phase 5 — Book detail page (info, rating, progress, reading-days grid, notes)

Prerequisites: Phases 1–4. Read `plans/reading-journal/README.md` for decisions **and its "Visual design" section** — this page leans hardest on the notebook aesthetic (see `plans/reading-journal/design/sample-trackers.png`). The `journal-paper` wrapper and CSS utilities (`journal-heading`, `journal-ruled`, `journal-grid-paper`) exist from Phase 4. No cursive fonts. Entries UI is Phase 6 — this phase builds everything else on the detail page and leaves a clearly-marked slot for the entries section.

## 1. Files to create

```
app/reading-journal/[bookId]/
├── page.tsx                      # FeatureGate + <BookDetailContent bookId=... />
└── components/
    ├── book-info-header.tsx
    ├── star-rating.tsx
    ├── progress-bar.tsx
    ├── reading-days-grid.tsx
    ├── book-notes.tsx
    └── delete-book-alert.tsx
app/reading-journal/hooks/
└── use-book-detail.ts
```

`page.tsx` reads `bookId` from route params (`useParams` from `next/navigation` in the client component, matching how the app handles dynamic client pages).

## 2. Page hook — `use-book-detail.ts`

- Fetch `GET /api/books/[id]` on mount → `BookDetailView`. Expose `isLoading`, `book`, `notFound` (404 → render a "Book not found" card with a link back to `/reading-journal`).
- `updateBook(patch: Partial<...>)` → `PATCH /api/books/[id]` with **optimistic update + rollback on failure** (copy the pattern used by the tasks hook). Used by rating, status, notes, dates, and edit-details form.
- `tickDay(date)` / `untickDay(date)` → `PUT`/`DELETE /api/books/[id]/days/[date]`, optimistic against the `readingDays` array.
- `deleteBook()` → `DELETE`, then `router.push("/reading-journal")`.
- Debounce notes saving with the existing utility `lib/autosave-debounce.ts` (see how planner/workout storage hooks use it) so typing in Book Notes doesn't spam PATCH requests.

## 3. `book-info-header.tsx`

Left: cover image (same placeholder rules as the card, roughly `w-32`–`w-40`). Right column:

- Title (h1) and author.
- Muted metadata line: published year · total pages · started/finished dates (render what exists).
- **Status** — shadcn `Select` with Reading / Finished / Abandoned. Changing it PATCHes `{ status }` only. Do not auto-modify dates.
- **Dates** — two shadcn `DatePicker`s (component exists in `components/ui/date-picker.tsx`) for `startedOn` / `finishedOn`, each nullable, PATCHing `YYYY-MM-DD` strings.
- **Star rating** — see below.
- Overflow `DropdownMenu` (`MoreHorizontal` icon): "Edit details" (dialog reusing the Phase 4 step-2 form fields: title, author, total pages, published year, cover URL) and "Delete book" (destructive, opens `delete-book-alert.tsx` — an `AlertDialog` copied from `delete-task-alert.tsx`, warning that all entries are deleted too).

## 4. `star-rating.tsx`

Interactive 5-star widget with half-star precision (rating stored 1–10):

- Render 5 stars; each star has two hit-zones (left half / right half) setting rating to `i*2-1` or `i*2`.
- Display: full / half / empty via lucide `Star` + `StarHalf` (or CSS-clipped overlay).
- Clicking the currently-set value clears the rating (PATCH `{ rating: null }`).
- Keyboard accessible: `role="radiogroup"` of 10 radio options with `aria-label`s like "3.5 stars"; visible focus ring.
- Usable anytime, regardless of status.

## 5. `progress-bar.tsx`

Uses `getProgressPercent(book.currentPage, book.totalPages)` from `lib/reading-progress.ts`:

- Derivable: labeled bar — `"p. 143 of 320 — 45%"` — with a `div`-based bar (dusty-rose fill on a muted paper track, `rounded-full`, `h-2`), `role="progressbar"` with `aria-valuenow`. Under a section heading styled with `journal-heading` ("Progress").
- Milestone labels, echoing the sample's vertical tracker annotations: small muted non-cursive text markers along the bar — "great start" (10%), "keep going" (40%), "almost there" (70%), "you did it" (100%). Milestones at or below the current percent render in the accent color; the rest stay faint. Hide them entirely below `sm` width. Keep the milestone list as a plain const in the component.
- Not derivable (no entries with pages, or no total pages): muted hint — "Log an entry with your current page to track progress" or "Set total pages to track progress" as appropriate.

Current Page comes only from Entries; there is no direct "set progress" control.

## 6. `reading-days-grid.tsx`

A paged month calendar of manually tickable days (see CONTEXT.md: ticking is independent of Entries):

- Style it after the sample's "reading tracker" spread: `journal-heading` title ("Reading Tracker") and a small key/legend in the top-right — two chips with colored dots: dusty-rose "Read", faint outline "No read" — matching the sample's key card.
- Header: month name + year, chevron buttons for previous/next month. Default to the current month. Allow paging back at least to the month of `startedOn` (or 12 months if unset); don't page into future months.
- Build the day cells with `date-fns` (already a dependency) — do NOT reuse `components/ui/calendar.tsx` (react-day-picker is a date *picker*; this is a toggle grid, simpler to build directly). 7-column grid, Mon–Sun or Sun–Sat matching `components/ui/calendar.tsx`'s locale default.
- Each day cell is a `<button>`: ticked days get a dusty-rose fill with readable foreground and slight rounding (like the sample's colored-in cells); unticked get a hairline border and hover state; future dates are `disabled`.
- Click toggles via `tickDay`/`untickDay` (optimistic — the tick appears instantly).
- Below the grid: a count line, e.g. "12 reading days this month".
- Keep the component pure/presentational: it receives `readingDays: string[]`, `onTick`, `onUntick`; month-paging state can live inside.

Extract pure month-math (cells for a month, membership checks) into `lib/reading-days-grid.ts` with tests in `lib/__tests__/reading-days-grid.test.ts` (month boundaries, leap February, future-date detection).

## 7. `book-notes.tsx`

A card with a `journal-heading` "Notes" and a shadcn `Textarea` (`min-h-32`) bound to `book.notes`, autosaved via the debounced `updateBook({ notes })`. Give the textarea the `journal-grid-paper` background (the sample's grid-paper notes panel); keep the grid faint enough that text stays readable in both themes. Show a subtle "Saved" indicator after a successful save (match how planner/workouts surface autosave if they do; otherwise a small muted text that appears briefly).

## 8. Page assembly

Order on the page: info header → progress bar → reading-days grid and notes side by side on `lg` (stacked on mobile) → entries section placeholder (`{/* Entries — Phase 6 */}`). Back-link ("← All books") above the header, to `/reading-journal`.

## Verification

1. `npm run lint` and `npm run test` pass.
2. Signed in, with a book created from Phase 4:
   - Detail page shows cover, title, author, metadata.
   - Rating: click 3.5 stars → persists across reload; click again → cleared.
   - Status → Finished; set `finishedOn` via the date picker; reload — both stick; card on the list page moved to the **Finished** section.
   - Progress bar shows the hint (no entries yet).
   - Tick today + yesterday in the grid; untick one; page to the previous month and back; reload — state correct.
   - Type in Notes, wait for debounce, reload — text persists.
   - Delete book → confirm dialog → lands on the list, book gone.
3. Unknown book ID shows the "Book not found" card.
4. Journal styling: progress milestones highlight as pages advance; the tracker legend and rose-filled cells match the design section; notes grid-paper is visible but text stays readable in light and dark themes; no cursive fonts.
