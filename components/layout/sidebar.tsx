import Link from "next/link";
import { navigationLinks } from "@/components/layout/nav-links";
import { appBranding } from "@/lib/branding";

export function Sidebar() {
  return (
    <aside className="no-print hidden border-l border-line bg-ink text-white lg:fixed lg:inset-y-0 lg:right-0 lg:flex lg:w-64">
      <div className="flex h-full flex-col p-4">
        <Link href="/dashboard" className="rounded-lg px-3 py-4">
          <p className="text-xl font-bold">{appBranding.name}</p>
          <p className="mt-1 text-sm text-white/70">{appBranding.tagline}</p>
        </Link>

        <nav className="mt-6 grid gap-1">
          {navigationLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/82 transition hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
