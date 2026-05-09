import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CancelTransactionButton,
  CompleteStepButton,
  DeleteTransferExecutionButton,
  TransferExecutionForm,
} from "@/components/forms/transaction-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { customerSelect } from "@/lib/customer-select";
import { formatDate, formatDecimal, formatMoney } from "@/lib/format";
import {
  currencyLabels,
  commissionBaseLabels,
  commissionTypeLabels,
  deliveredStatusLabels,
  receivedStatusLabels,
  transferExecutionTypeLabels,
  transferStatusLabels,
  transferTypeLabels,
} from "@/lib/options";
import { prisma } from "@/lib/prisma";
import { getOpenAmountInfos, getRateDirection, getTransferSettlement } from "@/lib/transfer-calculations";

type TransactionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const { id } = await params;
  const transaction = await prisma.transferTransaction.findUnique({
    where: { id },
    include: {
      customer: { select: customerSelect },
      commission: true,
      executions: { orderBy: [{ date: "asc" }, { createdAt: "asc" }] },
    },
  });

  if (!transaction) {
    notFound();
  }
  const fallbackDirection = getRateDirection(transaction.receivedCurrency, transaction.deliveredCurrency);
  const rateBaseCurrency = transaction.rateBaseCurrency || fallbackDirection.rateBaseCurrency;
  const rateQuoteCurrency = transaction.rateQuoteCurrency || fallbackDirection.rateQuoteCurrency;
  const settlement = getTransferSettlement(transaction);
  const openItems = getOpenAmountInfos(transaction);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line/80 bg-white/75 p-5 shadow-soft backdrop-blur">
        <div>
          <h2 className="text-3xl font-bold text-ink">تفاصيل العملية</h2>
          <p className="mt-1 text-sm text-muted">{transaction.customerNameSnapshot}</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Link href={`/dashboard/transactions/${transaction.id}/edit`} className="action-secondary flex-1 px-3 py-2 sm:flex-none">
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

      <Card title="الدفعات والمتبقي" subtitle="يمكن تسجيل الاستلام أو التسليم على أكثر من مرة حسب الواقع.">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-lg bg-paper p-4">
            <p className="text-sm text-muted">استلمنا فعليًا</p>
            <p className="mt-2 font-bold">{formatMoney(settlement.totalReceived, transaction.receivedCurrency)}</p>
          </div>
          <div className="rounded-lg bg-paper p-4">
            <p className="text-sm text-muted">باقي لنا عند العميل</p>
            <p className="mt-2 font-bold">{formatMoney(settlement.remainingReceived, transaction.receivedCurrency)}</p>
          </div>
          <div className="rounded-lg bg-mint p-4">
            <p className="text-sm text-muted">سلمنا فعليًا</p>
            <p className="mt-2 font-bold">{formatMoney(settlement.totalDelivered, transaction.deliveredCurrency)}</p>
          </div>
          <div className="rounded-lg bg-mint p-4">
            <p className="text-sm text-muted">باقي علينا للعميل</p>
            <p className="mt-2 font-bold">{formatMoney(settlement.remainingDelivered, transaction.deliveredCurrency)}</p>
          </div>
        </div>

        {settlement.extraReceived.gt(0) || settlement.extraDelivered.gt(0) ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {settlement.extraReceived.gt(0) ? (
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                زيادة استلام: {formatMoney(settlement.extraReceived, transaction.receivedCurrency)}
              </div>
            ) : null}
            {settlement.extraDelivered.gt(0) ? (
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                زيادة تسليم: {formatMoney(settlement.extraDelivered, transaction.deliveredCurrency)}
              </div>
            ) : null}
          </div>
        ) : null}

        {transaction.status !== "CANCELLED" ? (
          <div className="mt-5">
            <TransferExecutionForm
              transactionId={transaction.id}
              receivedCurrency={transaction.receivedCurrency}
              deliveredCurrency={transaction.deliveredCurrency}
              remainingReceived={settlement.remainingReceived.toString()}
              remainingDelivered={settlement.remainingDelivered.toString()}
            />
          </div>
        ) : null}

        <div className="mt-5">
          {transaction.executions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line bg-paper px-4 py-5 text-center text-sm text-muted">
              لا توجد دفعات مسجلة بعد.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-line/70">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-line text-right text-muted">
                    <th className="px-3 py-3 font-semibold">التاريخ</th>
                    <th className="px-3 py-3 font-semibold">النوع</th>
                    <th className="px-3 py-3 font-semibold">المبلغ</th>
                    <th className="px-3 py-3 font-semibold">ملاحظات</th>
                    <th className="px-3 py-3 font-semibold">حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {transaction.executions.map((execution) => (
                    <tr key={execution.id} className="border-b border-line/70 last:border-b-0">
                      <td className="px-3 py-3">{formatDate(execution.date)}</td>
                      <td className="px-3 py-3 font-semibold">{transferExecutionTypeLabels[execution.type]}</td>
                      <td className="px-3 py-3">{formatMoney(execution.amount, execution.currency)}</td>
                      <td className="max-w-[240px] px-3 py-3 text-muted">{execution.notes || "-"}</td>
                      <td className="px-3 py-3">
                        <DeleteTransferExecutionButton executionId={execution.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {openItems.length > 0 ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {openItems.map((item) => (
              <div key={`${item.side}-${item.currency}`} className="rounded-lg border border-line/80 bg-white px-3 py-2 text-sm font-bold text-ink">
                {item.label}: {formatMoney(item.amount, item.currency)}
              </div>
            ))}
          </div>
        ) : null}
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
              <Badge>{receivedStatusLabels[settlement.receivedStatus]}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-paper p-3">
              <span>حالة التسليم</span>
              <Badge>{deliveredStatusLabels[settlement.deliveredStatus]}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-paper p-3">
              <span>حالة العملية</span>
              <Badge tone={settlement.status === "COMPLETED" ? "success" : settlement.status === "CANCELLED" ? "danger" : "warning"}>{transferStatusLabels[settlement.status]}</Badge>
            </div>
            {transaction.status === "OPEN" ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {!settlement.isReceivedComplete ? <CompleteStepButton transactionId={transaction.id} step="received" /> : null}
                {!settlement.isDeliveredComplete ? <CompleteStepButton transactionId={transaction.id} step="delivered" /> : null}
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
