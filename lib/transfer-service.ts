import { Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import { calculateTransfer, deriveTransferStatus, getRemainingSide } from "@/lib/transfer-calculations";
import { emptyCurrencyTotals, toDecimal, toMoneyString } from "@/lib/calculations";
import { getDateRange } from "@/lib/format";
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

function normalizeMoney(value: Decimal.Value, scale = 4) {
  return toDecimal(value).toDecimalPlaces(scale).toFixed(scale);
}

async function resolveCustomer(input: TransferInput) {
  if (input.customerId) {
    const customer = await prisma.customer.findUniqueOrThrow({
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
    const customer = await prisma.customer.create({
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

export async function createTransferTransaction(input: TransferInput) {
  const customer = await resolveCustomer(input);
  const calculation = calculateTransfer({
    type: input.type,
    receivedCurrency: input.receivedCurrency,
    receivedAmount: input.receivedAmount,
    deliveredCurrency: input.deliveredCurrency,
    usdToEgp: input.usdToEgp,
    usdToTry: input.usdToTry,
    customerRate: input.customerRate,
    deliveredAmountOverride: input.deliveredAmount || undefined,
  });
  const status = deriveTransferStatus(input.receivedStatus, input.deliveredStatus);

  return prisma.transferTransaction.create({
    data: {
      date: input.date,
      ...customer,
      type: input.type,
      receivedCurrency: input.receivedCurrency,
      receivedAmount: normalizeMoney(input.receivedAmount),
      deliveredCurrency: input.deliveredCurrency,
      deliveredAmount: normalizeMoney(calculation.deliveredAmount),
      usdToEgp: normalizeMoney(input.usdToEgp, 8),
      usdToTry: normalizeMoney(input.usdToTry, 8),
      theoreticalRate: normalizeMoney(calculation.theoreticalRate, 8),
      customerRate: normalizeMoney(input.customerRate, 8),
      profitCurrency: calculation.profitCurrency,
      profitAmount: normalizeMoney(calculation.profitAmount),
      receivedStatus: input.receivedStatus,
      deliveredStatus: input.deliveredStatus,
      status,
      isDeliveredAmountManual: Boolean(input.deliveredAmount),
      notes: nullableString(input.notes),
    },
    include: transactionInclude,
  });
}

export async function updateTransferTransaction(id: string, input: TransferInput) {
  const existing = await prisma.transferTransaction.findUniqueOrThrow({
    where: { id },
  });
  const customer = await resolveCustomer(input);
  const calculation = calculateTransfer({
    type: input.type,
    receivedCurrency: input.receivedCurrency,
    receivedAmount: input.receivedAmount,
    deliveredCurrency: input.deliveredCurrency,
    usdToEgp: input.usdToEgp,
    usdToTry: input.usdToTry,
    customerRate: input.customerRate,
    deliveredAmountOverride: input.deliveredAmount || undefined,
  });
  const status = deriveTransferStatus(
    input.receivedStatus,
    input.deliveredStatus,
    existing.status === "CANCELLED",
  );

  return prisma.transferTransaction.update({
    where: { id },
    data: {
      date: input.date,
      ...customer,
      type: input.type,
      receivedCurrency: input.receivedCurrency,
      receivedAmount: normalizeMoney(input.receivedAmount),
      deliveredCurrency: input.deliveredCurrency,
      deliveredAmount: normalizeMoney(calculation.deliveredAmount),
      usdToEgp: normalizeMoney(input.usdToEgp, 8),
      usdToTry: normalizeMoney(input.usdToTry, 8),
      theoreticalRate: normalizeMoney(calculation.theoreticalRate, 8),
      customerRate: normalizeMoney(input.customerRate, 8),
      profitCurrency: calculation.profitCurrency,
      profitAmount: normalizeMoney(calculation.profitAmount),
      receivedStatus: input.receivedStatus,
      deliveredStatus: input.deliveredStatus,
      status,
      isDeliveredAmountManual: Boolean(input.deliveredAmount),
      notes: nullableString(input.notes),
    },
    include: transactionInclude,
  });
}

export async function cancelTransferTransaction(id: string) {
  return prisma.transferTransaction.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
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
      status: deriveTransferStatus(receivedStatus, deliveredStatus),
    },
  });
}

export function transferWhereFromFilters(filters: {
  from?: Date;
  to?: Date;
  customerId?: string;
  type?: TransferTypeCode;
  currency?: CurrencyCode;
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
