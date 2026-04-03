import Link from "next/link";

export default function DashboardDocsPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-5xl font-bold tracking-tight text-[#1b2832]">Docs</h1>
        <p className="mt-2 text-xl text-slate-600">
          Start here if you are a new agency operator. Follow these steps in
          order to run your first client from onboarding to live domain.
        </p>
      </header>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold text-[#1f2f39]">
          Quick start in 10 minutes
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-slate-700">
          <li>Create your first client in Clients.</li>
          <li>Create a project under that client in Projects.</li>
          <li>Open the project and run your first deployment.</li>
          <li>Add domain DNS records and complete verification.</li>
          <li>Open Billing and create the first invoice/checkout.</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard/clients"
            className="rounded-full bg-[#0a6f87] px-4 py-2 text-sm font-semibold text-white hover:bg-[#095f73]"
          >
            Start with Clients
          </Link>
          <Link
            href="/dashboard/support"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Open Support
          </Link>
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold text-[#1f2f39]">
          Step-by-step operating flow
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6 text-base text-slate-700">
          <li>
            Onboard client: save client name, contact email, and service plan.
          </li>
          <li>Create project: assign slug, stack, and deployment details.</li>
          <li>
            Deploy site: trigger deployment and watch status in project logs.
          </li>
          <li>
            Connect domain: add TXT/CNAME/A records and run DNS check until verified.
          </li>
          <li>
            Confirm SSL: once domain verifies, confirm HTTPS is active for the client.
          </li>
          <li>
            Start billing: create setup fee and monthly plan invoice for recurring revenue.
          </li>
          <li>
            Monitor health: check daily for failed builds, domain issues, or unpaid invoices.
          </li>
        </ol>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold text-[#1f2f39]">
          What is live vs what is mock today
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-slate-700">
          <li>
            Live now: client/project workflow, deployment controls, domain DNS check,
            monitoring dashboards.
          </li>
          <li>
            Partial/mock: billing fallback mode when Stripe live keys are not configured.
          </li>
          <li>
            Before production launch: remove dev-only payment and deploy mock controls.
          </li>
        </ul>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold text-[#1f2f39]">Daily operator routine</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-slate-700">
          <li>Morning: check Dashboard summary and monitoring health signals.</li>
          <li>Mid-day: process new client requests and pending domain verifications.</li>
          <li>End of day: confirm invoices, unresolved errors, and next-day priorities.</li>
          <li>
            Before release: run `pnpm scope:check`, `pnpm run lint`, and `pnpm run build`.
          </li>
        </ul>
      </article>
    </section>
  );
}
