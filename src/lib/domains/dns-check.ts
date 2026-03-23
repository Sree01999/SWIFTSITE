import { promises as dns } from "node:dns";

import {
  DOMAIN_WWW_CNAME_TARGET,
  buildDomainVerificationValue,
} from "@/lib/domains/constants";

type DnsRecordType = "TXT" | "CNAME" | "A";
type DnsRecordStatus = "matched" | "missing" | "mismatch";

export type DomainDnsRecordResult = {
  type: DnsRecordType;
  host: string;
  expected: string;
  found: string[];
  status: DnsRecordStatus;
  required: boolean;
  note?: string;
};

export type DomainDnsCheckResult = {
  passed: boolean;
  checkedAt: string;
  summary: string;
  records: DomainDnsRecordResult[];
};

function normalizeDnsValue(value: string) {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

async function resolveTxt(host: string) {
  try {
    const rows = await dns.resolveTxt(host);
    return rows.map((row) => row.join("")).filter(Boolean);
  } catch {
    return [];
  }
}

async function resolveCname(host: string) {
  try {
    return await dns.resolveCname(host);
  } catch {
    return [];
  }
}

async function resolveA(host: string) {
  try {
    return await dns.resolve4(host);
  } catch {
    return [];
  }
}

export async function evaluateDomainDns(
  domain: string,
  verificationToken: string,
): Promise<DomainDnsCheckResult> {
  const verificationHost = `_swiftsite-verify.${domain}`;
  const verificationValue = buildDomainVerificationValue(verificationToken);
  const wwwHost = `www.${domain}`;

  const [txtFound, cnameFound, aFound] = await Promise.all([
    resolveTxt(verificationHost),
    resolveCname(wwwHost),
    resolveA(domain),
  ]);

  const txtMatched = txtFound.some(
    (value) => normalizeDnsValue(value) === normalizeDnsValue(verificationValue),
  );
  const cnameMatched = cnameFound.some(
    (value) =>
      normalizeDnsValue(value) === normalizeDnsValue(DOMAIN_WWW_CNAME_TARGET),
  );
  const apexAExists = aFound.length > 0;

  const records: DomainDnsRecordResult[] = [
    {
      type: "TXT",
      host: verificationHost,
      expected: verificationValue,
      found: txtFound,
      status: txtMatched ? "matched" : txtFound.length ? "mismatch" : "missing",
      required: true,
    },
    {
      type: "CNAME",
      host: wwwHost,
      expected: DOMAIN_WWW_CNAME_TARGET,
      found: cnameFound,
      status: cnameMatched
        ? "matched"
        : cnameFound.length
          ? "mismatch"
          : "missing",
      required: false,
      note: "Optional if apex A record is configured.",
    },
    {
      type: "A",
      host: domain,
      expected: "Any valid A record",
      found: aFound,
      status: apexAExists ? "matched" : "missing",
      required: false,
      note: "Apex fallback if www CNAME is not configured.",
    },
  ];

  const passed = txtMatched && (cnameMatched || apexAExists);
  const summary = passed
    ? "DNS check passed. You can verify this domain."
    : "DNS check failed. Add required TXT and either CNAME or A record.";

  return {
    passed,
    checkedAt: new Date().toISOString(),
    summary,
    records,
  };
}
