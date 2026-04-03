import { describe, expect, it } from "vitest";

import { GET, POST } from "@/app/api/deploy/mock/route";

describe("deploy mock route", () => {
  it("returns health response on GET", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.message).toContain("Mock deploy hook is reachable");
  });

  it("returns generated deployment payload on POST", async () => {
    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.id).toBeTypeOf("string");
    expect(payload.deploymentId).toBe(payload.id);
    expect(payload.url).toMatch(/^https:\/\/preview-[a-z0-9]+\.swift\.local$/);
  });
});
