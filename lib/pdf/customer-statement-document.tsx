import fs from "node:fs";
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { currencies } from "@/lib/calculations";
import { formatDate, formatMoney } from "@/lib/format";
import {
  deliveredStatusLabels,
  receivedStatusLabels,
  transferStatusLabels,
  transferTypeLabels,
} from "@/lib/options";
import type { getCustomerTransferSummary } from "@/lib/transfer-service";

type CustomerTransferSummary = Awaited<ReturnType<typeof getCustomerTransferSummary>>;

const fontCandidates = [
  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
  "/System/Library/Fonts/Supplemental/Arial.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
];

let registeredFontFamily = "Helvetica";

export function registerStatementFont() {
  if (registeredFontFamily !== "Helvetica") return registeredFontFamily;
  const fontPath = fontCandidates.find((candidate) => fs.existsSync(candidate));

  if (fontPath) {
    Font.register({ family: "StatementArabic", src: fontPath });
    registeredFontFamily = "StatementArabic";
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
  table: { borderWidth: 1, borderColor: "#d8dfdc" },
  tableRow: {
    flexDirection: "row-reverse",
    borderBottomWidth: 1,
    borderBottomColor: "#d8dfdc",
    minHeight: 28,
  },
  tableHeader: { backgroundColor: "#e7f0ea", fontWeight: 700 },
  cell: { padding: 5, borderLeftWidth: 1, borderLeftColor: "#d8dfdc", textAlign: "right" },
  dateCell: { width: "11%" },
  customerCell: { width: "17%" },
  typeCell: { width: "15%" },
  moneyCell: { width: "16%" },
  statusCell: { width: "17%" },
  lastCell: { borderLeftWidth: 0 },
  footer: { marginTop: 14, borderTopWidth: 1, borderTopColor: "#d8dfdc", paddingTop: 10, color: "#65736e" },
});

function TotalsBox({
  label,
  totals,
}: {
  label: string;
  totals: CustomerTransferSummary["receivedTotals"];
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

export function CustomerStatementDocument({ summary }: { summary: CustomerTransferSummary }) {
  const fontFamily = registerStatementFont();

  return (
    <Document title={`تقرير عميل - ${summary.customer.name}`} author="نظام التحويل">
      <Page size="A4" style={[styles.page, { fontFamily }]}>
        <View style={styles.header}>
          <Text style={styles.title}>تقرير عميل</Text>
          <Text style={styles.subtitle}>{summary.customer.name}</Text>
        </View>

        <View style={styles.grid}>
          <TotalsBox label="إجمالي ما استلمناه" totals={summary.receivedTotals} />
          <TotalsBox label="إجمالي ما سلمناه" totals={summary.deliveredTotals} />
          <TotalsBox label="إجمالي الربح" totals={summary.profitTotals} />
        </View>

        <View style={styles.grid}>
          <TotalsBox label="باقي علينا" totals={summary.open.oweCustomer} />
          <TotalsBox label="باقي لنا" totals={summary.open.customerOwesUs} />
        </View>

        <Text style={styles.sectionTitle}>العمليات</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.dateCell]}>التاريخ</Text>
            <Text style={[styles.cell, styles.customerCell]}>العميل</Text>
            <Text style={[styles.cell, styles.typeCell]}>النوع</Text>
            <Text style={[styles.cell, styles.moneyCell]}>استلمنا</Text>
            <Text style={[styles.cell, styles.moneyCell]}>سلمنا / مطلوب</Text>
            <Text style={[styles.cell, styles.moneyCell]}>الربح</Text>
            <Text style={[styles.cell, styles.statusCell, styles.lastCell]}>الحالة</Text>
          </View>

          {summary.transactions.map((transaction) => (
            <View key={transaction.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.cell, styles.dateCell]}>{formatDate(transaction.date)}</Text>
              <Text style={[styles.cell, styles.customerCell]}>{transaction.customerNameSnapshot}</Text>
              <Text style={[styles.cell, styles.typeCell]}>{transferTypeLabels[transaction.type]}</Text>
              <Text style={[styles.cell, styles.moneyCell]}>
                {formatMoney(transaction.receivedAmount, transaction.receivedCurrency)}
              </Text>
              <Text style={[styles.cell, styles.moneyCell]}>
                {formatMoney(transaction.deliveredAmount, transaction.deliveredCurrency)}
              </Text>
              <Text style={[styles.cell, styles.moneyCell]}>
                {formatMoney(transaction.profitAmount, transaction.profitCurrency)}
              </Text>
              <Text style={[styles.cell, styles.statusCell, styles.lastCell]}>
                {receivedStatusLabels[transaction.receivedStatus]} / {deliveredStatusLabels[transaction.deliveredStatus]} / {transferStatusLabels[transaction.status]}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          هذا التقرير مبني على العمليات المسجلة وأسعار كل عملية وقت حفظها. لا يتم استخدام سعر صرف عام أو متغير.
        </Text>
      </Page>
    </Document>
  );
}
