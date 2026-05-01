import { ArrowLeft, Banknote, ReceiptText, Repeat, UsersRound } from "lucide-react";
import Link from "next/link";
import { Card, StatCard } from "@/components/ui/card";
import { currencies } from "@/lib/calculations";
import { formatDecimal, formatMoney } from "@/lib/format";
import { getDashboardMetrics } from "@/lib/ledger";

const quickLinks = [
  { href: "/dashboard/customers", label: "إدارة العملاء", icon: UsersRound },
  { href: "/dashboard/movements/new", label: "تسجيل حركة", icon: Banknote },
  { href: "/dashboard/movements", label: "الحركات المالية", icon: ReceiptText },
  { href: "/dashboard/transactions", label: "المعاملات المفتوحة", icon: Repeat },
];

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">لوحة التحكم</h2>
        <p className="mt-1 text-sm text-muted">ملخص اليوم من الحركات المسجلة في دفتر الأستاذ.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="عدد حركات اليوم" value={formatDecimal(metrics.movementsCount)} />
        <StatCard title="ربح اليوم" value={formatDecimal(metrics.todayProfit)} hint="من المعاملات التي لها ربح محسوب" />
        <StatCard title="إجمالي العملاء" value={formatDecimal(metrics.customersCount)} />
        <StatCard title="معاملات مفتوحة" value={formatDecimal(metrics.openGroupsCount)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="وارد اليوم حسب العملة">
          <div className="grid gap-3">
            {currencies.map((currency) => (
              <div key={currency} className="flex items-center justify-between rounded-lg bg-mint px-3 py-2">
                <span className="text-sm font-semibold text-muted">{currency}</span>
                <span className="font-bold text-ink">{formatMoney(metrics.totals.received[currency], currency)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="صادر اليوم حسب العملة">
          <div className="grid gap-3">
            {currencies.map((currency) => (
              <div key={currency} className="flex items-center justify-between rounded-lg bg-paper px-3 py-2">
                <span className="text-sm font-semibold text-muted">{currency}</span>
                <span className="font-bold text-ink">{formatMoney(metrics.totals.paid[currency], currency)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="روابط سريعة">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-lg border border-line p-4 transition hover:border-olive hover:bg-mint"
              >
                <span className="flex items-center gap-2 font-semibold text-ink">
                  <Icon className="h-4 w-4" />
                  {link.label}
                </span>
                <ArrowLeft className="h-4 w-4 text-muted" />
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
