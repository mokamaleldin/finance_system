import { Currency, MovementType } from "@prisma/client";
import { AlertTriangle, Pencil } from "lucide-react";
import Link from "next/link";
import { DeleteMovementButton } from "@/components/forms/delete-movement-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buildMovementWhere } from "@/lib/ledger";
import { movementTypeLabels } from "@/lib/calculations";
import { formatDate, formatMoney, parseOptionalDateParam } from "@/lib/format";
import { currencyValues, movementTypeValues } from "@/lib/options";
import { prisma } from "@/lib/prisma";

type MovementsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MovementsPage({ searchParams }: MovementsPageProps) {
  const params = (await searchParams) ?? {};
  const from = parseOptionalDateParam(params.from);
  const to = parseOptionalDateParam(params.to, true);
  const type =
    typeof params.type === "string" && movementTypeValues.includes(params.type as never)
      ? (params.type as MovementType)
      : undefined;
  const currency =
    typeof params.currency === "string" && currencyValues.includes(params.currency as never)
      ? (params.currency as Currency)
      : undefined;
  const customerId = typeof params.customerId === "string" ? params.customerId : "";

  const [customers, movements] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.financialMovement.findMany({
      where: buildMovementWhere({
        from,
        to,
        type,
        currency,
        customerId: customerId || undefined,
      }),
      include: {
        customer: true,
        transactionGroup: true,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 300,
    }),
  ]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-ink">الحركات المالية</h2>
          <p className="mt-1 text-sm text-muted">مصدر الحقيقة للأرصدة اليومية وأرصدة العملاء.</p>
        </div>
        <Link href="/dashboard/movements/new" className="rounded-lg bg-ink px-4 py-2.5 font-semibold text-white hover:bg-olive">
          حركة جديدة
        </Link>
      </div>

      <Card>
        <div className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>تحذير: تعديل أو حذف حركة مالية يغير أرصدة العملاء وحالة المعاملات المرتبطة.</p>
        </div>
      </Card>

      <Card title="تصفية الحركات">
        <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div>
            <label className="text-sm font-semibold text-ink">من تاريخ</label>
            <input name="from" type="date" defaultValue={from ? from.toISOString().slice(0, 10) : ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">إلى تاريخ</label>
            <input name="to" type="date" defaultValue={to ? to.toISOString().slice(0, 10) : ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">العميل</label>
            <select name="customerId" defaultValue={customerId} className="mt-2 w-full rounded-lg border border-line px-3 py-2">
              <option value="">كل العملاء</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">النوع</label>
            <select name="type" defaultValue={type || ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2">
              <option value="">كل الأنواع</option>
              {movementTypeValues.map((item) => (
                <option key={item} value={item}>
                  {movementTypeLabels[item]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">العملة</label>
            <select name="currency" defaultValue={currency || ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2">
              <option value="">كل العملات</option>
              {currencyValues.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full rounded-lg bg-ink px-4 py-2.5 font-semibold text-white">تطبيق</button>
          </div>
        </form>
      </Card>

      <Card title="سجل الحركات">
        {movements.length === 0 ? (
          <EmptyState title="لا توجد حركات مطابقة" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-line text-right text-muted">
                  <th className="py-3 font-semibold">التاريخ</th>
                  <th className="py-3 font-semibold">العميل</th>
                  <th className="py-3 font-semibold">النوع</th>
                  <th className="py-3 font-semibold">المبلغ</th>
                  <th className="py-3 font-semibold">السعر</th>
                  <th className="py-3 font-semibold">المعاملة</th>
                  <th className="py-3 font-semibold">ملاحظات</th>
                  <th className="py-3 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className="border-b border-line/70">
                    <td className="py-3">{formatDate(movement.date)}</td>
                    <td className="py-3">{movement.customer ? <Link className="font-semibold text-ink hover:underline" href={`/dashboard/customers/${movement.customer.id}`}>{movement.customer.name}</Link> : "-"}</td>
                    <td className="py-3"><Badge>{movementTypeLabels[movement.type]}</Badge></td>
                    <td className="py-3 font-semibold">{formatMoney(movement.amount, movement.currency)}</td>
                    <td className="py-3 text-muted">{movement.rate?.toString() || "-"}</td>
                    <td className="py-3 text-muted">{movement.transactionGroup?.title || "-"}</td>
                    <td className="py-3 text-muted">{movement.notes || "-"}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Link href={`/dashboard/movements/${movement.id}/edit`} className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs font-semibold text-ink hover:bg-mint">
                          <Pencil className="h-3.5 w-3.5" />
                          تعديل
                        </Link>
                        <DeleteMovementButton movementId={movement.id} />
                      </div>
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
