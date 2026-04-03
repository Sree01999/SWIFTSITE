import { describe, expect, it } from "vitest";

import {
  capabilityStatusClasses,
  capabilityStatusLabel,
  getCapability,
  getCapabilitySummary,
  getCapabilities,
  isCapabilityEnabled,
} from "@/lib/capabilities";

describe("capabilities", () => {
  it("loads capabilities from config", () => {
    const capabilities = getCapabilities();
    expect(capabilities.length).toBeGreaterThan(0);
  });

  it("returns known capability and null for unknown ids", () => {
    expect(getCapability("auth-login")?.id).toBe("auth-login");
    expect(getCapability("missing-capability-id")).toBeNull();
  });

  it("treats working and partial capabilities as enabled", () => {
    expect(isCapabilityEnabled("auth-login")).toBe(true);
    expect(isCapabilityEnabled("billing-checkout")).toBe(true);
    expect(isCapabilityEnabled("missing-capability-id")).toBe(false);
  });

  it("maps status to labels and classes", () => {
    expect(capabilityStatusLabel("working")).toBe("Working");
    expect(capabilityStatusLabel("partial")).toBe("Partial");
    expect(capabilityStatusLabel("stub")).toBe("Stub");
    expect(capabilityStatusLabel("out_of_scope")).toBe("Out of scope");

    expect(capabilityStatusClasses("working")).toContain("emerald");
    expect(capabilityStatusClasses("partial")).toContain("amber");
    expect(capabilityStatusClasses("stub")).toContain("slate");
    expect(capabilityStatusClasses("out_of_scope")).toContain("rose");
  });

  it("computes summary values with sane bounds", () => {
    const summary = getCapabilitySummary();
    expect(summary.total).toBeGreaterThan(0);
    expect(summary.mvpTotal).toBeGreaterThan(0);
    expect(summary.mvpReady).toBeLessThanOrEqual(summary.mvpTotal);
    expect(summary.mvpProgress).toBeGreaterThanOrEqual(0);
    expect(summary.mvpProgress).toBeLessThanOrEqual(100);
  });
});
