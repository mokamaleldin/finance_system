import { TransferTransactionForm } from "@/components/forms/transfer-transaction-form";
import { prisma } from "@/lib/prisma";

export default async function NewTransactionPage() {
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-line/80 bg-white/75 p-5 shadow-soft backdrop-blur">
        <h2 className="text-3xl font-bold text-ink">معاملة جديدة</h2>
        <p className="mt-1 text-sm text-muted">سجل عملية تحويل أو تبديل عملة بخطوات واضحة، وسيتم حساب المطلوب تسليمه والربح تلقائيًا.</p>
      </div>
      <TransferTransactionForm customers={customers.map((customer) => ({ id: customer.id, name: customer.name, phone: customer.phone }))} />
    </div>
  );
}
