import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  last_deploy_url: string | null;
};

type DeploymentRow = {
  id: string;
  project_id: string;
  status: string | null;
  error_message: string | null;
  created_at: string;
};

function formatTimeAgo(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function displayStatus(status: string | null) {
  if (!status) return "Queued";
  if (["ready", "deployed", "success"].includes(status)) return "Success";
  if (["error", "failed", "canceled"].includes(status)) return "Failed";
  return "Running";
}

function statusColor(label: string) {
  if (label === "Success") return "text-emerald-600";
  if (label === "Failed") return "text-red-600";
  return "text-amber-600";
}

function envLabel(status: string | null) {
  if (status === "ready" || status === "deployed" || status === "success") {
    return "Production";
  }
  return "Staging";
}

function envPillClasses(environment: string) {
  if (environment === "Production") return "bg-[#dce8ef] text-[#3a5368]";
  return "bg-[#cad9fb] text-[#304b85]";
}

function extractDomain(project: ProjectRow) {
  if (project.last_deploy_url) {
    try {
      return new URL(project.last_deploy_url).hostname;
    } catch {
      return project.slug;
    }
  }
  return project.slug;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [
    { count: projectCount },
    { count: monthlyDeploymentCount },
    { data: projectsData },
    { data: recentDeploymentsData },
    { data: healthDeploymentsData },
  ] = await Promise.all([
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase
      .from("deployments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString()),
    supabase.from("projects").select("id,name,slug,status,last_deploy_url"),
    supabase
      .from("deployments")
      .select("id,project_id,status,error_message,created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("deployments")
      .select("id,status")
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  const projects = (projectsData ?? []) as ProjectRow[];
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const recentDeployments = (recentDeploymentsData ?? []) as DeploymentRow[];
  const healthDeployments = (healthDeploymentsData ?? []) as {
    id: string;
    status: string | null;
  }[];

  const completedDeployments = healthDeployments.filter((deployment) =>
    ["ready", "deployed", "success", "error", "failed", "canceled"].includes(
      deployment.status ?? "",
    ),
  );
  const successfulDeployments = completedDeployments.filter((deployment) =>
    ["ready", "deployed", "success"].includes(deployment.status ?? ""),
  );
  const uptimePercent = completedDeployments.length
    ? (successfulDeployments.length / completedDeployments.length) * 100
    : 99.9;

  const activityRows = recentDeployments
    .map((deployment) => {
      const project = projectById.get(deployment.project_id);
      if (!project) return null;

      const status = displayStatus(deployment.status);
      const environment = envLabel(deployment.status);

      return {
        id: deployment.id,
        status,
        projectName: project.name,
        domain: extractDomain(project),
        detail: deployment.error_message || "Manual trigger",
        environment,
        timeAgo: formatTimeAgo(deployment.created_at),
      };
    })
    .filter((row): row is NonNullable<typeof row> => !!row)
    .slice(0, 3);

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-5xl font-bold tracking-tight text-[#1b2832]">
          Console Overview
        </h1>
        <p className="mt-2 text-xl text-slate-600">
          Real-time performance and system availability for your cluster.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-6">
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl text-[#0a6f87]">
              ⌗
            </span>
            <span className="rounded-full bg-[#c8e7f0] px-3 py-1 text-xs font-semibold text-[#0a6f87]">
              +2 this week
            </span>
          </div>
          <p className="mt-6 text-5xl font-bold text-[#1e2d38]">{projectCount ?? 0}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.11em] text-slate-600">
            Active Projects
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-6">
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl text-[#0a6f87]">
              ◔
            </span>
            <span className="rounded-full bg-[#dce8ef] px-3 py-1 text-xs font-semibold text-[#3a5368]">
              High Volume
            </span>
          </div>
          <p className="mt-6 text-5xl font-bold text-[#1e2d38]">
            {(monthlyDeploymentCount ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.11em] text-slate-600">
            Monthly Deployments
          </p>
        </article>

        <article className="rounded-2xl bg-[#066986] px-6 py-6 text-white shadow-[0_14px_28px_rgba(6,105,134,0.28)]">
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-xl">
              ☁
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              Healthy
            </span>
          </div>
          <p className="mt-6 text-5xl font-bold">{uptimePercent.toFixed(1)}%</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.11em] text-white/85">
            System Health Uptime
          </p>
        </article>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="text-4xl font-semibold text-[#1f2f39]">Recent Activity</h2>
            <Link
              href="/dashboard/projects"
              className="text-base font-semibold text-[#0a6f87] hover:underline"
            >
              View All Logs
            </Link>
          </div>
          <table className="min-w-full">
            <thead className="bg-[#ecf1f5]">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Domain / Project</th>
                <th className="px-6 py-4">Environment</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {activityRows.map((row) => (
                <tr key={row.id} className="border-t border-slate-200 text-base">
                  <td className={`px-6 py-5 font-semibold ${statusColor(row.status)}`}>
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-current align-middle" />
                    {row.status}
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-semibold text-slate-800">{row.domain}</p>
                    <p className="text-sm text-slate-500">{row.detail}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${envPillClasses(row.environment)}`}
                    >
                      {row.environment}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-600">{row.timeAgo}</td>
                </tr>
              ))}
              {!activityRows.length ? (
                <tr>
                  <td className="px-6 py-8 text-slate-500" colSpan={4}>
                    No deployment logs yet. Trigger your first deploy.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </article>

        <aside className="space-y-4">
          <h2 className="text-4xl font-semibold text-[#1f2f39]">Quick Actions</h2>
          <Link
            href="/dashboard/clients#new-client-form"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 hover:bg-slate-50"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef3f7] text-xl text-[#0a6f87]">
              ⍟
            </span>
            <div>
              <p className="font-semibold text-slate-800">Onboard New Client</p>
              <p className="text-sm text-slate-500">Create workspace &amp; keys</p>
            </div>
          </Link>
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 hover:bg-slate-50"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef3f7] text-xl text-[#0a6f87]">
              ⚡
            </span>
            <div>
              <p className="font-semibold text-slate-800">Trigger Global Build</p>
              <p className="text-sm text-slate-500">Re-deploy all edge nodes</p>
            </div>
          </Link>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Active Cluster
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#1f2f39]">
              Azure Horizon West
            </p>
            <p className="mt-3 text-base text-emerald-600">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-current align-middle" />
              Optimal Latency
            </p>
          </div>
        </aside>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-[#ecf2f6] px-8 py-8">
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_240px]">
          <div>
            <h3 className="text-5xl font-semibold leading-tight text-[#1f2f39]">
              Automate your enterprise workflow with Custom Edge Scripts.
            </h3>
            <p className="mt-4 text-xl text-slate-600">
              Leverage our WASM-powered execution engine to run complex logic at
              the closest edge node to your users.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="rounded-full bg-[#1e2d38] px-6 py-3 text-base font-semibold text-white"
              >
                Explore API
              </button>
              <button
                type="button"
                className="text-base font-semibold text-[#1e2d38] hover:underline"
              >
                View Samples
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <div className="h-4 w-4/5 rounded-full bg-[#c7d8e3]" />
            <div className="mt-4 h-4 w-full rounded-full bg-[#d5e1e9]" />
            <div className="mt-4 h-4 w-3/5 rounded-full bg-[#c7d8e3]" />
            <div className="mt-4 h-4 w-11/12 rounded-full bg-[#d5e1e9]" />
          </div>
        </div>
      </section>
    </section>
  );
}
