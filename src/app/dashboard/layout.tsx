import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode, SVGProps } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { CapabilityPill } from "@/components/capability/capability-pill";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { isCapabilityEnabled } from "@/lib/capabilities";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
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
          <p className="type-label mt-2 text-slate-500">Enterprise Console</p>
        </div>
        <div className="mt-10">
          <DashboardNav />
        </div>
        <div className="mt-auto pt-8">
          <SignOutButton className="type-button w-full rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 text-left text-slate-600 hover:bg-white/70" />
        </div>
      </aside>

      <main className="min-h-screen pb-8">
        <header className="flex min-h-[92px] items-center border-b border-slate-200/80 bg-[#f7f9fb] px-4 md:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-5 xl:gap-8">
            <div className="relative w-full max-w-xl flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon className="h-4 w-4" />
              </span>
              <input
                placeholder="Search deployments, domains, or logs..."
                className="type-secondary h-11 w-full rounded-2xl border border-transparent bg-[#e9eef3] pl-11 pr-4 text-slate-600 outline-none"
              />
            </div>

            <div className="type-nav hidden shrink-0 items-center gap-7 text-slate-600 xl:flex">
              {docsEnabled ? (
                <Link
                  href="/dashboard/docs"
                  data-capability="nav-docs-link"
                  className="type-nav whitespace-nowrap bg-transparent hover:text-slate-800"
                >
                  Docs
                </Link>
              ) : (
                <button
                  type="button"
                  data-capability="nav-docs-link"
                  disabled
                  className="type-nav cursor-not-allowed whitespace-nowrap bg-transparent opacity-55"
                >
                  Docs
                </button>
              )}

              {supportEnabled ? (
                <Link
                  href="/dashboard/support"
                  data-capability="nav-support-link"
                  className="type-nav whitespace-nowrap bg-transparent hover:text-slate-800"
                >
                  Support
                </Link>
              ) : (
                <button
                  type="button"
                  data-capability="nav-support-link"
                  disabled
                  className="type-nav cursor-not-allowed whitespace-nowrap bg-transparent opacity-55"
                >
                  Support
                </button>
              )}

              {changelogEnabled ? (
                <Link
                  href="/dashboard/changelog"
                  data-capability="nav-changelog-link"
                  className="type-nav whitespace-nowrap bg-transparent hover:text-slate-800"
                >
                  Changelog
                </Link>
              ) : (
                <button
                  type="button"
                  data-capability="nav-changelog-link"
                  disabled
                  className="type-nav cursor-not-allowed whitespace-nowrap bg-transparent opacity-55"
                >
                  Changelog
                </button>
              )}

              {!docsEnabled || !supportEnabled || !changelogEnabled ? (
                <CapabilityPill capabilityId="nav-docs-link" compact />
              ) : null}
            </div>
          </div>

          <div className="ml-4 flex shrink-0 items-center gap-3 md:gap-4">
            <button
              type="button"
              aria-label="Notifications"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200/65"
            >
              <BellIcon className="h-4.5 w-4.5" />
            </button>

            <button
              type="button"
              aria-label="Help"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200/65"
            >
              <HelpIcon className="h-4.5 w-4.5" />
            </button>

            <a href="#" className="type-nav hidden whitespace-nowrap text-[#0b5f72] 2xl:inline">
              Switch Org
            </a>

            <Link
              href="/dashboard/projects"
              className="type-button inline-flex h-11 min-w-[136px] items-center justify-center whitespace-nowrap rounded-full bg-[#0a6f87] px-6 text-white shadow-[0_8px_20px_rgba(10,111,135,0.28)] hover:bg-[#095f73]"
            >
              Deploy Site
            </Link>

            <span className="type-caption hidden whitespace-nowrap text-slate-500 xl:inline">
              {orgLabel}
            </span>
          </div>
        </header>

        <div className="px-4 py-7 md:px-8">{children}</div>
      </main>
    </div>
  );
}

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ className, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4.2 4.2" />
    </IconBase>
  );
}

function BellIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M15.9 17.4H8.1a1.4 1.4 0 0 1-1.3-2l1-2.4v-2.1A4.2 4.2 0 0 1 12 6.7a4.2 4.2 0 0 1 4.2 4.2V13l1 2.4a1.4 1.4 0 0 1-1.3 2Z" />
      <path d="M10.5 19.3a1.5 1.5 0 0 0 3 0" />
    </IconBase>
  );
}

function HelpIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.3" />
      <path d="M9.8 9.5a2.4 2.4 0 1 1 4.2 1.6c-.6.7-1.4 1.1-1.8 1.8v.9" />
      <path d="M12 16.7h.01" />
    </IconBase>
  );
}
