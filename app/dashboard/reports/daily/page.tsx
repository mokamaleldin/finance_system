import { FileDown } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, StatCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { currencies, type DecimalInput } from "@/lib/calculations";
import { formatDate, formatDateInput, formatMoney, parseDateParam } from "@/lib/format";
import {
  currencyLabels,
  deliveredStatusLabels,
  expenseCategoryLabels,
  type CurrencyCode,
  receivedStatusLabels,
  transferStatusLabels,
  transferTypeLabels,
} from "@/lib/options";
import {
  getReportByDateRange,
  getReportDateRange,
  parseReportPeriod,
  reportPeriodLabels,
  reportPeriodValues,
} from "@/lib/report-service";

type ReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function TotalsCard({
  title,
  totals,
  tone = "paper",
}: {
  title: string;
  totals: Record<CurrencyCode, DecimalInput>;
  tone?: "paper" | "mint";
}) {
  return (
    <Card title={title}>
      <div className="grid gap-2">
        {currencies.map((currency) => (
          <div
            key={currency}
            className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 ${
              tone === "mint" ? "bg-mint" : "bg-paper"
            }`}
          >
            <span>{currencyLabels[currency]}</span>
            <strong>{formatMoney(totals[currency], currency)}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = (await searchParams) ?? {};
  const period = parseReportPeriod(params.period);
  const from = parseDateParam(params.from, new Date());
  const to = parseDateParam(params.to, new Date());
  const range = getReportDateRange({ period, from, to });
  const report = await getReportByDateRange(range.start, range.end);

  const exportParams = new URLSearchParams({
    period,
    from: formatDateInput(range.start),
    to: formatDateInput(range.end),
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line/80 bg-white/75 p-5 shadow-soft backdrop-blur">
        <div>
          <h2 className="text-3xl font-bold text-ink">التقارير</h2>
          <p className="mt-1 text-sm text-muted">
            تقرير الفترة من {formatDate(range.start)} إلى {formatDate(range.end)} بدون خلط العملات.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            href={`/api/reports/pdf?${exportParams.toString()}`}
            prefetch={false}
            target="_blank"
            className="action-primary"
          >
            <FileDown className="h-4 w-4" />
            تحميل PDF
          </Link>
          <Link
            href={`/api/reports/excel?${exportParams.toString()}`}
            prefetch={false}
            className="action-secondary"
          >
            <FileDown className="h-4 w-4" />
            تحميل Excel
          </Link>
        </div>
      </div>

      <Card title="اختيار الفترة">
        <form className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="text-sm font-semibold text-ink">الفترة</label>
            <select name="period" defaultValue={period} className="mt-2 w-full rounded-lg border border-line px-3 py-2">
              {reportPeriodValues.map((item) => (
                <option key={item} value={item}>
                  {reportPeriodLabels[item]}
                </option>
              ))}
            </select>
          </div>

          {period === "custom" ? (
            <>
              <div className="min-w-[220px] flex-1">
                <label className="text-sm font-semibold text-ink">من تاريخ</label>
                <input name="from" type="date" dir="ltr" defaultValue={valueOf(params.from) || formatDateInput(range.start)} className="mt-2 w-full rounded-lg border border-line px-3 py-2" />
              </div>
              <div className="min-w-[220px] flex-1">
                <label className="text-sm font-semibold text-ink">إلى تاريخ</label>
                <input name="to" type="date" dir="ltr" defaultValue={valueOf(params.to) || formatDateInput(range.end)} className="mt-2 w-full rounded-lg border border-line px-3 py-2" />
              </div>
            </>
          ) : null}

          <div className="min-w-[160px] sm:min-w-[180px]">
            <button className="action-primary w-full">عرض التقرير</button>
          </div>
        </form>
      </Card>

      <Card title="ملخص الفترة">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="عدد العمليات" value={String(report.transactionsCount)} />
          <StatCard title="عدد العملاء" value={String(report.customersCount)} />
          <StatCard title="عمليات مكتملة" value={String(report.completedCount)} />
          <StatCard title="عمليات مفتوحة" value={String(report.openCount)} />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <TotalsCard title="إجمالي ما استلمناه" totals={report.receivedTotals} />
        <TotalsCard title="إجمالي ما سلمناه" totals={report.deliveredTotals} />
        <TotalsCard title="ربح العمليات" totals={report.transactionProfitTotals} tone="mint" />
        <TotalsCard title="المصاريف" totals={report.expenseTotals} />
        <TotalsCard title="العمولات" totals={report.commissionTotals} />
        <TotalsCard title="صافي الربح" totals={report.netProfitTotals} tone="mint" />
      </div>

      <Card title="عمليات الفترة">
        {report.transactions.length === 0 ? (
          <EmptyState title="لا توجد عمليات في هذه الفترة" />
        ) : (
          <div>
            <div className="grid gap-3 md:hidden">
              {report.transactions.map((transaction) => (
                <div key={transaction.id} className="record-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-ink">{transaction.customerNameSnapshot}</p>
                      <p className="mt-1 text-xs text-muted">
                        {formatDate(transaction.date)} - {transferTypeLabels[transaction.type]}
                      </p>
                    </div>
                    <Badge tone={transaction.status === "COMPLETED" ? "success" : "warning"}>{transferStatusLabels[transaction.status]}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm">
                    <div className="flex items-center justify-between gap-2"><span className="text-muted">استلمنا</span><strong>{formatMoney(transaction.receivedAmount, transaction.receivedCurrency)}</strong></div>
                    <div className="flex items-center justify-between gap-2"><span className="text-muted">سنسلم</span><strong>{formatMoney(transaction.deliveredAmount, transaction.deliveredCurrency)}</strong></div>
                    <div className="flex items-center justify-between gap-2"><span className="text-muted">ربح العملية</span><strong>{formatMoney(transaction.profitAmount, transaction.profitCurrency)}</strong></div>
                    <div className="flex items-center justify-between gap-2"><span className="text-muted">العمولة</span><strong>{transaction.commission ? formatMoney(transaction.commission.amount, transaction.commission.currencyCode) : "-"}</strong></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Badge>{receivedStatusLabels[transaction.receivedStatus]}</Badge>
                    <Badge>{deliveredStatusLabels[transaction.deliveredStatus]}</Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1100px] text-sm">
                <thead>
                  <tr className="border-b border-line text-right text-muted">
                    <th className="py-3 font-semibold">التاريخ</th>
                    <th className="py-3 font-semibold">العميل</th>
                    <th className="py-3 font-semibold">النوع</th>
                    <th className="py-3 font-semibold">استلمنا</th>
                    <th className="py-3 font-semibold">سلمنا / مطلوب</th>
                    <th className="py-3 font-semibold">ربح العملية</th>
                    <th className="py-3 font-semibold">العمولة</th>
                    <th className="py-3 font-semibold">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {report.transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-line/70">
                      <td className="py-3">{formatDate(transaction.date)}</td>
                      <td className="py-3 font-semibold">{transaction.customerNameSnapshot}</td>
                      <td className="py-3">{transferTypeLabels[transaction.type]}</td>
                      <td className="py-3">{formatMoney(transaction.receivedAmount, transaction.receivedCurrency)}</td>
                      <td className="py-3">{formatMoney(transaction.deliveredAmount, transaction.deliveredCurrency)}</td>
                      <td className="py-3">{formatMoney(transaction.profitAmount, transaction.profitCurrency)}</td>
                      <td className="py-3">{transaction.commission ? formatMoney(transaction.commission.amount, transaction.commission.currencyCode) : "-"}</td>
                      <td className="py-3"><Badge tone={transaction.status === "COMPLETED" ? "success" : "warning"}>{transferStatusLabels[transaction.status]}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      <Card title="مصاريف الفترة">
        {report.expenses.length === 0 ? (
          <EmptyState title="لا توجد مصاريف في هذه الفترة" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-line text-right text-muted">
                  <th className="py-3 font-semibold">التاريخ</th>
                  <th className="py-3 font-semibold">نوع المصروف</th>
                  <th className="py-3 font-semibold">الوصف</th>
                  <th className="py-3 font-semibold">المبلغ</th>
                  <th className="py-3 font-semibold">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {report.expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-line/70">
                    <td className="py-3">{formatDate(expense.date)}</td>
                    <td className="py-3">{expenseCategoryLabels[expense.category]}</td>
                    <td className="py-3 font-semibold">{expense.description}</td>
                    <td className="py-3">{formatMoney(expense.amount, expense.currencyCode)}</td>
                    <td className="py-3 text-muted">{expense.notes || "-"}</td>
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
