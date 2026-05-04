"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  currencyLabels,
  currencyValues,
  expenseCategoryLabels,
  expenseCategoryValues,
} from "@/lib/options";
import { expenseSchema } from "@/lib/validations";

type ExpenseFormValues = z.input<typeof expenseSchema>;

type ExpenseFormProps = {
  expenseId?: string;
  initialValues?: Partial<ExpenseFormValues>;
  onSavedPath?: string;
};

function toEnglishDigits(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";

  return value
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace("٫", ".")
    .replace("٬", "");
}

export function ExpenseForm({ expenseId, initialValues, onSavedPath = "/dashboard/expenses" }: ExpenseFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: initialValues?.date ?? new Date().toISOString().slice(0, 10),
      category: initialValues?.category ?? "OTHER",
      description: initialValues?.description ?? "",
      amount: initialValues?.amount ?? "",
      currencyCode: initialValues?.currencyCode ?? "EGP",
      notes: initialValues?.notes ?? "",
    },
  });

  async function onSubmit(values: ExpenseFormValues) {
    setServerError("");
    setIsSubmitting(true);
    const response = await fetch(expenseId ? `/api/expenses/${expenseId}` : "/api/expenses", {
      method: expenseId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setServerError(payload?.message ?? "تعذر حفظ المصروف");
      return;
    }

    router.push(onSavedPath);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="text-sm font-semibold text-ink">التاريخ</label>
          <input
            type="date"
            dir="ltr"
            className="mt-2 min-h-12 w-full rounded-lg border border-line px-3 py-2 text-left outline-none focus:border-olive"
            {...register("date")}
          />
          {errors.date ? <p className="mt-1 text-sm text-red-700">{errors.date.message}</p> : null}
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">نوع المصروف</label>
          <select className="mt-2 min-h-12 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("category")}>
            {expenseCategoryValues.map((category) => (
              <option key={category} value={category}>
                {expenseCategoryLabels[category]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">الوصف</label>
          <input
            className="mt-2 min-h-12 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive"
            placeholder="مثال: إنترنت المكتب"
            {...register("description")}
          />
          {errors.description ? <p className="mt-1 text-sm text-red-700">{errors.description.message}</p> : null}
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">المبلغ</label>
          <input
            inputMode="decimal"
            dir="ltr"
            className="mt-2 min-h-12 w-full rounded-lg border border-line px-3 py-2 text-left font-mono tabular-nums outline-none focus:border-olive"
            placeholder="1000"
            {...register("amount", {
              onChange: (event) => setValue("amount", toEnglishDigits(event.target.value)),
            })}
          />
          {errors.amount ? <p className="mt-1 text-sm text-red-700">{errors.amount.message}</p> : null}
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">العملة</label>
          <select className="mt-2 min-h-12 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("currencyCode")}>
            {currencyValues.map((currency) => (
              <option key={currency} value={currency}>
                {currencyLabels[currency]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">ملاحظات</label>
          <input
            className="mt-2 min-h-12 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive"
            {...register("notes")}
          />
        </div>
      </div>

      {serverError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="action-primary w-full sm:w-fit"
      >
        <Save className="h-4 w-4" />
        {expenseId ? "حفظ التعديل" : "إضافة المصروف"}
      </button>
    </form>
  );
}
