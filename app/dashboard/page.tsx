import { CheckCircle2, Clock3, PlusCircle, Receipt, Users2 } from "lucide-react";
import Link from "next/link";
import { BarChart, MiniLineChart } from "@/components/ui/analytics-charts";
import { Card, StatCard } from "@/components/ui/card";
import { currencies } from "@/lib/calculations";
import { formatDate, formatDecimal, formatMoney } from "@/lib/format";
import { currencyLabels } from "@/lib/options";
import { getDashboardTrends, getTodayDashboard } from "@/lib/transfer-service";


function buildTrend(today: number, yesterday: number) {
  if (yesterday === 0) {
    if (today === 0) {
      return { label: "مثل أمس", direction: "neutral" as const };
    }

    return { label: "أفضل من أمس", direction: "up" as const };
  }

  const diff = today - yesterday;
  if (diff === 0) {
    return { label: "مثل أمس", direction: "neutral" as const };
  }
  const percent = Math.abs(diff) / yesterday * 100;
  const label = diff >= 0 ? "أفضل من أمس" : "أقل من أمس";
  const value = `${diff >= 0 ? "+" : "-"}${percent.toFixed(1)}%`;

  return {
    label,
    value,
    direction: diff > 0 ? ("up" as const) : ("down" as const),
  };
}

export default async function DashboardPage() {
  const trendDays = 7;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const [dashboard, yesterdayDashboard, trends] = await Promise.all([
    getTodayDashboard(today),
    getTodayDashboard(yesterday),
    getDashboardTrends(trendDays, today),
  ]);

  const dayFormatter = new Intl.DateTimeFormat("ar", { weekday: "short" });

  const transactionsTrendPoints = trends.map((day) => ({
    label: dayFormatter.format(day.date),
    value: day.transactionsCount,
    tooltipLabel: formatDate(day.date),
    tooltipValue: `${formatDecimal(day.transactionsCount)} عملية`,
  }));

  const profitTrendPoints = trends.map((day) => ({
    label: dayFormatter.format(day.date),
    value: String(day.profitTotal),
    tooltipLabel: formatDate(day.date),
    tooltipValue: day.profitCurrency
      ? `${formatMoney(day.profitTotal, day.profitCurrency)} (${currencyLabels[day.profitCurrency]})`
      : `${formatDecimal(day.profitTotal)} ${day.mixedProfitCurrencies ? "(عملات متعددة)" : ""}`.trim(),
    tooltipLines: !day.profitCurrency
      ? currencies
          .map((currency) => ({
            currency,
            value: day.profitTotalsByCurrency[currency],
          }))
          .filter((item) => item.value.gt(0))
          .map((item) => `${formatMoney(item.value, item.currency)} (${currencyLabels[item.currency]})`)
      : undefined,
  }));

  const totalTransactions = trends.reduce((sum, day) => sum + day.transactionsCount, 0);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line/80 bg-white/75 p-5 shadow-soft backdrop-blur">
        <div>
          <h2 className="text-3xl font-bold text-ink">لوحة التحكم</h2>
          <p className="mt-1 text-sm text-muted">أرقام اليوم فقط حسب تاريخ العملية.</p>
        </div>
        <Link
          href="/dashboard/transactions/new"
          className="action-primary w-full sm:w-auto"
        >
          <PlusCircle className="h-4 w-4" />
          معاملة جديدة
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="عدد عمليات اليوم"
          value={formatDecimal(dashboard.transactionsCount)}
          icon={<Receipt className="h-5 w-5" />}
          trend={buildTrend(dashboard.transactionsCount, yesterdayDashboard.transactionsCount)}
        />
        <StatCard
          title="عملاء اليوم"
          value={formatDecimal(dashboard.customersCount)}
          icon={<Users2 className="h-5 w-5" />}
          trend={buildTrend(dashboard.customersCount, yesterdayDashboard.customersCount)}
        />
        <StatCard
          title="عمليات مكتملة"
          value={formatDecimal(dashboard.completedCount)}
          icon={<CheckCircle2 className="h-5 w-5" />}
          trend={buildTrend(dashboard.completedCount, yesterdayDashboard.completedCount)}
        />
        <StatCard
          title="عمليات مفتوحة"
          value={formatDecimal(dashboard.openCount)}
          icon={<Clock3 className="h-5 w-5" />}
          trend={buildTrend(dashboard.openCount, yesterdayDashboard.openCount)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <BarChart
          title="ربح اليوم لكل عملة"
          subtitle="بدون تحويل بين العملات"
          points={currencies.map((currency) => ({
            label: currency,
            value: String(dashboard.profitTotals[currency]),
            tooltipLabel: currencyLabels[currency],
            tooltipValue: formatMoney(dashboard.profitTotals[currency], currency),
          }))}
          hoverable
        />
        <Card title="إجمالي ما استلمناه اليوم">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2">
                <span>{currencyLabels[currency]}</span>
                <strong>{formatMoney(dashboard.receivedTotals[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card title="إجمالي ما سلمناه اليوم">
          <div className="grid gap-2">
            {currencies.map((currency) => (
              <div key={currency} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2">
                <span>{currencyLabels[currency]}</span>
                <strong>{formatMoney(dashboard.deliveredTotals[currency], currency)}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line/80 bg-white/80 p-4 shadow-soft">
        <div>
          <h3 className="text-lg font-bold text-ink">ملخص آخر 7 أيام</h3>
          <p className="mt-1 text-xs text-muted">عرض الاتجاهات لآخر أسبوع.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart
          title={`عدد العمليات آخر ${trendDays} يوم`}
          subtitle="حسب كل يوم"
          points={transactionsTrendPoints}
          summary={formatDecimal(totalTransactions)}
          hoverable
          highlightIndex={transactionsTrendPoints.length - 1}
        />
        <MiniLineChart
          title={`الربح خلال آخر ${trendDays} يوم`}
          subtitle="حرّك المؤشر لمعرفة ربح كل يوم"
          points={profitTrendPoints}
          tone="gold"
          hoverable
        />
      </div>
    </div>
  );
}
