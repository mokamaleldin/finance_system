"use client";

import { CalendarDays, Filter, RotateCcw, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import {
  capitalMovementTypeLabels,
  capitalMovementTypeValues,
  currencyLabels,
  currencyValues,
  type CapitalMovementTypeCode,
  type CurrencyCode,
} from "@/lib/options";

type CapitalFilterFormProps = {
  from: string;
  to: string;
  type: CapitalMovementTypeCode | "";
  currencyCode: CurrencyCode | "";
};

export function CapitalFilterForm({ from, to, type, currencyCode }: CapitalFilterFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("editId");

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => router.replace(nextUrl, { scroll: false }));
  }, [pathname, router, searchParams]);

  return (
    <div className={`grid gap-3 lg:grid-cols-[repeat(4,minmax(160px,1fr))_auto] ${isPending ? "opacity-80" : ""}`}>
      <label className="relative">
        <span className="mb-2 block text-sm font-semibold text-ink">من تاريخ</span>
        <CalendarDays className="pointer-events-none absolute right-3 top-[46px] h-4 w-4 text-muted" />
        <input
          type="date"
          dir="ltr"
          defaultValue={from}
          onChange={(event) => updateParams({ from: event.target.value })}
          className="min-h-12 w-full rounded-lg border border-line bg-white py-2 pl-3 pr-10 text-left outline-none transition focus:border-olive"
        />
      </label>

      <label className="relative">
        <span className="mb-2 block text-sm font-semibold text-ink">إلى تاريخ</span>
        <CalendarDays className="pointer-events-none absolute right-3 top-[46px] h-4 w-4 text-muted" />
        <input
          type="date"
          dir="ltr"
          defaultValue={to}
          onChange={(event) => updateParams({ to: event.target.value })}
          className="min-h-12 w-full rounded-lg border border-line bg-white py-2 pl-3 pr-10 text-left outline-none transition focus:border-olive"
        />
      </label>

      <label className="relative">
        <span className="mb-2 block text-sm font-semibold text-ink">نوع الحركة</span>
        <Filter className="pointer-events-none absolute right-3 top-[46px] h-4 w-4 text-muted" />
        <select
          defaultValue={type}
          onChange={(event) => updateParams({ type: event.target.value })}
          className="min-h-12 w-full appearance-none rounded-lg border border-line bg-white py-2 pl-3 pr-10 text-sm font-semibold outline-none transition focus:border-olive"
        >
          <option value="">الكل</option>
          {capitalMovementTypeValues.map((item) => (
            <option key={item} value={item}>
              {capitalMovementTypeLabels[item]}
            </option>
          ))}
        </select>
      </label>

      <label className="relative">
        <span className="mb-2 block text-sm font-semibold text-ink">العملة</span>
        <WalletCards className="pointer-events-none absolute right-3 top-[46px] h-4 w-4 text-muted" />
        <select
          defaultValue={currencyCode}
          onChange={(event) => updateParams({ currencyCode: event.target.value })}
          className="min-h-12 w-full appearance-none rounded-lg border border-line bg-white py-2 pl-3 pr-10 text-sm font-semibold outline-none transition focus:border-olive"
        >
          <option value="">الكل</option>
          {currencyValues.map((item) => (
            <option key={item} value={item}>
              {currencyLabels[item]}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-end">
        <Link href="/dashboard/capital" prefetch={false} className="action-secondary min-h-12 w-full px-5 lg:w-auto">
          <RotateCcw className="h-4 w-4" />
          إعادة ضبط
        </Link>
      </div>
    </div>
  );
}
