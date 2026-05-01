"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { calculateCrossRate } from "@/lib/calculations";
import { exchangeRateSchema } from "@/lib/validations";

type ExchangeRateFormValues = z.input<typeof exchangeRateSchema>;

export function ExchangeRateForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    watch,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ExchangeRateFormValues>({
    resolver: zodResolver(exchangeRateSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      usdToEgp: "",
      usdToTry: "",
      notes: "",
    },
  });
  const usdToEgp = watch("usdToEgp");
  const usdToTry = watch("usdToTry");
  const crossRate = useMemo(() => {
    try {
      return calculateCrossRate(usdToEgp, usdToTry).toFixed(6);
    } catch {
      return "-";
    }
  }, [usdToEgp, usdToTry]);

  async function onSubmit(values: ExchangeRateFormValues) {
    setServerError("");
    setIsSubmitting(true);
    const response = await fetch("/api/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setServerError(payload?.message ?? "تعذر حفظ السعر");
      return;
    }

    reset({ date: new Date().toISOString().slice(0, 10), usdToEgp: "", usdToTry: "", notes: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="text-sm font-semibold text-ink">التاريخ</label>
          <input type="date" className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("date")} />
          {errors.date ? <p className="mt-1 text-sm text-red-700">{errors.date.message?.toString()}</p> : null}
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">USD / EGP</label>
          <input inputMode="decimal" className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("usdToEgp")} />
          {errors.usdToEgp ? <p className="mt-1 text-sm text-red-700">{errors.usdToEgp.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">USD / TRY</label>
          <input inputMode="decimal" className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("usdToTry")} />
          {errors.usdToTry ? <p className="mt-1 text-sm text-red-700">{errors.usdToTry.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">السعر المتقاطع</label>
          <div className="mt-2 rounded-lg border border-line bg-mint px-3 py-2 font-semibold text-ink">{crossRate}</div>
        </div>
        <div className="md:col-span-2 xl:col-span-4">
          <label className="text-sm font-semibold text-ink">ملاحظات</label>
          <input className="mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("notes")} />
        </div>
      </div>

      {serverError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-fit items-center gap-2 rounded-lg bg-ink px-4 py-2.5 font-semibold text-white transition hover:bg-olive disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        حفظ السعر
      </button>
    </form>
  );
}
