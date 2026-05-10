import { notFound } from "next/navigation";
import { TransferTransactionForm } from "@/components/forms/transfer-transaction-form";
import { requirePagePermission } from "@/lib/auth";
import { customerOptionSelect } from "@/lib/customer-select";
import { formatDateInput } from "@/lib/format";
import type { CurrencyCode } from "@/lib/options";
import { prisma } from "@/lib/prisma";

type EditTransactionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTransactionPage({ params }: EditTransactionPageProps) {
  await requirePagePermission("transactions:write");
  const { id } = await params;
  const [transaction, customers] = await Promise.all([
    prisma.transferTransaction.findUnique({ where: { id }, include: { commission: true } }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: customerOptionSelect }),
  ]);

  if (!transaction) {
    notFound();
  }
  const usdRates = {
    ...(typeof transaction.usdRates === "object" && transaction.usdRates && !Array.isArray(transaction.usdRates)
      ? transaction.usdRates
      : {}),
    ...(transaction.usdToEgp ? { EGP: transaction.usdToEgp.toString() } : {}),
    ...(transaction.usdToTry ? { TRY: transaction.usdToTry.toString() } : {}),
    USD: "1",
  } as Record<CurrencyCode, string>;

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">تعديل العملية</h2>
        <p className="mt-1 text-sm text-muted">سيتم إعادة حساب المبلغ والربح حسب الأسعار والحالات المدخلة.</p>
      </div>

      <TransferTransactionForm
        transactionId={transaction.id}
        customers={customers.map((customer) => ({ id: customer.id, name: customer.name, phone: customer.phone }))}
        initialValues={{
          date: formatDateInput(transaction.date),
          customerId: transaction.customerId || "",
          customerName: transaction.customerNameSnapshot,
          quickCustomerName: transaction.customerId ? "" : transaction.customerNameSnapshot,
          phone: transaction.customerPhoneSnapshot || "",
          type: transaction.type,
          receivedCurrency: transaction.receivedCurrency,
          receivedAmount: transaction.receivedAmount.toString(),
          usdRates,
          customerRate: transaction.customerRate.toString(),
          deliveredCurrency: transaction.deliveredCurrency,
          deliveredAmount: transaction.isDeliveredAmountManual ? transaction.deliveredAmount.toString() : "",
          receivedStatus: transaction.receivedStatus === "NOT_RECEIVED" ? "NOT_RECEIVED" : "RECEIVED",
          deliveredStatus: transaction.deliveredStatus === "DELIVERED" ? "DELIVERED" : "NOT_DELIVERED",
          notes: transaction.notes || "",
          commissionEnabled: Boolean(transaction.commission),
          commissionPersonName: transaction.commission?.personName || "",
          commissionType: transaction.commission?.type || "FIXED",
          commissionBase: transaction.commission?.base || "RECEIVED_AMOUNT",
          commissionValue: transaction.commission?.value.toString() || "",
          commissionCurrency: transaction.commission?.currencyCode || transaction.profitCurrency,
          commissionNotes: transaction.commission?.notes || "",
        }}
      />
    </div>
  );
}
