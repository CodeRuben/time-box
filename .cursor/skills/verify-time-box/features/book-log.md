# Book log

Lets a signed-in user open the reading journal, add a book manually, open its detail page, and save a reflection entry.

## Sub-features

- `book-log-list` shows the book log heading and library table or empty state.
- `book-log-add-manual` creates a book from the manual entry path.
- `book-log-detail` opens a book detail page from the list.
- `book-log-entry` saves a reflection with current page and summary text.

## How to get to it (user POV)

- Sign in, then open **Book log** from the header (desktop links or mobile **Open menu** sheet).
- Choose **Add book** (or **Add your first book** when the library is empty).
- In **Add a book**, choose **Can't find it? Add manually**, fill **Book title**, and submit **Add book**.
- Click the new book in the **Reading** table to open its detail page.
- On the detail page, choose **Write today**, fill **Current page** and **Summary**, and save **Save entry**.

## Driving it with cursor-ide-browser

Preconditions:

- Doctor reports healthy `baseUrl`.
- User signed in with seeded credentials from `control-time-box print-env --run-id <RUN_ID>`.
- Complete [Sign in](./sign-in.md) first when starting from a guest session.

- **Open list.** Navigate to `<baseUrl>/reading-journal` or click link **Book log**. Heading **Book log** and subtitle *Track what you read, day by day.* are visible.
- **Add book.** Click **Add book**. Dialog **Add a book** opens. Click **Can't find it? Add manually**. On **Book details**, `browser_type` into placeholder **Book title** (e.g. `Verify Book`). Click **Add book**. Book appears in the **Reading** section table.
- **Open detail.** Click the row or title link for `Verify Book`. URL is `/reading-journal/<id>`. Heading matches the book title. Link **All books** is visible.
- **Write entry.** Click **Write today**. Dialog **New entry** opens. `browser_type` **Current page** with `42` and **Summary** with `Test summary`. Click **Save entry**. **Reflections** shows the new entry.
- **Proof.** Snapshot `artifacts/<RUN_ID>/book-log/detail.aria.txt` and screenshot `artifacts/<RUN_ID>/book-log/detail.png`. Artifacts show the book title and saved reflection content.

## Gotchas

- Book log is signed-in only; guests do not see the nav link and direct `/reading-journal` shows a **Sign in** gate card.
- Nav items load from `/api/settings/navigation`; wait for links to replace the loading skeleton.
- Use `browser_type` for book title, page number, and summary fields.
- Navigation to this page alone is covered by [Navigate features](./navigate-features.md); this file covers in-page behavior.
- Adding a book returns to the list page; it does not auto-navigate to the detail page.
