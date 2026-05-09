import { Pencil, PlusCircle, WalletCards } from "lucide-react";
import Link from "next/link";
import { DeleteCapitalMovementButton } from "@/components/forms/capital-movement-actions";
import { CapitalFilterForm } from "@/components/forms/capital-filter-form";
import { CapitalMovementForm } from "@/components/forms/capital-movement-form";
import { Badge } from "@/components/ui/badge";
import { Card, StatCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { calculateCapitalSummary, getCapitalMovement, getCapitalMovements, getCapitalSummary } from "@/lib/capital-service";
import { formatDate, formatDateInput, formatMoney, parseOptionalDateParam } from "@/lib/format";
import {
  capitalMovementTypeLabels,
  capitalMovementTypeValues,
  currencyLabels,
  currencyValues,
  type CapitalMovementTypeCode,
  type CurrencyCode,
} from "@/lib/options";

type CapitalPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pick<T extends readonly string[]>(value: unknown, values: T) {
  return typeof value === "string" && values.includes(value) ? value : undefined;
}

export default async function CapitalPage({ searchParams }: CapitalPageProps) {
  const params = (await searchParams) ?? {};
  const from = parseOptionalDateParam(params.from);
  const to = parseOptionalDateParam(params.to, true);
  const type = pick(params.type, capitalMovementTypeValues) as CapitalMovementTypeCode | undefined;
  const currencyCode = pick(params.currencyCode, currencyValues) as CurrencyCode | undefined;
  const editId = typeof params.editId === "string" ? params.editId : "";

  const [movements, editingMovement, fullSummary] = await Promise.all([
    getCapitalMovements({ from, to, type, currencyCode }),
    editId ? getCapitalMovement(editId) : Promise.resolve(null),
    getCapitalSummary(),
  ]);
  const filteredSummary = calculateCapitalSummary(movements);

  const filterParams = new URLSearchParams();
  if (from) filterParams.set("from", formatDateInput(from));
  if (to) filterParams.set("to", formatDateInput(to));
  if (type) filterParams.set("type", type);
  if (currencyCode) filterParams.set("currencyCode", currencyCode);
  const savedPath = `/dashboard/capital${filterParams.toString() ? `?${filterParams.toString()}` : ""}`;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line/80 bg-white/75 p-5 shadow-soft backdrop-blur">
        <div>
          <h2 className="text-3xl font-bold text-ink">رأس المال</h2>
          <p className="mt-1 text-sm text-muted">تابع رأس المال الأصلي، الضخ، والسحب لكل عملة بشكل منفصل.</p>
        </div>
        <a href="#capital-form" className="action-primary w-full sm:w-auto">
          <PlusCircle className="h-4 w-4" />
          إضافة حركة
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {currencyValues.map((currency) => (
          <StatCard
            key={currency}
            title={`رصيد رأس المال - ${currencyLabels[currency]}`}
            value={formatMoney(fullSummary.balance[currency], currency)}
            hint={`ضخ: ${formatMoney(fullSummary.inflow[currency], currency)} | سحب: ${formatMoney(fullSummary.outflow[currency], currency)}`}
            icon={<WalletCards className="h-5 w-5" />}
            trend={{
              label: fullSummary.balance[currency].isZero()
                ? "لا يوجد رصيد"
                : fullSummary.balance[currency].isPositive()
                  ? "رصيد موجب"
                  : "رصيد سالب",
              direction: fullSummary.balance[currency].isNegative() ? "down" : fullSummary.balance[currency].isZero() ? "neutral" : "up",
            }}
          />
        ))}
      </div>

      <Card title={editingMovement ? "تعديل حركة رأس مال" : "إضافة حركة رأس مال"} subtitle="استخدم الضخ عند إدخال مال جديد، والسحب عند خروج مال من رأس المال.">
        <div id="capital-form">
          <CapitalMovementForm
            movementId={editingMovement?.id}
            onSavedPath={savedPath}
            initialValues={editingMovement
              ? {
                  date: formatDateInput(editingMovement.date),
                  type: editingMovement.type,
                  currencyCode: editingMovement.currencyCode,
                  amount: editingMovement.amount.toString(),
                  description: editingMovement.description,
                  notes: editingMovement.notes || "",
                }
              : undefined}
          />
        </div>
        {editingMovement ? (
          <Link href={savedPath} className="mt-3 inline-flex text-sm font-semibold text-olive hover:text-ink">
            إلغاء التعديل
          </Link>
        ) : null}
      </Card>

      <section className="rounded-lg border border-line/80 bg-white/95 p-4 shadow-soft sm:p-5">
        <div className="mb-5 border-b border-line/70 pb-3">
          <h3 className="text-xl font-bold text-ink">الفلاتر</h3>
          <p className="mt-1 text-sm text-muted">اعرض حركات رأس المال حسب التاريخ، النوع، أو العملة.</p>
        </div>
        <CapitalFilterForm
          from={from ? formatDateInput(from) : ""}
          to={to ? formatDateInput(to) : ""}
          type={type || ""}
          currencyCode={currencyCode || ""}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="إجمالي الضخ في النتائج">
          <div className="grid gap-2">
            {currencyValues.map((currency) => (
              <div key={currency} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-mint px-3 py-2">
                <span>{currencyLabels[currency]}</span>
                <strong>{formatMoney(filteredSummary.inflow[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card title="إجمالي السحب في النتائج">
          <div className="grid gap-2">
            {currencyValues.map((currency) => (
              <div key={currency} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2">
                <span>{currencyLabels[currency]}</span>
                <strong>{formatMoney(filteredSummary.outflow[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card title="صافي النتائج المعروضة">
          <div className="grid gap-2">
            {currencyValues.map((currency) => (
              <div key={currency} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-line/70">
                <span>{currencyLabels[currency]}</span>
                <strong>{formatMoney(filteredSummary.balance[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="حركات رأس المال">
        {movements.length === 0 ? (
          <EmptyState title="لا توجد حركات رأس مال" description="سجل أول ضخ أو سحب ليظهر هنا." />
        ) : (
          <div>
            <div className="grid gap-3 md:hidden">
              {movements.map((movement) => (
                <div key={movement.id} className="record-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-ink">{movement.description}</p>
                      <p className="mt-1 text-xs text-muted">{formatDate(movement.date)}</p>
                    </div>
                    <Badge tone={movement.type === "INFLOW" ? "success" : "warning"}>{capitalMovementTypeLabels[movement.type]}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted">المبلغ</span>
                    <strong>{formatMoney(movement.amount, movement.currencyCode)}</strong>
                  </div>
                  {movement.notes ? <p className="mt-2 text-sm leading-6 text-muted">{movement.notes}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/dashboard/capital?editId=${movement.id}`} className="action-secondary flex-1 px-2 py-2 text-xs">
                      <Pencil className="h-3.5 w-3.5" />
                      تعديل
                    </Link>
                    <DeleteCapitalMovementButton movementId={movement.id} />
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-line text-right text-muted">
                    <th className="py-3 font-semibold">التاريخ</th>
                    <th className="py-3 font-semibold">نوع الحركة</th>
                    <th className="py-3 font-semibold">الوصف</th>
                    <th className="py-3 font-semibold">المبلغ</th>
                    <th className="py-3 font-semibold">ملاحظات</th>
                    <th className="py-3 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.id} className="border-b border-line/70">
                      <td className="py-3">{formatDate(movement.date)}</td>
                      <td className="py-3">
                        <Badge tone={movement.type === "INFLOW" ? "success" : "warning"}>{capitalMovementTypeLabels[movement.type]}</Badge>
                      </td>
                      <td className="py-3 font-semibold text-ink">{movement.description}</td>
                      <td className="py-3">{formatMoney(movement.amount, movement.currencyCode)}</td>
                      <td className="py-3 text-muted">{movement.notes || "-"}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/dashboard/capital?editId=${movement.id}`} className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm hover:bg-mint">
                            <Pencil className="h-3.5 w-3.5" />
                            تعديل
                          </Link>
                          <DeleteCapitalMovementButton movementId={movement.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
