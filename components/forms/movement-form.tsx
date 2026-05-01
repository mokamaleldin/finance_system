"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { currencyLabels, currencyValues, movementTypeLabels, movementTypeValues } from "@/lib/options";
import { movementSchema } from "@/lib/validations";

type MovementFormValues = z.input<typeof movementSchema>;

type Option = {
  id: string;
  name?: string;
  title?: string | null;
  customerId?: string;
};

type MovementFormProps = {
  customers: Option[];
  transactionGroups: Option[];
  movementId?: string;
  initialValues?: Partial<MovementFormValues>;
  redirectTo?: string;
};

export function MovementForm({
  customers,
  transactionGroups,
  movementId,
  initialValues,
  redirectTo = "/dashboard/movements",
}: MovementFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      customerId: initialValues?.customerId ?? "",
      date: initialValues?.date ?? new Date().toISOString().slice(0, 10),
      type: initialValues?.type ?? "RECEIVED",
      currency: initialValues?.currency ?? "USD",
      amount: initialValues?.amount ?? "",
      rate: initialValues?.rate ?? "",
      transactionGroupId: initialValues?.transactionGroupId ?? "",
      notes: initialValues?.notes ?? "",
    },
  });
  const selectedCustomerId = watch("customerId");
  const visibleGroups = useMemo(
    () =>
      selectedCustomerId
        ? transactionGroups.filter((group) => group.customerId === selectedCustomerId)
        : transactionGroups,
    [selectedCustomerId, transactionGroups],
  );

  async function onSubmit(values: MovementFormValues) {
    setServerError("");
    setIsSubmitting(true);
    const response = await fetch(movementId ? `/api/movements/${movementId}` : "/api/movements", {
      method: movementId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setServerError(payload?.message ?? "تعذر حفظ الحركة");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="text-sm font-semibold text-ink">العميل</label>
          <select className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("customerId")}>
            <option value="">بدون عميل</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">التاريخ</label>
          <input type="date" className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("date")} />
          {errors.date ? <p className="mt-1 text-sm text-red-700">{errors.date.message?.toString()}</p> : null}
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">نوع الحركة</label>
          <select className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("type")}>
            {movementTypeValues.map((type) => (
              <option key={type} value={type}>
                {movementTypeLabels[type]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">الوارد يقلل الرصيد، والصادر يزيده.</p>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">العملة</label>
          <select className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("currency")}>
            {currencyValues.map((currency) => (
              <option key={currency} value={currency}>
                {currencyLabels[currency]} ({currency})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">المبلغ</label>
          <input inputMode="decimal" className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("amount")} />
          {errors.amount ? <p className="mt-1 text-sm text-red-700">{errors.amount.message}</p> : null}
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">السعر</label>
          <input inputMode="decimal" className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("rate")} />
        </div>

        <div className="md:col-span-2 xl:col-span-3">
          <label className="text-sm font-semibold text-ink">المعاملة المرتبطة</label>
          <select className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("transactionGroupId")}>
            <option value="">بدون معاملة</option>
            {visibleGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.title || `معاملة ${group.id.slice(0, 8)}`}
              </option>
            ))}
          </select>
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
        {movementId ? "حفظ التعديل" : "حفظ الحركة"}
      </button>
    </form>
  );
}
