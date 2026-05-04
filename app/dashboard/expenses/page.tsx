import { Pencil } from "lucide-react";
import Link from "next/link";
import { DeleteExpenseButton } from "@/components/forms/expense-actions";
import { ExpenseForm } from "@/components/forms/expense-form";
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

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-line/80 bg-white/75 p-5 shadow-soft backdrop-blur">
        <h2 className="text-3xl font-bold text-ink">المصاريف</h2>
        <p className="mt-1 text-sm text-muted">سجل مصاريف التشغيل بعيدًا عن ربح العمليات، وستظهر في التقارير وصافي الربح.</p>
      </div>

      <Card title={editingExpense ? "تعديل مصروف" : "إضافة مصروف"}>
        <ExpenseForm
          expenseId={editingExpense?.id}
          onSavedPath={savedPath}
          initialValues={
            editingExpense
              ? {
                  date: formatDateInput(editingExpense.date),
                  category: editingExpense.category,
                  description: editingExpense.description,
                  amount: editingExpense.amount.toString(),
                  currencyCode: editingExpense.currencyCode,
                  notes: editingExpense.notes || "",
                }
              : undefined
          }
        />
        {editingExpense ? (
          <Link href={savedPath} className="mt-3 inline-flex text-sm font-semibold text-olive hover:text-ink">
            إلغاء التعديل
          </Link>
        ) : null}
      </Card>

      <Card title="الفلاتر">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-sm font-semibold text-ink">من تاريخ</label>
            <input name="from" type="date" dir="ltr" defaultValue={from ? formatDateInput(from) : ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">إلى تاريخ</label>
            <input name="to" type="date" dir="ltr" defaultValue={to ? formatDateInput(to) : ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">نوع المصروف</label>
            <select name="category" defaultValue={category || ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2">
              <option value="">الكل</option>
              {expenseCategoryValues.map((item) => (
                <option key={item} value={item}>{expenseCategoryLabels[item]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">العملة</label>
            <select name="currencyCode" defaultValue={currencyCode || ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2">
              <option value="">الكل</option>
              {currencyValues.map((item) => (
                <option key={item} value={item}>{currencyLabels[item]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <button className="action-primary w-full sm:w-auto">تطبيق الفلاتر</button>
          </div>
        </form>
      </Card>

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
