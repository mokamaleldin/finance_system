import { FileText } from "lucide-react";
import Link from "next/link";
import { CustomerForm } from "@/components/forms/customer-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  currencies,
  movementTypeLabels,
  transactionStatusLabels,
} from "@/lib/calculations";
import {
  formatDate,
  formatDateInput,
  formatMoney,
  formatOptionalMoney,
  formatSignedBalance,
  parseOptionalDateParam,
} from "@/lib/format";
import { getCustomerStatement } from "@/lib/ledger";
import { currencyValues } from "@/lib/options";
import { prisma } from "@/lib/prisma";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomerDetailPage({ params, searchParams }: CustomerDetailPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const from = parseOptionalDateParam(query.from);
  const to = parseOptionalDateParam(query.to, true);
  const currency =
    typeof query.currency === "string" && currencyValues.includes(query.currency as never)
      ? query.currency
      : undefined;

  const statement = await getCustomerStatement(id, {
    from,
    to,
    currency: currency as never,
  });
  const groups = await prisma.transactionGroup.findMany({
    where: { customerId: id },
    include: { financialMovements: true },
    orderBy: { createdAt: "desc" },
  });
  const pdfParams = new URLSearchParams();
  if (from) pdfParams.set("from", formatDateInput(from));
  if (to) pdfParams.set("to", formatDateInput(to));
  if (currency) pdfParams.set("currency", currency);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-ink">{statement.customer.name}</h2>
          <p className="mt-1 text-sm text-muted">كشف حساب العميل والأرصدة الحالية حسب العملة.</p>
        </div>
        <Link
          href={`/api/statements/customer/${id}?${pdfParams.toString()}`}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 font-semibold text-white transition hover:bg-olive"
          target="_blank"
        >
          <FileText className="h-4 w-4" />
          تصدير PDF
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="بيانات العميل">
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">الهاتف</dt>
              <dd className="font-semibold text-ink">{statement.customer.phone || "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">الدولة</dt>
              <dd className="font-semibold text-ink">{statement.customer.country || "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">ملاحظات</dt>
              <dd className="font-semibold text-ink">{statement.customer.notes || "-"}</dd>
            </div>
          </dl>
        </Card>

        <Card title="الرصيد الحالي" className="lg:col-span-2">
          <div className="grid gap-3 md:grid-cols-3">
            {currencies.map((item) => (
              <div key={item} className="rounded-lg bg-mint p-4">
                <p className="text-sm font-semibold text-muted">{item}</p>
                <p className="mt-2 text-lg font-bold text-ink">
                  {formatSignedBalance(statement.currentBalance[item], item)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">
            موجب = مدين لنا، سالب = دائن علينا. كل رقم محسوب من الحركات المالية فقط.
          </p>
        </Card>
      </div>

      <Card title="تعديل بيانات العميل">
        <CustomerForm
          customerId={statement.customer.id}
          initialValues={{
            name: statement.customer.name,
            phone: statement.customer.phone || "",
            country: statement.customer.country || "",
            notes: statement.customer.notes || "",
          }}
        />
      </Card>

      <Card title="تصفية كشف الحساب">
        <form className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="text-sm font-semibold text-ink">من تاريخ</label>
            <input name="from" type="date" defaultValue={from ? formatDateInput(from) : ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">إلى تاريخ</label>
            <input name="to" type="date" defaultValue={to ? formatDateInput(to) : ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">العملة</label>
            <select name="currency" defaultValue={currency || ""} className="mt-2 w-full rounded-lg border border-line px-3 py-2">
              <option value="">كل العملات</option>
              {currencyValues.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full rounded-lg bg-ink px-4 py-2.5 font-semibold text-white">تطبيق</button>
          </div>
        </form>
      </Card>

      <Card title="الحركات المالية">
        {statement.rows.length === 0 ? (
          <EmptyState title="لا توجد حركات في هذه الفترة" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-sm">
              <thead>
                <tr className="border-b border-line text-right text-muted">
                  <th className="py-3 font-semibold">التاريخ</th>
                  <th className="py-3 font-semibold">النوع</th>
                  <th className="py-3 font-semibold">رقم الحركة</th>
                  <th className="py-3 font-semibold">الملاحظات</th>
                  <th className="py-3 font-semibold">لنا</th>
                  <th className="py-3 font-semibold">علينا</th>
                  <th className="py-3 font-semibold">الرصيد الجاري</th>
                </tr>
              </thead>
              <tbody>
                {statement.rows.map((row) => (
                  <tr key={row.movement.id} className="border-b border-line/70">
                    <td className="py-3">{formatDate(row.movement.date)}</td>
                    <td className="py-3">{movementTypeLabels[row.movement.type]}</td>
                    <td className="py-3 font-mono text-xs">{row.movement.id.slice(0, 10)}</td>
                    <td className="py-3 text-muted">{row.movement.notes || "-"}</td>
                    <td className="py-3">{row.debit.isZero() ? "-" : formatMoney(row.debit, row.movement.currency)}</td>
                    <td className="py-3">{row.credit.isZero() ? "-" : formatMoney(row.credit, row.movement.currency)}</td>
                    <td className="py-3 font-semibold">{formatSignedBalance(row.runningBalance, row.movement.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="المعاملات المرتبطة">
        {groups.length === 0 ? (
          <EmptyState title="لا توجد معاملات مرتبطة بهذا العميل" />
        ) : (
          <div className="grid gap-3">
            {groups.map((group) => (
              <details key={group.id} className="rounded-lg border border-line bg-white p-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink">{group.title || `معاملة ${group.id.slice(0, 8)}`}</p>
                      <p className="mt-1 text-sm text-muted">
                        {formatOptionalMoney(group.actualSourceAmount, group.sourceCurrency)} وارد / {formatOptionalMoney(group.actualTargetAmount, group.targetCurrency)} صادر
                      </p>
                    </div>
                    <Badge>{transactionStatusLabels[group.status]}</Badge>
                  </div>
                </summary>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-line text-right text-muted">
                        <th className="py-2">التاريخ</th>
                        <th className="py-2">النوع</th>
                        <th className="py-2">المبلغ</th>
                        <th className="py-2">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.financialMovements.map((movement) => (
                        <tr key={movement.id} className="border-b border-line/70">
                          <td className="py-2">{formatDate(movement.date)}</td>
                          <td className="py-2">{movementTypeLabels[movement.type]}</td>
                          <td className="py-2">{formatMoney(movement.amount, movement.currency)}</td>
                          <td className="py-2 text-muted">{movement.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
