# Planner focus item

Lets a user add a custom item to the focus list in the **To do** column.

## Sub-features

- `focus-add-open` reveals the add-item form.
- `focus-add-save` inserts a row in the To do column.
- `focus-complete` marks an item complete (moves to Complete column).

## How to get to it (user POV)

- On the planner home page, scroll to **Focus List**.
- Choose **Add item** below the columns.
- Type a title and choose **Add**.

## Driving it with cursor-ide-browser

Preconditions:

- Doctor `ok: true`.
- Planner loaded at `<baseUrl>/`.

- **Open add form.** Click button **Add item**. Textbox **Focus item title** appears with buttons **Add** and **Cancel**.
- **Enter title.** Fill **Focus item title** with `Verify focus item`. Click **Add**. Row appears with button `Complete Verify focus item` (aria-label pattern).
- **Proof.** Snapshot `artifacts/<RUN_ID>/planner-focus-item/todo.aria.txt` and screenshot `artifacts/<RUN_ID>/planner-focus-item/todo.png`. Artifacts show **Focus List** and `Verify focus item` in the To do column.
- **Optional complete.** Click `Complete Verify focus item`. Item animates to the Complete column or disappears from To do. Snapshot `complete.aria.txt` if exercising this sub-feature.

## Gotchas

- Focus list uses drag-and-drop; prefer Complete/Remove buttons for stable automation.
- Complete animation may take a moment; wait for snapshot until the To do row is gone or Complete column updates.
- Empty title submit is ignored.
