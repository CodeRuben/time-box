-- CreateTable
CREATE TABLE "RecurringFocusTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TEXT,
    "endDate" TEXT,
    "schedule" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringFocusTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecurringFocusTaskOccurrence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recurringFocusTaskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "focusListItemId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecurringFocusTaskOccurrence_recurringFocusTaskId_fkey" FOREIGN KEY ("recurringFocusTaskId") REFERENCES "RecurringFocusTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RecurringFocusTask_userId_idx" ON "RecurringFocusTask"("userId");

-- CreateIndex
CREATE INDEX "RecurringFocusTask_userId_enabled_idx" ON "RecurringFocusTask"("userId", "enabled");

-- CreateIndex
CREATE INDEX "RecurringFocusTaskOccurrence_userId_date_idx" ON "RecurringFocusTaskOccurrence"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringFocusTaskOccurrence_recurringFocusTaskId_date_key" ON "RecurringFocusTaskOccurrence"("recurringFocusTaskId", "date");
