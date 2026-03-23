export default function DashboardSupportPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-5xl font-bold tracking-tight text-[#1b2832]">Support</h1>
        <p className="mt-2 text-xl text-slate-600">
          Operator support center for troubleshooting and escalation.
        </p>
      </header>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold text-[#1f2f39]">Troubleshooting</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-slate-700">
          <li>If auth fails, verify Supabase URL and publishable key.</li>
          <li>If deploy hook fails, verify hook URL and provider status.</li>
          <li>If domains fail verification, confirm TXT + CNAME/A records.</li>
          <li>If billing fails, check invoice state and API response message.</li>
        </ul>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold text-[#1f2f39]">Escalation Path</h2>
        <p className="mt-4 text-base text-slate-700">
          For MVP, use the internal engineering escalation process and capture steps,
          console error, and API response body before filing an issue.
        </p>
      </article>
    </section>
  );
}
