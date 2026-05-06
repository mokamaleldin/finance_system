import { Pencil } from "lucide-react";
import Link from "next/link";
import { DeleteExpenseButton } from "@/components/forms/expense-actions";
import { ExpenseCreateModal } from "@/components/forms/expense-create-modal";
import { ExpenseFilterForm } from "@/components/forms/expense-filter-form";
import { ExpenseForm } from "@/components/forms/expense-form";
import { BarChart, DonutChart } from "@/components/ui/analytics-charts";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getExpense, getExpenses } from "@/lib/expense-service";
import { formatDate, formatDateInput, formatMoney, parseOptionalDateParam } from "@/lib/format";
import {
  currencyLabels,
  currencyValues,
  expenseCategoryLabels,
  expenseCategoryValues,
  type CurrencyCode,
  type ExpenseCategoryCode,
} from "@/lib/options";
import { toDecimal } from "@/lib/calculations";

type ExpensesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pick<T extends readonly string[]>(value: unknown, values: T) {
  return typeof value === "string" && values.includes(value) ? value : undefined;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = (await searchParams) ?? {};
  const from = parseOptionalDateParam(params.from);
  const to = parseOptionalDateParam(params.to, true);
  const category = pick(params.category, expenseCategoryValues) as ExpenseCategoryCode | undefined;
  const currencyCode = pick(params.currencyCode, currencyValues) as CurrencyCode | undefined;
  const editId = typeof params.editId === "string" ? params.editId : "";
  const [expenses, editingExpense] = await Promise.all([
    getExpenses({ from, to, category, currencyCode }),
    editId ? getExpense(editId) : Promise.resolve(null),
  ]);

  const filterParams = new URLSearchParams();
  if (from) filterParams.set("from", formatDateInput(from));
  if (to) filterParams.set("to", formatDateInput(to));
  if (category) filterParams.set("category", category);
  if (currencyCode) filterParams.set("currencyCode", currencyCode);
  const savedPath = `/dashboard/expenses${filterParams.toString() ? `?${filterParams.toString()}` : ""}`;
  const categoryChartItems = expenseCategoryValues.map((item) => ({
    label: expenseCategoryLabels[item],
    value: expenses.filter((expense) => expense.category === item).length,
  }));
  const currencyTotals = currencyValues.reduce(
    (totals, currency) => {
      totals[currency] = toDecimal(0);
      return totals;
    },
    {} as Record<CurrencyCode, ReturnType<typeof toDecimal>>,
  );
  for (const expense of expenses) {
    currencyTotals[expense.currencyCode] = toDecimal(currencyTotals[expense.currencyCode]).plus(expense.amount);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line/80 bg-white/75 p-5 shadow-soft backdrop-blur">
        <div>
          <h2 className="text-3xl font-bold text-ink">المصاريف</h2>
          <p className="mt-1 text-sm text-muted">سجل مصاريف التشغيل بعيدًا عن ربح العمليات، وستظهر في التقارير وصافي الربح.</p>
        </div>
        {!editingExpense ? <ExpenseCreateModal onSavedPath={savedPath} /> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DonutChart
          title="توزيع المصاريف حسب النوع"
          subtitle="عدد المصاريف في النتائج الحالية"
          items={categoryChartItems}
          centerLabel="مصروف"
          centerValue={String(expenses.length)}
        />
        <BarChart title="نشاط المصاريف" subtitle="عدد السجلات لكل نوع" points={categoryChartItems} hoverable />
        <Card title="صرفنا من كل عملة" subtitle="إجمالي المصاريف لكل عملة في النتائج الحالية">
          <div className="rounded-xl border border-line/70 bg-paper/70 p-3">
            <div className="grid divide-y divide-line/60">
              {currencyValues.map((currency) => (
                <div key={currency} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{currencyLabels[currency]}</p>
                    <p className="mt-0.5 text-xs text-muted">{currency}</p>
                  </div>
                  <p className="text-lg font-bold text-ink tabular-nums">{formatMoney(currencyTotals[currency], currency)}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {editingExpense ? (
        <Card title="تعديل مصروف">
          <ExpenseForm
            expenseId={editingExpense.id}
            onSavedPath={savedPath}
            initialValues={{
              date: formatDateInput(editingExpense.date),
              category: editingExpense.category,
              description: editingExpense.description,
              amount: editingExpense.amount.toString(),
              currencyCode: editingExpense.currencyCode,
              notes: editingExpense.notes || "",
            }}
          />
          <Link href={savedPath} className="mt-3 inline-flex text-sm font-semibold text-olive hover:text-ink">
            إلغاء التعديل
          </Link>
        </Card>
      ) : null}

      <section className="rounded-lg border border-line/80 bg-white/95 p-4 shadow-soft sm:p-5">
        <div className="mb-5 border-b border-line/70 pb-3">
          <h3 className="text-xl font-bold text-ink">الفلاتر</h3>
          <p className="mt-1 text-sm text-muted">غيّر أي فلتر وسيتم تحديث المصاريف مباشرة.</p>
        </div>
        <ExpenseFilterForm
          from={from ? formatDateInput(from) : ""}
          to={to ? formatDateInput(to) : ""}
          category={category || ""}
          currencyCode={currencyCode || ""}
        />
      </section>

      <Card title="قائمة المصاريف">
        {expenses.length === 0 ? (
          <EmptyState title="لا توجد مصاريف مطابقة" description="أضف مصروفًا جديدًا ليظهر هنا." />
        ) : (
          <div>
            <div className="grid gap-3 md:hidden">
              {expenses.map((expense) => (
                <div key={expense.id} className="record-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-ink">{expense.description}</p>
                      <p className="mt-1 text-xs text-muted">
                        {formatDate(expense.date)} - {expenseCategoryLabels[expense.category]}
                      </p>
                    </div>
                    <strong>{formatMoney(expense.amount, expense.currencyCode)}</strong>
                  </div>
                  {expense.notes ? <p className="mt-2 text-sm leading-6 text-muted">{expense.notes}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/dashboard/expenses?editId=${expense.id}`} className="action-secondary flex-1 px-2 py-2 text-xs">
                      <Pencil className="h-3.5 w-3.5" />
                      تعديل
                    </Link>
                    <DeleteExpenseButton expenseId={expense.id} />
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-line text-right text-muted">
                    <th className="py-3 font-semibold">التاريخ</th>
                    <th className="py-3 font-semibold">نوع المصروف</th>
                    <th className="py-3 font-semibold">الوصف</th>
                    <th className="py-3 font-semibold">المبلغ</th>
                    <th className="py-3 font-semibold">ملاحظات</th>
                    <th className="py-3 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-line/70">
                      <td className="py-3">{formatDate(expense.date)}</td>
                      <td className="py-3">{expenseCategoryLabels[expense.category]}</td>
                      <td className="py-3 font-semibold text-ink">{expense.description}</td>
                      <td className="py-3">{formatMoney(expense.amount, expense.currencyCode)}</td>
                      <td className="py-3 text-muted">{expense.notes || "-"}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/dashboard/expenses?editId=${expense.id}`} className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm hover:bg-mint">
                            <Pencil className="h-3.5 w-3.5" />
                            تعديل
                          </Link>
                          <DeleteExpenseButton expenseId={expense.id} />
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
