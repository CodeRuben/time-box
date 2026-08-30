# Workout tracker

Lets a user pick a day on the calendar, add a workout, name it, and clear the day again.

## Sub-features

- `workout-landing` shows calendar, selected-day card, and page actions.
- `workout-add-new` creates a blank workout from the add popover.
- `workout-name` saves a workout title in the selected-day editor.
- `workout-clear-day` removes all workouts for the selected date.

## How to get to it (user POV)

- Open **Workouts** from the header (desktop links or mobile **Open menu** sheet).
- Use the month calendar to select a day (defaults to today).
- In **Selected Day**, choose **Add workout** → **New workout**.
- Expand the workout card and type a name in **Workout name**.
- Use **Clear workouts for selected date** to reset the day when finished.

## Driving it with cursor-ide-browser

Preconditions:

- Doctor reports healthy `baseUrl`.
- Start at `<baseUrl>/workout-tracker` or navigate via **Workouts** from the planner.

- **Landing.** Snapshot shows heading **Workout Tracker**, card **Selected Day**, buttons **Export** and **Workout Insights**, and month navigation **Previous month** / **Next month**. Opening the insights sheet is covered by [Workout insights](./workout-insights.md).
- **Add workout.** Click **Add workout** (popover). Choose **New workout**. **Workout Details** appears with **Untitled workout**.
- **Name workout.** Expand the workout if collapsed. `browser_type` into placeholder **Workout name** (e.g. `Verify workout`). Press Tab or click outside. Card shows `Verify workout`.
- **Clear day.** Click button **Clear workouts for selected date**. Confirm **Clear Workouts** in the dialog. Empty state reads *No workouts logged yet. Add your first workout below.*
- **Proof.** Snapshot `artifacts/<RUN_ID>/workout-tracker/day.aria.txt` and screenshot `artifacts/<RUN_ID>/workout-tracker/day.png`. Artifacts show **Workout Tracker** and either the named workout or the cleared empty state.

## Gotchas

- **Clear workouts for selected date** is disabled when the day has no workouts.
- Use `browser_type` for **Workout name**; `browser_fill` does not update React state.
- Guest workouts persist in browser localStorage; signed-in users autosave to the verification database ([Autosave](./autosave.md)).
- Navigation to this page alone is covered by [Navigate features](./navigate-features.md); this file covers in-page behavior.
