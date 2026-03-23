import Link from "next/link";

const endpoints = [
  {
    method: "POST",
    path: "/api/deploy",
    description: "Trigger a deployment for a project by ID.",
  },
  {
    method: "POST",
    path: "/api/domains",
    description: "Create and attach a domain record to a project.",
  },
  {
    method: "POST",
    path: "/api/domains/[id]/dns-check",
    description: "Run DNS verification checks for a domain.",
  },
  {
    method: "POST",
    path: "/api/billing/checkout",
    description: "Start checkout flow (mock or Stripe mode).",
  },
  {
    method: "GET",
    path: "/api/monitoring/export",
    description: "Download monitoring deployment report as CSV.",
  },
];

export default function ApiGuidePage() {
  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-medium text-[#0a6f87]">
          <Link href="/dashboard" className="hover:underline">
            Back to Dashboard
          </Link>
        </p>
        <h1 className="mt-2 text-5xl font-bold tracking-tight text-[#1b2832]">
          API Guide
        </h1>
        <p className="mt-2 text-xl text-slate-600">
          Operational endpoints used by the SwiftSite operator console.
        </p>
      </header>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold text-[#1f2f39]">Available Endpoints</h2>
        <p className="mt-2 text-base text-slate-600">
          Use authenticated session context for dashboard-initiated requests.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#ecf1f5]">
              <tr className="text-left text-sm text-slate-600">
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Path</th>
                <th className="px-4 py-3">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint) => (
                <tr key={`${endpoint.method}-${endpoint.path}`} className="border-t border-slate-200">
                  <td className="px-4 py-3 text-sm font-medium text-[#0a6f87]">
                    {endpoint.method}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800">{endpoint.path}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {endpoint.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold text-[#1f2f39]">Response Discipline</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-slate-700">
          <li>All endpoints should return JSON for success and failure paths.</li>
          <li>Use capability ledger updates whenever endpoint behavior changes.</li>
          <li>Keep mock-mode behavior explicit until production cutover.</li>
        </ul>
      </article>
    </section>
  );
}
