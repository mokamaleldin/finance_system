import { ExchangeRateForm } from "@/components/forms/exchange-rate-form";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatDecimal } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function RatesPage() {
  const rates = await prisma.exchangeRate.findMany({
    orderBy: { date: "desc" },
    take: 100,
  });

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">أسعار الصرف</h2>
        <p className="mt-1 text-sm text-muted">إضافة سعر الدولار مقابل الجنيه والليرة، وحساب السعر المتقاطع تلقائيا.</p>
      </div>

      <Card title="سعر يومي جديد">
        <ExchangeRateForm />
      </Card>

      <Card title="الأسعار السابقة">
        {rates.length === 0 ? (
          <EmptyState title="لا توجد أسعار مسجلة" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-right text-muted">
                  <th className="py-3 font-semibold">التاريخ</th>
                  <th className="py-3 font-semibold">USD / EGP</th>
                  <th className="py-3 font-semibold">USD / TRY</th>
                  <th className="py-3 font-semibold">Cross</th>
                  <th className="py-3 font-semibold">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.id} className="border-b border-line/70">
                    <td className="py-3">{formatDate(rate.date)}</td>
                    <td className="py-3 font-semibold">{formatDecimal(rate.usdToEgp)}</td>
                    <td className="py-3 font-semibold">{formatDecimal(rate.usdToTry)}</td>
                    <td className="py-3 font-semibold">{formatDecimal(rate.crossRate)}</td>
                    <td className="py-3 text-muted">{rate.notes || "-"}</td>
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
