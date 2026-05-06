import { Eye, Pencil, PlusCircle } from "lucide-react";
import Link from "next/link";
import { CancelTransactionButton } from "@/components/forms/transaction-actions";
import { TransactionsFilterForm } from "@/components/forms/transactions-filter-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatDecimal, formatMoney, parseOptionalDateParam } from "@/lib/format";
import {
  currencyValues,
  deliveredStatusLabels,
  receivedStatusLabels,
  transferStatusLabels,
  transferStatusValues,
  transferTypeLabels,
  transferTypeValues,
  type CurrencyCode,
  type TransferStatusCode,
  type TransferTypeCode,
} from "@/lib/options";
import { getTransferTransactions } from "@/lib/transfer-service";
import { prisma } from "@/lib/prisma";

type TransactionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pick<T extends readonly string[]>(value: unknown, values: T) {
  return typeof value === "string" && values.includes(value) ? value : undefined;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const params = (await searchParams) ?? {};
  const from = parseOptionalDateParam(params.from);
  const to = parseOptionalDateParam(params.to, true);
  const customerId = typeof params.customerId === "string" ? params.customerId : "";
  const type = pick(params.type, transferTypeValues) as TransferTypeCode | undefined;
  const currency = pick(params.currency, currencyValues) as CurrencyCode | undefined;
  const status = pick(params.status, transferStatusValues) as TransferStatusCode | undefined;
  const fromValue = typeof params.from === "string" ? params.from : "";
  const toValue = typeof params.to === "string" ? params.to : "";

  const [customers, transactions] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    getTransferTransactions({
      from,
      to,
      customerId: customerId || undefined,
      type,
      currency,
      status,
    }),
  ]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line/80 bg-white/75 p-5 shadow-soft backdrop-blur">
        <div>
          <h2 className="text-3xl font-bold text-ink">سجل المعاملات</h2>
          <p className="mt-1 text-sm text-muted">كل عمليات التحويل مع حالة الاستلام والتسليم والربح.</p>
        </div>
        <Link href="/dashboard/transactions/new" className="action-primary w-full sm:w-auto">
          <PlusCircle className="h-4 w-4" />
          معاملة جديدة
        </Link>
      </div>

      <Card title="الفلاتر">
        <TransactionsFilterForm
          customers={customers}
          defaultValues={{
            from: fromValue,
            to: toValue,
            customerId,
            type: type || "",
            status: status || "",
            currency: currency || "",
          }}
        />
      </Card>

      <Card title="العمليات">
        {transactions.length === 0 ? (
          <EmptyState title="لا توجد معاملات مطابقة" />
        ) : (
          <div>
            <div className="grid gap-3 md:hidden">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="record-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-ink">{transaction.customerNameSnapshot}</p>
                      <p className="mt-1 text-xs text-muted">
                        {formatDate(transaction.date)} - {transferTypeLabels[transaction.type]}
                      </p>
                    </div>
                    <Badge tone={transaction.status === "COMPLETED" ? "success" : transaction.status === "CANCELLED" ? "danger" : "warning"}>
                      {transferStatusLabels[transaction.status]}
                    </Badge>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted">استلمنا</span>
                      <strong>{formatMoney(transaction.receivedAmount, transaction.receivedCurrency)}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted">سنسلم</span>
                      <strong>{formatMoney(transaction.deliveredAmount, transaction.deliveredCurrency)}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted">سعر العميل</span>
                      <strong>{formatDecimal(transaction.customerRate)}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted">الربح</span>
                      <strong>{formatMoney(transaction.profitAmount, transaction.profitCurrency)}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted">العمولة</span>
                      <strong>
                        {transaction.commission
                          ? formatMoney(transaction.commission.amount, transaction.commission.currencyCode)
                          : "-"}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    <Badge>{receivedStatusLabels[transaction.receivedStatus]}</Badge>
                    <Badge>{deliveredStatusLabels[transaction.deliveredStatus]}</Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/dashboard/transactions/${transaction.id}`} className="action-secondary flex-1 px-2 py-2 text-xs">
                      <Eye className="h-3.5 w-3.5" />
                      عرض
                    </Link>
                    <Link href={`/dashboard/transactions/${transaction.id}/edit`} className="action-secondary flex-1 px-2 py-2 text-xs">
                      <Pencil className="h-3.5 w-3.5" />
                      تعديل
                    </Link>
                    {transaction.status !== "CANCELLED" ? <CancelTransactionButton transactionId={transaction.id} /> : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1250px] text-sm">
                <thead>
                  <tr className="border-b border-line text-right text-muted">
                    <th className="py-3 font-semibold">التاريخ</th>
                    <th className="py-3 font-semibold">العميل</th>
                    <th className="py-3 font-semibold">النوع</th>
                    <th className="py-3 font-semibold">استلمنا</th>
                    <th className="py-3 font-semibold">سلمنا / مطلوب</th>
                    <th className="py-3 font-semibold">سعر التكلفة</th>
                    <th className="py-3 font-semibold">سعر العميل</th>
                    <th className="py-3 font-semibold">ربح العملية</th>
                    <th className="py-3 font-semibold">الاستلام</th>
                    <th className="py-3 font-semibold">التسليم</th>
                    <th className="py-3 font-semibold">العمولة</th>
                    <th className="py-3 font-semibold">الحالة</th>
                    <th className="py-3 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-line/70">
                      <td className="py-3">{formatDate(transaction.date)}</td>
                      <td className="py-3 font-semibold">{transaction.customerNameSnapshot}</td>
                      <td className="py-3">{transferTypeLabels[transaction.type]}</td>
                      <td className="py-3">{formatMoney(transaction.receivedAmount, transaction.receivedCurrency)}</td>
                      <td className="py-3">{formatMoney(transaction.deliveredAmount, transaction.deliveredCurrency)}</td>
                      <td className="py-3">{formatDecimal(transaction.costRate)}</td>
                      <td className="py-3">{formatDecimal(transaction.customerRate)}</td>
                      <td className="py-3">{formatMoney(transaction.profitAmount, transaction.profitCurrency)}</td>
                      <td className="py-3"><Badge>{receivedStatusLabels[transaction.receivedStatus]}</Badge></td>
                      <td className="py-3"><Badge>{deliveredStatusLabels[transaction.deliveredStatus]}</Badge></td>
                      <td className="py-3">
                        {transaction.commission
                          ? formatMoney(transaction.commission.amount, transaction.commission.currencyCode)
                          : "-"}
                      </td>
                      <td className="py-3">
                        <Badge tone={transaction.status === "COMPLETED" ? "success" : transaction.status === "CANCELLED" ? "danger" : "warning"}>
                          {transferStatusLabels[transaction.status]}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/dashboard/transactions/${transaction.id}`} className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm hover:bg-mint">
                            <Eye className="h-3.5 w-3.5" />
                            عرض
                          </Link>
                          <Link href={`/dashboard/transactions/${transaction.id}/edit`} className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm hover:bg-mint">
                            <Pencil className="h-3.5 w-3.5" />
                            تعديل
                          </Link>
                          {transaction.status !== "CANCELLED" ? <CancelTransactionButton transactionId={transaction.id} /> : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
