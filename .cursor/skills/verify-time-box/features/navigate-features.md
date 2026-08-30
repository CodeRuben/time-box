# Navigate features

Lets a user move between primary app areas using the header navigation.

## Sub-features

- `nav-workouts` opens the workout tracker page.
- `nav-planner` returns to the planner from another page.
- `nav-book-log` opens book log when enabled for the signed-in user.
- `nav-mobile-menu` opens the full-screen sheet on small viewports.

## How to get to it (user POV)

- **Desktop (md and up):** use header links **Planner**, **Workouts**, and **Book log** (when visible).
- **Mobile:** tap **Open menu**, then choose **Planner**, **Workouts**, or **Book log** in the sheet.

## Driving it with cursor-ide-browser

Preconditions:

- Doctor `ok: true`.
- Start at `<baseUrl>/`.

- **Workouts (desktop).** At desktop width, click link **Workouts**. URL path is `/workout-tracker`. Page shows workout tracker UI (calendar or day controls).
- **Planner (desktop).** Click link **Planner**. URL is `/`. Heading **Daily Timeboxing Planner** returns.
- **Mobile menu.** Set viewport to ~390px width. Button **Open menu** is visible; inline **Planner** / **Workouts** links are not. Tap **Open menu**. Sheet shows heading **Menu**, logo, and nav links. Tap **Workouts**. URL is `/workout-tracker` and the sheet closes.
- **Book log (signed-in).** After sign-in, open **Book log** via desktop link or mobile sheet. URL prefix `/reading-journal`. Heading **Book log** is visible.
- **Proof.** Screenshot `artifacts/<RUN_ID>/navigate-features/workouts.png` on the workouts page and `planner.png` after return. For mobile, capture `mobile-menu.png` with the sheet open. For book log, capture `book-log-nav.png` when signed in. Skip book log with reason if the link is hidden by feature access.

## Gotchas

- Nav items load from `/api/settings/navigation`; wait for links to replace loading skeleton.
- Book log requires authentication per product ADR; guests may not see the link.
- On mobile the site logo lives in the menu sheet header, not the main header bar.
- Workout and book log in-page behavior is covered by [Workout tracker](./workout-tracker.md) and [Book log](./book-log.md).
