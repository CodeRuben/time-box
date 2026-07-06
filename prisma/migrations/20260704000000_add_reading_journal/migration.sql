-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT '',
    "coverUrl" TEXT NOT NULL DEFAULT '',
    "totalPages" INTEGER,
    "publishedYear" INTEGER,
    "openLibraryKey" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'reading',
    "rating" INTEGER,
    "notes" TEXT NOT NULL DEFAULT '',
    "startedOn" TEXT,
    "finishedOn" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Book_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadingEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "currentPage" INTEGER,
    "summary" TEXT NOT NULL DEFAULT '',
    "analysis" TEXT NOT NULL DEFAULT '',
    "thoughts" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReadingEntry_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadingDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReadingDay_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Book_userId_idx" ON "Book"("userId");

-- CreateIndex
CREATE INDEX "Book_userId_status_idx" ON "Book"("userId", "status");

-- CreateIndex
CREATE INDEX "ReadingEntry_userId_date_idx" ON "ReadingEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingEntry_bookId_date_key" ON "ReadingEntry"("bookId", "date");

-- CreateIndex
CREATE INDEX "ReadingDay_userId_idx" ON "ReadingDay"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingDay_bookId_date_key" ON "ReadingDay"("bookId", "date");
