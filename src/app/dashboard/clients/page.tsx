import { NewClientForm } from "@/components/dashboard/new-client-form";
import { createClient } from "@/lib/supabase/server";

type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  status: "active" | "suspended" | "churned";
};

type ProjectRow = {
  id: string;
  client_id: string;
};

type DeploymentRow = {
  id: string;
  project_id: string;
  status: string | null;
  created_at: string;
};

function formatDate(dateInput: string | null) {
  if (!dateInput) {
    return { date: "-", time: "-" };
  }

  const date = new Date(dateInput);
  return {
    date: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date) + " UTC",
  };
}

function getPlanTier(activeSites: number) {
  if (activeSites >= 20) return "ENTERPRISE";
  if (activeSites >= 5) return "PRO";
  return "FREE";
}

function tierStyles(tier: string) {
  if (tier === "ENTERPRISE") return "bg-[#cad9fb] text-[#304b85]";
  if (tier === "PRO") return "bg-[#b5e6fb] text-[#115f7e]";
  return "bg-[#e5eaee] text-[#5b6673]";
}

function statusLabel(status: ClientRow["status"], activeSites: number) {
  if (status === "active" && activeSites === 0) return "Onboarding";
  if (status === "active") return "Active";
  if (status === "suspended") return "Suspended";
  return "Churned";
}

function statusStyles(label: string) {
  if (label === "Active") return "text-[#08a35b]";
  if (label === "Onboarding") return "text-[#d48700]";
  if (label === "Suspended") return "text-[#73839a]";
  return "text-[#9f1239]";
}

export default async function ClientsPage() {
  const supabase = await createClient();

  const [{ data: clientsData, error }, { data: projectsData }, { data: deploymentsData }] =
    await Promise.all([
      supabase.from("clients").select("id,name,email,status").order("name", { ascending: true }),
      supabase.from("projects").select("id,client_id"),
      supabase
        .from("deployments")
        .select("id,project_id,status,created_at")
        .order("created_at", { ascending: false }),
    ]);

  const clients = (clientsData ?? []) as ClientRow[];
  const projects = (projectsData ?? []) as ProjectRow[];
  const deployments = (deploymentsData ?? []) as DeploymentRow[];

  const projectToClient = new Map<string, string>();
  const activeSitesByClient = new Map<string, number>();

  projects.forEach((project) => {
    projectToClient.set(project.id, project.client_id);
    activeSitesByClient.set(
      project.client_id,
      (activeSitesByClient.get(project.client_id) ?? 0) + 1,
    );
  });

  const latestDeployByClient = new Map<
    string,
    { created_at: string; status: string | null }
  >();

  deployments.forEach((deployment) => {
    const clientId = projectToClient.get(deployment.project_id);
    if (!clientId || latestDeployByClient.has(clientId)) return;
    latestDeployByClient.set(clientId, {
      created_at: deployment.created_at,
      status: deployment.status,
    });
  });

  const activeDeploymentCount = deployments.filter((deployment) =>
    ["queued", "building", "ready", "deployed"].includes(
      deployment.status ?? "unknown",
    ),
  ).length;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#1b2832] md:text-5xl">
            Clients
          </h1>
          <p className="mt-2 text-base text-slate-600 md:text-xl">
            Manage your enterprise client accounts and deployment pipelines.
          </p>
        </div>
        <a
          href="#new-client-form"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#0a6f87] px-6 py-3 text-base font-semibold text-white shadow-[0_10px_24px_rgba(10,111,135,0.26)] hover:bg-[#0a6175]"
        >
          <span className="text-xl leading-none">+</span>
          Add Client
        </a>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            Total Clients
          </p>
          <div className="mt-4 flex items-end gap-3">
            <p className="text-4xl font-bold text-[#0a6f87]">{clients.length}</p>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
              +12%
            </span>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            Active Deployments
          </p>
          <p className="mt-4 text-4xl font-bold text-[#0a6f87]">
            {activeDeploymentCount.toLocaleString()}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-5 shadow-[inset_4px_0_0_#0a6f87]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            Global Uptime
          </p>
          <p className="mt-4 text-4xl font-bold text-[#0a6f87]">99.98%</p>
        </article>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <table className="min-w-full">
          <thead className="bg-[#ecf1f5]">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
              <th className="px-8 py-6">Client Name</th>
              <th className="px-6 py-6">Plan Tier</th>
              <th className="px-6 py-6">Active Sites</th>
              <th className="px-6 py-6">Last Deployment</th>
              <th className="px-6 py-6">Status</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const activeSites = activeSitesByClient.get(client.id) ?? 0;
              const planTier = getPlanTier(activeSites);
              const latestDeployment = latestDeployByClient.get(client.id);
              const displayStatus = statusLabel(client.status, activeSites);
              const formatted = formatDate(latestDeployment?.created_at ?? null);
              const host = client.email?.split("@")[0] ?? client.name.toLowerCase().replace(/\s+/g, "-");

              return (
                <tr key={client.id} className="border-t border-slate-200 text-base text-slate-800">
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7eef2] text-lg font-semibold text-[#0a6f87]">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold">{client.name}</p>
                        <p className="text-sm text-slate-500">{host}.swift.site</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-8">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tierStyles(planTier)}`}>
                      {planTier}
                    </span>
                  </td>
                  <td className="px-6 py-8 font-semibold">{activeSites}</td>
                  <td className="px-6 py-8">
                    <p>{formatted.date}</p>
                    <p className="text-sm text-slate-500">{formatted.time}</p>
                  </td>
                  <td className={`px-6 py-8 font-semibold ${statusStyles(displayStatus)}`}>
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-current align-middle" />
                    {displayStatus}
                  </td>
                </tr>
              );
            })}
            {!clients.length && !error ? (
              <tr>
                <td className="px-8 py-10 text-slate-500" colSpan={5}>
                  No clients yet. Add your first client below.
                </td>
              </tr>
            ) : null}
            {error ? (
              <tr>
                <td className="px-8 py-10 text-red-700" colSpan={5}>
                  {error.message}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-slate-200 px-8 py-5 text-sm text-slate-600">
          <p>
            Showing 1 to {Math.min(clients.length, 4)} of {clients.length} clients
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl bg-slate-200 px-4 py-2 font-medium text-slate-600"
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-xl bg-[#0a6f87] px-4 py-2 font-medium text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <section
        id="new-client-form"
        className="rounded-3xl border border-slate-200 bg-white p-5"
      >
        <NewClientForm />
      </section>

      <div className="rounded-3xl border border-[#0a6f87] border-l-8 bg-[#eaf2f7] p-6">
        <p className="text-2xl font-semibold text-[#1f2e3a]">
          Need help with Enterprise Scaling?
        </p>
        <p className="mt-2 text-sm text-slate-600 md:text-base">
          Connect with your dedicated Account Manager to discuss custom site
          limits, advanced edge caching strategies, or priority white-label
          deployment workflows for your larger clients.
        </p>
        <button
          type="button"
          className="mt-4 text-base font-semibold text-[#0a6f87] hover:underline"
        >
          Contact Support →
        </button>
      </div>
    </section>
  );
}
