export default function DashboardLoading() {
  return (
    <section className="space-y-4">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-6 w-96 animate-pulse rounded-xl bg-slate-200" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      </div>
      <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
    </section>
  );
}
