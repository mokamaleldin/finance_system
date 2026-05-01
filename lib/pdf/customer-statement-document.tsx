import fs from "node:fs";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { Currency } from "@prisma/client";
import {
  currencies,
  movementTypeLabels,
} from "@/lib/calculations";
import {
  formatDate,
  formatMoney,
  formatSignedBalance,
} from "@/lib/format";
import type { getCustomerStatement } from "@/lib/ledger";

type Statement = Awaited<ReturnType<typeof getCustomerStatement>>;

const fontCandidates = [
  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
  "/System/Library/Fonts/Supplemental/Arial.ttf",
  "/System/Library/Fonts/Supplemental/Damascus.ttc",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
];

let registeredFontFamily = "Helvetica";

export function registerStatementFont() {
  if (registeredFontFamily !== "Helvetica") {
    return registeredFontFamily;
  }

  const fontPath = fontCandidates.find((candidate) => fs.existsSync(candidate));

  if (fontPath) {
    Font.register({
      family: "StatementArabic",
      src: fontPath,
    });
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
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    color: "#65736e",
  },
  grid: {
    flexDirection: "row-reverse",
    gap: 8,
    marginBottom: 12,
  },
  box: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d8dfdc",
    borderRadius: 6,
    padding: 8,
  },
  boxLabel: {
    color: "#65736e",
    marginBottom: 4,
  },
  boxValue: {
    fontSize: 11,
    fontWeight: 700,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 8,
    marginBottom: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: "#d8dfdc",
  },
  tableRow: {
    flexDirection: "row-reverse",
    borderBottomWidth: 1,
    borderBottomColor: "#d8dfdc",
    minHeight: 26,
  },
  tableHeader: {
    backgroundColor: "#e7f0ea",
    fontWeight: 700,
  },
  cell: {
    padding: 5,
    borderLeftWidth: 1,
    borderLeftColor: "#d8dfdc",
    textAlign: "right",
  },
  dateCell: { width: "10%" },
  typeCell: { width: "10%" },
  idCell: { width: "13%" },
  notesCell: { width: "25%" },
  moneyCell: { width: "14%" },
  balanceCell: { width: "14%", borderLeftWidth: 0 },
  footer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#d8dfdc",
    paddingTop: 10,
    color: "#65736e",
  },
});

function BalanceLine({
  label,
  balances,
  currency,
}: {
  label: string;
  balances: Statement["currentBalance"];
  currency?: Currency;
}) {
  const selectedCurrencies = currency ? [currency] : currencies;

  return (
    <View style={styles.box}>
      <Text style={styles.boxLabel}>{label}</Text>
      {selectedCurrencies.map((item) => (
        <Text key={item} style={styles.boxValue}>
          {formatSignedBalance(balances[item], item)}
        </Text>
      ))}
    </View>
  );
}

export function CustomerStatementDocument({
  statement,
  from,
  to,
  currency,
}: {
  statement: Statement;
  from?: Date;
  to?: Date;
  currency?: Currency;
}) {
  const fontFamily = registerStatementFont();
  const selectedCurrencies = currency ? [currency] : currencies;

  return (
    <Document title={`كشف حساب - ${statement.customer.name}`} author="دفتر الصرافة">
      <Page size="A4" style={[styles.page, { fontFamily }]}>
        <View style={styles.header}>
          <Text style={styles.title}>كشف حساب</Text>
          <Text style={styles.subtitle}>{statement.customer.name}</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>من تاريخ</Text>
            <Text style={styles.boxValue}>{from ? formatDate(from) : "بداية الحساب"}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>إلى تاريخ</Text>
            <Text style={styles.boxValue}>{to ? formatDate(to) : "حتى الآن"}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>العملة</Text>
            <Text style={styles.boxValue}>{currency || "كل العملات"}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>عدد الحركات</Text>
            <Text style={styles.boxValue}>{statement.movementCount.toString()}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <BalanceLine label="الرصيد السابق" balances={statement.previousBalance} currency={currency} />
          <BalanceLine label="الرصيد الحالي" balances={statement.currentBalance} currency={currency} />
        </View>

        <View style={styles.grid}>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>إجمالي لنا</Text>
            {selectedCurrencies.map((item) => (
              <Text key={item} style={styles.boxValue}>
                {formatMoney(statement.totals.debit[item], item)}
              </Text>
            ))}
          </View>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>إجمالي علينا</Text>
            {selectedCurrencies.map((item) => (
              <Text key={item} style={styles.boxValue}>
                {formatMoney(statement.totals.credit[item], item)}
              </Text>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>تفاصيل الحركات</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.dateCell]}>التاريخ</Text>
            <Text style={[styles.cell, styles.typeCell]}>النوع</Text>
            <Text style={[styles.cell, styles.idCell]}>رقم الحركة</Text>
            <Text style={[styles.cell, styles.notesCell]}>ملاحظات</Text>
            <Text style={[styles.cell, styles.moneyCell]}>لنا</Text>
            <Text style={[styles.cell, styles.moneyCell]}>علينا</Text>
            <Text style={[styles.cell, styles.balanceCell]}>الرصيد الجاري</Text>
          </View>

          {statement.rows.map((row) => (
            <View key={row.movement.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.cell, styles.dateCell]}>{formatDate(row.movement.date)}</Text>
              <Text style={[styles.cell, styles.typeCell]}>{movementTypeLabels[row.movement.type]}</Text>
              <Text style={[styles.cell, styles.idCell]}>{row.movement.id.slice(0, 10)}</Text>
              <Text style={[styles.cell, styles.notesCell]}>{row.movement.notes || "-"}</Text>
              <Text style={[styles.cell, styles.moneyCell]}>
                {row.debit.isZero() ? "-" : formatMoney(row.debit, row.movement.currency)}
              </Text>
              <Text style={[styles.cell, styles.moneyCell]}>
                {row.credit.isZero() ? "-" : formatMoney(row.credit, row.movement.currency)}
              </Text>
              <Text style={[styles.cell, styles.balanceCell]}>
                {formatSignedBalance(row.runningBalance, row.movement.currency)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          الرصيد الموجب يعني أن العميل مدين لنا، والرصيد السالب يعني أننا دائنون للعميل. جميع الأرصدة محسوبة من القيود المالية وليست مدخلة يدويا.
        </Text>
      </Page>
    </Document>
  );
}
