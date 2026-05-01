import { TransferTransactionForm } from "@/components/forms/transfer-transaction-form";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function NewTransactionPage() {
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">معاملة جديدة</h2>
        <p className="mt-1 text-sm text-muted">سجل العملية بأسعارها الخاصة، وسيتم حساب المطلوب تسليمه والربح تلقائيًا.</p>
      </div>
      <Card title="بيانات العملية">
        <TransferTransactionForm customers={customers.map((customer) => ({ id: customer.id, name: customer.name, phone: customer.phone }))} />
      </Card>
    </div>
  );
}
