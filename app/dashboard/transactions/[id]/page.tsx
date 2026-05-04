import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelTransactionButton, CompleteStepButton } from "@/components/forms/transaction-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, formatDecimal, formatMoney } from "@/lib/format";
import {
  currencyLabels,
  commissionBaseLabels,
  commissionTypeLabels,
  deliveredStatusLabels,
  receivedStatusLabels,
  transferStatusLabels,
  transferTypeLabels,
} from "@/lib/options";
import { prisma } from "@/lib/prisma";
import { getRateDirection } from "@/lib/transfer-calculations";

type TransactionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const { id } = await params;
  const transaction = await prisma.transferTransaction.findUnique({
    where: { id },
    include: { customer: true, commission: true },
  });

  if (!transaction) {
    notFound();
  }
  const fallbackDirection = getRateDirection(transaction.receivedCurrency, transaction.deliveredCurrency);
  const rateBaseCurrency = transaction.rateBaseCurrency || fallbackDirection.rateBaseCurrency;
  const rateQuoteCurrency = transaction.rateQuoteCurrency || fallbackDirection.rateQuoteCurrency;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-ink">تفاصيل العملية</h2>
          <p className="mt-1 text-sm text-muted">{transaction.customerNameSnapshot}</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Link href={`/dashboard/transactions/${transaction.id}/edit`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 font-semibold text-ink hover:bg-mint sm:flex-none">
            <Pencil className="h-4 w-4" />
            تعديل
          </Link>
          {transaction.status !== "CANCELLED" ? <CancelTransactionButton transactionId={transaction.id} /> : null}
        </div>
      </div>

      <Card title="ملخص العملية">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg bg-mint p-4">
            <p className="text-sm text-muted">نوع العملية</p>
            <p className="mt-2 font-bold">{transferTypeLabels[transaction.type]}</p>
          </div>
          <div className="rounded-lg bg-mint p-4">
            <p className="text-sm text-muted">استلمنا</p>
            <p className="mt-2 font-bold">{formatMoney(transaction.receivedAmount, transaction.receivedCurrency)}</p>
          </div>
          <div className="rounded-lg bg-mint p-4">
            <p className="text-sm text-muted">سلمنا / مطلوب تسليمه</p>
            <p className="mt-2 font-bold">{formatMoney(transaction.deliveredAmount, transaction.deliveredCurrency)}</p>
          </div>
          <div className="rounded-lg bg-mint p-4">
            <p className="text-sm text-muted">ربح العملية</p>
            <p className="mt-2 font-bold">{formatMoney(transaction.profitAmount, transaction.profitCurrency)}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="الأسعار والحساب">
          <dl className="grid gap-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2"><dt className="text-muted">اتجاه السعر</dt><dd className="font-semibold">كل 1 {currencyLabels[rateBaseCurrency]} = X {currencyLabels[rateQuoteCurrency]}</dd></div>
            <div className="flex flex-wrap justify-between gap-2"><dt className="text-muted">سعر التكلفة</dt><dd className="font-semibold">{formatDecimal(transaction.costRate)} {currencyLabels[rateQuoteCurrency]}</dd></div>
            <div className="flex flex-wrap justify-between gap-2"><dt className="text-muted">سعر العميل</dt><dd className="font-semibold">{formatDecimal(transaction.customerRate)} {currencyLabels[rateQuoteCurrency]}</dd></div>
            <div className="flex flex-wrap justify-between gap-2"><dt className="text-muted">فرق السعر</dt><dd className="font-semibold">{formatDecimal(transaction.rateDifference)} {currencyLabels[rateQuoteCurrency]}</dd></div>
          </dl>
        </Card>

        <Card title="الحالات">
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-paper p-3">
              <span>حالة الاستلام</span>
              <Badge>{receivedStatusLabels[transaction.receivedStatus]}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-paper p-3">
              <span>حالة التسليم</span>
              <Badge>{deliveredStatusLabels[transaction.deliveredStatus]}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-paper p-3">
              <span>حالة العملية</span>
              <Badge tone={transaction.status === "COMPLETED" ? "success" : transaction.status === "CANCELLED" ? "danger" : "warning"}>{transferStatusLabels[transaction.status]}</Badge>
            </div>
            {transaction.status === "OPEN" ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {transaction.receivedStatus !== "RECEIVED" ? <CompleteStepButton transactionId={transaction.id} step="received" /> : null}
                {transaction.deliveredStatus !== "DELIVERED" ? <CompleteStepButton transactionId={transaction.id} step="delivered" /> : null}
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <Card title="العمولة">
        {transaction.commission ? (
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div className="min-w-0"><dt className="text-muted">اسم صاحب العمولة</dt><dd className="break-words font-semibold">{transaction.commission.personName || "-"}</dd></div>
            <div className="min-w-0"><dt className="text-muted">نوع العمولة</dt><dd className="break-words font-semibold">{commissionTypeLabels[transaction.commission.type]}</dd></div>
            <div className="min-w-0"><dt className="text-muted">تُحسب من</dt><dd className="break-words font-semibold">{commissionBaseLabels[transaction.commission.base]}</dd></div>
            <div className="min-w-0"><dt className="text-muted">قيمة العمولة</dt><dd className="break-words font-semibold">{formatDecimal(transaction.commission.value)}</dd></div>
            <div className="min-w-0"><dt className="text-muted">المبلغ المحسوب</dt><dd className="break-words font-semibold">{formatMoney(transaction.commission.amount, transaction.commission.currencyCode)}</dd></div>
            <div className="min-w-0"><dt className="text-muted">ملاحظات العمولة</dt><dd className="break-words font-semibold">{transaction.commission.notes || "-"}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-muted">لا توجد عمولة مسجلة لهذه العملية.</p>
        )}
      </Card>

      <Card title="بيانات إضافية">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div className="min-w-0"><dt className="text-muted">التاريخ</dt><dd className="break-words font-semibold">{formatDate(transaction.date)}</dd></div>
          <div className="min-w-0"><dt className="text-muted">العميل/التاجر</dt><dd className="break-words font-semibold">{transaction.customerNameSnapshot}</dd></div>
          <div className="min-w-0"><dt className="text-muted">الهاتف</dt><dd className="break-words font-semibold">{transaction.customerPhoneSnapshot || "-"}</dd></div>
          <div className="min-w-0"><dt className="text-muted">ملاحظات</dt><dd className="break-words font-semibold">{transaction.notes || "-"}</dd></div>
          <div className="min-w-0"><dt className="text-muted">سبب الإلغاء</dt><dd className="break-words font-semibold">{transaction.cancellationReason || "-"}</dd></div>
        </dl>
      </Card>
    </div>
  );
}
