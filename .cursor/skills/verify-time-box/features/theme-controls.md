# Theme controls

Lets a user switch between light and dark themes from the header and keep the choice across reloads.

## Sub-features

- `theme-toggle` switches theme via button **Toggle theme**.
- `theme-persist` remembers choice in `localStorage` under key `theme`.
- `theme-keyboard` toggles with the `D` key outside text fields.

## How to get to it (user POV)

- On any page with the app header (planner, workouts, book log, settings), click **Toggle theme** (sun/moon icon) in the top-right. Auth is not required.
- Reload the page; the chosen theme remains.
- Press `D` while focus is not in an input to toggle quickly.

## Driving it with cursor-ide-browser

Preconditions:

- Doctor reports healthy `baseUrl`.
- Start at `<baseUrl>/`.

- **Toggle.** Click button **Toggle theme**. Page background and text colors invert (dark ↔ light). Icon swaps between sun and moon states.
- **Persist.** Reload `<baseUrl>/`. Theme matches the choice before reload (check `document.documentElement` has or lacks class `dark` via CDP if needed).
- **Proof.** Screenshot `artifacts/<RUN_ID>/theme-controls/dark.png` and `light.png` after each toggle. Both show **Daily Timeboxing Planner** (or current page heading) with visibly different chrome.

## Gotchas

- Theme applies to `document.documentElement` class `dark`; journal pages inherit the same provider.
- `D` shortcut is ignored while typing in inputs or contenteditable fields.
- Initial paint is handled by a layout script to avoid flash; first automated toggle may start from light unless localStorage already has `theme=dark`.
