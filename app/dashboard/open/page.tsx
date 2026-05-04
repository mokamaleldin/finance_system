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
import { getOpenAmountInfo } from "@/lib/transfer-calculations";
import { getOpenTransfers } from "@/lib/transfer-service";

export default async function OpenTransactionsPage() {
  const report = await getOpenTransfers();

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">المتبقي علينا ولنا</h2>
        <p className="mt-1 text-sm text-muted">عمليات مفتوحة لم يكتمل فيها الاستلام أو التسليم.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="علينا للعملاء">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-mint px-3 py-2">
                <span>{currencyLabels[currency]}</span>
                <strong>{formatMoney(report.oweCustomer[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card title="لنا عند العملاء">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2">
                <span>{currencyLabels[currency]}</span>
                <strong>{formatMoney(report.customerOwesUs[currency], currency)}</strong>
              </div>
            ))}
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
                const openInfo = getOpenAmountInfo({
                  receivedStatus: transaction.receivedStatus,
                  deliveredStatus: transaction.deliveredStatus,
                  status: transaction.status,
                  receivedCurrency: transaction.receivedCurrency,
                  receivedAmount: transaction.receivedAmount,
                  deliveredCurrency: transaction.deliveredCurrency,
                  deliveredAmount: transaction.deliveredAmount,
                });

                return (
                  <div key={transaction.id} className="rounded-lg border border-line bg-paper p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-ink">{transaction.customerNameSnapshot}</p>
                        <p className="mt-1 text-xs text-muted">
                          {formatDate(transaction.date)} - {transferTypeLabels[transaction.type]}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg bg-white px-3 py-2 font-bold text-ink">
                      {openInfo
                        ? openInfo.side === "PENDING"
                          ? openInfo.label
                          : (
                              <span>
                                {openInfo.label}: {formatMoney(openInfo.amount, openInfo.currency)}
                              </span>
                            )
                        : "-"}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      <Badge>{receivedStatusLabels[transaction.receivedStatus]}</Badge>
                      <Badge>{deliveredStatusLabels[transaction.deliveredStatus]}</Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/dashboard/transactions/${transaction.id}`} className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-mint">
                        فتح العملية
                      </Link>
                      {transaction.receivedStatus !== "RECEIVED" ? <CompleteStepButton transactionId={transaction.id} step="received" /> : null}
                      {transaction.deliveredStatus !== "DELIVERED" ? <CompleteStepButton transactionId={transaction.id} step="delivered" /> : null}
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
                    const openInfo = getOpenAmountInfo({
                      receivedStatus: transaction.receivedStatus,
                      deliveredStatus: transaction.deliveredStatus,
                      status: transaction.status,
                      receivedCurrency: transaction.receivedCurrency,
                      receivedAmount: transaction.receivedAmount,
                      deliveredCurrency: transaction.deliveredCurrency,
                      deliveredAmount: transaction.deliveredAmount,
                    });

                    return (
                      <tr key={transaction.id} className="border-b border-line/70">
                        <td className="py-3">{formatDate(transaction.date)}</td>
                        <td className="py-3 font-semibold">{transaction.customerNameSnapshot}</td>
                        <td className="py-3">{transferTypeLabels[transaction.type]}</td>
                        <td className="py-3 font-semibold">
                          {openInfo
                            ? openInfo.side === "PENDING"
                              ? openInfo.label
                              : `${openInfo.label}: ${formatMoney(openInfo.amount, openInfo.currency)}`
                            : "-"}
                        </td>
                        <td className="py-3"><Badge>{receivedStatusLabels[transaction.receivedStatus]}</Badge></td>
                        <td className="py-3"><Badge>{deliveredStatusLabels[transaction.deliveredStatus]}</Badge></td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/dashboard/transactions/${transaction.id}`} className="rounded-lg border border-line px-2 py-1 text-xs font-semibold text-ink hover:bg-mint">
                              فتح العملية
                            </Link>
                            {transaction.receivedStatus !== "RECEIVED" ? <CompleteStepButton transactionId={transaction.id} step="received" /> : null}
                            {transaction.deliveredStatus !== "DELIVERED" ? <CompleteStepButton transactionId={transaction.id} step="delivered" /> : null}
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
