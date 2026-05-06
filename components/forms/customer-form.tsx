"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { customerSchema } from "@/lib/validations";

type CustomerFormValues = z.input<typeof customerSchema>;

type CustomerFormProps = {
  customerId?: string;
  initialValues?: Partial<CustomerFormValues>;
  onSavedPath?: string;
  onSaved?: () => void;
};

export function CustomerForm({ customerId, initialValues, onSavedPath, onSaved }: CustomerFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      phone: initialValues?.phone ?? "",
      country: initialValues?.country ?? "",
      notes: initialValues?.notes ?? "",
    },
  });

  async function onSubmit(values: CustomerFormValues) {
    setServerError("");
    setIsSubmitting(true);
    const response = await fetch(customerId ? `/api/customers/${customerId}` : "/api/customers", {
      method: customerId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setServerError(payload?.message ?? "تعذر حفظ العميل");
      return;
    }

    if (!customerId) {
      reset();
    }

    router.refresh();
    onSaved?.();
    if (onSavedPath) {
      router.push(onSavedPath);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-ink">اسم العميل</label>
          <input className="mt-2 min-h-12 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("name")} />
          {errors.name ? <p className="mt-1 text-sm text-red-700">{errors.name.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">الهاتف</label>
          <input dir="ltr" inputMode="tel" className="mt-2 min-h-12 w-full rounded-lg border border-line px-3 py-2 text-left outline-none focus:border-olive" {...register("phone")} />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">الدولة</label>
          <input className="mt-2 min-h-12 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("country")} />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">ملاحظات</label>
          <input className="mt-2 min-h-12 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("notes")} />
        </div>
      </div>

      {serverError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="action-primary w-full sm:w-fit"
      >
        <Save className="h-4 w-4" />
        {customerId ? "حفظ التعديل" : "إضافة العميل"}
      </button>
    </form>
  );
}
