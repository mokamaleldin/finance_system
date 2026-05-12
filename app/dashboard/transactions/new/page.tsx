import { TransferTransactionForm } from "@/components/forms/transfer-transaction-form";
import { DataError } from "@/components/ui/data-error";
import { requirePagePermission } from "@/lib/auth";
import { customerOptionSelect } from "@/lib/customer-select";
import { prisma } from "@/lib/prisma";
import { logMissingServerEnv, logServerError } from "@/lib/server-logging";

export default async function NewTransactionPage() {
  await requirePagePermission("transactions:write");
  let customers;
  try {
    logMissingServerEnv("dashboard/transactions/new");
    customers = await prisma.customer.findMany({ orderBy: { name: "asc" }, select: customerOptionSelect });
  } catch (error) {
    logServerError("dashboard/transactions/new: failed to load customers", error);
    return (
      <div className="grid gap-6">
        <div className="rounded-lg border border-line/80 bg-white/75 p-5 shadow-soft backdrop-blur">
          <h2 className="text-3xl font-bold text-ink">معاملة جديدة</h2>
          <p className="mt-1 text-sm text-muted">سجل عملية تحويل أو تبديل عملة بخطوات واضحة.</p>
        </div>
        <DataError description="تعذر تحميل قائمة العملاء اللازمة لإنشاء معاملة. راجع اتصال قاعدة البيانات." />
      </div>
    );
  }

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
