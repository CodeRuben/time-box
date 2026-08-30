# Planner top priority

Lets a guest user add a top priority name on today's planner and see it after a full page reload.

## Sub-features

- `priority-add-blank` opens a new priority card from the empty state.
- `priority-name` saves a title via the inline editor.
- `priority-persist` keeps the title in localStorage after reload.

## How to get to it (user POV)

- Open the planner home page (`/`).
- In the **Top Priorities** section, choose **New priority** when the list is empty.
- Or choose the **Add blank priority** control when priorities already exist.
- Type a priority name in the **Priority name** field.

## Driving it with cursor-ide-browser

Preconditions:

- Doctor reports healthy `baseUrl` (default `http://127.0.0.1:3847`).
- Browser tab has no conflicting planner data for today, or clear day first via planner actions.

- **Open planner.** Navigate to `<baseUrl>/`. Snapshot shows heading `Daily Timeboxing Planner` and region **Top Priorities**.
- **Add priority.** Click button **New priority** (empty state) or button with `aria-label` **Add blank priority**. An input with placeholder **Priority name** appears focused.
- **Enter name.** Type into **Priority name** with `browser_type` (not `browser_fill` — React inputs need real keystrokes). Press Enter. The inline editor closes and the card shows `Verify priority` (not **Untitled Priority**).
- **Reload.** Navigate to `<baseUrl>/` again (hard refresh if needed). The card still shows `Verify priority`.
- **Proof.** Snapshot to `artifacts/<RUN_ID>/planner-top-priority/list.aria.txt` and screenshot to `artifacts/<RUN_ID>/planner-top-priority/list.png`. Both must show **Top Priorities** and `Verify priority`.

## Gotchas

- Maximum three top priorities; delete extras before re-running if the section is full.
- Empty name on blur may remain **Untitled Priority**; assert the saved display text.
- `browser_fill` updates the DOM without React state; always use `browser_type` for priority names.
- Guest data is per-browser profile; do not switch browser contexts mid-run.
- Clear day (planner actions menu) removes priorities but is destructive; prefer a fresh tab or new run ID.
