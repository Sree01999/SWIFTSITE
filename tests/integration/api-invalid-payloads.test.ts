import { describe, expect, it } from "vitest";

import { POST as billingCheckoutPost } from "@/app/api/billing/checkout/route";
import { POST as authLoginPost } from "@/app/api/auth/login/route";
import { POST as authRegisterPost } from "@/app/api/auth/register/route";
import { POST as deployPost } from "@/app/api/deploy/route";
import { POST as domainsPost } from "@/app/api/domains/route";

function makeJsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API payload validation", () => {
  it("rejects invalid login payload", async () => {
    const response = await authLoginPost(
      makeJsonRequest("http://localhost/api/auth/login", {
        email: "invalid",
        password: "123",
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid login payload.",
    });
  });

  it("rejects invalid register payload", async () => {
    const response = await authRegisterPost(
      makeJsonRequest("http://localhost/api/auth/register", {
        email: "invalid",
        password: "123",
        name: "",
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid registration payload.",
    });
  });

  it("rejects invalid deploy payload", async () => {
    const response = await deployPost(
      makeJsonRequest("http://localhost/api/deploy", {
        projectId: "not-a-uuid",
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid deploy payload.",
    });
  });

  it("rejects invalid domains payload", async () => {
    const response = await domainsPost(
      makeJsonRequest("http://localhost/api/domains", {
        projectId: "not-a-uuid",
        domain: "",
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid domain payload.",
    });
  });

  it("rejects invalid billing checkout payload", async () => {
    const response = await billingCheckoutPost(
      makeJsonRequest("http://localhost/api/billing/checkout", {
        clientId: "bad",
        chargeType: "none",
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid checkout payload.",
    });
  });
});
