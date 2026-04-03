import Link from "next/link";

import { NewProjectForm } from "@/components/dashboard/new-project-form";
import { StateBanner } from "@/components/ui/state-banner";
import { createClient } from "@/lib/supabase/server";

type ClientOption = {
  id: string;
  name: string;
};

type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  tech_stack: string | null;
  last_deploy_status: string | null;
  created_at: string;
  client: { name: string } | null;
};

type ProjectRowRaw = Omit<ProjectRow, "client"> & {
  client: { name: string } | { name: string }[] | null;
};

function statusClasses(status: string) {
  switch (status) {
    case "deployed":
      return "bg-emerald-100 text-emerald-700";
    case "building":
      return "bg-sky-100 text-sky-700";
    case "error":
      return "bg-red-100 text-red-700";
    case "suspended":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

export default async function ProjectsPage() {
  const supabase = await createClient();

  const [
    { data: clientsData, error: clientsError },
    { data: projectsData, error: projectsError },
  ] = await Promise.all([
    supabase.from("clients").select("id,name").order("name", { ascending: true }),
    supabase
      .from("projects")
      .select(
        "id,name,slug,status,tech_stack,last_deploy_status,created_at,client:clients(name)",
      )
      .order("created_at", { ascending: false }),
  ]);

  const clients = (clientsData ?? []) as ClientOption[];
  const projects = ((projectsData ?? []) as ProjectRowRaw[]).map((project) => ({
    ...project,
    client: Array.isArray(project.client)
      ? (project.client[0] ?? null)
      : project.client,
  }));

  const buildingCount = projects.filter((project) =>
    ["building", "queued"].includes(project.last_deploy_status ?? ""),
  ).length;
  const readyCount = projects.filter((project) =>
    ["ready", "deployed"].includes(project.last_deploy_status ?? ""),
  ).length;
  const errorCount = projects.filter((project) =>
    ["error", "failed", "canceled"].includes(project.last_deploy_status ?? ""),
  ).length;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-5xl font-bold tracking-tight text-[#1b2832]">
            Deployments
          </h1>
          <p className="mt-2 text-xl text-slate-600">
            Track build pipelines, deployment status, and project rollout health.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/docs"
              className="text-sm font-semibold text-[#0a6f87] hover:underline"
            >
              Deployment guide
            </Link>
            <Link
              href="/dashboard/support"
              className="text-sm font-semibold text-[#0a6f87] hover:underline"
            >
              Need help?
            </Link>
          </div>
        </div>
      </div>
      {clientsError ? (
        <StateBanner
          variant="warning"
          title="Client list is unavailable"
          message={`${clientsError.message} You can still review existing projects.`}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            Total Projects
          </p>
          <p className="mt-4 text-4xl font-bold text-[#0a6f87]">{projects.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            Building
          </p>
          <p className="mt-4 text-4xl font-bold text-[#0a6f87]">{buildingCount}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            Ready / Error
          </p>
          <p className="mt-4 text-4xl font-bold text-[#0a6f87]">
            {readyCount} / {errorCount}
          </p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        {clients.length ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <NewProjectForm clients={clients} />
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
            Create at least one client first, then you can add deployments.
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <table className="min-w-full">
            <thead className="bg-[#ecf1f5]">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Stack</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Deploy</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-t border-slate-200 text-base">
                  <td className="px-6 py-5">
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="font-semibold text-slate-900 hover:text-[#0a6f87] hover:underline"
                    >
                      {project.name}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">{project.slug}</p>
                  </td>
                  <td className="px-6 py-5 text-slate-700">
                    {project.client?.name ?? "-"}
                  </td>
                  <td className="px-6 py-5 text-slate-700">
                    {project.tech_stack ?? "-"}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses(project.status)}`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 capitalize text-slate-700">
                    {project.last_deploy_status ?? "pending"}
                  </td>
                </tr>
              ))}
              {!projects.length && !projectsError ? (
                <tr>
                  <td className="px-6 py-8 text-slate-500" colSpan={5}>
                    No projects yet.
                  </td>
                </tr>
              ) : null}
              {projectsError ? (
                <tr>
                  <td className="px-6 py-8 text-red-700" colSpan={5}>
                    {projectsError.message}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
