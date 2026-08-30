# Planner focus item

Lets a user add a custom item to the focus list in the **To do** column.

## Sub-features

- `focus-add-open` reveals the add-item form.
- `focus-add-save` inserts a row in the To do column.
- `focus-complete` marks an item complete (moves to **Done**).

## How to get to it (user POV)

- On the planner home page, scroll to **Focus List**.
- Choose **Add item** (empty To do footer, or below the empty-state card).
- Type a title and choose **Add**.

## Driving it with cursor-ide-browser

Preconditions:

- Doctor `ok: true`.
- Planner loaded at `<baseUrl>/`.

- **Open add form.** Click button **Add item**. Textbox **Focus item title** appears with buttons **Add** and **Cancel**.
- **Enter title.** Fill **Focus item title** with `Verify focus item`. Click **Add**. The row shows **Verify Focus Item** (title-cased) with button `Complete Verify Focus Item`.
- **Proof.** Snapshot `artifacts/<RUN_ID>/planner-focus-item/todo.aria.txt` and screenshot `artifacts/<RUN_ID>/planner-focus-item/todo.png`. Artifacts show **Focus List** and **Verify Focus Item** in the To do column.
- **Optional complete.** Click `Complete Verify Focus Item`. After the exit animation, the row leaves To do and appears under heading **Done** (`aria-label` **Completed column**). Snapshot `complete.aria.txt` if exercising this sub-feature.

## Gotchas

- Focus list uses drag-and-drop; prefer Complete/Remove buttons for stable automation.
- Complete animation may take a moment; wait until the To do row is gone or the **Done** section updates.
- Empty title submit is ignored.
