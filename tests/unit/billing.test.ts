import { afterEach, describe, expect, it } from "vitest";

import {
  BUILD_FEE_CENTS,
  BUILD_FEE_LABEL,
  MAINTENANCE_CENTS,
  MAINTENANCE_LABEL,
  amountForChargeType,
  labelForChargeType,
} from "@/lib/billing/constants";
import { getBillingEnv } from "@/lib/billing/env";

const ORIGINAL_ENV = { ...process.env };

describe("billing constants", () => {
  it("returns correct amounts for charge types", () => {
    expect(amountForChargeType("build_fee")).toBe(BUILD_FEE_CENTS);
    expect(amountForChargeType("maintenance")).toBe(MAINTENANCE_CENTS);
  });

  it("returns correct labels for charge types", () => {
    expect(labelForChargeType("build_fee")).toBe(BUILD_FEE_LABEL);
    expect(labelForChargeType("maintenance")).toBe(MAINTENANCE_LABEL);
  });
});

describe("billing env", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("uses localhost app url and disables stripe by default", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const env = getBillingEnv();
    expect(env.appUrl).toBe("http://localhost:3000");
    expect(env.stripeEnabled).toBe(false);
    expect(env.stripeSecretKey).toBeNull();
    expect(env.stripeWebhookSecret).toBeNull();
  });

  it("trims env values and enables stripe when secret key is present", () => {
    process.env.NEXT_PUBLIC_APP_URL = " https://app.example.com ";
    process.env.STRIPE_SECRET_KEY = " sk_test_123 ";
    process.env.STRIPE_WEBHOOK_SECRET = " whsec_123 ";

    const env = getBillingEnv();
    expect(env.appUrl).toBe("https://app.example.com");
    expect(env.stripeSecretKey).toBe("sk_test_123");
    expect(env.stripeWebhookSecret).toBe("whsec_123");
    expect(env.stripeEnabled).toBe(true);
  });
});
