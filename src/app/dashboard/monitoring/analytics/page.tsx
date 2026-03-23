import Link from "next/link";

import { StateBanner } from "@/components/ui/state-banner";
import { createClient } from "@/lib/supabase/server";

type DeploymentRow = {
  id: string;
  project_id: string;
  status: string | null;
  created_at: string;
  error_message: string | null;
  deploy_url: string | null;
};

type ProjectRow = {
  id: string;
  name: string;
  slug: string;
};

type AnalyticsSearchParams = {
  range?: string | string[];
  status?: string | string[];
  project?: string | string[];
};

const SUCCESS_STATUSES = ["ready", "deployed", "success"];
const FAILURE_STATUSES = ["error", "failed", "canceled"];
const BUILDING_STATUSES = ["building", "queued"];

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseRangeDays(rawValue: string | undefined) {
  const parsed = Number.parseInt(rawValue ?? "30", 10);
  if (parsed === 7 || parsed === 30 || parsed === 90) return parsed;
  return 30;
}

function statusMatchesFilter(status: string | null, statusFilter: string) {
  if (statusFilter === "all") return true;
  if (statusFilter === "success") return SUCCESS_STATUSES.includes(status ?? "");
  if (statusFilter === "failure") return FAILURE_STATUSES.includes(status ?? "");
  if (statusFilter === "building") return BUILDING_STATUSES.includes(status ?? "");
  return true;
}

function formatDateLabel(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(isoDate));
}

function buildDailyTrend(rows: DeploymentRow[], rangeDays: number) {
  const end = new Date();
  const start = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
  );
  start.setUTCDate(start.getUTCDate() - (rangeDays - 1));

  const buckets = new Map<string, { total: number; success: number; failed: number }>();
  for (let i = 0; i < rangeDays; i += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    buckets.set(day.toISOString().slice(0, 10), { total: 0, success: 0, failed: 0 });
  }

  rows.forEach((row) => {
    const key = row.created_at.slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) return;
    bucket.total += 1;
    if (SUCCESS_STATUSES.includes(row.status ?? "")) bucket.success += 1;
    if (FAILURE_STATUSES.includes(row.status ?? "")) bucket.failed += 1;
  });

  return Array.from(buckets.entries()).map(([date, data]) => ({ date, ...data }));
}

export default async function MonitoringAnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<AnalyticsSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rangeDays = parseRangeDays(toSingle(resolvedSearchParams.range));
  const statusFilter = toSingle(resolvedSearchParams.status) ?? "all";
  const projectFilter = toSingle(resolvedSearchParams.project) ?? "all";

  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - rangeDays);
  const startIso = startDate.toISOString();

  const supabase = await createClient();
  const [
    { data: projectsData, error: projectsError },
    { data: deploymentsData, error: deploymentsError },
  ] = await Promise.all([
    supabase.from("projects").select("id,name,slug").order("name", { ascending: true }),
    supabase
      .from("deployments")
      .select("id,project_id,status,created_at,error_message,deploy_url")
      .gte("created_at", startIso)
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);

  const projects = (projectsData ?? []) as ProjectRow[];
  const deployments = (deploymentsData ?? []) as DeploymentRow[];

  const projectById = new Map(projects.map((project) => [project.id, project]));
  const filtered = deployments.filter((row) => {
    if (projectFilter !== "all" && row.project_id !== projectFilter) return false;
    return statusMatchesFilter(row.status, statusFilter);
  });

  const successCount = filtered.filter((row) =>
    SUCCESS_STATUSES.includes(row.status ?? ""),
  ).length;
  const failureCount = filtered.filter((row) =>
    FAILURE_STATUSES.includes(row.status ?? ""),
  ).length;
  const buildingCount = filtered.filter((row) =>
    BUILDING_STATUSES.includes(row.status ?? ""),
  ).length;

  const successRate = filtered.length ? (successCount / filtered.length) * 100 : 0;
  const averagePerDay = rangeDays ? filtered.length / rangeDays : 0;

  const trend = buildDailyTrend(filtered, rangeDays);
  const maxTotal = Math.max(...trend.map((point) => point.total), 1);
  const failedLogs = filtered
    .filter((row) => FAILURE_STATUSES.includes(row.status ?? ""))
    .slice(0, 12);

  const projectHealth = projects
    .map((project) => {
      const rows = filtered.filter((row) => row.project_id === project.id);
      const total = rows.length;
      const ok = rows.filter((row) => SUCCESS_STATUSES.includes(row.status ?? "")).length;
      const failed = rows.filter((row) => FAILURE_STATUSES.includes(row.status ?? "")).length;
      const rate = total ? (ok / total) * 100 : 0;
      return {
        id: project.id,
        name: project.name,
        slug: project.slug,
        total,
        failed,
        successRate: rate,
      };
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#0a6f87]">
            <Link href="/dashboard/monitoring" className="hover:underline">
              Back to Monitoring
            </Link>
          </p>
          <h1 className="mt-2 text-5xl font-bold tracking-tight text-[#1b2832]">
            Detailed Analytics
          </h1>
          <p className="mt-2 text-xl text-slate-600">
            Deployment behavior, reliability trends, and project-level performance.
          </p>
        </div>
      </header>
      {projectsError || deploymentsError ? (
        <StateBanner
          variant="warning"
          title="Analytics data is partially unavailable"
          message={[projectsError?.message, deploymentsError?.message]
            .filter(Boolean)
            .join(" | ")}
        />
      ) : null}

      <form
        action="/dashboard/monitoring/analytics"
        method="get"
        className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-4"
      >
        <label className="grid gap-1">
          <span className="text-sm text-slate-600">Range</span>
          <select
            name="range"
            defaultValue={String(rangeDays)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-slate-600">Status</span>
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2"
          >
            <option value="all">All statuses</option>
            <option value="success">Success only</option>
            <option value="failure">Failures only</option>
            <option value="building">Building only</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-slate-600">Project</span>
          <select
            name="project"
            defaultValue={projectFilter}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2"
          >
            <option value="all">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            data-capability="monitoring-detailed-analytics"
            className="w-full rounded-xl bg-[#0a6f87] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#095f73]"
          >
            Apply filters
          </button>
        </div>
      </form>

      <div className="grid gap-4 lg:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-5 py-4">
          <p className="text-sm text-slate-600">Filtered deployments</p>
          <p className="mt-2 text-4xl font-semibold text-[#0a6f87]">{filtered.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-5 py-4">
          <p className="text-sm text-slate-600">Success rate</p>
          <p className="mt-2 text-4xl font-semibold text-[#0a6f87]">
            {successRate.toFixed(1)}%
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-5 py-4">
          <p className="text-sm text-slate-600">Failures</p>
          <p className="mt-2 text-4xl font-semibold text-[#0a6f87]">{failureCount}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-5 py-4">
          <p className="text-sm text-slate-600">Avg deployments/day</p>
          <p className="mt-2 text-4xl font-semibold text-[#0a6f87]">
            {averagePerDay.toFixed(1)}
          </p>
        </article>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-3xl font-semibold text-[#1f2f39]">Daily Deployment Trend</h2>
          <p className="mt-1 text-base text-slate-600">
            Total and failed deployments for the selected window.
          </p>
          <div className="mt-5 grid gap-2">
            {trend.map((point) => {
              const totalWidth = `${(point.total / maxTotal) * 100}%`;
              const failedWidth = `${(point.failed / maxTotal) * 100}%`;
              return (
                <div key={point.date} className="grid grid-cols-[90px_1fr_auto] items-center gap-3">
                  <span className="text-sm text-slate-600">{formatDateLabel(point.date)}</span>
                  <div className="relative h-4 rounded-full bg-slate-100">
                    <span
                      className="absolute left-0 top-0 h-4 rounded-full bg-[#9dc5d1]"
                      style={{ width: totalWidth }}
                    />
                    <span
                      className="absolute left-0 top-0 h-4 rounded-full bg-[#e57272]"
                      style={{ width: failedWidth }}
                    />
                  </div>
                  <span className="text-sm text-slate-700">
                    {point.total} / {point.failed}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Legend: blue = total deployments, red = failed deployments.
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-3xl font-semibold text-[#1f2f39]">Status Breakdown</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-base text-slate-700">Success</span>
              <span className="text-2xl font-semibold text-emerald-700">{successCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-base text-slate-700">Failed</span>
              <span className="text-2xl font-semibold text-rose-700">{failureCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-base text-slate-700">Building/Queued</span>
              <span className="text-2xl font-semibold text-amber-700">{buildingCount}</span>
            </div>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="px-6 py-5">
          <h2 className="text-3xl font-semibold text-[#1f2f39]">Project Health</h2>
          <p className="text-base text-slate-600">Top active projects in current filter set.</p>
        </div>
        <table className="min-w-full">
          <thead className="bg-[#ecf1f5]">
            <tr className="text-left text-sm text-slate-600">
              <th className="px-6 py-4">Project</th>
              <th className="px-6 py-4">Deployments</th>
              <th className="px-6 py-4">Failures</th>
              <th className="px-6 py-4">Success Rate</th>
            </tr>
          </thead>
          <tbody>
            {projectHealth.map((row) => (
              <tr key={row.id} className="border-t border-slate-200">
                <td className="px-6 py-4 text-base text-slate-800">
                  {row.name}
                  <span className="ml-2 text-sm text-slate-500">{row.slug}</span>
                </td>
                <td className="px-6 py-4 text-base text-slate-700">{row.total}</td>
                <td className="px-6 py-4 text-base text-slate-700">{row.failed}</td>
                <td className="px-6 py-4 text-base text-slate-700">
                  {row.successRate.toFixed(1)}%
                </td>
              </tr>
            ))}
            {!projectHealth.length ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-base text-slate-500">
                  No project activity found for selected filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="px-6 py-5">
          <h2 className="text-3xl font-semibold text-[#1f2f39]">Recent Failures</h2>
          <p className="text-base text-slate-600">
            Most recent failed deployment events for faster triage.
          </p>
        </div>
        <table className="min-w-full">
          <thead className="bg-[#ecf1f5]">
            <tr className="text-left text-sm text-slate-600">
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Project</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Message</th>
            </tr>
          </thead>
          <tbody>
            {failedLogs.map((row) => {
              const project = projectById.get(row.project_id);
              return (
                <tr key={row.id} className="border-t border-slate-200">
                  <td className="px-6 py-4 text-base text-slate-700">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(row.created_at))}
                  </td>
                  <td className="px-6 py-4 text-base text-slate-800">
                    {project?.name ?? "Unknown project"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-rose-100 px-2 py-1 text-sm font-medium text-rose-700">
                      {row.status ?? "failed"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-base text-slate-700">
                    {row.error_message ?? "No error details available."}
                  </td>
                </tr>
              );
            })}
            {!failedLogs.length ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-base text-slate-500">
                  No failed deployments in selected filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </section>
  );
}
