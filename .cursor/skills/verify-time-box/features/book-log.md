# Book log

Lets a signed-in user open the reading journal library and add a book from the list page.

## Sub-features

- `book-log-list` shows the **Book log** heading and status-grouped tables or empty state.
- `book-log-add-manual` creates a book from the manual entry path.
- `book-log-open-detail` navigates to a book detail page from the table.

## How to get to it (user POV)

- Sign in, then open **Book log** from the header (desktop links or mobile **Open menu** sheet).
- Choose **Add book** (or **Add your first book** when the library is empty).
- In **Add a book**, choose **Can't find it? Add manually**, fill **Book title**, and submit **Add book**.
- Click a book in the **Reading** table to open its detail page.

## Driving it with cursor-ide-browser

Preconditions:

- Doctor reports healthy `baseUrl`.
- User signed in with seeded credentials from `control-time-box print-env --run-id <RUN_ID>`.
- Complete [Sign in](./sign-in.md) first when starting from a guest session.

- **Open list.** Navigate to `<baseUrl>/reading-journal` or click link **Book log**. Heading **Book log** and subtitle *Track what you read, day by day.* are visible.
- **Add book.** Click **Add book**. Dialog **Add a book** opens. Click **Can't find it? Add manually**. On **Book details**, `browser_type` into placeholder **Book title** (e.g. `Verify Book`). Click **Add book**. Book appears in the **Reading** section table.
- **Open detail.** Click the row or title link for `Verify Book`. URL is `/reading-journal/<id>`. Hand off to [Book detail](./book-detail.md) for in-page verification.
- **Proof.** Snapshot `artifacts/<RUN_ID>/book-log/list.aria.txt` and screenshot `artifacts/<RUN_ID>/book-log/list.png`. Artifacts show **Book log** and `Verify Book` in the table.

## Gotchas

- Book log is signed-in only; guests do not see the nav link. Direct `/reading-journal` redirects to another allowed page (usually Planner). A **Sign in** button appears only on the **No pages available** fallback card when no other nav destination exists.
- Nav items load from `/api/settings/navigation`; wait for links to replace the loading skeleton.
- Use `browser_type` for **Book title**.
- **Can't find it? Add manually** uses `&rsquo;` in source. Snapshot the dialog and click by ref rather than assuming an ASCII apostrophe.
- Adding a book returns to the list page; it does not auto-navigate to the detail page.
- Detail-page behavior is covered by [Book detail](./book-detail.md).
