export const DOMAIN_WWW_CNAME_TARGET = "cname.vercel-dns.com";

export function buildVerificationToken() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export function buildDomainVerificationValue(token: string) {
  return `swiftsite-verify=${token}`;
}
