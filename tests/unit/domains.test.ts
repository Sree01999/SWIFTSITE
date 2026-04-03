import { describe, expect, it } from "vitest";

import {
  DOMAIN_WWW_CNAME_TARGET,
  buildDomainVerificationValue,
  buildVerificationToken,
} from "@/lib/domains/constants";

describe("domain constants", () => {
  it("keeps expected cname target", () => {
    expect(DOMAIN_WWW_CNAME_TARGET).toBe("cname.vercel-dns.com");
  });

  it("builds 16-char verification tokens without dashes", () => {
    const token = buildVerificationToken();
    expect(token).toHaveLength(16);
    expect(token).toMatch(/^[a-f0-9]{16}$/);
  });

  it("builds dns txt verification value", () => {
    expect(buildDomainVerificationValue("abcd1234")).toBe(
      "swiftsite-verify=abcd1234",
    );
  });
});
