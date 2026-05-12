import {
  CalendarDays,
  Eye,
  FileText,
  Phone,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { CustomerCardMenu } from "@/components/forms/customer-card-menu";
import { CustomerCreateModal } from "@/components/forms/customer-create-modal";
import { CustomerFilterForm } from "@/components/forms/customer-filter-form";
import { StatCard } from "@/components/ui/card";
import { DataError } from "@/components/ui/data-error";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAdminSession } from "@/lib/auth";
import { currencies, toDecimal } from "@/lib/calculations";
import { formatDate, formatMoney } from "@/lib/format";
import { customerKindLabels } from "@/lib/options";
import { hasPermission } from "@/lib/permissions";
import { logMissingServerEnv, logServerError } from "@/lib/server-logging";
import { getCustomerListWithTransferSummary } from "@/lib/transfer-service";

type CustomersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}` : name.slice(0, 2);
  return letters.toUpperCase();
}

function hasAnyAmount(record: Record<string, unknown>) {
  return currencies.some((currency) => toDecimal(String(record[currency] ?? "0")).gt(0));
}

function primaryMoney(record: Record<string, unknown>) {
  const currency = currencies.find((item) => toDecimal(String(record[item] ?? "0")).gt(0)) ?? "EGP";
  return formatMoney(String(record[currency] ?? "0"), currency);
}

function latestActivityDate(transactions: { date: Date | string }[]) {
  if (transactions.length === 0) return "-";

  const latest = transactions.reduce((current, transaction) => {
    const value = new Date(transaction.date);
    return value > current ? value : current;
  }, new Date(transactions[0].date));

  return formatDate(latest);
}

function getPageHref(params: Record<string, string | string[] | undefined>, page: number) {
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key === "page") continue;
    if (typeof value === "string" && value) {
      nextParams.set(key, value);
    }
  }

  if (page > 1) {
    nextParams.set("page", String(page));
  }

  const query = nextParams.toString();
  return query ? `/dashboard/customers?${query}` : "/dashboard/customers";
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const session = await requireAdminSession();
  const canCreateCustomers = hasPermission(session.role, "customers:create");
  const canWriteCustomers = hasPermission(session.role, "customers:write");
  const params = (await searchParams) ?? {};
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const sort = typeof params.sort === "string" ? params.sort : "recent";
  const balance = typeof params.balance === "string" ? params.balance : "all";
  const currentPageParam = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const currentPage = Number.isFinite(currentPageParam) && currentPageParam > 0 ? currentPageParam : 1;
  let baseRows;
  try {
    logMissingServerEnv("dashboard/customers");
    baseRows = await getCustomerListWithTransferSummary(q);
  } catch (error) {
    logServerError("dashboard/customers: failed to load customers", error);
    return (
      <div className="grid gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-ink">العملاء والتجار</h2>
            <p className="mt-1 text-sm text-muted">إدارة العملاء والتجار ومتابعة تعاملاتهم وأرصدتهم بسهولة.</p>
          </div>
          {canCreateCustomers ? <CustomerCreateModal /> : null}
        </div>
        <DataError description="تعذر تحميل العملاء أو أرصدتهم من قاعدة البيانات. راجع لوج السيرفر وتأكد من حالة Nile." />
      </div>
    );
  }
  const rows = baseRows
    .filter(({ open }) => {
      const balanceMatch =
        balance === "owe"
          ? hasAnyAmount(open.oweCustomer)
          : balance === "owed"
            ? hasAnyAmount(open.customerOwesUs)
            : true;

      return balanceMatch;
    })
    .sort((first, second) => {
      if (sort === "active") {
        return second.operationsCount - first.operationsCount;
      }

      const firstDate = first.customer.transferTransactions[0]?.date ?? first.customer.createdAt;
      const secondDate = second.customer.transferTransactions[0]?.date ?? second.customer.createdAt;
      return new Date(secondDate).getTime() - new Date(firstDate).getTime();
    });
  const activeCustomers = rows.filter(({ operationsCount }) => operationsCount > 0).length;
  const customersWithOwe = rows.filter(({ open }) => hasAnyAmount(open.oweCustomer)).length;
  const customersOweUs = rows.filter(({ open }) => hasAnyAmount(open.customerOwesUs)).length;
  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-ink">العملاء والتجار</h2>
          <p className="mt-1 text-sm text-muted">إدارة العملاء والتجار ومتابعة تعاملاتهم وأرصدتهم بسهولة.</p>
        </div>
        {canCreateCustomers ? <CustomerCreateModal /> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="عدد العملاء والتجار" value={String(rows.length)} hint="جميع الحسابات في النتائج الحالية" />
        <StatCard title="نشطون" value={String(activeCustomers)} hint="لديهم عمليات مسجلة" />
        <StatCard title="علينا العملاء" value={String(customersWithOwe)} hint="مبالغ مفتوحة علينا لهم" />
        <StatCard title="لنا عند العملاء" value={String(customersOweUs)} hint="مبالغ مفتوحة لنا عندهم" />
      </div>

      <section className="rounded-lg border border-line/80 bg-white/95 p-4 shadow-soft sm:p-5">
        <CustomerFilterForm q={q} sort={sort} balance={balance} />
      </section>

      <section className="rounded-lg border border-line/80 bg-white/95 p-4 shadow-soft sm:p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-3">
          <div>
            <h3 className="text-xl font-bold text-ink">قائمة العملاء والتجار</h3>
            <p className="mt-1 text-sm text-muted">عرض سريع لكل عميل مع أهم الأرقام والإجراءات.</p>
          </div>
          <span className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-muted">
            {rows.length} حساب
          </span>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="لا يوجد عملاء أو تجار" />
        ) : (
          <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {pagedRows.map(({ customer, operationsCount, open }) => {
              const hasOpenOwe = hasAnyAmount(open.oweCustomer);
              const hasCustomerOwe = hasAnyAmount(open.customerOwesUs);
              const note = customer.notes?.trim();

              return (
                <article
                  key={customer.id}
                  className={`relative overflow-visible rounded-lg border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft ${
                    hasOpenOwe || hasCustomerOwe ? "border-olive/25" : "border-line/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 p-4">
                    {canWriteCustomers ? <CustomerCardMenu customerId={customer.id} /> : null}
                    <div className="min-w-0 flex-1 text-center">
                      <h4 className="truncate text-base font-bold text-ink">{customer.name}</h4>
                      <span className="mt-1 inline-flex rounded-full border border-olive/15 bg-mint px-2.5 py-1 text-xs font-bold text-olive">
                        {customerKindLabels[customer.kind]}
                      </span>
                      <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted">
                        <Phone className="h-3.5 w-3.5" />
                        <span dir="ltr">{customer.phone || "بدون هاتف"}</span>
                      </p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mint text-base font-bold text-olive">
                        {initials(customer.name)}
                    </div>
                  </div>

                  {note ? <p className="mx-4 line-clamp-1 rounded-lg bg-paper/70 px-3 py-2 text-center text-xs text-muted">{note}</p> : null}

                  <div className="mt-4 grid grid-cols-2 border-y border-line/70 text-center text-sm">
                    <div className="border-l border-line/70 px-3 py-4">
                      <p className="text-xs font-semibold text-muted">علينا له</p>
                      <p className={`mt-1 text-lg font-bold ${hasOpenOwe ? "text-red-700" : "text-ink"}`} dir="ltr">
                        {hasOpenOwe ? primaryMoney(open.oweCustomer) : "0.00"}
                      </p>
                    </div>
                    <div className="px-3 py-4">
                      <p className="text-xs font-semibold text-muted">لنا عنده</p>
                      <p className={`mt-1 text-lg font-bold ${hasCustomerOwe ? "text-emerald-700" : "text-ink"}`} dir="ltr">
                        {hasCustomerOwe ? primaryMoney(open.customerOwesUs) : "0.00"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {latestActivityDate(customer.transferTransactions)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <UserRound className="h-3.5 w-3.5" />
                      {operationsCount} عملية
                    </span>
                  </div>

                  <div className="grid grid-cols-2 border-t border-line/70 bg-paper/40">
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      prefetch={false}
                      className="inline-flex items-center justify-center gap-2 border-l border-line/70 px-3 py-3 text-sm font-semibold text-ink hover:bg-mint"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      عرض
                    </Link>
                    <Link
                      href={`/api/statements/customer/${customer.id}`}
                      prefetch={false}
                      target="_blank"
                      className="inline-flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold text-ink hover:bg-mint"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      تقرير
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-line/70 pt-4 sm:flex-row">
            <p className="text-sm text-muted">
              عرض {(safePage - 1) * pageSize + 1} - {Math.min(safePage * pageSize, rows.length)} من {rows.length} عميل
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href={getPageHref(params, Math.max(1, safePage - 1))}
                prefetch={false}
                aria-disabled={safePage === 1}
                className={`rounded-lg border border-line px-3 py-2 text-sm font-semibold shadow-sm ${
                  safePage === 1 ? "pointer-events-none bg-paper text-muted" : "bg-white text-ink hover:bg-mint"
                }`}
              >
                السابق
              </Link>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <Link
                  key={page}
                  href={getPageHref(params, page)}
                  prefetch={false}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold shadow-sm ${
                    safePage === page
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-ink hover:bg-mint"
                  }`}
                >
                  {page}
                </Link>
              ))}
              <Link
                href={getPageHref(params, Math.min(totalPages, safePage + 1))}
                prefetch={false}
                aria-disabled={safePage === totalPages}
                className={`rounded-lg border border-line px-3 py-2 text-sm font-semibold shadow-sm ${
                  safePage === totalPages ? "pointer-events-none bg-paper text-muted" : "bg-white text-ink hover:bg-mint"
                }`}
              >
                التالي
              </Link>
            </div>
          </div>
          </>
        )}
      </section>
    </div>
  );
}
