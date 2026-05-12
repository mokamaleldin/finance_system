import { NextResponse } from "next/server";
import { requireApiAuth, serverErrorResponse } from "@/lib/api";
import { currencies, type DecimalInput } from "@/lib/calculations";
import { formatDate, formatMoney, parseDateParam } from "@/lib/format";
import {
  currencyLabels,
  expenseCategoryLabels,
  type CurrencyCode,
  transferStatusLabels,
  transferTypeLabels,
} from "@/lib/options";
import {
  getReportByDateRange,
  getReportDateRange,
  parseReportPeriod,
} from "@/lib/report-service";

function escapeCell(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function totalsRows(title: string, totals: Record<CurrencyCode, DecimalInput>) {
  return `
    <tr><th colspan="2">${escapeCell(title)}</th></tr>
    ${currencies.map((currency) => `<tr><td>${escapeCell(currencyLabels[currency])}</td><td>${escapeCell(formatMoney(totals[currency], currency))}</td></tr>`).join("")}
  `;
}

export async function GET(request: Request) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const params = new URL(request.url).searchParams;
  const period = parseReportPeriod(params.get("period") || undefined);
  const from = parseDateParam(params.get("from") || undefined, new Date());
  const to = parseDateParam(params.get("to") || undefined, new Date());
  const range = getReportDateRange({ period, from, to });

  try {
    const report = await getReportByDateRange(range.start, range.end);
    const html = `
      <html dir="rtl" lang="ar">
        <head><meta charset="utf-8" /></head>
        <body>
          <h1>التقارير</h1>
          <p>الفترة من ${escapeCell(formatDate(report.start))} إلى ${escapeCell(formatDate(report.end))}</p>
          <table border="1">
            <tr><th>عدد العمليات</th><th>عدد العملاء</th><th>عمليات مكتملة</th><th>عمليات مفتوحة</th></tr>
            <tr><td>${report.transactionsCount}</td><td>${report.customersCount}</td><td>${report.completedCount}</td><td>${report.openCount}</td></tr>
          </table>
          <br />
          <table border="1">
            ${totalsRows("إجمالي ما استلمناه", report.receivedTotals)}
            ${totalsRows("إجمالي ما سلمناه", report.deliveredTotals)}
            ${totalsRows("ربح العمليات", report.transactionProfitTotals)}
            ${totalsRows("المصاريف", report.expenseTotals)}
            ${totalsRows("العمولات", report.commissionTotals)}
            ${totalsRows("صافي الربح", report.netProfitTotals)}
          </table>
          <br />
          <table border="1">
            <tr><th>التاريخ</th><th>العميل</th><th>النوع</th><th>استلمنا</th><th>سلمنا</th><th>الربح</th><th>العمولة</th><th>الحالة</th></tr>
            ${report.transactions.map((transaction) => `
              <tr>
                <td>${escapeCell(formatDate(transaction.date))}</td>
                <td>${escapeCell(transaction.customerNameSnapshot)}</td>
                <td>${escapeCell(transferTypeLabels[transaction.type])}</td>
                <td>${escapeCell(formatMoney(transaction.receivedAmount, transaction.receivedCurrency))}</td>
                <td>${escapeCell(formatMoney(transaction.deliveredAmount, transaction.deliveredCurrency))}</td>
                <td>${escapeCell(formatMoney(transaction.profitAmount, transaction.profitCurrency))}</td>
                <td>${escapeCell(transaction.commission ? formatMoney(transaction.commission.amount, transaction.commission.currencyCode) : "-")}</td>
                <td>${escapeCell(transferStatusLabels[transaction.status])}</td>
              </tr>
            `).join("")}
          </table>
          <br />
          <table border="1">
            <tr><th>التاريخ</th><th>نوع المصروف</th><th>الوصف</th><th>المبلغ</th><th>ملاحظات</th></tr>
            ${report.expenses.map((expense) => `
              <tr>
                <td>${escapeCell(formatDate(expense.date))}</td>
                <td>${escapeCell(expenseCategoryLabels[expense.category])}</td>
                <td>${escapeCell(expense.description)}</td>
                <td>${escapeCell(formatMoney(expense.amount, expense.currencyCode))}</td>
                <td>${escapeCell(expense.notes || "-")}</td>
              </tr>
            `).join("")}
          </table>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`report-${range.period}.xls`)}`,
      },
    });
  } catch (error) {
    return serverErrorResponse(error, "GET /api/reports/excel");
  }
}
