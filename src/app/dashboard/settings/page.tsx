export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-5xl font-bold tracking-tight text-[#1b2832]">Settings</h1>
        <p className="mt-2 text-xl text-slate-600">
          Environment controls, operational defaults, and system preferences.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white px-6 py-6">
          <h2 className="text-2xl font-semibold text-[#1f2f39]">Environment</h2>
          <div className="mt-4 space-y-2 text-slate-700">
            <p>
              <span className="font-semibold">Mode:</span> Development
            </p>
            <p>
              <span className="font-semibold">Region:</span> us-east-1
            </p>
            <p>
              <span className="font-semibold">App URL:</span> http://localhost:3000
            </p>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white px-6 py-6">
          <h2 className="text-2xl font-semibold text-[#1f2f39]">Feature Flags</h2>
          <div className="mt-4 space-y-2 text-slate-700">
            <p>Client CMS: Off</p>
            <p>SEO Package: Off</p>
            <p>Analytics Dashboard: Off</p>
            <p>Change Request Workflow: Off</p>
          </div>
        </article>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-[#ecf2f6] px-7 py-7">
        <h2 className="text-3xl font-semibold text-[#1f2f39]">Security Notes</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
          <li>Keep service keys only in server-side environment variables.</li>
          <li>Rotate Supabase and Stripe secrets every 90 days.</li>
          <li>Use production keys only after staging acceptance passes.</li>
        </ul>
      </div>
    </section>
  );
}
