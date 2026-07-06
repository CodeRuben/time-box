# Reading journal is signed-in only

Every existing module (planner, tasks, workouts) supports guests via localStorage with Prisma sync for authenticated users. The reading journal deliberately breaks this pattern: it is Prisma/API-only and unavailable to guests. Its data is long-lived and relational (Book → Entries → Reading Days, external cover images), which makes a localStorage mirror disproportionately expensive compared to the day-scoped JSON blobs the other modules mirror — and the journal only makes sense as a durable, cross-device record.
