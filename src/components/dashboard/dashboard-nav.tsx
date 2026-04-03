"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/dashboard/clients", label: "Clients", icon: UsersIcon },
  { href: "/dashboard/projects", label: "Projects", icon: FolderIcon },
  { href: "/dashboard/billing", label: "Billing", icon: CardIcon },
  { href: "/dashboard/monitoring", label: "Monitoring", icon: PulseIcon },
  { href: "/dashboard/capabilities", label: "Capabilities", icon: ChecklistIcon },
  { href: "/dashboard/settings", label: "Settings", icon: GearIcon }
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5">
      {navItems.map((item) => {
        const isDashboardRoot = item.href === "/dashboard";
        const isActive = isDashboardRoot
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`type-nav flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition ${
              isActive
                ? "bg-[#e6eff3] text-[#0b6b81]"
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
            }`}
          >
            <span className="w-5 opacity-85">
              <item.icon className="h-5 w-5" />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
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

function DashboardIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
    </IconBase>
  );
}

function UsersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8.2" r="2.7" />
      <path d="M3.8 18c.6-2.4 2.9-4 5.2-4 2.3 0 4.6 1.6 5.2 4" />
      <circle cx="17.3" cy="9.3" r="2.1" />
      <path d="M15.3 17.7c.6-1.7 2.1-2.8 3.9-3.1" />
    </IconBase>
  );
}

function FolderIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.6 7.8a2.3 2.3 0 0 1 2.3-2.3h4.1l2 2.2h6a2.3 2.3 0 0 1 2.3 2.3v6.3a2.3 2.3 0 0 1-2.3 2.3H5.9a2.3 2.3 0 0 1-2.3-2.3z" />
    </IconBase>
  );
}

function CardIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="5.6" width="17" height="12.8" rx="2.2" />
      <path d="M3.5 10h17" />
      <path d="M7.2 14.2h3.8" />
    </IconBase>
  );
}

function PulseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.7 12h4l1.9-3.6 4 7.2 2.3-4.4h4.4" />
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.1" />
    </IconBase>
  );
}

function ChecklistIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4.4" y="3.8" width="15.2" height="16.4" rx="2" />
      <path d="M8 8.2l1.4 1.4 2.4-2.4" />
      <path d="M13.7 9h3" />
      <path d="M8 13l1.4 1.4 2.4-2.4" />
      <path d="M13.7 13.8h3" />
    </IconBase>
  );
}

function GearIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h8" />
      <path d="M16 7h4" />
      <circle cx="14" cy="7" r="2" />
      <path d="M4 12h4" />
      <path d="M12 12h8" />
      <circle cx="10" cy="12" r="2" />
      <path d="M4 17h10" />
      <path d="M18 17h2" />
      <circle cx="16" cy="17" r="2" />
    </IconBase>
  );
}
