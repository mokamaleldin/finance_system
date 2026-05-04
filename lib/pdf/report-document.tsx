import fs from "node:fs";
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { currencies } from "@/lib/calculations";
import { formatDate, formatMoney } from "@/lib/format";
import {
  deliveredStatusLabels,
  expenseCategoryLabels,
  receivedStatusLabels,
  transferStatusLabels,
} from "@/lib/options";
import type { getReportByDateRange } from "@/lib/report-service";

type PeriodReport = Awaited<ReturnType<typeof getReportByDateRange>>;

const fontCandidates = [
  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
  "/System/Library/Fonts/Supplemental/Arial.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
];

let registeredFontFamily = "Helvetica";

function registerReportFont() {
  if (registeredFontFamily !== "Helvetica") return registeredFontFamily;
  const fontPath = fontCandidates.find((candidate) => fs.existsSync(candidate));

  if (fontPath) {
    Font.register({ family: "ReportArabic", src: fontPath });
    registeredFontFamily = "ReportArabic";
  }

  return registeredFontFamily;
}

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 9,
    color: "#15201d",
    backgroundColor: "#ffffff",
    textAlign: "right",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#d8dfdc",
    paddingBottom: 12,
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 6 },
  subtitle: { fontSize: 11, color: "#65736e" },
  grid: { flexDirection: "row-reverse", gap: 8, marginBottom: 12 },
  box: { flex: 1, borderWidth: 1, borderColor: "#d8dfdc", borderRadius: 6, padding: 8 },
  boxLabel: { color: "#65736e", marginBottom: 4 },
  boxValue: { fontSize: 10, fontWeight: 700, marginBottom: 2 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 8, marginBottom: 8 },
  table: { borderWidth: 1, borderColor: "#d8dfdc", marginBottom: 10 },
  tableRow: {
    flexDirection: "row-reverse",
    borderBottomWidth: 1,
    borderBottomColor: "#d8dfdc",
    minHeight: 26,
  },
  tableHeader: { backgroundColor: "#e7f0ea", fontWeight: 700 },
  cell: { padding: 5, borderLeftWidth: 1, borderLeftColor: "#d8dfdc", textAlign: "right" },
  wideCell: { width: "22%" },
  cell16: { width: "16%" },
  cell14: { width: "14%" },
  cell12: { width: "12%" },
  lastCell: { borderLeftWidth: 0 },
  footer: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#d8dfdc", paddingTop: 10, color: "#65736e" },
});

function TotalsBox({
  label,
  totals,
}: {
  label: string;
  totals: PeriodReport["receivedTotals"];
}) {
  return (
    <View style={styles.box}>
      <Text style={styles.boxLabel}>{label}</Text>
      {currencies.map((currency) => (
        <Text key={currency} style={styles.boxValue}>
          {formatMoney(totals[currency], currency)}
        </Text>
      ))}
    </View>
  );
}

export function ReportDocument({ report }: { report: PeriodReport }) {
  const fontFamily = registerReportFont();

  return (
    <Document title="تقرير الفترة" author="عمر للعملات">
      <Page size="A4" style={[styles.page, { fontFamily }]}>
        <View style={styles.header}>
          <Text style={styles.title}>التقارير</Text>
          <Text style={styles.subtitle}>
            الفترة من {formatDate(report.start)} إلى {formatDate(report.end)} - تاريخ التقرير: {formatDate(new Date())}
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.box}><Text style={styles.boxLabel}>عدد العمليات</Text><Text style={styles.boxValue}>{report.transactionsCount}</Text></View>
          <View style={styles.box}><Text style={styles.boxLabel}>عدد العملاء</Text><Text style={styles.boxValue}>{report.customersCount}</Text></View>
          <View style={styles.box}><Text style={styles.boxLabel}>عمليات مكتملة</Text><Text style={styles.boxValue}>{report.completedCount}</Text></View>
          <View style={styles.box}><Text style={styles.boxLabel}>عمليات مفتوحة</Text><Text style={styles.boxValue}>{report.openCount}</Text></View>
        </View>

        <View style={styles.grid}>
          <TotalsBox label="استلمنا" totals={report.receivedTotals} />
          <TotalsBox label="سلمنا" totals={report.deliveredTotals} />
          <TotalsBox label="ربح العمليات" totals={report.transactionProfitTotals} />
        </View>
        <View style={styles.grid}>
          <TotalsBox label="المصاريف" totals={report.expenseTotals} />
          <TotalsBox label="العمولات" totals={report.commissionTotals} />
          <TotalsBox label="صافي الربح" totals={report.netProfitTotals} />
        </View>

        <Text style={styles.sectionTitle}>العمليات</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.cell12]}>التاريخ</Text>
            <Text style={[styles.cell, styles.wideCell]}>العميل</Text>
            <Text style={[styles.cell, styles.cell16]}>استلمنا</Text>
            <Text style={[styles.cell, styles.cell16]}>سلمنا</Text>
            <Text style={[styles.cell, styles.cell14]}>الربح</Text>
            <Text style={[styles.cell, styles.cell12, styles.lastCell]}>الحالة</Text>
          </View>
          {report.transactions.slice(0, 60).map((transaction) => (
            <View key={transaction.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.cell, styles.cell12]}>{formatDate(transaction.date)}</Text>
              <Text style={[styles.cell, styles.wideCell]}>{transaction.customerNameSnapshot}</Text>
              <Text style={[styles.cell, styles.cell16]}>{formatMoney(transaction.receivedAmount, transaction.receivedCurrency)}</Text>
              <Text style={[styles.cell, styles.cell16]}>{formatMoney(transaction.deliveredAmount, transaction.deliveredCurrency)}</Text>
              <Text style={[styles.cell, styles.cell14]}>{formatMoney(transaction.profitAmount, transaction.profitCurrency)}</Text>
              <Text style={[styles.cell, styles.cell12, styles.lastCell]}>
                {receivedStatusLabels[transaction.receivedStatus]} / {deliveredStatusLabels[transaction.deliveredStatus]} / {transferStatusLabels[transaction.status]}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>المصاريف</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.cell12]}>التاريخ</Text>
            <Text style={[styles.cell, styles.cell16]}>النوع</Text>
            <Text style={[styles.cell, styles.wideCell]}>الوصف</Text>
            <Text style={[styles.cell, styles.cell16, styles.lastCell]}>المبلغ</Text>
          </View>
          {report.expenses.slice(0, 60).map((expense) => (
            <View key={expense.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.cell, styles.cell12]}>{formatDate(expense.date)}</Text>
              <Text style={[styles.cell, styles.cell16]}>{expenseCategoryLabels[expense.category]}</Text>
              <Text style={[styles.cell, styles.wideCell]}>{expense.description}</Text>
              <Text style={[styles.cell, styles.cell16, styles.lastCell]}>{formatMoney(expense.amount, expense.currencyCode)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          صافي الربح = ربح العمليات - المصاريف - العمولات، ويتم حساب كل عملة منفصلة بدون تحويل بين العملات.
        </Text>
      </Page>
    </Document>
  );
}
