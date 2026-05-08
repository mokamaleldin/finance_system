import { Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import {
  calculateCommissionAmount,
  getCommissionCurrency,
  type CommissionInput,
} from "@/lib/commission";
import { calculateTransfer, deriveTransferStatus, getRemainingSide } from "@/lib/transfer-calculations";
import { emptyCurrencyTotals, toDecimal, toMoneyString } from "@/lib/calculations";
import { formatDateInput, getDateRange } from "@/lib/format";
import {
  currencyValues,
  type CurrencyCode,
  type DeliveredStatusCode,
  type ReceivedStatusCode,
  type TransferStatusCode,
  type TransferTypeCode,
} from "@/lib/options";
import { prisma } from "@/lib/prisma";
import { nullableString, transferTransactionSchema } from "@/lib/validations";
import type { z } from "zod";

type TransferInput = z.output<typeof transferTransactionSchema>;

const transactionInclude = {
  customer: true,
  commission: true,
} satisfies Prisma.TransferTransactionInclude;

export type TransferWithCustomer = Prisma.TransferTransactionGetPayload<{
  include: typeof transactionInclude;
}>;

type TransferSummaryTransaction = {
  receivedStatus: ReceivedStatusCode;
  deliveredStatus: DeliveredStatusCode;
  status: TransferStatusCode;
  receivedCurrency: CurrencyCode;
  receivedAmount: Decimal.Value;
  deliveredCurrency: CurrencyCode;
  deliveredAmount: Decimal.Value;
};

type PrismaWriteClient = typeof prisma | Prisma.TransactionClient;

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function normalizeMoney(value: Decimal.Value | null | undefined | { toString(): string }, scale = 4) {
  return toDecimal(value).toDecimalPlaces(scale).toFixed(scale);
}

function normalizeOptionalMoney(value: Decimal.Value | null | undefined | { toString(): string }, scale = 4) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return normalizeMoney(value, scale);
}

function normalizeUsdRates(input: TransferInput) {
  const rates: Partial<Record<CurrencyCode, string>> = { USD: "1.00000000" };

  for (const currency of currencyValues) {
    const raw =
      input.usdRates?.[currency] ||
      (currency === "EGP" ? input.usdToEgp : "") ||
      (currency === "TRY" ? input.usdToTry : "");

    if (raw !== undefined && raw !== null && raw !== "") {
      rates[currency] = normalizeMoney(raw, 8);
    }
  }

  return rates;
}

async function resolveCustomer(input: TransferInput, db: PrismaWriteClient = prisma) {
  if (input.customerId) {
    const customer = await db.customer.findUniqueOrThrow({
      where: { id: input.customerId },
    });

    return {
      customerId: customer.id,
      customerNameSnapshot: customer.name,
      customerPhoneSnapshot: customer.phone,
    };
  }

  const name = input.quickCustomerName || input.customerName;

  if (input.createCustomer) {
    const customer = await db.customer.create({
      data: {
        name,
        phone: nullableString(input.phone),
        notes: "تم إنشاؤه من صفحة معاملة جديدة",
      },
    });

    return {
      customerId: customer.id,
      customerNameSnapshot: customer.name,
      customerPhoneSnapshot: customer.phone,
    };
  }

  return {
    customerId: null,
    customerNameSnapshot: name,
    customerPhoneSnapshot: nullableString(input.phone),
  };
}

async function syncTransactionCommission(
  db: PrismaWriteClient,
  transactionId: string,
  input: CommissionInput,
  context: {
    receivedAmount: Decimal.Value;
    receivedCurrency: CurrencyCode;
    profitAmount: Decimal.Value;
    profitCurrency: CurrencyCode;
  },
) {
  if (!input.commissionEnabled) {
    await db.commission.deleteMany({ where: { transactionId } });
    return;
  }

  const amount = calculateCommissionAmount(input, context);
  const currencyCode = getCommissionCurrency(input, context);
  const value = normalizeMoney(input.commissionValue ?? 0, 8);
  const data = {
    personName: nullableString(input.commissionPersonName),
    type: input.commissionType ?? "FIXED",
    base: input.commissionBase ?? "RECEIVED_AMOUNT",
    value,
    amount: normalizeMoney(amount),
    currencyCode,
    notes: nullableString(input.commissionNotes),
  };

  await db.commission.upsert({
    where: { transactionId },
    create: {
      transactionId,
      ...data,
    },
    update: data,
  });
}

export async function createTransferTransaction(input: TransferInput) {
  const usdRates = normalizeUsdRates(input);
  const calculation = calculateTransfer({
    type: input.type,
    receivedCurrency: input.receivedCurrency,
    receivedAmount: input.receivedAmount,
    deliveredCurrency: input.deliveredCurrency,
    usdRates,
    costRate: input.costRate,
    customerRate: input.customerRate,
    deliveredAmountOverride: input.deliveredAmount || undefined,
  });
  const status = deriveTransferStatus(input.receivedStatus, input.deliveredStatus);

  return prisma.$transaction(async (db) => {
    const customer = await resolveCustomer(input, db);
    const transaction = await db.transferTransaction.create({
      data: {
        date: input.date,
        ...customer,
        type: input.type,
        receiveLocation: nullableString(input.receiveLocation),
        deliverLocation: nullableString(input.deliverLocation),
        receivedCurrency: input.receivedCurrency,
        receivedAmount: normalizeMoney(input.receivedAmount),
        deliveredCurrency: input.deliveredCurrency,
        deliveredAmount: normalizeMoney(calculation.deliveredAmount),
        usdRates,
        usdToEgp: normalizeOptionalMoney(usdRates.EGP, 8),
        usdToTry: normalizeOptionalMoney(usdRates.TRY, 8),
        rateBaseCurrency: calculation.rateBaseCurrency,
        rateQuoteCurrency: calculation.rateQuoteCurrency,
        costRate: normalizeMoney(calculation.costRate, 8),
        theoreticalRate: normalizeMoney(calculation.costRate, 8),
        customerRate: normalizeMoney(calculation.customerRate, 8),
        rateDifference: normalizeMoney(calculation.rateDifference, 8),
        profitCurrency: calculation.profitCurrency,
        profitAmount: normalizeMoney(calculation.profitAmount),
        receivedStatus: input.receivedStatus,
        deliveredStatus: input.deliveredStatus,
        status,
        isDeliveredAmountManual: Boolean(input.deliveredAmount),
        notes: nullableString(input.notes),
      },
    });

    await syncTransactionCommission(db, transaction.id, input, {
      receivedAmount: input.receivedAmount,
      receivedCurrency: input.receivedCurrency,
      profitAmount: calculation.profitAmount,
      profitCurrency: calculation.profitCurrency,
    });

    return db.transferTransaction.findUniqueOrThrow({
      where: { id: transaction.id },
      include: transactionInclude,
    });
  });
}

export async function updateTransferTransaction(id: string, input: TransferInput) {
  const existing = await prisma.transferTransaction.findUniqueOrThrow({
    where: { id },
  });
  const usdRates = normalizeUsdRates(input);
  const calculation = calculateTransfer({
    type: input.type,
    receivedCurrency: input.receivedCurrency,
    receivedAmount: input.receivedAmount,
    deliveredCurrency: input.deliveredCurrency,
    usdRates,
    costRate: input.costRate,
    customerRate: input.customerRate,
    deliveredAmountOverride: input.deliveredAmount || undefined,
  });
  const status = deriveTransferStatus(
    input.receivedStatus,
    input.deliveredStatus,
    existing.status === "CANCELLED",
  );

  return prisma.$transaction(async (db) => {
    const customer = await resolveCustomer(input, db);
    await db.transferTransaction.update({
      where: { id },
      data: {
        date: input.date,
        ...customer,
        type: input.type,
        receiveLocation: nullableString(input.receiveLocation),
        deliverLocation: nullableString(input.deliverLocation),
        receivedCurrency: input.receivedCurrency,
        receivedAmount: normalizeMoney(input.receivedAmount),
        deliveredCurrency: input.deliveredCurrency,
        deliveredAmount: normalizeMoney(calculation.deliveredAmount),
        usdRates,
        usdToEgp: normalizeOptionalMoney(usdRates.EGP, 8),
        usdToTry: normalizeOptionalMoney(usdRates.TRY, 8),
        rateBaseCurrency: calculation.rateBaseCurrency,
        rateQuoteCurrency: calculation.rateQuoteCurrency,
        costRate: normalizeMoney(calculation.costRate, 8),
        theoreticalRate: normalizeMoney(calculation.costRate, 8),
        customerRate: normalizeMoney(calculation.customerRate, 8),
        rateDifference: normalizeMoney(calculation.rateDifference, 8),
        profitCurrency: calculation.profitCurrency,
        profitAmount: normalizeMoney(calculation.profitAmount),
        receivedStatus: input.receivedStatus,
        deliveredStatus: input.deliveredStatus,
        status,
        isDeliveredAmountManual: Boolean(input.deliveredAmount),
        notes: nullableString(input.notes),
      },
    });

    await syncTransactionCommission(db, id, input, {
      receivedAmount: input.receivedAmount,
      receivedCurrency: input.receivedCurrency,
      profitAmount: calculation.profitAmount,
      profitCurrency: calculation.profitCurrency,
    });

    return db.transferTransaction.findUniqueOrThrow({
      where: { id },
      include: transactionInclude,
    });
  });
}

export async function cancelTransferTransaction(id: string, cancellationReason?: string | null) {
  return prisma.transferTransaction.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: nullableString(cancellationReason),
    },
  });
}

export async function setTransferStepStatus(
  id: string,
  data: Partial<{
    receivedStatus: ReceivedStatusCode;
    deliveredStatus: DeliveredStatusCode;
  }>,
) {
  const current = await prisma.transferTransaction.findUniqueOrThrow({ where: { id } });
  const receivedStatus = data.receivedStatus ?? (current.receivedStatus as ReceivedStatusCode);
  const deliveredStatus = data.deliveredStatus ?? (current.deliveredStatus as DeliveredStatusCode);

  return prisma.transferTransaction.update({
    where: { id },
    data: {
      ...data,
      status: deriveTransferStatus(receivedStatus, deliveredStatus, current.status === "CANCELLED"),
    },
  });
}

export function transferWhereFromFilters(filters: {
  from?: Date;
  to?: Date;
  customerId?: string;
  type?: TransferTypeCode;
  currency?: CurrencyCode;
  receivedCurrency?: CurrencyCode;
  deliveredCurrency?: CurrencyCode;
  status?: TransferStatusCode;
  receivedStatus?: ReceivedStatusCode;
  deliveredStatus?: DeliveredStatusCode;
}) {
  return {
    ...(filters.from || filters.to
      ? {
          date: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.receivedCurrency ? { receivedCurrency: filters.receivedCurrency } : {}),
    ...(filters.deliveredCurrency ? { deliveredCurrency: filters.deliveredCurrency } : {}),
    ...(filters.status ? { status: filters.status } : { status: { not: "CANCELLED" as const } }),
    ...(filters.receivedStatus ? { receivedStatus: filters.receivedStatus } : {}),
    ...(filters.deliveredStatus ? { deliveredStatus: filters.deliveredStatus } : {}),
    ...(filters.currency
      ? {
          OR: [
            { receivedCurrency: filters.currency },
            { deliveredCurrency: filters.currency },
            { profitCurrency: filters.currency },
          ],
        }
      : {}),
  } satisfies Prisma.TransferTransactionWhereInput;
}

export async function getTransferTransactions(filters: Parameters<typeof transferWhereFromFilters>[0] = {}) {
  return prisma.transferTransaction.findMany({
    where: transferWhereFromFilters(filters),
    include: transactionInclude,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 300,
  });
}

export async function getTodayDashboard(today = new Date()) {
  const { start, end } = getDateRange(today);
  const transactions = await prisma.transferTransaction.findMany({
    where: {
      date: { gte: start, lte: end },
      status: { not: "CANCELLED" },
    },
    include: transactionInclude,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const receivedTotals = emptyCurrencyTotals();
  const deliveredTotals = emptyCurrencyTotals();
  const profitTotals = emptyCurrencyTotals();
  const customerIds = new Set<string>();
  const customerNames = new Set<string>();

  for (const transaction of transactions) {
    receivedTotals[transaction.receivedCurrency] =
      receivedTotals[transaction.receivedCurrency].plus(transaction.receivedAmount);
    deliveredTotals[transaction.deliveredCurrency] =
      deliveredTotals[transaction.deliveredCurrency].plus(transaction.deliveredAmount);
    profitTotals[transaction.profitCurrency] =
      profitTotals[transaction.profitCurrency].plus(transaction.profitAmount);

    if (transaction.customerId) {
      customerIds.add(transaction.customerId);
    } else {
      customerNames.add(transaction.customerNameSnapshot);
    }
  }

  return {
    transactions,
    latestTransactions: transactions.slice(0, 8),
    receivedTotals,
    deliveredTotals,
    profitTotals,
    transactionsCount: transactions.length,
    customersCount: customerIds.size + customerNames.size,
    completedCount: transactions.filter((item) => item.status === "COMPLETED").length,
    openCount: transactions.filter((item) => item.status === "OPEN").length,
  };
}

export type DashboardTrendDay = {
  date: Date;
  transactionsCount: number;
  profitTotal: Decimal;
  profitTotalsByCurrency: Record<CurrencyCode, Decimal>;
  profitCurrency: CurrencyCode | null;
  mixedProfitCurrencies: boolean;
};

export async function getDashboardTrends(days = 7, today = new Date()) {
  const safeDays = Math.max(1, Math.min(days, 31));
  const end = endOfDay(today);
  const start = startOfDay(new Date(today));
  start.setDate(start.getDate() - (safeDays - 1));

  const transactions = await prisma.transferTransaction.findMany({
    where: {
      date: { gte: start, lte: end },
      status: { not: "CANCELLED" },
    },
    select: {
      date: true,
      profitAmount: true,
      profitCurrency: true,
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  const daysList: DashboardTrendDay[] = [];
  const map = new Map<string, { index: number; currencies: Set<CurrencyCode> }>();

  for (let offset = 0; offset < safeDays; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const key = formatDateInput(date);

    map.set(key, { index: daysList.length, currencies: new Set() });
    daysList.push({
      date,
      transactionsCount: 0,
      profitTotal: new Decimal(0),
      profitTotalsByCurrency: emptyCurrencyTotals(),
      profitCurrency: null,
      mixedProfitCurrencies: false,
    });
  }

  for (const transaction of transactions) {
    const key = formatDateInput(transaction.date);
    const entry = map.get(key);
    if (!entry) {
      continue;
    }

    const day = daysList[entry.index];
    day.transactionsCount += 1;
    day.profitTotal = day.profitTotal.plus(transaction.profitAmount);
    day.profitTotalsByCurrency[transaction.profitCurrency] =
      day.profitTotalsByCurrency[transaction.profitCurrency].plus(transaction.profitAmount);
    entry.currencies.add(transaction.profitCurrency);
  }

  for (const entry of map.values()) {
    const day = daysList[entry.index];
    const currencies = Array.from(entry.currencies);
    if (currencies.length === 1) {
      day.profitCurrency = currencies[0];
    }
    if (currencies.length > 1) {
      day.mixedProfitCurrencies = true;
    }
  }

  return daysList;
}

export function calculateOpenSummary(transactions: TransferSummaryTransaction[]) {
  const oweCustomer = emptyCurrencyTotals();
  const customerOwesUs = emptyCurrencyTotals();

  for (const transaction of transactions) {
    const side = getRemainingSide({
      receivedStatus: transaction.receivedStatus,
      deliveredStatus: transaction.deliveredStatus,
      status: transaction.status,
    });

    if (side === "OWE_CUSTOMER") {
      oweCustomer[transaction.deliveredCurrency] =
        oweCustomer[transaction.deliveredCurrency].plus(transaction.deliveredAmount);
    }

    if (side === "CUSTOMER_OWES_US") {
      customerOwesUs[transaction.receivedCurrency] =
        customerOwesUs[transaction.receivedCurrency].plus(transaction.receivedAmount);
    }
  }

  return { oweCustomer, customerOwesUs };
}

export async function getOpenTransfers() {
  const transactions = await prisma.transferTransaction.findMany({
    where: { status: "OPEN" },
    include: transactionInclude,
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  return {
    transactions,
    ...calculateOpenSummary(transactions),
  };
}

export async function getCustomerTransferSummary(customerId: string) {
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
  const transactions = await prisma.transferTransaction.findMany({
    where: {
      customerId,
      status: { not: "CANCELLED" },
    },
    include: transactionInclude,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  const receivedTotals = emptyCurrencyTotals();
  const deliveredTotals = emptyCurrencyTotals();
  const profitTotals = emptyCurrencyTotals();

  for (const transaction of transactions) {
    receivedTotals[transaction.receivedCurrency] =
      receivedTotals[transaction.receivedCurrency].plus(transaction.receivedAmount);
    deliveredTotals[transaction.deliveredCurrency] =
      deliveredTotals[transaction.deliveredCurrency].plus(transaction.deliveredAmount);
    profitTotals[transaction.profitCurrency] =
      profitTotals[transaction.profitCurrency].plus(transaction.profitAmount);
  }

  return {
    customer,
    transactions,
    receivedTotals,
    deliveredTotals,
    profitTotals,
    open: calculateOpenSummary(transactions.filter((item) => item.status === "OPEN")),
  };
}

export async function getCustomerListWithTransferSummary(search?: string) {
  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      transferTransactions: {
        where: { status: { not: "CANCELLED" } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return customers.map((customer) => {
    const receivedTotals = emptyCurrencyTotals();
    const deliveredTotals = emptyCurrencyTotals();
    const open = calculateOpenSummary(
      customer.transferTransactions.filter((item) => item.status === "OPEN") as TransferSummaryTransaction[],
    );
    let operationsAmount = new Decimal(0);

    for (const transaction of customer.transferTransactions) {
      receivedTotals[transaction.receivedCurrency] =
        receivedTotals[transaction.receivedCurrency].plus(transaction.receivedAmount);
      deliveredTotals[transaction.deliveredCurrency] =
        deliveredTotals[transaction.deliveredCurrency].plus(transaction.deliveredAmount);
      operationsAmount = operationsAmount.plus(transaction.receivedAmount);
    }

    return {
      customer,
      operationsCount: customer.transferTransactions.length,
      operationsAmount,
      receivedTotals,
      deliveredTotals,
      open,
    };
  });
}

export function totalsToRows(totals: Record<CurrencyCode, Decimal>) {
  return currencyValues.map((currency) => ({
    currency,
    amount: totals[currency],
    amountString: toMoneyString(totals[currency]),
  }));
}
