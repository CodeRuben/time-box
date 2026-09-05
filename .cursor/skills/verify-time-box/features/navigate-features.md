# Navigate features

Lets a user move between primary app areas using the left sidebar (desktop) or the hamburger menu (small screens).

## Sub-features

- `nav-workouts` opens the workout tracker page.
- `nav-planner` returns to the planner from another page.
- `nav-book-log` opens book log when enabled for the signed-in user.
- `nav-mobile-menu` opens the full-screen sheet on small viewports.

## How to get to it (user POV)

- **Desktop (md and up):** use the narrow left sidebar links **Planner**, **Workouts**, and **Books** (when visible). Each link shows an icon with the label underneath.
- **Mobile:** tap the icon button with accessible name **Open menu**, then choose **Planner**, **Workouts**, or **Books** in the sheet.

## Driving it with cursor-ide-browser

Preconditions:

- Doctor `ok: true`.
- Start at `<baseUrl>/`.

- **Workouts (desktop).** At desktop width, click sidebar link **Workouts**. URL path is `/workout-tracker`. Page shows workout tracker UI (calendar or day controls). The sidebar stays visible on the left.
- **Planner (desktop).** Click sidebar link **Planner**. URL is `/`. Heading **Daily Timeboxing Planner** returns.
- **Mobile menu.** Set viewport to ~390px width. Button **Open menu** is visible in the top bar; the left sidebar is not. Tap **Open menu**. Sheet shows heading **Menu**, logo, and nav links with icons. Tap **Workouts**. URL is `/workout-tracker` and the sheet closes.
- **Books (signed-in).** After sign-in, open **Books** via desktop sidebar or mobile sheet. URL prefix `/reading-journal`. Heading **Books** is visible.
- **Proof.** Screenshot `artifacts/<RUN_ID>/navigate-features/workouts.png` on the workouts page and `planner.png` after return. For mobile, capture `mobile-menu.png` with the sheet open. For book log, capture `book-log-nav.png` when signed in. Skip book log with reason if the link is hidden by feature access.

## Gotchas

- Nav items load from `/api/settings/navigation`; wait for links to replace loading skeleton.
- Books requires authentication per product ADR; guests never see the link.
- **Open menu** is an icon-only button (`aria-label="Open menu"`), not visible text.
- On mobile the site logo lives in the menu sheet header, not the top bar. On desktop the **Timebox** mark lives at the top of the sidebar.
- Desktop account and theme controls live at the bottom of the sidebar, not in a top header.
- Workout and book log in-page behavior is covered by [Workout tracker](./workout-tracker.md) and [Book log](./book-log.md).
