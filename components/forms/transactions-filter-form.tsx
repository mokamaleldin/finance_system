"use client";

import { RotateCcw } from "lucide-react";
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

  return (
    <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-6 ${isPending ? "opacity-80" : ""}`}>
      <div className="min-w-0">
        <label className="text-sm font-semibold text-ink">من تاريخ</label>
        <input
          name="from"
          type="date"
          dir="ltr"
          value={from}
          onChange={(event) => updateParams({ from: event.target.value })}
          className="mt-2 w-full rounded-lg border border-line px-3 py-2"
        />
      </div>
      <div className="min-w-0">
        <label className="text-sm font-semibold text-ink">إلى تاريخ</label>
        <input
          name="to"
          type="date"
          dir="ltr"
          value={to}
          onChange={(event) => updateParams({ to: event.target.value })}
          className="mt-2 w-full rounded-lg border border-line px-3 py-2"
        />
      </div>
      <div className="min-w-0">
        <label className="text-sm font-semibold text-ink">العميل/التاجر</label>
        <select
          name="customerId"
          value={customerId}
          onChange={(event) => updateParams({ customerId: event.target.value })}
          className="mt-2 w-full rounded-lg border border-line px-3 py-2"
        >
          <option value="">الكل</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0">
        <label className="text-sm font-semibold text-ink">نوع العملية</label>
        <select
          name="type"
          value={type}
          onChange={(event) => updateParams({ type: event.target.value })}
          className="mt-2 w-full rounded-lg border border-line px-3 py-2"
        >
          <option value="">الكل</option>
          {transferTypeValues.map((item) => (
            <option key={item} value={item}>
              {transferTypeLabels[item]}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0">
        <label className="text-sm font-semibold text-ink">حالة العملية</label>
        <select
          name="status"
          value={status}
          onChange={(event) => updateParams({ status: event.target.value })}
          className="mt-2 w-full rounded-lg border border-line px-3 py-2"
        >
          <option value="">غير الملغاة</option>
          {transferStatusValues.map((item) => (
            <option key={item} value={item}>
              {transferStatusLabels[item]}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0">
        <label className="text-sm font-semibold text-ink">العملة</label>
        <select
          name="currency"
          value={currency}
          onChange={(event) => updateParams({ currency: event.target.value })}
          className="mt-2 w-full rounded-lg border border-line px-3 py-2"
        >
          <option value="">الكل</option>
          {currencyValues.map((item) => (
            <option key={item} value={item}>
              {currencyLabels[item]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end sm:col-span-2 lg:col-span-6 lg:justify-start">
        <Link href="/dashboard/transactions" className="action-secondary w-full sm:w-[220px]">
          <RotateCcw className="h-4 w-4" />
          إعادة ضبط
        </Link>
      </div>
    </div>
  );
}
