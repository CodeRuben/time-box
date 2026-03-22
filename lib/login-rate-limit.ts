const failureTimestamps = new Map<string, number[]>();

function maxFailures(): number {
  const raw = process.env.LOGIN_RATE_LIMIT_MAX;
  if (raw === undefined || raw === "") {
    return 5;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 5;
}

function windowMs(): number {
  const raw = process.env.LOGIN_RATE_LIMIT_WINDOW_MS;
  if (raw === undefined || raw === "") {
    return 15 * 60 * 1000;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 15 * 60 * 1000;
}

function pruneOld(key: string, now: number): number[] {
  const w = windowMs();
  const timestamps = (failureTimestamps.get(key) ?? []).filter(
    (t) => now - t < w
  );
  failureTimestamps.set(key, timestamps);
  return timestamps;
}

export function getClientIpFromHeaders(
  headers:
    | Record<string, string | string[] | undefined>
    | Headers
    | undefined
): string {
  if (!headers) {
    return "unknown";
  }

  const get = (name: string): string | undefined => {
    if (typeof Headers !== "undefined" && headers instanceof Headers) {
      return headers.get(name) ?? undefined;
    }
    const record = headers as Record<string, string | string[] | undefined>;
    const value =
      record[name] ??
      record[name.toLowerCase()] ??
      record[name.toUpperCase()];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  };

  const forwarded = get("x-forwarded-for") ?? get("X-Forwarded-For");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) {
      return ip;
    }
  }

  const realIp = get("x-real-ip") ?? get("X-Real-IP");
  if (realIp?.trim()) {
    return realIp.trim();
  }

  return "unknown";
}

export function isLoginRateLimited(clientKey: string): boolean {
  const now = Date.now();
  const timestamps = pruneOld(clientKey, now);
  return timestamps.length >= maxFailures();
}

export function recordFailedLoginAttempt(clientKey: string): void {
  const now = Date.now();
  const timestamps = pruneOld(clientKey, now);
  timestamps.push(now);
  failureTimestamps.set(clientKey, timestamps);
}

export function resetLoginAttempts(clientKey: string): void {
  failureTimestamps.delete(clientKey);
}

export function __resetLoginRateLimitForTests(): void {
  failureTimestamps.clear();
}
