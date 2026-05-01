import Link from "next/link";
import { PrintButton } from "@/components/forms/print-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { currencies } from "@/lib/calculations";
import { formatDate, formatDateInput, formatMoney, parseDateParam } from "@/lib/format";
import {
  deliveredStatusLabels,
  receivedStatusLabels,
  transferStatusLabels,
  transferTypeLabels,
} from "@/lib/options";
import { getTodayDashboard } from "@/lib/transfer-service";

type DailyReportPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DailyReportPage({ searchParams }: DailyReportPageProps) {
  const params = (await searchParams) ?? {};
  const selectedDate = parseDateParam(params.date, new Date());
  const report = await getTodayDashboard(selectedDate);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-ink">تقرير اليوم</h2>
          <p className="mt-1 text-sm text-muted">تقرير بسيط للعمليات حسب التاريخ المختار.</p>
        </div>
        <PrintButton label="طباعة التقرير" />
      </div>

      <Card title="اختيار التاريخ">
        <form className="flex flex-col gap-3 md:flex-row md:items-end">
          <div>
            <label className="text-sm font-semibold text-ink">التاريخ</label>
            <input name="date" type="date" defaultValue={formatDateInput(selectedDate)} className="mt-2 w-full rounded-lg border border-line px-3 py-2 md:w-72" />
          </div>
          <button className="rounded-lg bg-ink px-4 py-2.5 font-semibold text-white">عرض</button>
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="استلمنا">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex justify-between rounded-lg bg-paper px-3 py-2">
                <span>{currency}</span>
                <strong>{formatMoney(report.receivedTotals[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card title="سلمنا">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex justify-between rounded-lg bg-paper px-3 py-2">
                <span>{currency}</span>
                <strong>{formatMoney(report.deliveredTotals[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card title="ربح اليوم">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex justify-between rounded-lg bg-mint px-3 py-2">
                <span>{currency}</span>
                <strong>{formatMoney(report.profitTotals[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title={`عمليات يوم ${formatDate(selectedDate)}`}>
        {report.transactions.length === 0 ? (
          <EmptyState title="لا توجد عمليات في هذا اليوم" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-line text-right text-muted">
                  <th className="py-3 font-semibold">العميل</th>
                  <th className="py-3 font-semibold">النوع</th>
                  <th className="py-3 font-semibold">استلمنا</th>
                  <th className="py-3 font-semibold">سلمنا / مطلوب</th>
                  <th className="py-3 font-semibold">الربح</th>
                  <th className="py-3 font-semibold">الحالات</th>
                  <th className="py-3 font-semibold">فتح</th>
                </tr>
              </thead>
              <tbody>
                {report.transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-line/70">
                    <td className="py-3 font-semibold">{transaction.customerNameSnapshot}</td>
                    <td className="py-3">{transferTypeLabels[transaction.type]}</td>
                    <td className="py-3">{formatMoney(transaction.receivedAmount, transaction.receivedCurrency)}</td>
                    <td className="py-3">{formatMoney(transaction.deliveredAmount, transaction.deliveredCurrency)}</td>
                    <td className="py-3">{formatMoney(transaction.profitAmount, transaction.profitCurrency)}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge>{receivedStatusLabels[transaction.receivedStatus]}</Badge>
                        <Badge>{deliveredStatusLabels[transaction.deliveredStatus]}</Badge>
                        <Badge tone={transaction.status === "COMPLETED" ? "success" : "warning"}>{transferStatusLabels[transaction.status]}</Badge>
                      </div>
                    </td>
                    <td className="py-3">
                      <Link href={`/dashboard/transactions/${transaction.id}`} className="rounded-lg border border-line px-2 py-1 text-xs font-semibold text-ink hover:bg-mint">عرض</Link>
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
