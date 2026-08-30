# Autosave

Lets a signed-in user see save feedback when planner or workout data syncs to their account, and when book notes persist on the detail page.

## Sub-features

- `autosave-planner` shows **Saving…** then **Saved** on the planner after edits.
- `autosave-workouts` shows the same indicator on the workout tracker after edits.
- `autosave-book-notes` shows **Saving…** / **Saved** beside **Notes** on a book detail page.

## How to get to it (user POV)

- Sign in. A **Saved** / **Saving…** status control appears beside **Planner actions** on `/` and beside **Export** on the workout tracker (not in the app header).
- On the planner, change working notes or a focus item and watch the indicator beside **Planner actions**.
- On **Workouts**, add or rename a workout and watch the indicator beside **Export**.
- On a book detail page, edit **Notes** and watch the inline **Saving…** / **Saved** text.

## Driving it with cursor-ide-browser

Preconditions:

- Doctor reports healthy `baseUrl`.
- User signed in with seeded credentials from `control-time-box print-env --run-id <RUN_ID>`.
- Complete [Sign in](./sign-in.md) when starting from a guest session.

- **Planner autosave.** Navigate to `<baseUrl>/`. Confirm a status control with **Saved** (or cloud icon) appears near **Planner actions**. `browser_type` into working notes placeholder *Write down all your thoughts, tasks, and ideas here...* with `Autosave verify`. Wait for **Saving…** then **Saved** on the status control.
- **Workout autosave.** Open **Workouts**. Click **Add workout**, then **New workout**. Name it `Autosave verify` in **Workout name**. Status control beside **Export** cycles through **Saving…** and **Saved**.
- **Book notes autosave.** Open [Book detail](./book-detail.md) for any book. Type in the **Notes** textarea. Wait for **Saved** next to the **Notes** heading.
- **Proof.** Screenshot `artifacts/<RUN_ID>/autosave/planner.png` showing **Saved** on the planner. Optional: `workouts.png` and `book-notes.png` for the other surfaces.

## Gotchas

- **AutosaveIndicator** is hidden for guests (`status !== "authenticated"` on planner and workout pages).
- Guest planner and workout data still persist locally; only the cloud status UI requires sign-in.
- Book notes use inline text feedback, not the shared **AutosaveIndicator** component.
- Debounce delay is shared (`AUTOSAVE_DEBOUNCE_MS`); wait briefly after typing before asserting **Saved**.
