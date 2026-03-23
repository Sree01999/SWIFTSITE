"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  DOMAIN_WWW_CNAME_TARGET,
  buildDomainVerificationValue,
} from "@/lib/domains/constants";

import styles from "./page.module.css";

type DomainStatus = "pending" | "verified" | "failed";
type DnsRecordStatus = "matched" | "missing" | "mismatch";

type DomainDnsRecordResult = {
  type: "TXT" | "CNAME" | "A";
  host: string;
  expected: string;
  found: string[];
  status: DnsRecordStatus;
  required: boolean;
  note?: string;
};

type DnsCheckDetails = {
  passed?: boolean;
  checkedAt?: string;
  summary?: string;
  records?: DomainDnsRecordResult[];
};

type DomainRow = {
  id: string;
  domain: string;
  status: DomainStatus;
  ssl_status: string;
  verified_at: string | null;
  created_at: string;
  verification_token: string;
  dns_check_passed: boolean;
  last_dns_check_at: string | null;
  dns_check_details: DnsCheckDetails | null;
};

function formatStatus(status: string) {
  if (status === "verified") return "Verified";
  if (status === "failed") return "Failed";
  return "Pending";
}

function formatSslStatus(status: string) {
  if (status === "active") return "Active";
  if (status === "failed") return "Failed";
  return "Pending";
}

function statusClass(status: string) {
  if (status === "verified") return styles.domainStatusVerified;
  if (status === "failed") return styles.domainStatusFailed;
  return styles.domainStatusPending;
}

function dnsRecordClass(status: DnsRecordStatus) {
  if (status === "matched") return styles.domainDnsOk;
  if (status === "mismatch") return styles.domainDnsBad;
  return styles.domainDnsPending;
}

function prettyDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function defaultRecordsForDomain(domain: DomainRow): DomainDnsRecordResult[] {
  return [
    {
      type: "TXT",
      host: `_swiftsite-verify.${domain.domain}`,
      expected: buildDomainVerificationValue(domain.verification_token),
      found: [],
      status: "missing",
      required: true,
    },
    {
      type: "CNAME",
      host: `www.${domain.domain}`,
      expected: DOMAIN_WWW_CNAME_TARGET,
      found: [],
      status: "missing",
      required: false,
      note: "Optional if apex A record is configured.",
    },
    {
      type: "A",
      host: domain.domain,
      expected: "Any valid A record",
      found: [],
      status: "missing",
      required: false,
      note: "Apex fallback if www CNAME is not configured.",
    },
  ];
}

export function DomainManager({
  projectId,
  initialDomains,
}: {
  projectId: string;
  initialDomains: DomainRow[];
}) {
  const router = useRouter();
  const [domains, setDomains] = useState(initialDomains);
  const [domainInput, setDomainInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function addDomain() {
    if (!domainInput.trim()) {
      setError("Please enter a domain.");
      return;
    }

    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, domain: domainInput }),
      });
      const data = (await res.json()) as {
        domain?: DomainRow;
        error?: string;
      };

      if (!res.ok || !data.domain) {
        setError(data.error ?? "Could not add domain.");
        return;
      }

      setDomains((prev) => [data.domain!, ...prev]);
      setDomainInput("");
      setMessage("Domain added. Configure DNS records, then run Check DNS.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Could not add domain.",
      );
    } finally {
      setPending(false);
    }
  }

  async function checkDns(domainId: string) {
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/domains/${domainId}/dns-check`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        domain?: DomainRow;
        error?: string;
      };

      if (!res.ok || !data.domain) {
        setError(data.error ?? "DNS check failed.");
        return;
      }

      setDomains((prev) =>
        prev.map((item) => (item.id === domainId ? data.domain! : item)),
      );
      setMessage(
        data.domain.dns_check_passed
          ? "DNS check passed. You can now verify this domain."
          : "DNS check failed. Update records and check again.",
      );
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "DNS check failed.",
      );
    } finally {
      setPending(false);
    }
  }

  async function updateStatus(domainId: string, status: DomainStatus) {
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/domains/${domainId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as {
        domain?: DomainRow;
        error?: string;
      };

      if (!res.ok || !data.domain) {
        setError(data.error ?? "Could not update domain status.");
        return;
      }

      setDomains((prev) =>
        prev.map((item) => (item.id === domainId ? data.domain! : item)),
      );
      setMessage(
        status === "verified"
          ? "Domain verified."
          : status === "failed"
            ? "Domain marked as failed."
            : "Domain reset to pending.",
      );
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update domain status.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={styles.domainsCard}>
      <h3 className={styles.quickTitle}>Domains</h3>

      <div className={styles.domainCreateRow}>
        <input
          data-capability="domains-management"
          value={domainInput}
          onChange={(event) => setDomainInput(event.target.value)}
          placeholder="example.com"
          className={styles.domainInput}
          disabled={pending}
        />
        <button
          type="button"
          data-capability="domains-management"
          onClick={addDomain}
          disabled={pending}
          className={styles.domainAddBtn}
        >
          {pending ? "Saving..." : "Add"}
        </button>
      </div>

      {error ? <p className={styles.controlError}>{error}</p> : null}
      {message ? <p className={styles.controlNotice}>{message}</p> : null}

      <div className={styles.domainList}>
        {domains.map((domain) => {
          const records =
            domain.dns_check_details?.records && domain.dns_check_details.records.length
              ? domain.dns_check_details.records
              : defaultRecordsForDomain(domain);

          return (
            <article key={domain.id} className={styles.domainItem}>
              <div>
                <p className={styles.domainName}>{domain.domain}</p>
                <p className={styles.domainMeta}>
                  Verified: {prettyDate(domain.verified_at)} · Last DNS check:{" "}
                  {prettyDate(domain.last_dns_check_at)}
                </p>
              </div>
              <div className={styles.domainBadges}>
                <span className={`${styles.domainBadge} ${statusClass(domain.status)}`}>
                  {formatStatus(domain.status)}
                </span>
                <span
                  className={`${styles.domainBadge} ${statusClass(domain.ssl_status)}`}
                >
                  SSL {formatSslStatus(domain.ssl_status)}
                </span>
                <span
                  className={`${styles.domainBadge} ${
                    domain.dns_check_passed
                      ? styles.domainStatusVerified
                      : styles.domainStatusPending
                  }`}
                >
                  DNS {domain.dns_check_passed ? "Passed" : "Pending"}
                </span>
              </div>

              <div className={styles.domainDnsPanel}>
                <p className={styles.domainMetaStrong}>Required DNS Records</p>
                {records.map((record, index) => (
                  <div key={`${domain.id}-${record.type}-${index}`} className={styles.domainDnsRow}>
                    <span className={styles.domainDnsType}>{record.type}</span>
                    <code className={styles.domainDnsHost}>{record.host}</code>
                    <code className={styles.domainDnsValue}>{record.expected}</code>
                    <span className={`${styles.domainDnsState} ${dnsRecordClass(record.status)}`}>
                      {record.status}
                    </span>
                  </div>
                ))}
                {domain.dns_check_details?.summary ? (
                  <p className={styles.domainMeta}>{domain.dns_check_details.summary}</p>
                ) : null}
              </div>

              <div className={styles.domainActions}>
                <button
                  type="button"
                  data-capability="domains-management"
                  className={styles.domainActionBtn}
                  onClick={() => checkDns(domain.id)}
                  disabled={pending}
                >
                  Check DNS
                </button>
                <button
                  type="button"
                  data-capability="domains-management"
                  className={styles.domainActionBtn}
                  onClick={() => updateStatus(domain.id, "verified")}
                  disabled={pending || !domain.dns_check_passed}
                >
                  Verify
                </button>
                <button
                  type="button"
                  data-capability="domains-management"
                  className={styles.domainActionBtn}
                  onClick={() => updateStatus(domain.id, "failed")}
                  disabled={pending}
                >
                  Fail
                </button>
                <button
                  type="button"
                  data-capability="domains-management"
                  className={styles.domainActionBtn}
                  onClick={() => updateStatus(domain.id, "pending")}
                  disabled={pending}
                >
                  Reset
                </button>
              </div>
            </article>
          );
        })}
        {!domains.length ? (
          <p className={styles.domainEmpty}>
            No domains attached yet. Add one to start verification.
          </p>
        ) : null}
      </div>
    </section>
  );
}
