-- CreateTable
CREATE TABLE "RegistrationRateLimitBucket" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "resetAtMs" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "RegistrationRateLimitBucket_resetAtMs_idx" ON "RegistrationRateLimitBucket"("resetAtMs");
