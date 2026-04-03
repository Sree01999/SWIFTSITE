import Link from "next/link";

export default function DashboardSupportPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-5xl font-bold tracking-tight text-[#1b2832]">Support</h1>
        <p className="mt-2 text-xl text-slate-600">
          Troubleshooting center for operators. Use this page when a workflow is
          blocked or behavior looks unexpected.
        </p>
      </header>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold text-[#1f2f39]">
          If something fails, check this first
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-slate-700">
          <li>Auth issue: verify Supabase URL/key values in `.env.local`.</li>
          <li>Deploy issue: confirm project deploy settings and provider endpoint.</li>
          <li>Domain issue: verify TXT plus CNAME or A records exactly match required values.</li>
          <li>Billing issue: confirm Stripe mode (mock/test/live) and invoice status.</li>
        </ul>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold text-[#1f2f39]">
          Symptom to action map
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#ecf1f5]">
              <tr className="text-left text-xs font-semibold text-slate-600">
                <th className="px-4 py-3">Symptom</th>
                <th className="px-4 py-3">Likely cause</th>
                <th className="px-4 py-3">Immediate action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-200">
                <td className="px-4 py-3 text-sm text-slate-700">Verify button disabled</td>
                <td className="px-4 py-3 text-sm text-slate-700">DNS records not propagated yet</td>
                <td className="px-4 py-3 text-sm text-slate-700">Wait 5-30 min, run DNS check again</td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="px-4 py-3 text-sm text-slate-700">Checkout returns mock mode message</td>
                <td className="px-4 py-3 text-sm text-slate-700">Stripe key missing or disabled</td>
                <td className="px-4 py-3 text-sm text-slate-700">Set Stripe keys or continue dev mode testing</td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="px-4 py-3 text-sm text-slate-700">401 unauthorized on action</td>
                <td className="px-4 py-3 text-sm text-slate-700">Session expired or auth mismatch</td>
                <td className="px-4 py-3 text-sm text-slate-700">Log out, log in, retry request</td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="px-4 py-3 text-sm text-slate-700">Deploy action does nothing</td>
                <td className="px-4 py-3 text-sm text-slate-700">Hook/endpoint not configured correctly</td>
                <td className="px-4 py-3 text-sm text-slate-700">Validate hook URL and API response message</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold text-[#1f2f39]">Escalation path</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-6 text-base text-slate-700">
          <li>Capture exact steps you performed.</li>
          <li>Capture console error and API response message.</li>
          <li>Note affected client/project/domain IDs.</li>
          <li>Open internal engineering issue with the details above.</li>
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard/docs"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Open Docs
          </Link>
          <Link
            href="/dashboard/capabilities"
            className="rounded-full bg-[#0a6f87] px-4 py-2 text-sm font-semibold text-white hover:bg-[#095f73]"
          >
            Check Capabilities
          </Link>
        </div>
      </article>
    </section>
  );
}
