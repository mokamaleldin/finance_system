import Link from "next/link";
import { CompleteStepButton } from "@/components/forms/transaction-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { currencies } from "@/lib/calculations";
import { formatDate, formatMoney } from "@/lib/format";
import {
  currencyLabels,
  deliveredStatusLabels,
  receivedStatusLabels,
  transferTypeLabels,
} from "@/lib/options";
import { getOpenAmountInfos, getTransferSettlement } from "@/lib/transfer-calculations";
import { getOpenTransfers } from "@/lib/transfer-service";

export default async function OpenTransactionsPage() {
  const report = await getOpenTransfers();

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-line/80 bg-white/75 p-5 shadow-soft backdrop-blur">
        <h2 className="text-3xl font-bold text-ink">المتبقي علينا ولنا</h2>
        <p className="mt-1 text-sm text-muted">عمليات مفتوحة لم يكتمل فيها الاستلام أو التسليم.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="علينا للعملاء">
          <div className="rounded-xl border border-line/70 bg-mint/40 p-3">
            <div className="grid divide-y divide-line/60">
              {currencies.map((currency) => (
                <div key={currency} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{currencyLabels[currency]}</p>
                    <p className="mt-0.5 text-xs text-muted">{currency}</p>
                  </div>
                  <p className="text-lg font-bold text-ink tabular-nums">{formatMoney(report.oweCustomer[currency], currency)}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card title="لنا عند العملاء">
          <div className="rounded-xl border border-line/70 bg-paper/70 p-3">
            <div className="grid divide-y divide-line/60">
              {currencies.map((currency) => (
                <div key={currency} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{currencyLabels[currency]}</p>
                    <p className="mt-0.5 text-xs text-muted">{currency}</p>
                  </div>
                  <p className="text-lg font-bold text-ink tabular-nums">{formatMoney(report.customerOwesUs[currency], currency)}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card title="العمليات المفتوحة">
        {report.transactions.length === 0 ? (
          <EmptyState title="لا توجد عمليات مفتوحة" description="كل العمليات الحالية مكتملة." />
        ) : (
          <div>
            <div className="grid gap-3 md:hidden">
              {report.transactions.map((transaction) => {
                const openItems = getOpenAmountInfos(transaction);
                const settlement = getTransferSettlement(transaction);

                return (
                  <div key={transaction.id} className="record-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-ink">{transaction.customerNameSnapshot}</p>
                        <p className="mt-1 text-xs text-muted">
                          {formatDate(transaction.date)} - {transferTypeLabels[transaction.type]}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2">
                      {openItems.length > 0
                        ? openItems.map((item) => (
                            <div key={`${item.side}-${item.currency}`} className="rounded-lg border border-line/70 bg-mint/70 px-3 py-2 font-bold text-ink">
                              {item.label}: {formatMoney(item.amount, item.currency)}
                            </div>
                          ))
                        : <div className="rounded-lg border border-line/70 bg-mint/70 px-3 py-2 font-bold text-ink">-</div>}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      <Badge>{receivedStatusLabels[transaction.receivedStatus]}</Badge>
                      <Badge>{deliveredStatusLabels[transaction.deliveredStatus]}</Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/dashboard/transactions/${transaction.id}`} className="action-secondary px-3 py-2 text-xs">
                        فتح العملية
                      </Link>
                      {!settlement.isReceivedComplete ? <CompleteStepButton transactionId={transaction.id} step="received" /> : null}
                      {!settlement.isDeliveredComplete ? <CompleteStepButton transactionId={transaction.id} step="delivered" /> : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1000px] text-sm">
                <thead>
                  <tr className="border-b border-line text-right text-muted">
                    <th className="py-3 font-semibold">التاريخ</th>
                    <th className="py-3 font-semibold">العميل</th>
                    <th className="py-3 font-semibold">نوع العملية</th>
                    <th className="py-3 font-semibold">المعلق</th>
                    <th className="py-3 font-semibold">الاستلام</th>
                    <th className="py-3 font-semibold">التسليم</th>
                    <th className="py-3 font-semibold">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {report.transactions.map((transaction) => {
                    const openItems = getOpenAmountInfos(transaction);
                    const settlement = getTransferSettlement(transaction);

                    return (
                      <tr key={transaction.id} className="border-b border-line/70">
                        <td className="py-3">{formatDate(transaction.date)}</td>
                        <td className="py-3 font-semibold">{transaction.customerNameSnapshot}</td>
                        <td className="py-3">{transferTypeLabels[transaction.type]}</td>
                        <td className="py-3 font-semibold">
                          {openItems.length > 0
                            ? openItems.map((item) => `${item.label}: ${formatMoney(item.amount, item.currency)}`).join(" / ")
                            : "-"}
                        </td>
                        <td className="py-3"><Badge>{receivedStatusLabels[transaction.receivedStatus]}</Badge></td>
                        <td className="py-3"><Badge>{deliveredStatusLabels[transaction.deliveredStatus]}</Badge></td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/dashboard/transactions/${transaction.id}`} className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm hover:bg-mint">
                              فتح العملية
                            </Link>
                            {!settlement.isReceivedComplete ? <CompleteStepButton transactionId={transaction.id} step="received" /> : null}
                            {!settlement.isDeliveredComplete ? <CompleteStepButton transactionId={transaction.id} step="delivered" /> : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
