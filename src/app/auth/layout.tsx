export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
      <div className="grid w-full gap-6 lg:grid-cols-[1fr_500px]">
        <section className="panel-card fade-rise hidden p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="eyebrow">SwiftSite Platform</p>
            <h1 className="type-hero mt-4">
              Build, deploy, and run client sites from one calm dashboard.
            </h1>
            <p className="type-body mt-4 max-w-lg text-slate-600">
              We are shaping the operator console to feel fast, predictable, and
              premium from day one.
            </p>
          </div>
          <div className="soft-card mt-8 p-5">
            <p className="eyebrow">MVP Focus</p>
            <p className="mt-2 text-sm text-slate-700">
              Single-operator workflow, owner-scoped security, and deploy
              automation that grows with your business.
            </p>
          </div>
        </section>
        <section className="panel-card fade-rise w-full p-8">{children}</section>
      </div>
    </main>
  );
}
