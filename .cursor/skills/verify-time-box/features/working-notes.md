# Working notes

Lets a user capture free-form brain dump text for the selected planner day.

## Sub-features

- `notes-type` updates the working notes textarea.
- `notes-persist-guest` keeps text in localStorage after reload for guests.

## How to get to it (user POV)

- On the planner home page, find the working notes / brain dump textarea (below **Top Priorities**).

## Driving it with cursor-ide-browser

Preconditions:

- Doctor `ok: true`.
- Planner at `<baseUrl>/`.

- **Focus notes.** Snapshot to locate the brain dump textarea (labeled in UI near working notes section).
- **Enter text.** Fill textarea with `Verify brain dump line`. Content visible in the field.
- **Reload.** Navigate to `<baseUrl>/` again. Textarea still contains `Verify brain dump line`.
- **Proof.** Snapshot `artifacts/<RUN_ID>/working-notes/notes.aria.txt` and screenshot `artifacts/<RUN_ID>/working-notes/notes.png`.

## Gotchas

- Autosave indicator appears only for signed-in users; guests rely on localStorage sync on edit.
- Large paste may trigger transform shortcuts in the working notes toolbar; use simple plain text for verification.
- Clear day from planner actions wipes brain dump along with priorities and focus list.
