# Timeboxing Planner

A personal productivity web app with daily-cadence modules: a timeboxing planner, a workout tracker, and a reading journal. Each module tracks what the user does on a given day.

## Language

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

**Progress**:
How far through a Book the user is: the Current Page of the latest Entry over the Book's total pages. Always derived, never stored. Current Page may move backwards; Progress simply reflects the latest Entry by date.

**Cover**:
The Book's image, stored as a URL (from Open Library, or edited manually). A placeholder is shown when absent.

### Mock Draft

**Board**:
The ranked player list used for a Mock Draft.
_Avoid_: Rankings (when referring to the in-app list)

**Pick**:
One player selection, identified by its overall number, round, Slot, and player.
_Avoid_: Selection

**Slot**:
A team's 1-based position in the draft order.
_Avoid_: Seed, position

**On the Clock**:
The team whose turn it is to make a Pick.

**Archetype**:
A bot's drafting personality, which influences how it values positions.
_Avoid_: Strategy

**Best Available**:
The undrafted players ordered by Board rank.
_Avoid_: Available players (when referring to the ranked view)

**Grade**:
The post-draft letter score assigned to a team.
