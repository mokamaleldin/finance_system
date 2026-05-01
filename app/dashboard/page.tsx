import { ArrowLeft, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, StatCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { currencies } from "@/lib/calculations";
import { formatDate, formatDecimal, formatMoney } from "@/lib/format";
import {
  deliveredStatusLabels,
  receivedStatusLabels,
  transferStatusLabels,
  transferTypeLabels,
} from "@/lib/options";
import { getTodayDashboard } from "@/lib/transfer-service";

export default async function DashboardPage() {
  const dashboard = await getTodayDashboard();

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-ink">لوحة التحكم</h2>
          <p className="mt-1 text-sm text-muted">أرقام اليوم فقط حسب تاريخ العملية.</p>
        </div>
        <Link
          href="/dashboard/transactions/new"
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 font-semibold text-white hover:bg-olive"
        >
          <PlusCircle className="h-4 w-4" />
          معاملة جديدة
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="عدد عمليات اليوم" value={formatDecimal(dashboard.transactionsCount)} />
        <StatCard title="عملاء اليوم" value={formatDecimal(dashboard.customersCount)} />
        <StatCard title="عمليات مكتملة" value={formatDecimal(dashboard.completedCount)} />
        <StatCard title="عمليات مفتوحة" value={formatDecimal(dashboard.openCount)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="ربح اليوم">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex justify-between rounded-lg bg-mint px-3 py-2">
                <span>{currency}</span>
                <strong>{formatMoney(dashboard.profitTotals[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card title="إجمالي ما استلمناه اليوم">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex justify-between rounded-lg bg-paper px-3 py-2">
                <span>{currency}</span>
                <strong>{formatMoney(dashboard.receivedTotals[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card title="إجمالي ما سلمناه اليوم">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex justify-between rounded-lg bg-paper px-3 py-2">
                <span>{currency}</span>
                <strong>{formatMoney(dashboard.deliveredTotals[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="أحدث العمليات">
        {dashboard.latestTransactions.length === 0 ? (
          <EmptyState title="لا توجد عمليات اليوم" description="ابدأ بإضافة معاملة جديدة." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-line text-right text-muted">
                  <th className="py-3 font-semibold">التاريخ</th>
                  <th className="py-3 font-semibold">العميل</th>
                  <th className="py-3 font-semibold">نوع العملية</th>
                  <th className="py-3 font-semibold">استلمنا</th>
                  <th className="py-3 font-semibold">سلمنا / مطلوب</th>
                  <th className="py-3 font-semibold">الربح</th>
                  <th className="py-3 font-semibold">الحالة</th>
                  <th className="py-3 font-semibold">فتح</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.latestTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-line/70">
                    <td className="py-3">{formatDate(transaction.date)}</td>
                    <td className="py-3 font-semibold">{transaction.customerNameSnapshot}</td>
                    <td className="py-3">{transferTypeLabels[transaction.type]}</td>
                    <td className="py-3">{formatMoney(transaction.receivedAmount, transaction.receivedCurrency)}</td>
                    <td className="py-3">{formatMoney(transaction.deliveredAmount, transaction.deliveredCurrency)}</td>
                    <td className="py-3">{formatMoney(transaction.profitAmount, transaction.profitCurrency)}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge>{receivedStatusLabels[transaction.receivedStatus]}</Badge>
                        <Badge>{deliveredStatusLabels[transaction.deliveredStatus]}</Badge>
                        <Badge tone={transaction.status === "COMPLETED" ? "success" : "warning"}>
                          {transferStatusLabels[transaction.status]}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/dashboard/transactions/${transaction.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 font-semibold text-ink hover:bg-mint"
                      >
                        عرض
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
