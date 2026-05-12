import { Calculator, Pencil, PlusCircle, WalletCards } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CapitalCloseForm } from "@/components/forms/capital-close-form";
import { DeleteCapitalMovementButton } from "@/components/forms/capital-movement-actions";
import { CapitalFilterForm } from "@/components/forms/capital-filter-form";
import { CapitalMovementForm } from "@/components/forms/capital-movement-form";
import { Badge } from "@/components/ui/badge";
import { Card, StatCard } from "@/components/ui/card";
import { DataError } from "@/components/ui/data-error";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePagePermission } from "@/lib/auth";
import {
  calculateCapitalSummary,
  getCapitalCashBalances,
  getCapitalCloseRateDefaults,
  getCapitalCloses,
  getCapitalMovement,
  getCapitalMovements,
  getCapitalSummary,
  parseCapitalCloseBalances,
  parseCapitalCloseRates,
} from "@/lib/capital-service";
import { formatDate, formatDateInput, formatMoney, parseOptionalDateParam } from "@/lib/format";
import {
  capitalMovementTypeLabels,
  capitalMovementTypeValues,
  currencyLabels,
  currencyValues,
  type CapitalMovementTypeCode,
  type CurrencyCode,
} from "@/lib/options";
import { hasPermission } from "@/lib/permissions";
import { logMissingServerEnv, logServerError } from "@/lib/server-logging";

type CapitalPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pick<T extends readonly string[]>(value: unknown, values: T) {
  return typeof value === "string" && values.includes(value) ? value : undefined;
}

export default async function CapitalPage({ searchParams }: CapitalPageProps) {
  const session = await requirePagePermission("capital:read");
  const canWriteCapital = hasPermission(session.role, "capital:write");
  const params = (await searchParams) ?? {};
  const from = parseOptionalDateParam(params.from);
  const to = parseOptionalDateParam(params.to, true);
  const type = pick(params.type, capitalMovementTypeValues) as CapitalMovementTypeCode | undefined;
  const currencyCode = pick(params.currencyCode, currencyValues) as CurrencyCode | undefined;
  const editId = typeof params.editId === "string" ? params.editId : "";

  if (editId && !canWriteCapital) {
    redirect("/dashboard/capital");
  }

  const filterParams = new URLSearchParams();
  if (from) filterParams.set("from", formatDateInput(from));
  if (to) filterParams.set("to", formatDateInput(to));
  if (type) filterParams.set("type", type);
  if (currencyCode) filterParams.set("currencyCode", currencyCode);
  const savedPath = `/dashboard/capital${filterParams.toString() ? `?${filterParams.toString()}` : ""}`;
  let pageData;
  try {
    logMissingServerEnv("dashboard/capital");
    pageData = await Promise.all([
      getCapitalMovements({ from, to, type, currencyCode }),
      editId ? getCapitalMovement(editId) : Promise.resolve(null),
      getCapitalSummary(),
      getCapitalCashBalances(new Date()),
      getCapitalCloseRateDefaults(),
      getCapitalCloses(),
    ]);
  } catch (error) {
    logServerError("dashboard/capital: failed to load capital data", error);
    return (
      <div className="grid gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line/80 bg-white/75 p-5 shadow-soft backdrop-blur">
          <div>
            <h2 className="text-3xl font-bold text-ink">رأس المال</h2>
            <p className="mt-1 text-sm text-muted">تابع رصيد الكاش الفعلي، وسجل جرد اليوم بالدولار حسب الريت.</p>
          </div>
          {canWriteCapital ? (
            <a href="#capital-form" className="action-primary w-full sm:w-auto">
              <PlusCircle className="h-4 w-4" />
              إضافة حركة
            </a>
          ) : null}
        </div>
        <DataError description="تعذر تحميل بيانات رأس المال. إذا ظهر هذا في الإنتاج فراجع هل تم تطبيق migration جدول CapitalClose على Nile." />
      </div>
    );
  }
  const [movements, editingMovement, fullSummary, currentCashBalances, closeRateDefaults, capitalCloses] = pageData;
  const filteredSummary = calculateCapitalSummary(movements);
  const latestClose = capitalCloses[0];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line/80 bg-white/75 p-5 shadow-soft backdrop-blur">
        <div>
          <h2 className="text-3xl font-bold text-ink">رأس المال</h2>
          <p className="mt-1 text-sm text-muted">تابع رصيد الكاش الفعلي، وسجل جرد اليوم بالدولار حسب الريت.</p>
        </div>
        {canWriteCapital ? (
          <a href="#capital-form" className="action-primary w-full sm:w-auto">
            <PlusCircle className="h-4 w-4" />
            إضافة حركة
          </a>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {currencyValues.map((currency) => (
          <StatCard
            key={currency}
            title={`رصيد الكاش الحالي - ${currencyLabels[currency]}`}
            value={formatMoney(currentCashBalances[currency], currency)}
            hint={`رأس المال اليدوي: ${formatMoney(fullSummary.balance[currency], currency)}`}
            icon={<WalletCards className="h-5 w-5" />}
            trend={{
              label: currentCashBalances[currency].isZero()
                ? "لا يوجد رصيد"
                : currentCashBalances[currency].isPositive()
                  ? "رصيد موجب"
                  : "رصيد سالب",
              direction: currentCashBalances[currency].isNegative() ? "down" : currentCashBalances[currency].isZero() ? "neutral" : "up",
            }}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="رأس المال بعد آخر جرد"
          value={latestClose ? formatMoney(latestClose.capitalUsd, "USD") : "-"}
          hint={latestClose ? `آخر جرد: ${formatDate(latestClose.date)}` : "لم يتم تسجيل جرد بعد"}
          icon={<Calculator className="h-5 w-5" />}
          trend={latestClose ? {
            label: latestClose.profitUsd.isZero() ? "بدون فرق" : latestClose.profitUsd.isPositive() ? "زيادة" : "عجز",
            direction: latestClose.profitUsd.isNegative() ? "down" : latestClose.profitUsd.isZero() ? "neutral" : "up",
          } : undefined}
        />
        <StatCard
          title="ربح / عجز آخر جرد"
          value={latestClose ? formatMoney(latestClose.profitUsd, "USD") : "-"}
          hint="بعد استبعاد ضخ وسحب رأس المال"
          trend={latestClose ? {
            label: latestClose.profitUsd.isZero() ? "تعادل" : latestClose.profitUsd.isPositive() ? "ربح" : "خسارة",
            direction: latestClose.profitUsd.isNegative() ? "down" : latestClose.profitUsd.isZero() ? "neutral" : "up",
          } : undefined}
        />
        <StatCard
          title="ضخ رأس مال داخل الجرد"
          value={latestClose ? formatMoney(latestClose.externalInflowUsd, "USD") : "-"}
          hint="محول للدولار بسعر الجرد"
        />
        <StatCard
          title="سحب رأس مال داخل الجرد"
          value={latestClose ? formatMoney(latestClose.externalOutflowUsd, "USD") : "-"}
          hint="محول للدولار بسعر الجرد"
        />
      </div>

      {canWriteCapital ? (
        <Card title="جرد اليوم بالدولار" subtitle="أدخل سعر الدولار مقابل كل عملة، وسيتم تحويل الرصيد الحالي وحساب الربح أو العجز.">
          <CapitalCloseForm initialRates={closeRateDefaults} />
        </Card>
      ) : null}

      {canWriteCapital ? (
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
            <Link href={savedPath} prefetch={false} className="mt-3 inline-flex text-sm font-semibold text-olive hover:text-ink">
              إلغاء التعديل
            </Link>
          ) : null}
        </Card>
      ) : null}

      <Card title="سجل الجرد اليومي">
        {capitalCloses.length === 0 ? (
          <EmptyState title="لا توجد عمليات جرد" description="بعد الضغط على جرد اليوم سيظهر تاريخ الجرد والربح هنا." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-line text-right text-muted">
                  <th className="py-3 font-semibold">التاريخ</th>
                  <th className="py-3 font-semibold">رأس المال بالدولار</th>
                  <th className="py-3 font-semibold">السابق</th>
                  <th className="py-3 font-semibold">الضخ</th>
                  <th className="py-3 font-semibold">السحب</th>
                  <th className="py-3 font-semibold">الربح / العجز</th>
                  <th className="py-3 font-semibold">أرصدة العملات</th>
                  <th className="py-3 font-semibold">الريت</th>
                </tr>
              </thead>
              <tbody>
                {capitalCloses.map((close) => {
                  const balances = parseCapitalCloseBalances(close.balances);
                  const rates = parseCapitalCloseRates(close.usdRates);

                  return (
                    <tr key={close.id} className="border-b border-line/70 align-top">
                      <td className="py-3">{formatDate(close.date)}</td>
                      <td className="py-3 font-semibold text-ink">{formatMoney(close.capitalUsd, "USD")}</td>
                      <td className="py-3">{formatMoney(close.previousCapitalUsd, "USD")}</td>
                      <td className="py-3">{formatMoney(close.externalInflowUsd, "USD")}</td>
                      <td className="py-3">{formatMoney(close.externalOutflowUsd, "USD")}</td>
                      <td className={`py-3 font-semibold ${close.profitUsd.isNegative() ? "text-red-700" : "text-emerald-700"}`}>
                        {formatMoney(close.profitUsd, "USD")}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {currencyValues.map((currency) => (
                            <Badge key={currency}>{formatMoney(balances[currency], currency)}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-muted">
                        <div className="grid gap-1">
                          {currencyValues.filter((currency) => currency !== "USD").map((currency) => (
                            <span key={currency}>USD/{currency}: {rates[currency] || "-"}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
                  {canWriteCapital ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/dashboard/capital?editId=${movement.id}`} prefetch={false} className="action-secondary flex-1 px-2 py-2 text-xs">
                        <Pencil className="h-3.5 w-3.5" />
                        تعديل
                      </Link>
                      <DeleteCapitalMovementButton movementId={movement.id} />
                    </div>
                  ) : null}
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
                    {canWriteCapital ? <th className="py-3 font-semibold">إجراءات</th> : null}
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
                      {canWriteCapital ? (
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/dashboard/capital?editId=${movement.id}`} prefetch={false} className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm hover:bg-mint">
                              <Pencil className="h-3.5 w-3.5" />
                              تعديل
                            </Link>
                            <DeleteCapitalMovementButton movementId={movement.id} />
                          </div>
                        </td>
                      ) : null}
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
