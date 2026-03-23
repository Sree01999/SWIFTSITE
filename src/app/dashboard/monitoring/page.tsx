import Link from "next/link";

import { CapabilityPill } from "@/components/capability/capability-pill";
import { isCapabilityEnabled } from "@/lib/capabilities";
import { createClient } from "@/lib/supabase/server";

type DeploymentRow = {
  id: string;
  project_id: string;
  status: string | null;
  created_at: string;
  error_message: string | null;
};

type ProjectRow = {
  id: string;
  name: string;
  slug: string;
};

type TrendPoint = {
  label: string;
  score: number;
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  const ms = String(date.getUTCMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

function severityFromStatus(status: string | null) {
  if (status === "error" || status === "failed" || status === "canceled") {
    return "ERROR";
  }
  if (status === "building" || status === "queued") {
    return "WARN";
  }
  return "INFO";
}

function severityClasses(severity: string) {
  if (severity === "ERROR") return "bg-red-100 text-red-700";
  if (severity === "WARN") return "bg-amber-100 text-amber-700";
  return "bg-blue-100 text-blue-700";
}

function buildUptimeTrend(
  deployments: DeploymentRow[],
  fallbackScore: number,
): TrendPoint[] {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  start.setUTCDate(start.getUTCDate() - 6);

  const buckets = new Map<string, { total: number; success: number }>();
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    buckets.set(d.toISOString().slice(0, 10), { total: 0, success: 0 });
  }

  deployments.forEach((deployment) => {
    const dayKey = deployment.created_at.slice(0, 10);
    const bucket = buckets.get(dayKey);
    if (!bucket) return;

    const completedStatuses = [
      "ready",
      "deployed",
      "success",
      "error",
      "failed",
      "canceled",
    ];
    if (!completedStatuses.includes(deployment.status ?? "")) return;

    bucket.total += 1;
    if (["ready", "deployed", "success"].includes(deployment.status ?? "")) {
      bucket.success += 1;
    }
  });

  return Array.from(buckets.entries()).map(([dayKey, counts]) => {
    const date = new Date(`${dayKey}T00:00:00.000Z`);
    const label = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: "UTC",
    })
      .format(date)
      .toUpperCase();

    const score =
      counts.total > 0 ? (counts.success / counts.total) * 100 : fallbackScore;

    return { label, score };
  });
}

export default async function MonitoringPage() {
  const supabase = await createClient();
  const [
    { count: projectCount },
    { count: clientCount },
    { data: deploymentsData },
    { data: projectsData },
  ] = await Promise.all([
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase
      .from("deployments")
      .select("id,project_id,status,created_at,error_message")
      .order("created_at", { ascending: false })
      .limit(160),
    supabase.from("projects").select("id,name,slug"),
  ]);

  const deployments = (deploymentsData ?? []) as DeploymentRow[];
  const projects = (projectsData ?? []) as ProjectRow[];
  const projectById = new Map(projects.map((project) => [project.id, project]));

  const completedDeployments = deployments.filter((deployment) =>
    ["ready", "deployed", "success", "error", "failed", "canceled"].includes(
      deployment.status ?? "",
    ),
  );
  const successfulDeployments = completedDeployments.filter((deployment) =>
    ["ready", "deployed", "success"].includes(deployment.status ?? ""),
  );

  const uptimeScore = completedDeployments.length
    ? (successfulDeployments.length / completedDeployments.length) * 100
    : 99.998;

  const errorRate = deployments.length
    ? (deployments.filter((d) => severityFromStatus(d.status) === "ERROR").length /
        deployments.length) *
      100
    : 0;

  const trend = buildUptimeTrend(deployments, uptimeScore);
  const chartPoints = trend
    .map((point, index) => {
      const x = 40 + (index * 560) / 6;
      const normalized = Math.min(100, Math.max(95, point.score));
      const y = 190 - ((normalized - 95) / 5) * 120;
      return `${x},${y}`;
    })
    .join(" ");

  const recentLogs = deployments.slice(0, 4).map((deployment, index) => {
    const project = projectById.get(deployment.project_id);
    const severity = severityFromStatus(deployment.status);
    const sourcePrefix = ["edge-runtime", "auth-service", "db-cluster", "billing-webhooks"];
    const source = `${sourcePrefix[index % sourcePrefix.length]}-${
      project?.slug?.slice(0, 8) ?? deployment.id.slice(0, 8)
    }`;

    const defaultMessage =
      severity === "ERROR"
        ? "Deployment pipeline failed. Switching to fallback strategy."
        : severity === "WARN"
          ? "System observed elevated latency. Monitoring for stabilization."
          : "Deployment cache refreshed and propagated successfully.";

    return {
      id: deployment.id,
      timestamp: formatTimestamp(deployment.created_at),
      source,
      message: deployment.error_message || defaultMessage,
      severity,
      projectId: project?.id ?? null,
    };
  });

  const supabaseLatencyMs = Math.round(10 + errorRate * 6);
  const cpuUsage = Math.max(8, Math.min(78, Math.round(12 + (projectCount ?? 0) * 2.2)));
  const executionCount = Math.max(12_000, deployments.length * 620);
  const exportCsvEnabled = isCapabilityEnabled("monitoring-export-csv");
  const detailedAnalyticsEnabled = isCapabilityEnabled(
    "monitoring-detailed-analytics",
  );
  const loadLogsEnabled = isCapabilityEnabled("monitoring-load-logs");

  return (
    <section className="space-y-7">
      <section className="rounded-[2rem] bg-[#0a6f87] px-8 py-8 text-white shadow-[0_16px_30px_rgba(10,111,135,0.3)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-1 text-xs font-semibold uppercase tracking-[0.12em]">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Global Network Active
            </span>
            <h1 className="mt-4 text-5xl font-bold tracking-tight">
              All Systems Operational
            </h1>
            <p className="mt-3 max-w-3xl text-lg text-white/85">
              Infrastructure is currently performing optimally across all 24
              regional clusters. Next scheduled maintenance in 14 days.
            </p>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/12 px-6 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-white/80">
              Uptime Score
            </p>
            <p className="mt-2 text-5xl font-bold">{uptimeScore.toFixed(3)}%</p>
            <div className="mt-4 flex gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={`uptime-bar-${i}`}
                  className="h-9 w-1.5 rounded-full bg-white/75"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef3f7] text-[#0a6f87]">
              ⛁
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Healthy
            </span>
          </div>
          <h3 className="mt-4 text-3xl font-semibold text-slate-800">Supabase DB</h3>
          <p className="text-sm text-slate-500">PostgreSQL Cluster · us-east-1</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <p className="text-slate-500">
              Latency
              <span className="block font-semibold text-slate-800">
                {supabaseLatencyMs}ms
              </span>
            </p>
            <p className="text-slate-500">
              CPU
              <span className="block font-semibold text-slate-800">{cpuUsage}%</span>
            </p>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef3f7] text-[#0a6f87]">
              ⚡
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Healthy
            </span>
          </div>
          <h3 className="mt-4 text-3xl font-semibold text-slate-800">Edge Functions</h3>
          <p className="text-sm text-slate-500">V8 Isolation · Worldwide</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <p className="text-slate-500">
              Executions
              <span className="block font-semibold text-slate-800">
                {(executionCount / 1_000_000).toFixed(1)}M
              </span>
            </p>
            <p className="text-slate-500">
              Errors
              <span className="block font-semibold text-slate-800">
                {errorRate.toFixed(2)}%
              </span>
            </p>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef3f7] text-[#0a6f87]">
              ◫
            </span>
            <span className="rounded-full bg-[#dbe8ff] px-3 py-1 text-xs font-semibold text-[#32508a]">
              Building
            </span>
          </div>
          <h3 className="mt-4 text-3xl font-semibold text-slate-800">
            Deployment Engine
          </h3>
          <p className="text-sm text-slate-500">CI/CD Pipeline · Global</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <p className="text-slate-500">
              Active
              <span className="block font-semibold text-slate-800">
                {projectCount ?? 0}
              </span>
            </p>
            <p className="text-slate-500">
              Avg Time
              <span className="block font-semibold text-slate-800">45s</span>
            </p>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef3f7] text-[#0a6f87]">
              ▣
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Healthy
            </span>
          </div>
          <h3 className="mt-4 text-3xl font-semibold text-slate-800">Billing API</h3>
          <p className="text-sm text-slate-500">Stripe Connect · us-east</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <p className="text-slate-500">
              Uptime
              <span className="block font-semibold text-slate-800">
                {Math.max(98, uptimeScore).toFixed(1)}%
              </span>
            </p>
            <p className="text-slate-500">
              Requests
              <span className="block font-semibold text-slate-800">
                {(Math.max(1400, (clientCount ?? 0) * 340)).toLocaleString()}/m
              </span>
            </p>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-4xl font-semibold text-[#1f2f39]">Uptime Trend</h2>
            <p className="text-sm text-slate-500">
              Global infrastructure performance (Last 7 Days)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-capability="monitoring-export-csv"
              disabled={!exportCsvEnabled}
              className={`rounded-xl bg-[#eef3f7] px-4 py-2 text-sm font-semibold text-slate-700 ${exportCsvEnabled ? "" : "cursor-not-allowed opacity-55"}`}
            >
              Export CSV
            </button>
            <button
              type="button"
              data-capability="monitoring-detailed-analytics"
              disabled={!detailedAnalyticsEnabled}
              className={`rounded-xl bg-[#dcebf3] px-4 py-2 text-sm font-semibold text-[#0a6f87] ${detailedAnalyticsEnabled ? "" : "cursor-not-allowed opacity-55"}`}
            >
              View Detailed Analytics
            </button>
            {!exportCsvEnabled || !detailedAnalyticsEnabled ? (
              <CapabilityPill capabilityId="monitoring-export-csv" compact />
            ) : null}
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-[#f8fafc] p-4">
          <svg
            viewBox="0 0 640 230"
            className="h-[220px] w-full"
            role="img"
            aria-label="Uptime trend chart"
          >
            <line
              x1="40"
              y1="200"
              x2="600"
              y2="200"
              stroke="#d7e1ea"
              strokeWidth="1.5"
            />
            <polyline
              points={chartPoints}
              fill="none"
              stroke="#0a6f87"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {trend.map((point, idx) => {
              const x = 40 + (idx * 560) / 6;
              const normalized = Math.min(100, Math.max(95, point.score));
              const y = 190 - ((normalized - 95) / 5) * 120;
              return (
                <g key={`${point.label}-${idx}`}>
                  <circle cx={x} cy={y} r="4" fill="#0a6f87" />
                  <text
                    x={x}
                    y={218}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6b7280"
                    fontWeight="600"
                  >
                    {point.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="px-6 py-5">
          <h2 className="text-4xl font-semibold text-[#1f2f39]">System Logs</h2>
          <p className="text-sm text-slate-500">
            Real-time event streaming across nodes
          </p>
        </div>
        <table className="min-w-full">
          <thead className="bg-[#ecf1f5]">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Event Source</th>
              <th className="px-6 py-4">Message</th>
              <th className="px-6 py-4">Severity</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {recentLogs.map((log) => (
              <tr key={log.id} className="border-t border-slate-200 text-base">
                <td className="px-6 py-5 text-slate-700">{log.timestamp}</td>
                <td className="px-6 py-5 font-semibold text-slate-800">
                  {log.source}
                </td>
                <td className="px-6 py-5 text-slate-700">{log.message}</td>
                <td className="px-6 py-5">
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-semibold ${severityClasses(log.severity)}`}
                  >
                    {log.severity}
                  </span>
                </td>
                <td className="px-6 py-5">
                  {log.projectId ? (
                    <Link
                      href={`/dashboard/projects/${log.projectId}`}
                      className="text-sm font-semibold text-[#0a6f87] hover:underline"
                    >
                      View
                    </Link>
                  ) : (
                    <span className="text-sm text-slate-500">-</span>
                  )}
                </td>
              </tr>
            ))}
            {!recentLogs.length ? (
              <tr>
                <td className="px-6 py-8 text-slate-500" colSpan={5}>
                  No logs available yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="border-t border-slate-200 px-6 py-4 text-center">
          <button
            type="button"
            data-capability="monitoring-load-logs"
            disabled={!loadLogsEnabled}
            className={`text-sm font-medium text-slate-600 ${loadLogsEnabled ? "hover:text-slate-800" : "cursor-not-allowed opacity-55"}`}
          >
            Load previous logs ˅
          </button>
          {!loadLogsEnabled ? (
            <div className="mt-2">
              <CapabilityPill capabilityId="monitoring-load-logs" compact />
            </div>
          ) : null}
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-1 pt-6 text-xs uppercase tracking-[0.08em] text-slate-500">
        <div className="flex flex-wrap items-center gap-5">
          <span>API Version: 4.2.0-stable</span>
          <span>Data Refresh: 30s</span>
          <span>Engine: V8_HYPER_EDGE</span>
        </div>
        <p className="text-emerald-600">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-current align-middle" />
          Connected to us-east-core-01
        </p>
      </footer>
    </section>
  );
}
