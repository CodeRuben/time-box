# Workout export

Lets a user download all saved workouts as a CSV file from the workout tracker.

## Sub-features

- `export-open` opens the export confirmation dialog from the tracker header.
- `export-confirm` starts the CSV download via **Export CSV**.
- `export-sources` reads guest data from localStorage or signed-in data from `/api/workouts/export`.

## How to get to it (user POV)

- Open **Workouts** from the header.
- Click **Export** beside **Workout Insights**.
- In dialog **Export workouts?**, read *Download all your saved workouts as a CSV file.*
- Choose **Export CSV** to download, or **Cancel** to close without exporting.

## Driving it with cursor-ide-browser

Preconditions:

- Doctor reports healthy `baseUrl`.
- At least one workout exists on any day (create via [Workout tracker](./workout-tracker.md) if the export button is disabled with no data).

- **Open dialog.** On `<baseUrl>/workout-tracker`, click button **Export**. Dialog title **Export workouts?** and buttons **Cancel** and **Export CSV** are visible.
- **Confirm export.** Click **Export CSV**. Button may briefly show **Exporting…** with a spinner, then the dialog closes.
- **Download check.** Browser triggers a file download (`workouts-export.csv` or similar). CDP or network inspection can confirm a CSV response when signed in; guest export is generated client-side from localStorage.
- **Cancel path.** Re-open **Export** and click **Cancel**. Dialog closes with no download.
- **Proof.** Screenshot `artifacts/<RUN_ID>/workout-export/dialog.png` showing **Export workouts?** and **Export CSV**.

## Gotchas

- **Export** is disabled while session status is loading or when `isReady` is false; wait for the header to finish loading.
- Guest and signed-in users can both export; data source differs ([Autosave](./autosave.md) surfaces apply only when signed in).
- Empty workout history still opens the dialog but the CSV may contain headers only.
- Insights browsing is covered by [Workout insights](./workout-insights.md); this file covers CSV export only.
