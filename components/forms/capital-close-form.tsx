"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { currencyLabels, currencyValues, type CurrencyCode } from "@/lib/options";
import { capitalCloseSchema } from "@/lib/validations";

type CapitalCloseFormValues = z.input<typeof capitalCloseSchema>;

type CapitalCloseFormProps = {
  initialRates: Record<CurrencyCode, string>;
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

export function CapitalCloseForm({ initialRates }: CapitalCloseFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CapitalCloseFormValues>({
    resolver: zodResolver(capitalCloseSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      usdRates: initialRates,
      notes: "",
    },
  });
  const rateErrors = errors.usdRates as Partial<Record<CurrencyCode, { message?: string }>> | undefined;

  async function onSubmit(values: CapitalCloseFormValues) {
    setServerError("");
    setIsSubmitting(true);
    const response = await fetch("/api/capital/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setServerError(payload?.message ?? "تعذر حفظ جرد اليوم");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="text-sm font-semibold text-ink">تاريخ الجرد</label>
          <input
            type="date"
            dir="ltr"
            className="mt-2 min-h-12 w-full rounded-lg border border-line px-3 py-2 text-left outline-none focus:border-olive"
            {...register("date")}
          />
          {errors.date ? <p className="mt-1 text-sm text-red-700">{errors.date.message?.toString()}</p> : null}
        </div>

        {currencyValues
          .filter((currency) => currency !== "USD")
          .map((currency) => {
            const fieldName = `usdRates.${currency}` as const;

            return (
              <div key={currency}>
                <label className="text-sm font-semibold text-ink">سعر 1 USD مقابل {currencyLabels[currency]}</label>
                <input
                  inputMode="decimal"
                  dir="ltr"
                  className="mt-2 min-h-12 w-full rounded-lg border border-line px-3 py-2 text-left font-mono tabular-nums outline-none focus:border-olive"
                  placeholder={currency === "EUR" ? "0.92" : "0"}
                  {...register(fieldName, {
                    onChange: (event) => setValue(fieldName, toEnglishDigits(event.target.value)),
                  })}
                />
                {rateErrors?.[currency]?.message ? (
                  <p className="mt-1 text-sm text-red-700">{rateErrors[currency]?.message}</p>
                ) : null}
              </div>
            );
          })}

        <input type="hidden" value="1" {...register("usdRates.USD")} />

        <div className="md:col-span-2 xl:col-span-4">
          <label className="text-sm font-semibold text-ink">ملاحظات الجرد</label>
          <input
            className="mt-2 min-h-12 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive"
            placeholder="اختياري"
            {...register("notes")}
          />
        </div>
      </div>

      {serverError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="submit" disabled={isSubmitting} className="action-primary w-full sm:w-fit">
          <Calculator className="h-4 w-4" />
          {isSubmitting ? "جار الجرد..." : "جرد اليوم"}
        </button>
      </div>
    </form>
  );
}
