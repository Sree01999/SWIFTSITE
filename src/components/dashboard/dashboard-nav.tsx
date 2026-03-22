"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/dashboard/clients", label: "Clients", icon: "◉" },
  { href: "/dashboard/projects", label: "Deployments", icon: "✦" },
  { href: "/dashboard/monitoring", label: "Monitoring", icon: "▣" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙" },
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
            <span className="w-5 text-center opacity-85">
              {item.icon ?? "•"}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

