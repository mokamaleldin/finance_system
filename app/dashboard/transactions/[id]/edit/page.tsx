import { notFound } from "next/navigation";
import { TransferTransactionForm } from "@/components/forms/transfer-transaction-form";
import { Card } from "@/components/ui/card";
import { formatDateInput } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type EditTransactionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTransactionPage({ params }: EditTransactionPageProps) {
  const { id } = await params;
  const [transaction, customers] = await Promise.all([
    prisma.transferTransaction.findUnique({ where: { id } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!transaction) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">تعديل العملية</h2>
        <p className="mt-1 text-sm text-muted">سيتم إعادة حساب المبلغ والربح حسب الأسعار والحالات المدخلة.</p>
      </div>

      <Card title="بيانات العملية">
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
            usdToEgp: transaction.usdToEgp.toString(),
            usdToTry: transaction.usdToTry.toString(),
            customerRate: transaction.customerRate.toString(),
            deliveredCurrency: transaction.deliveredCurrency,
            deliveredAmount: transaction.isDeliveredAmountManual ? transaction.deliveredAmount.toString() : "",
            receivedStatus: transaction.receivedStatus === "NOT_RECEIVED" ? "NOT_RECEIVED" : "RECEIVED",
            deliveredStatus: transaction.deliveredStatus === "DELIVERED" ? "DELIVERED" : "NOT_DELIVERED",
            notes: transaction.notes || "",
          }}
        />
      </Card>
    </div>
  );
}
