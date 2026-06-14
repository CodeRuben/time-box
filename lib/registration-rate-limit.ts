import { prisma } from "./prisma";

type RegistrationRateLimitKey = {
  clientIp: string;
  email: string;
};

const TABLE_NAME = "RegistrationRateLimitBucket";
let ensureTablePromise: Promise<void> | null = null;

function maxAttempts(): number {
  const raw = process.env.REGISTRATION_RATE_LIMIT_MAX;
  if (raw === undefined || raw === "") {
    return 5;
  }

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : 5;
}

function globalMaxAttempts(): number {
  const raw = process.env.REGISTRATION_RATE_LIMIT_GLOBAL_MAX;
  if (raw === undefined || raw === "") {
    return 25;
  }

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : 25;
}

function windowMs(): number {
  const raw = process.env.REGISTRATION_RATE_LIMIT_WINDOW_MS;
  if (raw === undefined || raw === "") {
    return 15 * 60 * 1000;
  }

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : 15 * 60 * 1000;
}

function keysFor({ clientIp, email }: RegistrationRateLimitKey) {
  return ["global", `ip:${clientIp}`, `email:${email}`];
}

function limitForBucket(key: string) {
  return key === "global" ? globalMaxAttempts() : maxAttempts();
}

async function ensureTable(): Promise<void> {
  ensureTablePromise ??= prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${TABLE_NAME}" (
      "key" TEXT NOT NULL PRIMARY KEY,
      "attempts" INTEGER NOT NULL DEFAULT 0,
      "resetAtMs" INTEGER NOT NULL
    )
  `).then(async () => {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "RegistrationRateLimitBucket_resetAtMs_idx"
      ON "${TABLE_NAME}"("resetAtMs")
    `);
  }).catch((error) => {
    ensureTablePromise = null;
    throw error;
  });

  return ensureTablePromise;
}

async function incrementBucket(
  key: string,
  now: number,
  resetAtMs: number
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO "RegistrationRateLimitBucket" ("key", "attempts", "resetAtMs")
    VALUES (${key}, 1, ${resetAtMs})
    ON CONFLICT("key") DO UPDATE SET
      "attempts" = CASE
        WHEN "resetAtMs" <= ${now} THEN 1
        ELSE "attempts" + 1
      END,
      "resetAtMs" = CASE
        WHEN "resetAtMs" <= ${now} THEN ${resetAtMs}
        ELSE "resetAtMs"
      END
  `;
}

async function getBucket(key: string): Promise<{ attempts: number } | null> {
  const rows = await prisma.$queryRaw<{ attempts: number }[]>`
    SELECT "attempts", "resetAtMs"
    FROM "RegistrationRateLimitBucket"
    WHERE "key" = ${key}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function consumeRegistrationRateLimit(
  key: RegistrationRateLimitKey
): Promise<boolean> {
  await ensureTable();

  const now = Date.now();
  const resetAtMs = now + windowMs();
  const rateLimitKeys = keysFor(key);

  await prisma.$executeRaw`
    DELETE FROM "RegistrationRateLimitBucket"
    WHERE "resetAtMs" <= ${now}
  `;

  for (const rateLimitKey of rateLimitKeys) {
    await incrementBucket(rateLimitKey, now, resetAtMs);
  }

  for (const rateLimitKey of rateLimitKeys) {
    const bucket = await getBucket(rateLimitKey);
    if (bucket && bucket.attempts > limitForBucket(rateLimitKey)) {
      return true;
    }
  }

  return false;
}

export async function __resetRegistrationRateLimitForTests(): Promise<void> {
  await ensureTable();
  await prisma.$executeRaw`DELETE FROM "RegistrationRateLimitBucket"`;
}
