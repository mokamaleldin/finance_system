import { notFound } from "next/navigation";
import { MovementForm } from "@/components/forms/movement-form";
import { Card } from "@/components/ui/card";
import { formatDateInput } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type EditMovementPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditMovementPage({ params }: EditMovementPageProps) {
  const { id } = await params;
  const [movement, customers, transactionGroups] = await Promise.all([
    prisma.financialMovement.findUnique({ where: { id } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.transactionGroup.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  if (!movement) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">تعديل حركة مالية</h2>
        <p className="mt-1 text-sm text-muted">راجع التعديل بعناية لأنه سيعيد حساب أرصدة العميل والمعاملة.</p>
      </div>

      <Card title="بيانات الحركة">
        <MovementForm
          movementId={movement.id}
          customers={customers.map((customer) => ({ id: customer.id, name: customer.name }))}
          transactionGroups={transactionGroups.map((group) => ({
            id: group.id,
            title: group.title,
            customerId: group.customerId,
          }))}
          initialValues={{
            customerId: movement.customerId || "",
            date: formatDateInput(movement.date),
            type: movement.type,
            currency: movement.currency,
            amount: movement.amount.toString(),
            rate: movement.rate?.toString() || "",
            transactionGroupId: movement.transactionGroupId || "",
            notes: movement.notes || "",
          }}
        />
      </Card>
    </div>
  );
}
