import { Search } from "lucide-react";
import Link from "next/link";
import { CustomerForm } from "@/components/forms/customer-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { currencies } from "@/lib/calculations";
import { formatDate, formatSignedBalance } from "@/lib/format";
import { getCustomerBalances } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";

type CustomersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = (await searchParams) ?? {};
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const rows = await Promise.all(
    customers.map(async (customer) => ({
      customer,
      balances: await getCustomerBalances(customer.id),
    })),
  );

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">العملاء</h2>
        <p className="mt-1 text-sm text-muted">إضافة العملاء ومراجعة أرصدتهم المحسوبة من القيود.</p>
      </div>

      <Card title="إضافة عميل">
        <CustomerForm />
      </Card>

      <Card title="قائمة العملاء">
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
          <EmptyState title="لا يوجد عملاء" description="ابدأ بإضافة عميل جديد من النموذج بالأعلى." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-line text-right text-muted">
                  <th className="py-3 font-semibold">الاسم</th>
                  <th className="py-3 font-semibold">الهاتف</th>
                  <th className="py-3 font-semibold">الدولة</th>
                  <th className="py-3 font-semibold">الأرصدة</th>
                  <th className="py-3 font-semibold">تاريخ الإضافة</th>
                  <th className="py-3 font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ customer, balances }) => (
                  <tr key={customer.id} className="border-b border-line/70">
                    <td className="py-3 font-semibold text-ink">{customer.name}</td>
                    <td className="py-3 text-muted">{customer.phone || "-"}</td>
                    <td className="py-3 text-muted">{customer.country || "-"}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {currencies.map((currency) => (
                          <Badge key={currency}>{formatSignedBalance(balances[currency], currency)}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-muted">{formatDate(customer.createdAt)}</td>
                    <td className="py-3">
                      <Link className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink hover:bg-mint" href={`/dashboard/customers/${customer.id}`}>
                        عرض
                      </Link>
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
