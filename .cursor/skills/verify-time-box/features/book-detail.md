# Book detail

Lets a signed-in user manage one book on its detail page: status, reading days, notes, and reflections.

## Sub-features

- `book-detail-header` shows cover, title, status select, rating, and date pickers.
- `book-detail-days` toggles read days on the **Days read** calendar.
- `book-detail-notes` autosaves free-form notes with **Saving…** / **Saved** feedback.
- `book-detail-reflection` creates or edits a daily reflection entry.

## How to get to it (user POV)

- Sign in and open a book from the [Book log](./book-log.md) list table.
- On `/reading-journal/<bookId>`, use link **All books** to return to the library.
- Change **Reading** / **Finished** / **Abandoned** from the status select in the header.
- Tap days in **Days read** to mark or unmark reading days.
- Type in the **Notes** textarea; wait for **Saved** beside the heading.
- Under **Reflections**, choose **Write today**, fill **Current page** and **Summary**, and save **Save entry**.

## Driving it with cursor-ide-browser

Preconditions:

- Doctor reports healthy `baseUrl`.
- User signed in with seeded credentials from `control-time-box print-env --run-id <RUN_ID>`.
- A book exists on the list (create one via [Book log](./book-log.md) if needed).

- **Open detail.** From `/reading-journal`, click a book title in the **Reading** table. URL is `/reading-journal/<id>`. Page heading matches the book title. Link **All books** is visible.
- **Toggle reading day.** In **Days read**, click today's date button (long `aria-label` with weekday and date). Button shows `aria-pressed="true"` when marked read.
- **Edit notes.** `browser_type` into the **Notes** textarea (placeholder *Jot down anything about this book…*). Wait until **Saved** appears next to the **Notes** heading.
- **Write reflection.** Click **Write today**. Dialog **New entry** opens. `browser_type` **Current page** with `42` and **Summary** with `Test summary`. Click **Save entry**. **Reflections** lists the new entry.
- **Proof.** Snapshot `artifacts/<RUN_ID>/book-detail/page.aria.txt` and screenshot `artifacts/<RUN_ID>/book-detail/page.png`. Artifacts show the book title, **Days read**, and at least one reflection or note save indicator.

## Gotchas

- Reading days and reflection entries are independent; saving an entry does not tick a calendar day.
- Book log is signed-in only; complete [Sign in](./sign-in.md) first.
- Use `browser_type` for notes and entry fields.
- **Book actions** menu exposes **Edit details** and **Delete book**; destructive delete is out of scope for the default recipe.
- List-page behavior lives in [Book log](./book-log.md).
