export default function BillingPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-5xl font-bold tracking-tight text-[#1b2832]">Billing</h1>
        <p className="mt-2 text-xl text-slate-600">
          Revenue controls, invoice automation, and subscription lifecycle.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            Build Fee
          </p>
          <p className="mt-3 text-4xl font-bold text-[#0a6f87]">$199</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            Maintenance
          </p>
          <p className="mt-3 text-4xl font-bold text-[#0a6f87]">$19/mo</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            Integration Status
          </p>
          <p className="mt-3 text-4xl font-bold text-[#0a6f87]">Deferred</p>
        </article>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white px-7 py-7">
        <h2 className="text-3xl font-semibold text-[#1f2f39]">Implementation Plan</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-slate-700">
          <li>Create Stripe checkout for one-time build fee.</li>
          <li>Auto-start monthly subscription after first successful deploy.</li>
          <li>Sync invoice states to `invoices` via webhook events.</li>
          <li>Show payment status and retry actions in this dashboard.</li>
        </ol>
      </div>
    </section>
  );
}
