import { Eye, Pencil, PlusCircle } from "lucide-react";
import Link from "next/link";
import { CancelTransactionButton } from "@/components/forms/transaction-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatDateInput, formatMoney, parseOptionalDateParam } from "@/lib/format";
import {
  currencyValues,
  deliveredStatusLabels,
  deliveredStatusValues,
  receivedStatusLabels,
  receivedStatusValues,
  transferStatusLabels,
  transferStatusValues,
  transferTypeLabels,
  transferTypeValues,
  type CurrencyCode,
  type DeliveredStatusCode,
  type ReceivedStatusCode,
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
  const receivedStatus = pick(params.receivedStatus, receivedStatusValues) as ReceivedStatusCode | undefined;
  const deliveredStatus = pick(params.deliveredStatus, deliveredStatusValues) as DeliveredStatusCode | undefined;

  const [customers, transactions] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    getTransferTransactions({
      from,
      to,
      customerId: customerId || undefined,
      type,
      currency,
      status,
      receivedStatus,
      deliveredStatus,
    }),
  ]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-ink">سجل المعاملات</h2>
          <p className="mt-1 text-sm text-muted">كل عمليات التحويل مع حالة الاستلام والتسليم والربح.</p>
        </div>
        <Link href="/dashboard/transactions/new" className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 font-semibold text-white hover:bg-olive">
          <PlusCircle className="h-4 w-4" />
          معاملة جديدة
        </Link>
      </div>

      <Card title="الفلاتر">
        <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
          <div>
            <label className="text-sm font-semibold text-ink">من تاريخ</label>
            <input name="from" type="date" defaultValue={from ? formatDateInput(from) : ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">إلى تاريخ</label>
            <input name="to" type="date" defaultValue={to ? formatDateInput(to) : ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">العميل/التاجر</label>
            <select name="customerId" defaultValue={customerId} className="mt-2 w-full rounded-lg border border-line px-3 py-2">
              <option value="">الكل</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">نوع العملية</label>
            <select name="type" defaultValue={type || ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2">
              <option value="">الكل</option>
              {transferTypeValues.map((item) => <option key={item} value={item}>{transferTypeLabels[item]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">العملة</label>
            <select name="currency" defaultValue={currency || ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2">
              <option value="">الكل</option>
              {currencyValues.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">حالة العملية</label>
            <select name="status" defaultValue={status || ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2">
              <option value="">غير الملغاة</option>
              {transferStatusValues.map((item) => <option key={item} value={item}>{transferStatusLabels[item]}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full rounded-lg bg-ink px-4 py-2.5 font-semibold text-white">تطبيق</button>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">الاستلام</label>
            <select name="receivedStatus" defaultValue={receivedStatus || ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2">
              <option value="">الكل</option>
              {receivedStatusValues.map((item) => <option key={item} value={item}>{receivedStatusLabels[item]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">التسليم</label>
            <select name="deliveredStatus" defaultValue={deliveredStatus || ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2">
              <option value="">الكل</option>
              {deliveredStatusValues.map((item) => <option key={item} value={item}>{deliveredStatusLabels[item]}</option>)}
            </select>
          </div>
        </form>
      </Card>

      <Card title="العمليات">
        {transactions.length === 0 ? (
          <EmptyState title="لا توجد معاملات مطابقة" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-line text-right text-muted">
                  <th className="py-3 font-semibold">التاريخ</th>
                  <th className="py-3 font-semibold">العميل</th>
                  <th className="py-3 font-semibold">النوع</th>
                  <th className="py-3 font-semibold">استلمنا</th>
                  <th className="py-3 font-semibold">سلمنا / مطلوب</th>
                  <th className="py-3 font-semibold">ربح العملية</th>
                  <th className="py-3 font-semibold">الاستلام</th>
                  <th className="py-3 font-semibold">التسليم</th>
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
                    <td className="py-3">{formatMoney(transaction.profitAmount, transaction.profitCurrency)}</td>
                    <td className="py-3"><Badge>{receivedStatusLabels[transaction.receivedStatus]}</Badge></td>
                    <td className="py-3"><Badge>{deliveredStatusLabels[transaction.deliveredStatus]}</Badge></td>
                    <td className="py-3">
                      <Badge tone={transaction.status === "COMPLETED" ? "success" : transaction.status === "CANCELLED" ? "danger" : "warning"}>
                        {transferStatusLabels[transaction.status]}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/dashboard/transactions/${transaction.id}`} className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs font-semibold text-ink hover:bg-mint">
                          <Eye className="h-3.5 w-3.5" />
                          عرض
                        </Link>
                        <Link href={`/dashboard/transactions/${transaction.id}/edit`} className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs font-semibold text-ink hover:bg-mint">
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
        )}
      </Card>
    </div>
  );
}
