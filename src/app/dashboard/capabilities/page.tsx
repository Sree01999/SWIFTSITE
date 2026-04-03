import {
  capabilityReleaseScopeDecision,
  capabilityStatusClasses,
  capabilityStatusLabel,
  getCapabilities,
  getReleaseScopeSummary,
  getCapabilitySummary,
} from "@/lib/capabilities";

export default function CapabilitiesPage() {
  const capabilities = getCapabilities();
  const summary = getCapabilitySummary();
  const releaseScope = getReleaseScopeSummary();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-5xl font-bold tracking-tight text-[#1b2832]">
          Capability Ledger
        </h1>
        <p className="mt-2 text-xl text-slate-600">
          Live map of requirements, UI controls, backend wiring, and scope status.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-5">
          <p className="text-xs font-medium text-slate-600">Total capabilities</p>
          <p className="mt-3 text-4xl font-semibold text-[#0a6f87]">{summary.total}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-5">
          <p className="text-xs font-medium text-slate-600">Working / Partial</p>
          <p className="mt-3 text-4xl font-semibold text-[#0a6f87]">
            {summary.working} / {summary.partial}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-5">
          <p className="text-xs font-medium text-slate-600">Stub / Out of scope</p>
          <p className="mt-3 text-4xl font-semibold text-[#0a6f87]">
            {summary.stub} / {summary.outOfScope}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-5">
          <p className="text-xs font-medium text-slate-600">MVP readiness</p>
          <p className="mt-3 text-4xl font-semibold text-[#0a6f87]">
            {summary.mvpReady}/{summary.mvpTotal}
          </p>
          <p className="text-sm text-slate-600">{summary.mvpProgress}% complete</p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
          <p className="text-xs font-medium text-slate-600">Current release</p>
          <p className="mt-3 text-2xl font-semibold text-[#0a6f87]">
            {releaseScope.release}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
          <p className="text-xs font-medium text-slate-600">In scope / Deferred</p>
          <p className="mt-3 text-2xl font-semibold text-[#0a6f87]">
            {releaseScope.inScopeCount} / {releaseScope.deferredCount}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
          <p className="text-xs font-medium text-slate-600">Deferred but delivered</p>
          <p className="mt-3 text-2xl font-semibold text-[#0a6f87]">
            {releaseScope.deliveredEarly}
          </p>
          <p className="text-sm text-slate-600">
            Already built, but not required for current release.
          </p>
        </article>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <table className="min-w-full">
          <thead className="bg-[#ecf1f5]">
            <tr className="text-left text-xs font-medium text-slate-600">
              <th className="px-5 py-4">Capability</th>
              <th className="px-5 py-4">Requirement</th>
              <th className="px-5 py-4">Release scope</th>
              <th className="px-5 py-4">Scope</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">UI Routes</th>
              <th className="px-5 py-4">Backend Mapping</th>
            </tr>
          </thead>
          <tbody>
            {capabilities.map((capability) => (
              <tr key={capability.id} className="border-t border-slate-200 align-top">
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-900">{capability.title}</p>
                  <p className="text-xs text-slate-500">{capability.id}</p>
                </td>
                <td className="px-5 py-4 text-slate-700">{capability.requirementId}</td>
                <td className="px-5 py-4">
                  {capabilityReleaseScopeDecision(capability.id) === "in_scope" ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                      In scope
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                      Deferred
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      capability.scope === "mvp"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {capability.scope === "mvp" ? "MVP" : "Post-MVP"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${capabilityStatusClasses(
                      capability.status,
                    )}`}
                  >
                    {capabilityStatusLabel(capability.status)}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {capability.uiRoutes.map((route) => (
                    <p key={`${capability.id}-${route}`} className="text-sm">
                      {route}
                    </p>
                  ))}
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {capability.backendMappings.map((mapping) => (
                    <p key={`${capability.id}-${mapping}`} className="text-sm">
                      {mapping}
                    </p>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
