"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/layout/logout-button";
import { getNavigationLinks } from "@/components/layout/nav-links";
import { appBranding } from "@/lib/branding";
import { roleLabels, type UserRole } from "@/lib/permissions";

export function MobileNavigation({ email, role }: { email: string; role: UserRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const navigationLinks = getNavigationLinks(role);

  return (
    <>
      <header className="no-print sticky top-0 z-40 border-b border-line/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-white text-ink shadow-sm"
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" prefetch={false} className="min-w-0 flex-1 text-right">
            <p className="truncate text-lg font-bold text-ink">{appBranding.name}</p>
            <p className="truncate text-xs text-muted">{appBranding.tagline}</p>
          </Link>
        </div>
      </header>

      {isOpen ? (
        <div className="no-print fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-ink/45"
            aria-label="إغلاق القائمة"
            onClick={() => setIsOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-[min(88vw,340px)] flex-col bg-[radial-gradient(circle_at_top_right,rgba(217,154,23,0.16),transparent_34%),linear-gradient(180deg,#08231f_0%,#061a17_100%)] p-4 text-white shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <Link href="/dashboard" prefetch={false} onClick={() => setIsOpen(false)} className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gold/50 bg-gold/10 text-2xl font-black text-gold">
                  ع
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xl font-bold text-gold">{appBranding.name}</span>
                  <span className="mt-1 block truncate text-xs text-white/70">{appBranding.tagline}</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white"
                aria-label="إغلاق القائمة"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-7 grid gap-1">
              {navigationLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.href === "/dashboard"
                    ? pathname === link.href
                    : link.href === "/dashboard/transactions"
                      ? pathname.startsWith("/dashboard/transactions") &&
                        !pathname.startsWith("/dashboard/transactions/new")
                      : pathname === link.href || pathname.startsWith(`${link.href}/`);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    onClick={() => setIsOpen(false)}
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

            <div className="mt-auto grid gap-3 border-t border-white/10 pt-4">
              <div>
                <p className="truncate text-xs text-white/70">{email}</p>
                <p className="mt-1 truncate text-xs font-semibold text-gold">{roleLabels[role]}</p>
              </div>
              <LogoutButton />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
