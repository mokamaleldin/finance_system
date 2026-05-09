"use client";

import { ArrowUpDown, CalendarDays, RotateCcw, UserRound, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import {
  currencyLabels,
  currencyValues,
  transferStatusLabels,
  transferStatusValues,
  transferTypeLabels,
  transferTypeValues,
} from "@/lib/options";

type TransactionsFilterFormProps = {
  customers: Array<{ id: string; name: string }>;
  defaultValues: {
    from?: string;
    to?: string;
    customerId?: string;
    type?: string;
    status?: string;
    currency?: string;
  };
};

export function TransactionsFilterForm({ customers, defaultValues }: TransactionsFilterFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      startTransition(() => router.replace(nextUrl, { scroll: false }));
    },
    [pathname, router, searchParams],
  );

  const from = searchParams.get("from") ?? defaultValues.from ?? "";
  const to = searchParams.get("to") ?? defaultValues.to ?? "";
  const customerId = searchParams.get("customerId") ?? defaultValues.customerId ?? "";
  const type = searchParams.get("type") ?? defaultValues.type ?? "";
  const status = searchParams.get("status") ?? defaultValues.status ?? "";
  const currency = searchParams.get("currency") ?? defaultValues.currency ?? "";

  const fieldClassName =
    "min-h-12 w-full appearance-none rounded-lg border border-line bg-white py-2 pl-3 pr-10 text-sm font-semibold outline-none transition focus:border-olive";

  return (
    <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[repeat(6,minmax(135px,1fr))_auto] ${isPending ? "opacity-80" : ""}`}>
      <label className="relative min-w-0">
        <span className="mb-2 block text-sm font-semibold text-ink">من تاريخ</span>
        <CalendarDays className="pointer-events-none absolute right-3 top-[46px] h-4 w-4 text-muted" />
        <input
          type="date"
          dir="ltr"
          value={from}
          onChange={(event) => updateParams({ from: event.target.value })}
          className={fieldClassName}
        />
      </label>
      <label className="relative min-w-0">
        <span className="mb-2 block text-sm font-semibold text-ink">إلى تاريخ</span>
        <CalendarDays className="pointer-events-none absolute right-3 top-[46px] h-4 w-4 text-muted" />
        <input
          type="date"
          dir="ltr"
          value={to}
          onChange={(event) => updateParams({ to: event.target.value })}
          className={fieldClassName}
        />
      </label>
      <label className="relative min-w-0">
        <span className="mb-2 block text-sm font-semibold text-ink">العميل/التاجر</span>
        <UserRound className="pointer-events-none absolute right-3 top-[46px] h-4 w-4 text-muted" />
        <select
          value={customerId}
          onChange={(event) => updateParams({ customerId: event.target.value })}
          className={fieldClassName}
        >
          <option value="">الكل</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </label>
      <label className="relative min-w-0">
        <span className="mb-2 block text-sm font-semibold text-ink">نوع العملية</span>
        <ArrowUpDown className="pointer-events-none absolute right-3 top-[46px] h-4 w-4 text-muted" />
        <select
          value={type}
          onChange={(event) => updateParams({ type: event.target.value })}
          className={fieldClassName}
        >
          <option value="">الكل</option>
          {transferTypeValues.map((item) => (
            <option key={item} value={item}>
              {transferTypeLabels[item]}
            </option>
          ))}
        </select>
      </label>
      <label className="relative min-w-0">
        <span className="mb-2 block text-sm font-semibold text-ink">حالة العملية</span>
        <ArrowUpDown className="pointer-events-none absolute right-3 top-[46px] h-4 w-4 text-muted" />
        <select
          value={status}
          onChange={(event) => updateParams({ status: event.target.value })}
          className={fieldClassName}
        >
          <option value="">غير الملغاة</option>
          {transferStatusValues.map((item) => (
            <option key={item} value={item}>
              {transferStatusLabels[item]}
            </option>
          ))}
        </select>
      </label>
      <label className="relative min-w-0">
        <span className="mb-2 block text-sm font-semibold text-ink">العملة</span>
        <WalletCards className="pointer-events-none absolute right-3 top-[46px] h-4 w-4 text-muted" />
        <select
          value={currency}
          onChange={(event) => updateParams({ currency: event.target.value })}
          className={fieldClassName}
        >
          <option value="">الكل</option>
          {currencyValues.map((item) => (
            <option key={item} value={item}>
              {currencyLabels[item]}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end md:col-span-2 xl:col-span-3 2xl:col-span-1">
        <Link href="/dashboard/transactions" prefetch={false} className="action-secondary min-h-12 w-full px-5">
          <RotateCcw className="h-4 w-4" />
          إعادة ضبط
        </Link>
      </div>
    </div>
  );
}
