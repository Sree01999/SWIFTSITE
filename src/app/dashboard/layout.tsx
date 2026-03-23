import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { CapabilityPill } from "@/components/capability/capability-pill";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { isCapabilityEnabled } from "@/lib/capabilities";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  await supabase.from("profiles").upsert({
    id: user.id,
    full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
  });

  const orgLabel =
    (user.user_metadata?.full_name as string | undefined) ?? "Acme Corp";
  const docsEnabled = isCapabilityEnabled("nav-docs-link");
  const supportEnabled = isCapabilityEnabled("nav-support-link");
  const changelogEnabled = isCapabilityEnabled("nav-changelog-link");

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-[1700px] grid-cols-1 bg-[#f3f6f9] lg:grid-cols-[288px_1fr]">
      <aside className="flex min-h-screen flex-col border-r border-slate-200/80 bg-[#eef2f6] px-6 py-8 md:px-8 md:py-9">
        <div>
          <h2 className="text-4xl font-bold leading-none text-[#0a6a80] md:text-5xl">
            SwiftSite
          </h2>
          <p className="type-label mt-2 text-slate-500">
            Enterprise Console
          </p>
        </div>
        <div className="mt-10">
          <DashboardNav />
        </div>
        <div className="mt-auto pt-8">
          <SignOutButton className="type-button w-full rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 text-left text-slate-600 hover:bg-white/70" />
        </div>
      </aside>
      <main className="min-h-screen pb-8">
        <header className="flex min-h-[92px] items-center justify-between border-b border-slate-200/80 bg-[#f7f9fb] px-4 md:px-8">
          <div className="relative w-full max-w-xl">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>
            <input
              placeholder="Search deployments, domains, or logs..."
              className="type-secondary h-11 w-full rounded-2xl border border-transparent bg-[#e9eef3] pl-11 pr-4 text-slate-600 outline-none"
            />
          </div>
          <div className="type-nav ml-8 hidden items-center gap-7 text-slate-600 lg:flex">
            <button
              type="button"
              data-capability="nav-docs-link"
              disabled={!docsEnabled}
              className={`type-nav bg-transparent ${docsEnabled ? "hover:text-slate-800" : "cursor-not-allowed opacity-55"}`}
            >
              Docs
            </button>
            <button
              type="button"
              data-capability="nav-support-link"
              disabled={!supportEnabled}
              className={`type-nav bg-transparent ${supportEnabled ? "hover:text-slate-800" : "cursor-not-allowed opacity-55"}`}
            >
              Support
            </button>
            <button
              type="button"
              data-capability="nav-changelog-link"
              disabled={!changelogEnabled}
              className={`type-nav bg-transparent ${changelogEnabled ? "hover:text-slate-800" : "cursor-not-allowed opacity-55"}`}
            >
              Changelog
            </button>
            {!docsEnabled || !supportEnabled || !changelogEnabled ? (
              <CapabilityPill capabilityId="nav-docs-link" compact />
            ) : null}
          </div>
          <div className="ml-8 flex items-center gap-4">
            <span className="text-slate-500">🔔</span>
            <span className="text-slate-500">?</span>
            <a href="#" className="type-nav text-[#0b5f72]">
              Switch Org
            </a>
            <Link
              href="/dashboard/projects"
              className="type-button rounded-full bg-[#0a6f87] px-5 py-2 text-white shadow-[0_8px_20px_rgba(10,111,135,0.28)] hover:bg-[#095f73]"
            >
              Deploy Site
            </Link>
            <span className="type-caption hidden text-slate-500 xl:inline">{orgLabel}</span>
          </div>
        </header>
        <div className="px-4 py-7 md:px-8">{children}</div>
      </main>
    </div>
  );
}
