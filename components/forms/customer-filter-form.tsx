"use client";

import { ArrowUpDown, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

type CustomerFilterFormProps = {
  q: string;
  sort: string;
  balance: string;
};

export function CustomerFilterForm({ q, sort, balance }: CustomerFilterFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(q);
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("country");
    params.delete("page");

    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== "all" && value !== "recent") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => router.replace(nextUrl, { scroll: false }));
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const currentQuery = searchParams.get("q") ?? "";
    const nextQuery = query.trim();
    if (nextQuery === currentQuery) return;

    const timeout = window.setTimeout(() => updateParams({ q: nextQuery }), 350);
    return () => window.clearTimeout(timeout);
  }, [query, searchParams, updateParams]);

  return (
    <div className={`grid gap-3 lg:grid-cols-[minmax(240px,1fr)_190px_190px_auto] ${isPending ? "opacity-80" : ""}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          className="min-h-12 w-full rounded-lg border border-line bg-white py-2 pl-3 pr-10 outline-none transition focus:border-olive"
        />
      </div>

      <label className="relative">
        <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <select
          value={balance}
          onChange={(event) => updateParams({ balance: event.target.value })}
          className="min-h-12 w-full appearance-none rounded-lg border border-line bg-white py-2 pl-3 pr-10 text-sm font-semibold outline-none transition focus:border-olive"
        >
          <option value="all">خيارات</option>
          <option value="owe">علينا لهم</option>
          <option value="owed">لنا عندهم</option>
        </select>
      </label>

      <label className="relative">
        <ArrowUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <select
          value={sort}
          onChange={(event) => updateParams({ sort: event.target.value })}
          className="min-h-12 w-full appearance-none rounded-lg border border-line bg-white py-2 pl-3 pr-10 text-sm font-semibold outline-none transition focus:border-olive"
        >
          <option value="recent">الأحدث تفاعلا</option>
          <option value="active">الأكثر عمليات</option>
        </select>
      </label>

      <Link href="/dashboard/customers" className="action-secondary min-h-12 px-5">
        <RotateCcw className="h-4 w-4" />
        إعادة ضبط
      </Link>
    </div>
  );
}
