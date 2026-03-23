const entries = [
  {
    date: "2026-03-23",
    title: "Monitoring Actions Enabled",
    details:
      "CSV export and incremental log loading are now operational from the Monitoring screen.",
  },
  {
    date: "2026-03-23",
    title: "Billing Mock Flow Stabilized",
    details:
      "Dev payment action now reliably updates invoice state and dashboard billing totals.",
  },
  {
    date: "2026-03-23",
    title: "Domain DNS Workflow Added",
    details:
      "Domain token verification, DNS checks, and SSL status transitions are now wired.",
  },
];

export default function DashboardChangelogPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-5xl font-bold tracking-tight text-[#1b2832]">Changelog</h1>
        <p className="mt-2 text-xl text-slate-600">
          Product implementation timeline for the SwiftSite operator console.
        </p>
      </header>

      <div className="space-y-4">
        {entries.map((entry) => (
          <article
            key={`${entry.date}-${entry.title}`}
            className="rounded-3xl border border-slate-200 bg-white p-6"
          >
            <p className="text-sm text-slate-500">{entry.date}</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#1f2f39]">{entry.title}</h2>
            <p className="mt-2 text-base text-slate-700">{entry.details}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
