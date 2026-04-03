export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-[1560px] items-stretch px-4 py-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(10,111,135,0.2),transparent_34%),radial-gradient(circle_at_84%_10%,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(8,145,178,0.12),transparent_40%)]" />
      <div className="grid min-h-[calc(100vh-2rem)] w-full gap-5 lg:grid-cols-[1.05fr_540px] xl:gap-6">
        <section className="fade-rise hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(145deg,#ffffff,#edf5fb)] p-8 text-left shadow-[0_16px_44px_rgba(15,31,45,0.14)] md:p-10 xl:p-12 lg:flex lg:flex-col lg:justify-start lg:gap-7">
          <div>
            <p className="type-label text-[#0a6f87]">SwiftSite Enterprise Console</p>
            <h1 className="mt-4 max-w-[640px] text-5xl font-bold leading-[1.1] tracking-tight text-[#152436]">
              Run every client website from one operator console.
            </h1>
            <p className="mt-5 max-w-[540px] text-base text-slate-600">
              SwiftSite helps you onboard clients, deploy updates, verify
              domains and SSL, monitor health, and track billing from one secure
              dashboard so nothing falls through.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-left">
              <p className="type-caption text-slate-500">Deployment Control</p>
              <p className="mt-2 text-2xl font-semibold leading-tight text-[#152436]">
                Live
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Trigger, restart, abort, and track build status in real time.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-left">
              <p className="type-caption text-slate-500">Data Security</p>
              <p className="mt-2 text-2xl font-semibold leading-tight text-[#152436]">
                Owner scoped
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Protected project and billing workflows with scoped access.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-left">
              <p className="type-caption text-slate-500">Operator Efficiency</p>
              <p className="mt-2 text-2xl font-semibold leading-tight text-[#152436]">
                Solo first
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Built for solo use today and team roles when you scale.
              </p>
            </article>
          </div>

          <div className="rounded-2xl border border-[#0a6f87]/25 bg-[#e7f3f7] p-5">
            <p className="type-label text-[#0a6f87]">Operational reliability</p>
            <p className="mt-2 text-base text-[#224154]">
              Standardized workflows reduce manual mistakes and save time across
              every client project.
            </p>
          </div>
        </section>

        <section className="fade-rise flex w-full items-center rounded-[28px] border border-slate-200/90 bg-white p-7 shadow-[0_16px_44px_rgba(15,31,45,0.12)] sm:p-8 md:p-10 xl:p-12">
          {children}
        </section>
      </div>
    </main>
  );
}
