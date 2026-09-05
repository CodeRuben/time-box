# Workout insights

Lets a user open the historical workout insights sheet from the workout tracker and browse filtered totals.

## Sub-features

- `insights-open` opens the **Workout Insights** sheet from the tracker header.
- `insights-presets` switches date presets (**Year to date**, **Last 90 days**, **Last 12 months**, **Custom**).
- `insights-summary` shows **Workout entries**, **Active days**, and **Most frequent** stats.
- `insights-history` lists past workouts with **Load more** pagination.

## How to get to it (user POV)

- Open **Workouts** from the left sidebar.
- Click the chart icon button **Workout Insights** beside **Export**.
- In the sheet, try preset tabs such as **Year to date** or **Last 90 days**.
- Scroll to **Activity trend**, **Monthly breakdown**, and the **Workouts** list.

## Driving it with cursor-ide-browser

Preconditions:

- Doctor reports healthy `baseUrl`.
- Start at `<baseUrl>/workout-tracker`.

- **Open sheet.** Click button **Workout Insights** (`aria-label="Workout Insights"`). Sheet title **Workout Insights** appears.
- **Presets.** Snapshot shows preset controls **Year to date**, **Last 90 days**, **Last 12 months**, and **Custom**. Click **Last 90 days** (or another preset). Summary row shows **Workout entries**, **Active days**, and **Most frequent**.
- **Sections.** Scroll within the sheet. **Activity trend** and **Monthly breakdown** sections render (empty or with data). **Workouts** heading appears at the bottom when history exists.
- **Close.** Close the sheet with the **Close** button or overlay dismiss.
- **Proof.** Snapshot `artifacts/<RUN_ID>/workout-insights/sheet.aria.txt` and screenshot `artifacts/<RUN_ID>/workout-insights/sheet.png`. Artifacts show **Workout Insights** and at least one preset label.

## Gotchas

- Insights load from `/api/workouts/insights`; signed-in users see account history, guests see localStorage-backed history.
- Preset buttons show short visible text (`YTD`, `90 days`, `12 months`) with full names as `aria-label`. Click by accessible name **Year to date**, **Last 90 days**, **Last 12 months**.
- Type filter checkboxes disable when a workout type has no entries in range.
- Day-level editing is covered by [Workout tracker](./workout-tracker.md); this file covers the insights sheet only.
- Signed-in fetches may briefly show *Loading insights…*. Guest insights compute locally and never show that loading state.
