import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET as deployMockGet } from "@/app/api/deploy/mock/route";
import { POST as invoicePayPost } from "@/app/api/billing/invoices/[id]/pay/route";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_ALLOW_DEV = process.env.ALLOW_DEV_ENDPOINTS;

describe("dev endpoint production guard", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production";
    delete process.env.ALLOW_DEV_ENDPOINTS;
  });

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    if (ORIGINAL_ALLOW_DEV === undefined) {
      delete process.env.ALLOW_DEV_ENDPOINTS;
    } else {
      process.env.ALLOW_DEV_ENDPOINTS = ORIGINAL_ALLOW_DEV;
    }
  });

  it("blocks deploy mock endpoint when dev features are disabled", async () => {
    const response = await deployMockGet();
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found." });
  });

  it("blocks dev mark-paid endpoint when dev features are disabled", async () => {
    const response = await invoicePayPost(new Request("http://localhost/test", { method: "POST" }), {
      params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }),
    });
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found." });
  });
});
