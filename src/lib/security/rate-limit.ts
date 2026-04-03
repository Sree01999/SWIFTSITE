type RateLimitOptions = {
  scope: string;
  maxRequests: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  limited: boolean;
  retryAfterSeconds: number;
  headers: Record<string, string>;
};

const STORE_KEY = "__swiftsite_rate_limit_store__";

function getStore() {
  const globalWithStore = globalThis as typeof globalThis & {
    [STORE_KEY]?: Map<string, RateLimitEntry>;
  };
  if (!globalWithStore[STORE_KEY]) {
    globalWithStore[STORE_KEY] = new Map<string, RateLimitEntry>();
  }
  return globalWithStore[STORE_KEY]!;
}

function clientIpFromRequest(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

function cleanupExpiredEntries(store: Map<string, RateLimitEntry>, now: number) {
  if (store.size < 5000) return;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(
  request: Request,
  { scope, maxRequests, windowMs }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const ip = clientIpFromRequest(request);
  const key = `${scope}:${ip}`;
  const store = getStore();

  cleanupExpiredEntries(store, now);

  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      limited: false,
      retryAfterSeconds: 0,
      headers: {
        "X-RateLimit-Limit": String(maxRequests),
        "X-RateLimit-Remaining": String(maxRequests - 1),
        "X-RateLimit-Reset": new Date(resetAt).toISOString(),
      },
    };
  }

  const nextCount = current.count + 1;
  store.set(key, { ...current, count: nextCount });
  const remaining = Math.max(0, maxRequests - nextCount);
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((current.resetAt - now) / 1000),
  );

  const limited = nextCount > maxRequests;
  return {
    limited,
    retryAfterSeconds: limited ? retryAfterSeconds : 0,
    headers: {
      "X-RateLimit-Limit": String(maxRequests),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": new Date(current.resetAt).toISOString(),
      ...(limited ? { "Retry-After": String(retryAfterSeconds) } : {}),
    },
  };
}
