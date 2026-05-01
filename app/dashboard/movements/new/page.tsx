import { MovementForm } from "@/components/forms/movement-form";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function NewMovementPage() {
  const [customers, transactionGroups] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.transactionGroup.findMany({
      where: { status: { in: ["OPEN", "PARTIALLY_SETTLED"] } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">حركة جديدة</h2>
        <p className="mt-1 text-sm text-muted">كل استلام أو دفع يجب تسجيله كقيد مستقل في دفتر الأستاذ.</p>
      </div>

      <Card title="بيانات الحركة" subtitle="تحذير: تعديل أو حذف الحركات المالية لاحقا سيعيد حساب الأرصدة.">
        <MovementForm
          customers={customers.map((customer) => ({ id: customer.id, name: customer.name }))}
          transactionGroups={transactionGroups.map((group) => ({
            id: group.id,
            title: group.title,
            customerId: group.customerId,
          }))}
        />
      </Card>
    </div>
  );
}
