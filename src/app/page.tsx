import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
      <section className="panel-card fade-rise w-full p-8 md:p-10">
        <p className="eyebrow">SwiftSite MVP</p>
        <h1 className="type-hero mt-3 max-w-3xl">
          Internal command center for high-velocity web delivery.
        </h1>
        <p className="type-body mt-4 max-w-2xl text-slate-600">
          Auth, client operations, project tracking, and deployment flow are
          now connected in one place and ready for scale-up.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {user ? (
            <Link href="/dashboard" className="btn-primary text-sm">
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/register" className="btn-primary text-sm">
                Create Account
              </Link>
              <Link href="/auth/login" className="btn-secondary text-sm">
                Log In
              </Link>
            </>
          )}
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <article className="soft-card p-4">
            <p className="eyebrow">Security</p>
            <p className="mt-2 text-sm text-slate-700">
              Owner-scoped RLS with session-aware middleware protection.
            </p>
          </article>
          <article className="soft-card p-4">
            <p className="eyebrow">Operations</p>
            <p className="mt-2 text-sm text-slate-700">
              Unified workflow for clients, projects, and deployment control.
            </p>
          </article>
          <article className="soft-card p-4">
            <p className="eyebrow">Scalability</p>
            <p className="mt-2 text-sm text-slate-700">
              Built for free-tier launch with production-ready growth path.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
