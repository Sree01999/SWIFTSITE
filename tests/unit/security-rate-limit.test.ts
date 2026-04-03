import { describe, expect, it } from "vitest";

import { checkRateLimit } from "@/lib/security/rate-limit";

function makeRequest(ip: string) {
  return new Request("http://localhost/test", {
    method: "POST",
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

describe("rate limit helper", () => {
  it("allows requests up to max and limits after threshold", () => {
    const ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
    const options = {
      scope: "unit-test-rate-limit",
      maxRequests: 2,
      windowMs: 60_000,
    };

    const first = checkRateLimit(makeRequest(ip), options);
    const second = checkRateLimit(makeRequest(ip), options);
    const third = checkRateLimit(makeRequest(ip), options);

    expect(first.limited).toBe(false);
    expect(second.limited).toBe(false);
    expect(third.limited).toBe(true);
    expect(Number(third.headers["Retry-After"])).toBeGreaterThanOrEqual(1);
  });

  it("tracks limits independently per client ip", () => {
    const options = {
      scope: "unit-test-rate-limit-per-ip",
      maxRequests: 1,
      windowMs: 60_000,
    };

    const a1 = checkRateLimit(makeRequest("198.51.100.10"), options);
    const a2 = checkRateLimit(makeRequest("198.51.100.10"), options);
    const b1 = checkRateLimit(makeRequest("198.51.100.11"), options);

    expect(a1.limited).toBe(false);
    expect(a2.limited).toBe(true);
    expect(b1.limited).toBe(false);
  });
});
