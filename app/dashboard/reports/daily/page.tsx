import Link from "next/link";
import { PrintButton } from "@/components/forms/print-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { currencies, movementTypeLabels } from "@/lib/calculations";
import { formatDate, formatDateInput, formatDecimal, formatMoney, parseDateParam } from "@/lib/format";
import { getDailyReport } from "@/lib/ledger";

type DailyReportPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DailyReportPage({ searchParams }: DailyReportPageProps) {
  const params = (await searchParams) ?? {};
  const selectedDate = parseDateParam(params.date, new Date());
  const report = await getDailyReport(selectedDate);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-ink">التقرير اليومي</h2>
          <p className="mt-1 text-sm text-muted">حركات اليوم، إجماليات العملات، والعملاء المشاركون.</p>
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
        <Card title="وارد اليوم">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex justify-between rounded-lg bg-mint px-3 py-2">
                <span>{currency}</span>
                <strong>{formatMoney(report.totals.received[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card title="صادر اليوم">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex justify-between rounded-lg bg-paper px-3 py-2">
                <span>{currency}</span>
                <strong>{formatMoney(report.totals.paid[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card title="الربح / الخسارة">
          <p className="text-3xl font-bold text-ink">{formatDecimal(report.profit)}</p>
          <p className="mt-2 text-sm text-muted">محسوب من المعاملات التي لها ربح في هذا اليوم.</p>
        </Card>
      </div>

      <Card title={`حركات يوم ${formatDate(selectedDate)}`}>
        {report.movements.length === 0 ? (
          <EmptyState title="لا توجد حركات في هذا اليوم" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-line text-right text-muted">
                  <th className="py-3 font-semibold">التاريخ</th>
                  <th className="py-3 font-semibold">العميل</th>
                  <th className="py-3 font-semibold">النوع</th>
                  <th className="py-3 font-semibold">المبلغ</th>
                  <th className="py-3 font-semibold">المعاملة</th>
                  <th className="py-3 font-semibold">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {report.movements.map((movement) => (
                  <tr key={movement.id} className="border-b border-line/70">
                    <td className="py-3">{formatDate(movement.date)}</td>
                    <td className="py-3">
                      {movement.customer ? (
                        <Link className="font-semibold text-ink hover:underline" href={`/dashboard/customers/${movement.customer.id}`}>
                          {movement.customer.name}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3">{movementTypeLabels[movement.type]}</td>
                    <td className="py-3 font-semibold">{formatMoney(movement.amount, movement.currency)}</td>
                    <td className="py-3 text-muted">{movement.transactionGroup?.title || "-"}</td>
                    <td className="py-3 text-muted">{movement.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="العملاء في هذا اليوم">
        {report.customers.length === 0 ? (
          <EmptyState title="لا يوجد عملاء في التقرير" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {report.customers.map((customer) => (
              <Link key={customer?.id} href={`/dashboard/customers/${customer?.id}`} className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-mint">
                {customer?.name}
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
