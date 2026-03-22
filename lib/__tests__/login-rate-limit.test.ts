import { afterEach, describe, expect, it } from "vitest";
import {
  __resetLoginRateLimitForTests,
  getClientIpFromHeaders,
  isLoginRateLimited,
  recordFailedLoginAttempt,
  resetLoginAttempts,
} from "../login-rate-limit";

afterEach(() => {
  __resetLoginRateLimitForTests();
});

describe("getClientIpFromHeaders", () => {
  it("returns first IP from x-forwarded-for", () => {
    expect(
      getClientIpFromHeaders({ "x-forwarded-for": "203.0.113.1, 10.0.0.1" })
    ).toBe("203.0.113.1");
  });

  it("reads x-real-ip when forwarded is absent", () => {
    expect(getClientIpFromHeaders({ "x-real-ip": "198.51.100.2" })).toBe(
      "198.51.100.2"
    );
  });

  it("returns unknown when no proxy headers", () => {
    expect(getClientIpFromHeaders({})).toBe("unknown");
  });
});

describe("login rate limit", () => {
  it("allows attempts below the max", () => {
    const key = "client-a";
    recordFailedLoginAttempt(key);
    recordFailedLoginAttempt(key);
    recordFailedLoginAttempt(key);
    recordFailedLoginAttempt(key);
    expect(isLoginRateLimited(key)).toBe(false);
  });

  it("blocks after max failures in the window", () => {
    const key = "client-b";
    recordFailedLoginAttempt(key);
    recordFailedLoginAttempt(key);
    recordFailedLoginAttempt(key);
    recordFailedLoginAttempt(key);
    recordFailedLoginAttempt(key);
    expect(isLoginRateLimited(key)).toBe(true);
  });

  it("clears failures on reset", () => {
    const key = "client-c";
    recordFailedLoginAttempt(key);
    recordFailedLoginAttempt(key);
    recordFailedLoginAttempt(key);
    recordFailedLoginAttempt(key);
    recordFailedLoginAttempt(key);
    expect(isLoginRateLimited(key)).toBe(true);
    resetLoginAttempts(key);
    expect(isLoginRateLimited(key)).toBe(false);
  });
});
