"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/layout/logout-button";
import { navigationLinks } from "@/components/layout/nav-links";
import { appBranding } from "@/lib/branding";

export function MobileNavigation({ email }: { email: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="no-print sticky top-0 z-40 border-b border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-white text-ink"
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="min-w-0 flex-1 text-right">
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
          <aside className="absolute inset-y-0 right-0 flex w-[min(86vw,320px)] flex-col bg-ink p-4 text-white shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <Link href="/dashboard" onClick={() => setIsOpen(false)} className="min-w-0">
                <p className="text-xl font-bold">{appBranding.name}</p>
                <p className="mt-1 text-sm text-white/70">{appBranding.tagline}</p>
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
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                      isActive ? "bg-white text-ink" : "text-white/82 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto grid gap-3 border-t border-white/10 pt-4">
              <p className="truncate text-xs text-white/70">{email}</p>
              <LogoutButton />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
