# Timeboxing Planner

A personal productivity web app with daily-cadence modules: a timeboxing planner, a workout tracker, and a reading journal. Each module tracks what the user does on a given day.

## Language

### Planner

**Focus List**:
The day's actionable items on the planner, split into Todo and Complete columns.
_Avoid_: Task list (unqualified), kanban

**Focus List Item**:
A single Focus List entry. After creation it behaves like a normal item (complete, reopen, reorder, delete). It can be typed directly into the Focus List, or source metadata may link it to a Priority, Brain Dump line, or Recurring Focus Task occurrence.
_Avoid_: Card, ticket

**Custom Focus Item**:
A Focus List Item created by typing a title directly into the Focus List. The title is snapshotted on the item and is not live-tied to Working Notes or a Priority.
_Avoid_: Manual task, ad-hoc task, typed task (as a domain term)

**Recurring Focus Task**:
An account-scoped schedule definition that can generate a Focus List Item for the logged-in user's local today when the schedule is active. Guests do not have Recurring Focus Tasks.
_Avoid_: Reminder, recurring reminder, cron job

**Occurrence**:
The idempotency record that a Recurring Focus Task already generated (or attempted) for a given local date. Deleting the Focus List Item does not remove the Occurrence, so that day will not regenerate.
_Avoid_: Instance, run

**Active-rest cycle**:
A Recurring Focus Task schedule mode with alternating active and inactive week windows anchored to a start date, plus selected weekdays inside active weeks.
_Avoid_: Sprint rotation (as a separate domain term)

### Reading Journal

**Book**:
A title the user is reading or has read. Tracked as a single read-through — start/end dates and progress live on the Book itself (re-reads are not modeled).
_Avoid_: Reading, read-through

**Entry**:
A single day's journal record for one Book. Holds the Current Page, a Summary, an Analysis, and Thoughts. At most one Entry per Book per day.
_Avoid_: Daily entry, journal entry, log

**Current Page**:
The page the user is on when writing an Entry. Pages read per day is derived by diffing consecutive Entries, never stored.
_Avoid_: Pages read (as a stored field)

**Reading Day**:
A day the user manually ticks on a Book's grid to record that reading happened. Independent of Entries — writing an Entry does not tick the day, and a day can be ticked without an Entry.
_Avoid_: Streak, check-in

**Summary**:
The Entry field describing what was read that day.

**Analysis**:
The Entry field for critical analysis — how the day's reading ties into what came before and what it may mean for the rest of the Book.
_Avoid_: Critical analysis (as a separate concept)

**Thoughts**:
The Entry field for free-form personal reflection, distinct from the structured Summary and Analysis.

**Rating**:
A per-Book score from half a star to 5 stars (stored 1–10). Can be set or changed at any time, regardless of Status.

**Status**:
The Book lifecycle state: Reading, Finished, or Abandoned. Set explicitly, never derived from dates. There is no wishlist state — a Book exists only once the user starts it.
_Avoid_: Want-to-read, backlog

**Book Notes**:
Free-form notes attached to a Book as a whole, independent of any day's Entry.
_Avoid_: Notes (unqualified)

**Product Notes**:
Admin-only private idea notes with a title and optional description, each tagged to a fixed product area (Planner, Workouts, Book log, New page). Captured and managed from the Planner toolbar dialog; not a public feature page.
_Avoid_: Notes (unqualified), Idea notes (as a separate domain term)

**Progress**:
How far through a Book the user is: the Current Page of the latest Entry over the Book's total pages. Always derived, never stored. Current Page may move backwards; Progress simply reflects the latest Entry by date.

**Cover**:
The Book's image, stored as a URL (from Open Library, or edited manually). A placeholder is shown when absent.

### Draft Rankings

**Board**:
The ordered player list for a fantasy football draft. Users can reorder players by dragging; the custom order persists in local storage.
_Avoid_: Rankings (when referring to the in-app list order — prefer Board)

**Position Filter**:
A multi-select control that greys out players whose Position is not in the active set, without changing Board order.
_Avoid_: Filter chips (unqualified)

**Live Draft**:
A Board mode for tracking a draft in progress. The user clicks a player when that player is selected; Taken players stay in place and are visually marked unavailable. Clicking again marks them Available. Reset restores default Board order and clears Taken players.
_Avoid_: Draft tracker, snake draft room

**Taken**:
A player already selected in the current Live Draft. Distinct from Board rank.
_Avoid_: Drafted, unavailable (as stored state names)

**Player Signal**:
A draft-relevant fact or editorial assessment attached to a Player for a dated season snapshot. A Player Signal provides context but does not change Board rank.
_Avoid_: Player trait, Draft tag

**Injury Risk**:
A binary Player Signal for a player whose recent health history and current outlook warrant extra draft caution. It is an editorial watchlist, not a prediction that the player will be injured.

**Veteran Age**:
A Player Signal for a player whose opening-day age meets the established threshold for their Position. The threshold differs by Position and does not claim that the player's performance has already declined.
_Avoid_: Age cliff

**Rookie**:
A Player Signal for a player who entered the NFL in the current season's draft or undrafted free-agent class.

**Team Offense Tier**:
A preseason projection that groups an NFL offense as Good, Mid, or Bad by expected points per game. Offensive Players inherit their NFL team's tier.
_Avoid_: Offense strength (when referring to the tier)

**Contingent Upside**:
A Player Signal for a reserve whose expected role would make them a likely weekly fantasy starter if one named teammate became unavailable.
_Avoid_: Upside (unqualified), Sleeper
