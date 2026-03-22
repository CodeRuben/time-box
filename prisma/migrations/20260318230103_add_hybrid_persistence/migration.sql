-- CreateTable
CREATE TABLE "PlannerDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlannerDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PlannerDay_userId_idx" ON "PlannerDay"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlannerDay_userId_date_key" ON "PlannerDay"("userId", "date");

-- CreateIndex
CREATE INDEX "WorkoutDay_userId_idx" ON "WorkoutDay"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutDay_userId_date_key" ON "WorkoutDay"("userId", "date");
