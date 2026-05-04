import { Eye, Pencil, Search } from "lucide-react";
import Link from "next/link";
import { CustomerForm } from "@/components/forms/customer-form";
import { DeleteCustomerButton } from "@/components/forms/delete-customer-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { currencies } from "@/lib/calculations";
import { formatMoney } from "@/lib/format";
import { currencyLabels } from "@/lib/options";
import { getCustomerListWithTransferSummary } from "@/lib/transfer-service";

type CustomersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = (await searchParams) ?? {};
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const rows = await getCustomerListWithTransferSummary(q);

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-line/80 bg-white/75 p-5 shadow-soft backdrop-blur">
        <h2 className="text-3xl font-bold text-ink">العملاء والتجار</h2>
        <p className="mt-1 text-sm text-muted">بيانات العملاء، عدد العمليات، والمبالغ المتبقية لنا أو علينا.</p>
      </div>

      <Card title="إضافة عميل أو تاجر">
        <CustomerForm />
      </Card>

      <Card title="قائمة العملاء والتجار">
        <form className="mb-4 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted" />
            <input
              name="q"
              defaultValue={q}
              placeholder="بحث بالاسم أو الهاتف"
              className="w-full rounded-lg border border-line bg-white py-2 pl-3 pr-9 outline-none focus:border-olive"
            />
          </div>
          <button className="action-primary md:w-auto">بحث</button>
        </form>

        {rows.length === 0 ? (
          <EmptyState title="لا يوجد عملاء أو تجار" />
        ) : (
          <div>
            <div className="grid gap-3 md:hidden">
              {rows.map(({ customer, operationsCount, receivedTotals, open }) => (
                <div key={customer.id} className="record-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-ink">{customer.name}</p>
                      <p className="mt-1 text-xs text-muted">{customer.phone || "بدون هاتف"}</p>
                    </div>
                    <span className="rounded-lg border border-line/70 bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm">
                      {operationsCount} عملية
                    </span>
                  </div>
                  {customer.notes ? <p className="mt-2 text-sm leading-6 text-muted">{customer.notes}</p> : null}

                  <div className="mt-3 grid gap-2 text-sm">
                    <div className="rounded-lg border border-line/70 bg-white p-3">
                      <p className="mb-2 font-semibold text-ink">إجمالي التعامل معه</p>
                      <div className="grid gap-1">
                        {currencies.map((currency) => (
                          <span key={currency}>{currencyLabels[currency]}: {formatMoney(receivedTotals[currency], currency)}</span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-line/70 bg-white p-3">
                      <p className="mb-2 font-semibold text-ink">علينا له</p>
                      <div className="grid gap-1">
                        {currencies.map((currency) => (
                          <span key={currency}>{currencyLabels[currency]}: {formatMoney(open.oweCustomer[currency], currency)}</span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-line/70 bg-white p-3">
                      <p className="mb-2 font-semibold text-ink">لنا عنده</p>
                      <div className="grid gap-1">
                        {currencies.map((currency) => (
                          <span key={currency}>{currencyLabels[currency]}: {formatMoney(open.customerOwesUs[currency], currency)}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/dashboard/customers/${customer.id}`} className="action-secondary flex-1 px-2 py-2 text-xs">
                      <Eye className="h-3.5 w-3.5" />
                      عرض
                    </Link>
                    <Link href={`/dashboard/customers/${customer.id}`} className="action-secondary flex-1 px-2 py-2 text-xs">
                      <Pencil className="h-3.5 w-3.5" />
                      تعديل
                    </Link>
                    <DeleteCustomerButton customerId={customer.id} />
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px] text-sm">
                <thead>
                  <tr className="border-b border-line text-right text-muted">
                    <th className="py-3 font-semibold">الاسم</th>
                    <th className="py-3 font-semibold">الهاتف</th>
                    <th className="py-3 font-semibold">ملاحظات</th>
                    <th className="py-3 font-semibold">عدد العمليات</th>
                    <th className="py-3 font-semibold">إجمالي التعامل معه</th>
                    <th className="py-3 font-semibold">علينا له</th>
                    <th className="py-3 font-semibold">لنا عنده</th>
                    <th className="py-3 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ customer, operationsCount, receivedTotals, open }) => (
                    <tr key={customer.id} className="border-b border-line/70">
                      <td className="py-3 font-semibold text-ink">{customer.name}</td>
                      <td className="py-3 text-muted">{customer.phone || "-"}</td>
                      <td className="py-3 text-muted">{customer.notes || "-"}</td>
                      <td className="py-3">{operationsCount}</td>
                      <td className="py-3">
                        <div className="grid gap-1">
                          {currencies.map((currency) => (
                            <span key={currency}>{currencyLabels[currency]}: {formatMoney(receivedTotals[currency], currency)}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="grid gap-1">
                          {currencies.map((currency) => (
                            <span key={currency}>{currencyLabels[currency]}: {formatMoney(open.oweCustomer[currency], currency)}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="grid gap-1">
                          {currencies.map((currency) => (
                            <span key={currency}>{currencyLabels[currency]}: {formatMoney(open.customerOwesUs[currency], currency)}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/dashboard/customers/${customer.id}`} className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm hover:bg-mint">
                            <Eye className="h-3.5 w-3.5" />
                            عرض
                          </Link>
                          <Link href={`/dashboard/customers/${customer.id}`} className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm hover:bg-mint">
                            <Pencil className="h-3.5 w-3.5" />
                            تعديل
                          </Link>
                          <DeleteCustomerButton customerId={customer.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
