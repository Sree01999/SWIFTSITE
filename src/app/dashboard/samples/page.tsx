import Link from "next/link";

const samples = [
  {
    title: "Client Onboarding Flow",
    steps: [
      "Create client record",
      "Create first project",
      "Attach domain and run DNS check",
      "Trigger initial deployment",
    ],
  },
  {
    title: "Billing Mock Validation",
    steps: [
      "Create checkout invoice in billing page",
      "Mark invoice as paid in dev actions",
      "Confirm revenue and open invoice metrics update",
      "Confirm maintenance invoice generation",
    ],
  },
  {
    title: "Monitoring Operations",
    steps: [
      "Open monitoring overview",
      "Export CSV report",
      "Open detailed analytics and filter failures",
      "Review project health and recent failures",
    ],
  },
];

export default function SamplesPage() {
  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-medium text-[#0a6f87]">
          <Link href="/dashboard" className="hover:underline">
            Back to Dashboard
          </Link>
        </p>
        <h1 className="mt-2 text-5xl font-bold tracking-tight text-[#1b2832]">
          Implementation Samples
        </h1>
        <p className="mt-2 text-xl text-slate-600">
          Reusable workflow patterns to validate operator tasks quickly.
        </p>
      </header>

      <div className="grid gap-4">
        {samples.map((sample) => (
          <article key={sample.title} className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-3xl font-semibold text-[#1f2f39]">{sample.title}</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-base text-slate-700">
              {sample.steps.map((step) => (
                <li key={`${sample.title}-${step}`}>{step}</li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
