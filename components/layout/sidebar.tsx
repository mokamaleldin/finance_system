"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/layout/logout-button";
import { navigationLinks } from "@/components/layout/nav-links";
import { appBranding } from "@/lib/branding";

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  if (href === "/dashboard/transactions") {
    return pathname.startsWith("/dashboard/transactions") && !pathname.startsWith("/dashboard/transactions/new");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="no-print hidden border-l border-white/10 bg-ink text-white lg:fixed lg:inset-y-0 lg:right-0 lg:flex lg:w-72">
      <div className="flex h-full w-full flex-col bg-[radial-gradient(circle_at_top_right,rgba(217,154,23,0.16),transparent_34%),linear-gradient(180deg,#08231f_0%,#061a17_100%)] p-5">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-2 py-4">
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-gold/50 bg-gold/10 text-3xl font-black text-gold shadow-sm">
            ع
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xl font-bold text-gold">{appBranding.name}</span>
            <span className="mt-1 block truncate text-xs font-semibold text-white/70">{appBranding.tagline}</span>
          </span>
        </Link>

        <nav className="mt-6 grid gap-2">
          {navigationLinks.map((link) => {
            const Icon = link.icon;
            const isActive = isActivePath(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "border-gold/45 bg-white/10 text-gold shadow-[inset_3px_0_0_rgba(217,154,23,0.95)]"
                    : "border-transparent text-white/80 hover:border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-white/10 bg-white/10 p-3 shadow-sm">
          <p className="truncate text-sm font-bold text-white">{appBranding.name}</p>
          <p className="mt-1 truncate text-xs text-white/60">{email}</p>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
