# Phase 4 — Book list page with cards and add-book dialog

Prerequisites: Phases 1–3 (APIs live). Read `plans/reading-journal/README.md` for decisions.

Reference implementation for structure and conventions: `app/tasks/` (page → `FeatureGate` wrapper → content component driven by one page hook → dialog components in `components/`).

Visual style: this page introduces the **notebook journal aesthetic** — read the "Visual design" section of the README and the sample images in `plans/reading-journal/design/` before building. No cursive fonts.

## 1. Files to create

```
app/reading-journal/
├── layout.tsx                    # metadata only, copy app/tasks/layout.tsx style
├── page.tsx                      # FeatureGate("reading-journal") + <BookListContent />
├── hooks/
│   └── use-book-list.ts
└── components/
    ├── book-card.tsx
    ├── book-status-section.tsx
    └── add-book-dialog.tsx
```

## 2. Page hook — `use-book-list.ts`

State and logic live here, not in components (see `.cursor/rules/coding-conventions.mdc`). Responsibilities:

- Fetch `GET /api/books` on mount; expose `isLoading`, `books` (`BookSummaryView[]`).
- Group books by status: `{ reading: [...], finished: [...], abandoned: [...] }` preserving API order.
- `createBook(input)` → `POST /api/books`, then re-fetch (no optimistic update needed for creation), then `router.push` to the new book's detail page.
- Add-dialog open state.

## 3. Journal styling foundation (this phase sets it up for all journal pages)

In `app/reading-journal/layout.tsx`, wrap children in a `div.journal-paper`. In `app/globals.css`, add a scoped block for `.journal-paper` defining the journal palette as CSS custom properties (paper background, ink text, dusty-rose accent, dusty-blue secondary) with light and dark values wired into the app's existing theme mechanism, plus:

- a subtle CSS-only paper texture on the page background (layered gradients or inline-SVG noise — no image assets),
- a `journal-heading` utility (uppercase serif, wide tracking — see README "Typography"),
- `journal-ruled` (horizontal `repeating-linear-gradient` ruling matched to line-height) and `journal-grid-paper` (faint square grid) utilities for later phases.

Nothing outside `/reading-journal` may change appearance.

## 4. List page layout

Match the page chrome of `app/tasks/page.tsx`: same outer padding, `max-w-7xl`, `h1` title "Reading Journal", subtitle ("Track what you read, day by day."), and a primary "Add book" `Button` with the `Plus` icon. Style the `h1` with `journal-heading`, and add a single small leaf flourish (lucide `Leaf`) beside it — the page header should echo the sample spreads' title treatment, without cursive.

Sections in order — **Reading**, **Finished**, **Abandoned** — each a `journal-heading` section title + responsive card grid (`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4`). Omit a section entirely when it has no books. When there are no books at all, show a centered empty state with the subtitle text and an "Add your first book" button.

## 5. `book-card.tsx`

Not a table row — a cover-first card, the whole card a link to `/reading-journal/[bookId]`:

- Cover: `aspect-[2/3]` image (`object-cover`, `rounded-md`, subtle border). When `coverUrl` is empty, render a placeholder: muted background with the `BookOpen` lucide icon and the title centered.
- Use a plain `<img>` tag (external Open Library URLs; avoids configuring `next/image` remote patterns) with `alt={title}` and `loading="lazy"`.
- Below the cover: title (truncate to 2 lines with `line-clamp-2`), author in muted small text.
- For `reading` books with a derivable percentage (`getProgressPercent(currentPage, totalPages)`), a thin progress bar at the card's bottom edge (simple `div` with width %, `bg-primary`) plus `"p. X of Y"` micro-text. Skip when not derivable.
- For rated books, a small star display (filled/half/empty stars from lucide `Star`; half via CSS clip or the `StarHalf` icon). Rating is 1–10 → divide by 2.
- Hover: slight scale/shadow transition consistent with the app's press-scale motion rule (`.cursor/rules/dialog-primary-action-motion.mdc` for the pattern's feel; keep `motion-reduce` variants).

## 6. `add-book-dialog.tsx`

shadcn `Dialog`, opened by the "Add book" button. Two-step, single dialog:

**Step 1 — search.** An `Input` ("Search by title or author…"). Debounce 400ms, call `GET /api/book-search?q=...`. Render up to 10 result rows: small cover thumbnail (or placeholder), title, author, year. Below the results, always show a plain-text button: "Can't find it? Add manually". If the search request errors, show a muted "Search unavailable — add the book manually" message and the manual button.

**Step 2 — confirm/edit form.** Reached by clicking a result (fields prefilled) or the manual button (fields empty). Fields: Title (required), Author, Total pages (number), Published year (number), Cover URL. All editable — API values are prefill, not truth. A small cover preview renders when Cover URL is non-empty. Buttons: "Back" (to search) and "Add book" (primary — apply the dialog primary-action motion classes from `.cursor/rules/dialog-primary-action-motion.mdc`). Submit calls `createBook` from the hook; disable while pending.

Extract the debounced-search logic into `app/reading-journal/hooks/use-book-search.ts` (returns `{ query, setQuery, results, isSearching, searchFailed }`).

## Verification

1. `npm run lint` and `npm run test` pass.
2. Signed in, visit `/reading-journal`:
   - Empty state renders; "Add your first book" opens the dialog.
   - Searching "dune" shows results with covers; clicking one prefills step 2; editing Total pages persists on the created book.
   - Manual add with only a title works; its card shows the placeholder cover.
   - After adding, you land on `/reading-journal/[bookId]` (404/blank until Phase 5 — expected).
   - Back on the list: the book appears under **Reading**.
3. Signed out: `/reading-journal` is not in the nav and the page redirects/blocks via `FeatureGate`.
4. Resize to mobile width — the card grid collapses to 2 columns and the dialog remains usable.
5. Journal styling: the page shows the paper background and letter-spaced serif headings in both light and dark themes; no cursive font is used; `/tasks` and `/` look unchanged.
