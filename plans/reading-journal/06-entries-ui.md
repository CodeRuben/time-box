# Phase 6 — Entry editor and entries timeline

Prerequisites: Phases 1–5. Read `plans/reading-journal/README.md` for decisions **and its "Visual design" section**, plus `CONTEXT.md` for the Entry/Summary/Analysis/Thoughts vocabulary. The entries UI takes its look from `plans/reading-journal/design/sample-reflections.png` — a ruled "REFLECTIONS" notebook page — using the `journal-heading` and `journal-ruled` utilities from Phase 4. No cursive fonts; the handwriting in the sample is content, not a font choice.

This phase fills the entries slot on the book detail page. Entries are written from the book (book-centric flow — no separate day view anywhere in the app).

## 1. Files to create

```
app/reading-journal/[bookId]/components/
├── entries-section.tsx
├── entry-editor-dialog.tsx
└── entry-card.tsx
```

Extend `app/reading-journal/hooks/use-book-detail.ts` with:

- `saveEntry(date: string, input: { currentPage: number | null; summary: string; analysis: string; thoughts: string })` → `PUT /api/books/[id]/entries/[date]`, optimistic against `book.entries` (replace-or-insert by date, keep date-descending order), rollback on failure. Also recompute the derived `currentPage` on the book view after save (reuse `getCurrentPage`).
- `deleteEntry(date: string)` → `DELETE`, optimistic removal + rollback.
- Editor dialog state: `{ open: boolean; date: string | null }` (null date = closed).

## 2. `entries-section.tsx`

Card/section titled "Reflections" (a `journal-heading`, mirroring the sample page's title) with a primary button **"Write today's entry"**:

- If an entry for today (local `format(new Date(), "yyyy-MM-dd")`) already exists, the button reads **"Edit today's entry"** and opens it prefilled.
- A secondary, less prominent control ("Add for another day") opens the editor with a date picker enabled, for backfilling a missed day. If the chosen date already has an entry, the editor loads that entry (the API is an upsert keyed on date — surface this in the UI by prefilling, never by erroring).

Below the buttons, the timeline: `entry-card.tsx` per entry, date descending. Empty state: muted text — "No entries yet. Write what you read today."

## 3. `entry-card.tsx`

Per entry:

- Header row: human date ("Friday, July 3" via `date-fns` `format(parseISO(date), "EEEE, MMMM d")`), page info when present — "p. 143" plus derived pages-read for that day when computable ("+38 pages", from `getPagesReadByDate` over all entries), and an overflow menu: Edit / Delete (Delete uses a small `AlertDialog` confirm).
- Body: the three text fields, each rendered only when non-empty, with small muted labels **Summary**, **Analysis**, **Thoughts** above each block. Preserve line breaks (`whitespace-pre-wrap`). Render the text blocks on `journal-ruled` backgrounds so entries read like the sample's ruled reflections page — ruling spacing must match the text `line-height` exactly so lines sit under the text.
- Long entries: clamp the card body (`line-clamp` on a wrapper or max-height + fade) with a "Show more" toggle. Keep the toggle state local to the card.

## 4. `entry-editor-dialog.tsx`

shadcn `Dialog`, sized for writing (`sm:max-w-2xl`):

- **Date** — fixed label for the today-flow; a `DatePicker` (no future dates) for the backfill flow. Changing the date while editing re-prefills from that date's existing entry, if any.
- **Current page** — small number `Input` labeled "Current page". Placeholder shows the book's latest known page ("last: 143"). No validation against previous entries or total pages (backwards movement allowed by design); only non-negative integers enforced.
- **Summary** — `Textarea`, label "Summary", helper text "What did you read?"
- **Analysis** — `Textarea`, label "Analysis", helper text "How does it tie into what came before — and where might it be going?"
- **Thoughts** — `Textarea`, label "Thoughts", helper text "Anything else on your mind."
- Give the three textareas the `journal-ruled` background (writing on notebook lines). This requires the textarea `line-height` to equal the ruling interval — set both explicitly. Keep the app's sans font for input text.
- Footer: Cancel + **Save entry** (primary — apply the dialog primary-action motion classes from `.cursor/rules/dialog-primary-action-motion.mdc`; disabled while saving). Saving with every field empty is allowed (it records the day) but if truly all fields are empty AND no prior entry exists for that date, disable Save instead — an all-empty create is meaningless.

## 5. Progress integration

After `saveEntry`/`deleteEntry`, the progress bar and any "p. X of Y" text on the page must reflect the new derived Current Page without a reload (this falls out of recomputing `currentPage` in the hook — verify it).

## Verification

1. `npm run lint` and `npm run test` pass.
2. Signed in, on a book with total pages set:
   - "Write today's entry" → fill all four fields, save → card appears, progress bar updates immediately.
   - Button now reads "Edit today's entry"; editing changes persist after reload.
   - Backfill: add an entry for 3 days ago with a lower page → allowed; its card shows the earlier page; the progress bar still reflects the latest-dated entry.
   - Pages-read chips: with entries at p.50 (3 days ago) and p.143 (today), today's card shows "+93 pages".
   - Delete today's entry → confirm → card gone, progress falls back to the older entry.
   - Entries do NOT tick the reading-days grid (independent by design).
3. Mobile width: the editor dialog scrolls, textareas usable.
   - Journal styling: ruled lines align with text in both the editor textareas and rendered entry cards, in light and dark themes; no cursive fonts.
4. Full-feature pass: add a book via search → rate it → tick reading days → write entries across several days → mark Finished with an end date → confirm the list page card shows it under Finished with rating stars.
