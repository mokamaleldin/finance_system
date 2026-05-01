"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { currencyLabels, currencyValues } from "@/lib/options";
import { transactionGroupSchema } from "@/lib/validations";

type TransactionGroupFormValues = z.input<typeof transactionGroupSchema>;

type CustomerOption = {
  id: string;
  name: string;
};

export function TransactionGroupForm({ customers }: { customers: CustomerOption[] }) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionGroupFormValues>({
    resolver: zodResolver(transactionGroupSchema),
    defaultValues: {
      customerId: "",
      title: "",
      costRate: "",
      sellRate: "",
      sourceCurrency: "",
      targetCurrency: "",
      expectedSourceAmount: "",
      expectedTargetAmount: "",
      notes: "",
    },
  });

  async function onSubmit(values: TransactionGroupFormValues) {
    setServerError("");
    setIsSubmitting(true);
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setServerError(payload?.message ?? "تعذر حفظ المعاملة");
      return;
    }

    reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="text-sm font-semibold text-ink">العميل</label>
          <select className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("customerId")}>
            <option value="">اختر العميل</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          {errors.customerId ? <p className="mt-1 text-sm text-red-700">{errors.customerId.message}</p> : null}
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">عنوان المعاملة</label>
          <input className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("title")} />
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">سعر التكلفة</label>
          <input inputMode="decimal" className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("costRate")} />
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">سعر التنفيذ</label>
          <input inputMode="decimal" className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("sellRate")} />
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">عملة المصدر</label>
          <select className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("sourceCurrency")}>
            <option value="">غير محدد</option>
            {currencyValues.map((currency) => (
              <option key={currency} value={currency}>
                {currencyLabels[currency]} ({currency})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">عملة الهدف</label>
          <select className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("targetCurrency")}>
            <option value="">غير محدد</option>
            {currencyValues.map((currency) => (
              <option key={currency} value={currency}>
                {currencyLabels[currency]} ({currency})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">المبلغ المتوقع من العميل</label>
          <input inputMode="decimal" className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("expectedSourceAmount")} />
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">المبلغ المتوقع دفعه</label>
          <input inputMode="decimal" className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("expectedTargetAmount")} />
        </div>

        <div className="md:col-span-2 xl:col-span-3">
          <label className="text-sm font-semibold text-ink">ملاحظات</label>
          <textarea rows={3} className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("notes")} />
        </div>
      </div>

      {serverError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-fit items-center gap-2 rounded-lg bg-ink px-4 py-2.5 font-semibold text-white transition hover:bg-olive disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        إنشاء المعاملة
      </button>
    </form>
  );
}
