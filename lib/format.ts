import { Currency } from "@prisma/client";
import Decimal from "decimal.js";
import { currencyLabels, getBalanceStatus, toDecimal, type DecimalInput } from "@/lib/calculations";

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
  numberingSystem: "latn",
});

const moneyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  numberingSystem: "latn",
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  numberingSystem: "latn",
});

export function formatDecimal(value: DecimalInput) {
  return numberFormatter.format(toDecimal(value).toNumber());
}

export function formatMoney(value: DecimalInput, currency: Currency) {
  return `${moneyFormatter.format(toDecimal(value).toNumber())} ${currency}`;
}

export function formatCurrencyName(currency: Currency) {
  return currencyLabels[currency] ?? currency;
}

export function formatSignedBalance(value: DecimalInput, currency: Currency) {
  const balance = toDecimal(value);
  return `${formatMoney(balance.abs(), currency)} - ${getBalanceStatus(balance)}`;
}

export function formatDate(value: Date | string) {
  return dateFormatter.format(new Date(value));
}

export function formatDateInput(value: Date | string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatOptionalMoney(value: DecimalInput, currency?: Currency | null) {
  if (value === null || value === undefined) {
    return "-";
  }

  return currency ? formatMoney(value, currency) : formatDecimal(value);
}

export function decimalToJson(value: DecimalInput) {
  return toDecimal(value).toString();
}

export function decimalRecordToJson(record: Record<Currency, Decimal>) {
  return Object.fromEntries(
    Object.entries(record).map(([currency, value]) => [currency, value.toString()]),
  ) as Record<Currency, string>;
}

export function parseDateParam(value: string | string[] | undefined, fallback: Date) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) {
    return fallback;
  }

  const date = new Date(`${candidate}T00:00:00`);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export function parseOptionalDateParam(value: string | string[] | undefined, endOfDay = false) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) {
    return undefined;
  }

  const date = new Date(`${candidate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

export function getDateRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}
