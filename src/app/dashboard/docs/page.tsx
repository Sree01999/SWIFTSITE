export default function DashboardDocsPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-5xl font-bold tracking-tight text-[#1b2832]">Docs</h1>
        <p className="mt-2 text-xl text-slate-600">
          Internal operating guides for the SwiftSite single-operator MVP.
        </p>
      </header>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold text-[#1f2f39]">Runbook</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-slate-700">
          <li>Create client and project from dashboard forms.</li>
          <li>Set domain and run DNS checks in project details.</li>
          <li>Trigger deploy and watch status updates in deployment view.</li>
          <li>Use billing mock flow until Stripe live keys are added.</li>
        </ul>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold text-[#1f2f39]">Environment Notes</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-slate-700">
          <li>Supabase keys are required in `.env.local`.</li>
          <li>Stripe is optional for now and runs in mock mode when absent.</li>
          <li>Use `pnpm scope:check` before every push to avoid scope drift.</li>
        </ul>
      </article>
    </section>
  );
}
