import { TransactionStatus } from "@prisma/client";
import Link from "next/link";
import { TransactionGroupForm } from "@/components/forms/transaction-group-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  movementTypeLabels,
  transactionStatusLabels,
} from "@/lib/calculations";
import { formatDate, formatMoney, formatOptionalMoney } from "@/lib/format";
import { transactionStatusValues } from "@/lib/options";
import { prisma } from "@/lib/prisma";

type TransactionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function statusTone(status: TransactionStatus) {
  if (status === "SETTLED") return "success" as const;
  if (status === "PARTIALLY_SETTLED") return "warning" as const;
  return "neutral" as const;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const params = (await searchParams) ?? {};
  const status =
    typeof params.status === "string" && transactionStatusValues.includes(params.status as never)
      ? (params.status as TransactionStatus)
      : undefined;

  const [customers, groups] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.transactionGroup.findMany({
      where: status ? { status } : undefined,
      include: {
        customer: true,
        financialMovements: { orderBy: [{ date: "asc" }, { createdAt: "asc" }] },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">المعاملات</h2>
        <p className="mt-1 text-sm text-muted">ربط الحركات التي تخص نفس الصفقة ومتابعة التسوية والربح.</p>
      </div>

      <Card title="إنشاء معاملة">
        <TransactionGroupForm customers={customers.map((customer) => ({ id: customer.id, name: customer.name }))} />
      </Card>

      <Card title="تصفية المعاملات">
        <form className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="md:w-72">
            <label className="text-sm font-semibold text-ink">الحالة</label>
            <select name="status" defaultValue={status || ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2">
              <option value="">كل الحالات</option>
              {transactionStatusValues.map((item) => (
                <option key={item} value={item}>
                  {transactionStatusLabels[item]}
                </option>
              ))}
            </select>
          </div>
          <button className="rounded-lg bg-ink px-4 py-2.5 font-semibold text-white">تطبيق</button>
        </form>
      </Card>

      <Card title="قائمة المعاملات">
        {groups.length === 0 ? (
          <EmptyState title="لا توجد معاملات" />
        ) : (
          <div className="grid gap-3">
            {groups.map((group) => (
              <details key={group.id} className="rounded-lg border border-line bg-white p-4">
                <summary className="cursor-pointer list-none">
                  <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto] xl:items-center">
                    <div>
                      <p className="font-bold text-ink">{group.title || `معاملة ${group.id.slice(0, 8)}`}</p>
                      <Link className="mt-1 block text-sm text-muted hover:underline" href={`/dashboard/customers/${group.customerId}`}>
                        {group.customer.name}
                      </Link>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted">المتوقع</p>
                      <p className="font-semibold text-ink">
                        {formatOptionalMoney(group.expectedSourceAmount, group.sourceCurrency)} / {formatOptionalMoney(group.expectedTargetAmount, group.targetCurrency)}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted">الفعلي</p>
                      <p className="font-semibold text-ink">
                        {formatOptionalMoney(group.actualSourceAmount, group.sourceCurrency)} / {formatOptionalMoney(group.actualTargetAmount, group.targetCurrency)}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted">الربح</p>
                      <p className="font-semibold text-ink">{group.profit?.toString() || "-"}</p>
                    </div>
                    <Badge tone={statusTone(group.status)}>{transactionStatusLabels[group.status]}</Badge>
                  </div>
                </summary>

                <div className="mt-4 grid gap-4">
                  <dl className="grid gap-3 rounded-lg bg-paper p-4 text-sm md:grid-cols-4">
                    <div>
                      <dt className="text-muted">سعر التكلفة</dt>
                      <dd className="font-semibold text-ink">{group.costRate?.toString() || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">سعر التنفيذ</dt>
                      <dd className="font-semibold text-ink">{group.sellRate?.toString() || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">تاريخ الإنشاء</dt>
                      <dd className="font-semibold text-ink">{formatDate(group.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">ملاحظات</dt>
                      <dd className="font-semibold text-ink">{group.notes || "-"}</dd>
                    </div>
                  </dl>

                  {group.financialMovements.length === 0 ? (
                    <EmptyState title="لا توجد حركات مرتبطة" description="سجل حركة جديدة واربطها بهذه المعاملة." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-sm">
                        <thead>
                          <tr className="border-b border-line text-right text-muted">
                            <th className="py-2">التاريخ</th>
                            <th className="py-2">النوع</th>
                            <th className="py-2">المبلغ</th>
                            <th className="py-2">السعر</th>
                            <th className="py-2">ملاحظات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.financialMovements.map((movement) => (
                            <tr key={movement.id} className="border-b border-line/70">
                              <td className="py-2">{formatDate(movement.date)}</td>
                              <td className="py-2">{movementTypeLabels[movement.type]}</td>
                              <td className="py-2">{formatMoney(movement.amount, movement.currency)}</td>
                              <td className="py-2">{movement.rate?.toString() || "-"}</td>
                              <td className="py-2 text-muted">{movement.notes || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
