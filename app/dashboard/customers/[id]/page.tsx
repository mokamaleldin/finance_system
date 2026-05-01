import { FileText } from "lucide-react";
import Link from "next/link";
import { CustomerForm } from "@/components/forms/customer-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { currencies } from "@/lib/calculations";
import { formatDate, formatMoney } from "@/lib/format";
import {
  deliveredStatusLabels,
  receivedStatusLabels,
  transferStatusLabels,
  transferTypeLabels,
} from "@/lib/options";
import { getCustomerTransferSummary } from "@/lib/transfer-service";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const summary = await getCustomerTransferSummary(id);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-ink">{summary.customer.name}</h2>
          <p className="mt-1 text-sm text-muted">تقرير تعاملات العميل والمبالغ المفتوحة معه.</p>
        </div>
        <Link
          href={`/api/statements/customer/${summary.customer.id}`}
          target="_blank"
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 font-semibold text-white hover:bg-olive"
        >
          <FileText className="h-4 w-4" />
          تصدير PDF
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="بيانات العميل">
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">الهاتف</dt><dd className="font-semibold">{summary.customer.phone || "-"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">ملاحظات</dt><dd className="font-semibold">{summary.customer.notes || "-"}</dd></div>
          </dl>
        </Card>
        <Card title="تعديل بيانات العميل" className="lg:col-span-2">
          <CustomerForm
            customerId={summary.customer.id}
            initialValues={{
              name: summary.customer.name,
              phone: summary.customer.phone || "",
              country: summary.customer.country || "",
              notes: summary.customer.notes || "",
            }}
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="إجمالي ما استلمناه منه">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex justify-between rounded-lg bg-paper px-3 py-2">
                <span>{currency}</span>
                <strong>{formatMoney(summary.receivedTotals[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card title="إجمالي ما سلمناه له">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex justify-between rounded-lg bg-paper px-3 py-2">
                <span>{currency}</span>
                <strong>{formatMoney(summary.deliveredTotals[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card title="إجمالي الربح">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex justify-between rounded-lg bg-mint px-3 py-2">
                <span>{currency}</span>
                <strong>{formatMoney(summary.profitTotals[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="باقي علينا لهذا العميل">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex justify-between rounded-lg bg-mint px-3 py-2">
                <span>{currency}</span>
                <strong>{formatMoney(summary.open.oweCustomer[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card title="باقي لنا عند هذا العميل">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex justify-between rounded-lg bg-paper px-3 py-2">
                <span>{currency}</span>
                <strong>{formatMoney(summary.open.customerOwesUs[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="كل عمليات العميل">
        {summary.transactions.length === 0 ? (
          <EmptyState title="لا توجد عمليات لهذا العميل" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-line text-right text-muted">
                  <th className="py-3 font-semibold">التاريخ</th>
                  <th className="py-3 font-semibold">نوع العملية</th>
                  <th className="py-3 font-semibold">استلمنا</th>
                  <th className="py-3 font-semibold">سلمنا / مطلوب</th>
                  <th className="py-3 font-semibold">الربح</th>
                  <th className="py-3 font-semibold">الاستلام</th>
                  <th className="py-3 font-semibold">التسليم</th>
                  <th className="py-3 font-semibold">الحالة</th>
                  <th className="py-3 font-semibold">فتح</th>
                </tr>
              </thead>
              <tbody>
                {summary.transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-line/70">
                    <td className="py-3">{formatDate(transaction.date)}</td>
                    <td className="py-3">{transferTypeLabels[transaction.type]}</td>
                    <td className="py-3">{formatMoney(transaction.receivedAmount, transaction.receivedCurrency)}</td>
                    <td className="py-3">{formatMoney(transaction.deliveredAmount, transaction.deliveredCurrency)}</td>
                    <td className="py-3">{formatMoney(transaction.profitAmount, transaction.profitCurrency)}</td>
                    <td className="py-3"><Badge>{receivedStatusLabels[transaction.receivedStatus]}</Badge></td>
                    <td className="py-3"><Badge>{deliveredStatusLabels[transaction.deliveredStatus]}</Badge></td>
                    <td className="py-3"><Badge tone={transaction.status === "COMPLETED" ? "success" : "warning"}>{transferStatusLabels[transaction.status]}</Badge></td>
                    <td className="py-3">
                      <Link href={`/dashboard/transactions/${transaction.id}`} className="rounded-lg border border-line px-2 py-1 text-xs font-semibold text-ink hover:bg-mint">
                        عرض
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
