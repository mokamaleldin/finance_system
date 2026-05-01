import { Eye, Pencil, Search } from "lucide-react";
import Link from "next/link";
import { CustomerForm } from "@/components/forms/customer-form";
import { DeleteCustomerButton } from "@/components/forms/delete-customer-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { currencies } from "@/lib/calculations";
import { formatMoney } from "@/lib/format";
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
      <div>
        <h2 className="text-2xl font-bold text-ink">العملاء والتجار</h2>
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
          <button className="rounded-lg bg-ink px-4 py-2 font-semibold text-white">بحث</button>
        </form>

        {rows.length === 0 ? (
          <EmptyState title="لا يوجد عملاء أو تجار" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="border-b border-line text-right text-muted">
                  <th className="py-3 font-semibold">الاسم</th>
                  <th className="py-3 font-semibold">الهاتف</th>
                  <th className="py-3 font-semibold">ملاحظات</th>
                  <th className="py-3 font-semibold">عدد العمليات</th>
                  <th className="py-3 font-semibold">إجمالي التعامل معه</th>
                  <th className="py-3 font-semibold">باقي علينا</th>
                  <th className="py-3 font-semibold">باقي لنا</th>
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
                          <span key={currency}>{formatMoney(receivedTotals[currency], currency)}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="grid gap-1">
                        {currencies.map((currency) => (
                          <span key={currency}>{formatMoney(open.oweCustomer[currency], currency)}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="grid gap-1">
                        {currencies.map((currency) => (
                          <span key={currency}>{formatMoney(open.customerOwesUs[currency], currency)}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/dashboard/customers/${customer.id}`} className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs font-semibold text-ink hover:bg-mint">
                          <Eye className="h-3.5 w-3.5" />
                          عرض
                        </Link>
                        <Link href={`/dashboard/customers/${customer.id}`} className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs font-semibold text-ink hover:bg-mint">
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
        )}
      </Card>
    </div>
  );
}
