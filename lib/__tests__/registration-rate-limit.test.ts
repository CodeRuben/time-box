import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetRegistrationRateLimitForTests,
  consumeRegistrationRateLimit,
} from "../registration-rate-limit";

const originalMax = process.env.REGISTRATION_RATE_LIMIT_MAX;
const originalGlobalMax = process.env.REGISTRATION_RATE_LIMIT_GLOBAL_MAX;

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

beforeEach(async () => {
  process.env.REGISTRATION_RATE_LIMIT_MAX = "5";
  process.env.REGISTRATION_RATE_LIMIT_GLOBAL_MAX = "5";
  await __resetRegistrationRateLimitForTests();
});

afterEach(async () => {
  await __resetRegistrationRateLimitForTests();
});

afterAll(() => {
  restoreEnv("REGISTRATION_RATE_LIMIT_MAX", originalMax);
  restoreEnv("REGISTRATION_RATE_LIMIT_GLOBAL_MAX", originalGlobalMax);
});

describe("registration rate limit", () => {
  it("allows attempts through the limit", async () => {
    const key = { clientIp: "203.0.113.1", email: "user@example.com" };

    await expect(consumeRegistrationRateLimit(key)).resolves.toBe(false);
    await expect(consumeRegistrationRateLimit(key)).resolves.toBe(false);
    await expect(consumeRegistrationRateLimit(key)).resolves.toBe(false);
    await expect(consumeRegistrationRateLimit(key)).resolves.toBe(false);
    await expect(consumeRegistrationRateLimit(key)).resolves.toBe(false);
  });

  it("blocks after max attempts for an IP", async () => {
    const clientIp = "203.0.113.2";

    for (let i = 0; i < 5; i += 1) {
      await consumeRegistrationRateLimit({
        clientIp,
        email: `user-${i}@example.com`,
      });
    }

    expect(
      await consumeRegistrationRateLimit({
        clientIp,
        email: "another-user@example.com",
      })
    ).toBe(true);
  });

  it("blocks after max attempts for an email", async () => {
    const email = "user@example.com";

    for (let i = 0; i < 5; i += 1) {
      await consumeRegistrationRateLimit({
        clientIp: `203.0.113.${i}`,
        email,
      });
    }

    expect(
      await consumeRegistrationRateLimit({
        clientIp: "203.0.113.99",
        email,
      })
    ).toBe(true);
  });

  it("blocks after max attempts globally", async () => {
    for (let i = 0; i < 5; i += 1) {
      await consumeRegistrationRateLimit({
        clientIp: `203.0.113.${i}`,
        email: `user-${i}@example.com`,
      });
    }

    expect(
      await consumeRegistrationRateLimit({
        clientIp: "198.51.100.1",
        email: "another-user@example.com",
      })
    ).toBe(true);
  });
});
