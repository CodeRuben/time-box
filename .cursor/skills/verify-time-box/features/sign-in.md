# Sign in

Lets a user authenticate with email and password and reach the signed-in account menu.

## Sub-features

- `sign-in-form` submits valid credentials.
- `sign-in-account` shows account popover with email after login.
- `sign-in-settings-link` exposes Settings from the account menu.

## How to get to it (user POV)

- Choose **Sign in** (header icon link) or open `/login`.
- Enter **Email** and **Password**.
- Choose **Sign in**.

## Driving it with cursor-ide-browser

Preconditions:

- Verification instance launched (DB seeded).
- Credentials from `control-time-box print-env --run-id <RUN_ID>` (`adminEmail`, `adminPassword`).

- **Open login.** Navigate to `<baseUrl>/login`. Heading **Sign in** and fields **Email**, **Password** are visible.
- **Submit.** Fill email and password fields. Click button **Sign in**. URL becomes `/` (or planner) without **Invalid email or password** alert.
- **Account menu.** Click button **Account**. Popover shows seeded email and **Settings** link.
- **Proof.** Snapshot `artifacts/<RUN_ID>/sign-in/account.aria.txt` and screenshot `artifacts/<RUN_ID>/sign-in/account.png`. Artifacts show the seeded email in the account popover.

## Gotchas

- Too many failed attempts triggers rate limiting; use fresh run ID if locked out.
- Registration link appears only when registration feature flag allows it; do not rely on it for this recipe.
- After sign-in, planner autosaves to the server; guest localStorage data for the same day may still exist until overwritten.
