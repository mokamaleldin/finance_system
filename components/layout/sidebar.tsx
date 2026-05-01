import {
  Banknote,
  BarChart3,
  Gauge,
  Repeat,
  UserRound,
} from "lucide-react";
import Link from "next/link";

const links = [
  { href: "/dashboard", label: "لوحة التحكم", icon: Gauge },
  { href: "/dashboard/transactions/new", label: "معاملة جديدة", icon: Banknote },
  { href: "/dashboard/transactions", label: "سجل المعاملات", icon: Repeat },
  { href: "/dashboard/open", label: "المتبقي علينا ولنا", icon: BarChart3 },
  { href: "/dashboard/customers", label: "العملاء", icon: UserRound },
  { href: "/dashboard/reports/daily", label: "تقرير اليوم", icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="no-print border-l border-line bg-ink text-white lg:fixed lg:inset-y-0 lg:right-0 lg:w-64">
      <div className="flex h-full flex-col p-4">
        <Link href="/dashboard" className="rounded-lg px-3 py-4">
          <p className="text-xl font-bold">دفتر الصرافة</p>
          <p className="mt-1 text-sm text-white/70">مصر وتركيا</p>
        </Link>

        <nav className="mt-6 grid gap-1">
          {links.map((link) => {
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
