# Recurring Focus Tasks — Implementation Plan

Add account-scoped recurring tasks that automatically create focus-list items for the logged-in user's current day. This replaces the existing reminder feature on the planner page.

Read `CONTEXT.md` before implementing and add/update the planner vocabulary there if this repo is keeping feature terminology current.

## Decisions Already Made

| Topic | Decision |
|---|---|
| Feature scope | Logged-in users only. Guests keep the existing planner experience, but do not see the recurring-tasks control. |
| Reminder feature | Remove reminder functionality from the app. The recurring-tasks button replaces the reminders button on the planner page. No reminder migration. Old localStorage reminder data may remain unused. |
| Generation trigger | Generate lazily when an authenticated user loads the planner for their current local today. No background cron. |
| Past/future behavior | Do not create items for past dates. Do not create items for future selected dates. Do not catch up missed days. |
| Schedule granularity | Match by local date only. No hour/minute scheduling in v1. |
| Date range | Optional start and end dates are inclusive. |
| Schedule modes | Weekly day-of-week rules, plus anchored active/rest week cycles for sprint rotations. |
| Sprint example | Support "2 active weeks / 2 inactive weeks", anchored by a start date, with selected weekdays inside active weeks. |
| Idempotency | Store generated occurrence records keyed by recurring task + date. Each recurring task may create at most one focus item per day. |
| Same-day deletion | If the user deletes the generated focus-list item, it stays gone for that day and is not regenerated. |
| Generated items | Behave like normal focus-list items after creation: complete, reopen, reorder, and delete all work normally. Hidden source metadata links them back to the recurring task/occurrence. |
| Disabled tasks | Disabling stops future generation only. Existing planner-day items and occurrence history remain untouched. |
| Deleted tasks | Hard-delete the recurring task definition and its occurrence rows. Do not delete any focus-list items already created on planner days. |
| Editing tasks | Edits only affect future generation. Existing planner-day items keep their original title/source snapshot. |
| Dialog UX | The planner action opens a management dialog first, listing existing recurring tasks with a Create button. Create/edit happen in dialogs. |
| Task fields | Title, optional notes/description, enabled flag, schedule. Generated focus-list item displays the title only. |
| Item placement | Append generated items to the end of the Todo column. |

## Existing Architecture To Preserve

- The planner page is `app/page.tsx`, wrapped in `FeatureGate featureKey="planner"`.
- Authenticated planner data is persisted through `app/api/planner/[date]/route.ts` into `PlannerDay.data` JSON.
- Guest planner data uses localStorage through `lib/use-planner-storage.ts`.
- Focus-list items live in `PlannerData.focusList` and are manipulated by helpers in `lib/focus-list.ts`.
- Focus-list item source identity is defined in `lib/focus-item-source.ts`.
- Use shadcn/ui components already in the repo: `Dialog`, `AlertDialog`, `Button`, `Input`, `Textarea`, `Checkbox`, `Select`, `Badge`, `DatePicker`, `Popover` if needed.

## Target Data Model

Add structured Prisma models instead of putting recurring task definitions inside `PlannerDay.data`.

```prisma
model User {
  // existing fields...
  recurringFocusTasks RecurringFocusTask[]
}

model RecurringFocusTask {
  id          String   @id @default(cuid())
  userId      String
  title       String
  notes       String   @default("")
  enabled     Boolean  @default(true)
  startDate   String?
  endDate     String?
  schedule    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  occurrences RecurringFocusTaskOccurrence[]

  @@index([userId])
  @@index([userId, enabled])
}

model RecurringFocusTaskOccurrence {
  id                    String   @id @default(cuid())
  recurringFocusTaskId  String
  userId                String
  date                  String
  focusListItemId       String
  createdAt             DateTime @default(now())
  recurringFocusTask    RecurringFocusTask @relation(fields: [recurringFocusTaskId], references: [id], onDelete: Cascade)

  @@unique([recurringFocusTaskId, date])
  @@index([userId, date])
}
```

`schedule` is JSON stored as a string. Keep date fields as local `YYYY-MM-DD` strings, matching `PlannerDay`.

Recommended TypeScript schedule shape:

```typescript
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0

export type RecurringFocusTaskSchedule =
  | {
      type: "weekly";
      weekdays: Weekday[];
    }
  | {
      type: "active_rest_weeks";
      weekdays: Weekday[];
      anchorDate: string; // YYYY-MM-DD, first day of first active window
      activeWeeks: number; // v1 UI can default to 2
      inactiveWeeks: number; // v1 UI can default to 2
    };
```

Validation rules:

- `title.trim()` is required.
- `notes` is optional, trim before saving.
- `startDate`, `endDate`, and `anchorDate` must be valid date keys when present.
- If both start and end date are present, `startDate <= endDate`.
- `weekdays` must be non-empty and contain only 0-6.
- For cycle schedules, `activeWeeks >= 1`, `inactiveWeeks >= 1`, and `anchorDate` is required.
- Normalize weekday arrays to sorted unique values before saving.

## Focus Item Source Changes

Extend `FocusItemSource` in `lib/focus-item-source.ts`:

```typescript
export type FocusItemSource =
  | { type: "priority"; priorityId: string; label: string }
  | { type: "brain_dump"; text: string }
  | {
      type: "recurring_task";
      recurringTaskId: string;
      occurrenceId: string;
      label: string;
    };
```

Use a stable key such as `recurring:${source.occurrenceId}` in `getFocusItemSourceKey`.

Update `lib/focus-list.ts`:

- `getFocusListItemLabel` returns `source.label` for `recurring_task`.
- `getFocusListItemSubitems` returns `[]` for `recurring_task`.
- `isValidFocusListItem` accepts `recurring_task` only when `recurringTaskId`, `occurrenceId`, and `label` are strings.
- Keep copied/deleted/generated items independent of the task definition. The label snapshot is required because definitions can be deleted later.

## Schedule Helpers

Create `lib/recurring-focus-tasks/types.ts` and `lib/recurring-focus-tasks/schedule.ts`.

Core helpers:

- `parseRecurringFocusTaskSchedule(raw: unknown): RecurringFocusTaskSchedule | null`
- `serializeRecurringFocusTaskSchedule(schedule: RecurringFocusTaskSchedule): string`
- `isRecurringFocusTaskActiveOnDate(task, dateKey): boolean`
- `getWeekdayFromDateKey(dateKey): Weekday`
- `getWholeWeeksBetween(anchorDateKey, dateKey): number`

Active check algorithm:

1. Reject disabled tasks before calling schedule matching.
2. Reject date before `startDate`, if present.
3. Reject date after `endDate`, if present.
4. Reject if selected weekday is not in `schedule.weekdays`.
5. Weekly schedule matches after those checks.
6. Active/rest schedule:
   - Reject dates before `anchorDate`.
   - Compute whole weeks between `anchorDate` and `dateKey`.
   - `cycleLength = activeWeeks + inactiveWeeks`.
   - `weekInCycle = wholeWeeks % cycleLength`.
   - Match when `weekInCycle < activeWeeks`.

Use local-date math that avoids UTC rollover surprises. Prefer converting date keys to local `Date(year, monthIndex, day)` values and compare midnight-local timestamps.

Unit tests should cover:

- Weekday matching.
- Inclusive start/end dates.
- No match before anchor date.
- 2-active/2-inactive cycle boundaries.
- Sorted/unique weekday normalization.
- Invalid schedule parsing.

## API Surface

Add authenticated routes guarded with `requireFeatureUser("planner", "Planner is disabled")`, since recurring focus tasks are part of the planner feature.

| Route | Methods | Purpose |
|---|---|---|
| `/api/recurring-focus-tasks` | GET, POST | List current user's tasks; create a task |
| `/api/recurring-focus-tasks/[id]` | PATCH, DELETE | Update/disable/enable a task; hard-delete definition and occurrence rows |

Response DTO:

```typescript
export interface RecurringFocusTaskDto {
  id: string;
  title: string;
  notes: string;
  enabled: boolean;
  startDate: string | null;
  endDate: string | null;
  schedule: RecurringFocusTaskSchedule;
  createdAt: string;
  updatedAt: string;
}
```

API behavior:

- Every query must filter by `userId`.
- `PATCH` is partial, but validate the merged task state before saving.
- `DELETE` hard-deletes the task. `RecurringFocusTaskOccurrence` rows cascade. Do not inspect or mutate `PlannerDay`.
- Return `404` when the task id does not belong to the current user.
- Keep route logic thin; put validation/serialization in library helpers.

## Generation In Planner Load

Generation should happen during authenticated planner-day load, not from a separate client-only write after load.

Update `loadPlannerDataFromAccount` in `lib/use-planner-storage.ts` to include a query flag only when the selected planner date equals the browser's local today:

```typescript
const shouldApplyRecurring = formatDateKey(date) === formatDateKey(new Date());
const url = shouldApplyRecurring
  ? `${PLANNER_API_PREFIX}/${formatDateKey(date)}?applyRecurring=true&today=${formatDateKey(new Date())}`
  : `${PLANNER_API_PREFIX}/${formatDateKey(date)}`;
```

Update `app/api/planner/[date]/route.ts`:

- Parse `applyRecurring=true` and `today`.
- Validate `today` with `isDateKey`.
- Only apply when `date === today`. This preserves the "today only" rule even if the client sends a bad future/past request.
- For normal GETs, keep current behavior.
- For apply GETs, run generation before returning planner data.

Generation algorithm inside a transaction:

1. Load or initialize the `PlannerDay` for `userId + date`.
2. Hydrate the JSON into planner data. Reuse or share the same validation defaults as `hydratePlannerData`; if needed, extract server-safe planner parsing to a shared non-client module first.
3. Query enabled recurring tasks for the user.
4. Filter tasks with `isRecurringFocusTaskActiveOnDate(task, date)`.
5. For each matching task:
   - If an occurrence already exists for `task.id + date`, skip it.
   - Create a new focus-list item id and create an occurrence row with that id.
   - Append a focus-list item to `focusList` with source `{ type: "recurring_task", recurringTaskId: task.id, occurrenceId, label: task.title }`, status `"todo"`, and the next todo order.
6. If no items were added, return the existing planner day data.
7. If items were added, upsert/update `PlannerDay.data` with the modified JSON and a new `lastSaved`.

Concurrency notes:

- The unique index on `[recurringFocusTaskId, date]` is the hard idempotency guard.
- Handle unique-conflict races by skipping the losing insert and not adding a duplicate focus-list item.
- Keep occurrence creation and `PlannerDay` JSON update in the same transaction.

Important behavior:

- If a generated focus-list item is later deleted by the user, the occurrence remains. Reloading today must not recreate it.
- If a recurring task is disabled after today's item was generated, today's item remains.
- If a task is deleted after today's item was generated, today's item remains because it is stored in `PlannerDay.data`.

## Planner UI

Replace the reminders button in `app/page.tsx`.

Remove:

- `ReminderButton`
- `CreateReminderDialog`
- `ReminderInfoDialog`
- `DeleteReminderAlert`
- `useReminderStorage`
- Reminder state and handlers in `PlannerPageContent`

Add:

- `RecurringTasksButton` in `app/planner/components/recurring-tasks-button.tsx`
- `RecurringTasksDialog` in `app/planner/components/recurring-tasks-dialog.tsx`
- `RecurringTaskFormDialog` in `app/planner/components/recurring-task-form-dialog.tsx`
- `DeleteRecurringTaskAlert` in `app/planner/components/delete-recurring-task-alert.tsx`
- `useRecurringFocusTasks` hook, either in `lib/use-recurring-focus-tasks.ts` or `app/planner/hooks/use-recurring-focus-tasks.ts`

Suggested planner header behavior:

- Show the button only when `useSession().status === "authenticated"`.
- Button label/icon can use `Repeat` or `CalendarClock` from `lucide-react`.
- The button opens the management dialog.
- Do not show the button to guests.

Management dialog:

- Title: "Recurring tasks"
- Description: "Create tasks that are added to today's focus list when their schedule is active."
- Empty state with "Create recurring task".
- List tasks sorted enabled first, then newest/updated.
- Each row/card shows title, enabled/disabled badge, human-readable schedule summary, optional date range, and actions: Edit, Disable/Enable, Delete.
- Create button opens the form dialog.

Form dialog:

- Fields:
  - Title input
  - Notes textarea
  - Enabled checkbox/switch
  - Optional start date
  - Optional end date
  - Schedule type select: Weekly / Active-rest cycle
  - Weekday checkboxes
  - For active-rest cycle: anchor date, active weeks, inactive weeks
- Defaults:
  - Enabled: true
  - Schedule type: Weekly
  - Weekdays: Monday-Friday for a new task, because the primary example is workday code reviews
  - Cycle active/inactive weeks: 2 and 2
  - Anchor date: current local today
- Validation should disable Save and show concise inline errors.

Human-readable schedule examples:

- "Every Mon-Fri"
- "Every Tue and Thu, Jan 1-Mar 31"
- "2 weeks on / 2 weeks off, Mon-Fri, anchored Jul 20"

## Hook Behavior

`useRecurringFocusTasks` should own API calls for the dialog:

```typescript
export function useRecurringFocusTasks(enabled: boolean) {
  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    reload,
  };
}
```

- Only fetch when the dialog opens and the user is authenticated.
- Optimistically update only for simple enabled toggles if desired; otherwise reload after mutations.
- Surface a plain error message in the dialog.
- Do not mix this hook into planner-day storage/generation. The planner-day GET handles generation.

## Reminder Removal Checklist

Remove these files if no longer referenced:

- `lib/use-reminder-storage.ts`
- `app/planner/components/reminder-button.tsx`
- `app/planner/components/create-reminder-dialog.tsx`
- `app/planner/components/reminder-info-dialog.tsx`
- `app/planner/components/delete-reminder-alert.tsx`

Then search for and remove remaining reminder references:

- `Reminder`
- `reminder`
- `useReminderStorage`
- `ReminderButton`
- `CreateReminderDialog`
- `DeleteReminderAlert`
- localStorage key `"reminders"` references

Do not add migration code.

## Implementation Phases

### Phase 1 — Schema And Pure Helpers

Files:

- `prisma/schema.prisma`
- `lib/recurring-focus-tasks/types.ts`
- `lib/recurring-focus-tasks/schedule.ts`
- `lib/recurring-focus-tasks/validation.ts`
- `lib/__tests__/recurring-focus-tasks-schedule.test.ts`
- `lib/__tests__/recurring-focus-tasks-validation.test.ts`

Tasks:

- Add Prisma models and generate a migration.
- Add schedule types, parsing, serialization, and active-date matching.
- Add validation helpers for API payloads.
- Add tests for weekly and active/rest schedules.

Verification:

- `npm run lint`
- `npm run test -- recurring-focus-tasks`

### Phase 2 — Focus Item Source Support

Files:

- `lib/focus-item-source.ts`
- `lib/focus-list.ts`
- Existing focus-list tests, plus new cases in `lib/__tests__/focus-list.test.ts` or `lib/__tests__/focus-item-source.test.ts`

Tasks:

- Add `recurring_task` focus item source.
- Ensure labels resolve without needing the recurring task definition.
- Ensure parser accepts valid generated items and rejects malformed ones.
- Ensure source keys are stable and unique per occurrence.

Verification:

- `npm run lint`
- `npm run test -- focus`

### Phase 3 — Recurring Task API

Files:

- `app/api/recurring-focus-tasks/route.ts`
- `app/api/recurring-focus-tasks/[id]/route.ts`
- Supporting library mappers under `lib/recurring-focus-tasks/`

Tasks:

- Implement list/create/update/delete routes.
- Guard all routes with `requireFeatureUser("planner", "Planner is disabled")`.
- Scope every read/write by `userId`.
- Hard-delete definitions; let occurrence rows cascade.

Verification:

- `npm run lint`
- `npm run test`

### Phase 4 — Planner Load Generation

Files:

- `app/api/planner/[date]/route.ts`
- `lib/use-planner-storage.ts`
- New server helper such as `lib/recurring-focus-tasks/apply.ts`
- Tests for generation helper if factored as pure/semi-pure logic

Tasks:

- Add the `applyRecurring=true&today=YYYY-MM-DD` account-load path.
- Apply only when route date equals the provided local today date.
- Generate matching recurring focus-list items transactionally.
- Record occurrences for idempotency.
- Preserve normal planner GET/PUT behavior.

Verification cases:

- Loading today creates matching items once.
- Reloading today does not duplicate items.
- Loading future matching date does not create items.
- Loading past matching date does not create items.
- Deleting a generated focus-list item does not regenerate it.
- Disabled tasks do not generate.
- Deleted task definitions do not remove existing planner items.

### Phase 5 — Planner UI And Reminder Removal

Files:

- `app/page.tsx`
- New planner recurring task components/hooks
- Delete reminder files listed above

Tasks:

- Replace reminders button with authenticated-only recurring tasks button.
- Add management dialog.
- Add create/edit form dialog.
- Add delete confirmation.
- Add enable/disable action.
- Remove reminder imports, state, handlers, and files.
- Keep guest planner behavior otherwise unchanged.

Verification:

- Guest: no recurring-tasks button, planner still works with local storage.
- Logged in: button appears, task list loads, create/edit/disable/delete work.
- Creating a Mon-Fri task and loading today's planner adds one focus item if today matches.
- Generated item can be reordered, completed, reopened, and deleted.

### Phase 6 — Polish And Regression Pass

Tasks:

- Add accessible labels and dialog descriptions.
- Confirm mobile layout of the management and form dialogs.
- Confirm dark mode.
- Confirm no reminder references remain.
- Run full checks.

Verification:

- `npm run lint`
- `npm run test`
- Manual planner smoke test as guest and authenticated user.

## Known Risks

- `PlannerDay.data` is JSON, so generation must parse and write carefully. Extract shared server-safe planner parsing if current client-only helpers are not reusable.
- Transaction/idempotency is important because the page can load more than once. Do not rely on focus-list label matching.
- Date math must stay local-date based. Avoid `new Date("YYYY-MM-DD")` for schedule math because that parses as UTC in JavaScript.
- Reminder removal may expose dead imports in planner components. Search broadly after deleting files.
- Existing uncommitted mock-draft changes are unrelated; do not modify them while implementing this feature.
