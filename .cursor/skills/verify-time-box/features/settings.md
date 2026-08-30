# Settings

Lets a signed-in user open account settings and toggle which pages appear in their workspace. Admins additionally manage global feature access by role.

## Sub-features

- `settings-access` requires sign-in; guests redirect to `/login`.
- `settings-workspace` toggles page visibility under **Your workspace** (non-admin users).
- `settings-admin` manages **Administration** feature flags with **Admin**, **User**, and **Guest** switches (admin role only).

## How to get to it (user POV)

- Sign in, then open **Settings** from the account popover (**Account** → **Settings**) or navigate to `/settings`.
- Read the page heading **Settings** and the intro description.
- **Admin (seeded verify user):** under **Administration**, read static groups **Pages** and **System** and flip a role switch (e.g. **Guest** for **Book log**).
- **Non-admin user:** under **Your workspace**, use switches labeled **Show Planner**, **Show Workouts**, etc.

## Driving it with cursor-ide-browser

Preconditions:

- Doctor reports healthy `baseUrl`.
- User signed in with seeded credentials from `control-time-box print-env --run-id <RUN_ID>` (admin account for administration recipe).
- Complete [Sign in](./sign-in.md) when starting from a guest session.

- **Open settings.** Click button **Account**, then link **Settings**. URL is `/settings`. Heading **Settings** is visible.
- **Admin view.** Panel **Administration** shows static groups **Pages** and **System** (not collapsible). Rows include **Planner**, **Workouts**, **Book log**, and **New user registration**. Each row has mini switches **Admin**, **User**, **Guest**.
- **Toggle flag.** Flip one **Guest** switch (e.g. for **Book log**). Brief **Saving...** may appear in the page intro area. Switch state persists after reload.
- **Guest gate.** Sign out or use a fresh guest tab. Navigate to `/settings`. Browser redirects to `/login`.
- **Proof.** Snapshot `artifacts/<RUN_ID>/settings/admin.aria.txt` and screenshot `artifacts/<RUN_ID>/settings/admin.png`. Artifacts show **Settings**, **Administration**, and at least one feature row.

## Gotchas

- `/settings` is auth-only; unauthenticated visits redirect to login.
- Seeded verify credentials (`verify@time-box.local`) are an admin; expect **Administration**, not **Your workspace**.
- Toggling global flags affects nav visibility for all users; restore defaults after verification if needed.
- **Open settings** on a feature-gate card appears only when the user is signed in and no other nav page is available; otherwise a denied page redirects to another allowed route.
