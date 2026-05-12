import { Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import { emptyCurrencyTotals, toDecimal, type DecimalInput } from "@/lib/calculations";
import {
  type CapitalMovementTypeCode,
  type CurrencyCode,
  currencyValues,
} from "@/lib/options";
import { prisma } from "@/lib/prisma";
import { capitalCloseSchema, capitalMovementSchema, nullableString } from "@/lib/validations";
import type { z } from "zod";

type CapitalMovementInput = z.output<typeof capitalMovementSchema>;
type CapitalCloseInput = z.output<typeof capitalCloseSchema>;
export type CapitalUsdRates = Record<CurrencyCode, string>;

function normalizeMoney(value: DecimalInput, scale = 4) {
  return toDecimal(value).toDecimalPlaces(scale).toFixed(scale);
}

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

function nextDayStart(date: Date) {
  const copy = startOfDay(date);
  copy.setDate(copy.getDate() + 1);
  return copy;
}

function previousMoment(date: Date) {
  return new Date(date.getTime() - 1);
}

function totalsToJson(totals: Record<CurrencyCode, Decimal>) {
  return Object.fromEntries(
    currencyValues.map((currency) => [currency, normalizeMoney(totals[currency])]),
  ) as Record<CurrencyCode, string>;
}

function blankRateDefaults() {
  return Object.fromEntries(
    currencyValues.map((currency) => [currency, currency === "USD" ? "1" : ""]),
  ) as CapitalUsdRates;
}

export function parseCapitalCloseRates(value: Prisma.JsonValue | null | undefined) {
  const rates = blankRateDefaults();

  if (!value || Array.isArray(value) || typeof value !== "object") {
    return rates;
  }

  const record = value as Record<string, unknown>;
  for (const currency of currencyValues) {
    const rate = record[currency];
    if (typeof rate === "string" || typeof rate === "number") {
      rates[currency] = String(rate);
    }
  }

  rates.USD = "1";
  return rates;
}

export function parseCapitalCloseBalances(value: Prisma.JsonValue | null | undefined) {
  const balances = emptyCurrencyTotals();

  if (!value || Array.isArray(value) || typeof value !== "object") {
    return balances;
  }

  const record = value as Record<string, unknown>;
  for (const currency of currencyValues) {
    const amount = record[currency];
    if (typeof amount === "string" || typeof amount === "number") {
      balances[currency] = toDecimal(amount);
    }
  }

  return balances;
}

function normalizeCapitalUsdRates(input: Partial<Record<CurrencyCode, DecimalInput>>) {
  return Object.fromEntries(
    currencyValues.map((currency) => [
      currency,
      currency === "USD" ? "1.00000000" : normalizeMoney(input[currency], 8),
    ]),
  ) as CapitalUsdRates;
}

export function convertCurrencyToUsd(
  amount: DecimalInput,
  currency: CurrencyCode,
  rates: CapitalUsdRates,
) {
  const value = toDecimal(amount);

  if (currency === "USD") {
    return value;
  }

  const rate = toDecimal(rates[currency]);
  if (rate.lte(0)) {
    throw new Error(`Missing USD rate for ${currency}`);
  }

  return value.dividedBy(rate);
}

export function convertTotalsToUsd(totals: Record<CurrencyCode, Decimal>, rates: CapitalUsdRates) {
  return currencyValues
    .reduce((sum, currency) => sum.plus(convertCurrencyToUsd(totals[currency], currency, rates)), new Decimal(0))
    .toDecimalPlaces(4);
}

export function capitalWhereFromFilters(filters: {
  from?: Date;
  to?: Date;
  type?: CapitalMovementTypeCode;
  currencyCode?: CurrencyCode;
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
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.currencyCode ? { currencyCode: filters.currencyCode } : {}),
  } satisfies Prisma.CapitalMovementWhereInput;
}

export async function getCapitalMovements(filters: Parameters<typeof capitalWhereFromFilters>[0] = {}) {
  return prisma.capitalMovement.findMany({
    where: capitalWhereFromFilters(filters),
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 500,
  });
}

export async function getCapitalMovement(id: string) {
  return prisma.capitalMovement.findUnique({ where: { id } });
}

export async function createCapitalMovement(input: CapitalMovementInput) {
  return prisma.capitalMovement.create({
    data: {
      date: input.date,
      type: input.type,
      currencyCode: input.currencyCode,
      amount: normalizeMoney(input.amount),
      description: input.description,
      notes: nullableString(input.notes),
    },
  });
}

export async function updateCapitalMovement(id: string, input: CapitalMovementInput) {
  return prisma.capitalMovement.update({
    where: { id },
    data: {
      date: input.date,
      type: input.type,
      currencyCode: input.currencyCode,
      amount: normalizeMoney(input.amount),
      description: input.description,
      notes: nullableString(input.notes),
    },
  });
}

export async function deleteCapitalMovement(id: string) {
  return prisma.capitalMovement.delete({ where: { id } });
}

export function calculateCapitalSummary(
  movements: Array<{
    type: CapitalMovementTypeCode;
    currencyCode: CurrencyCode;
    amount: DecimalInput;
  }>,
) {
  const inflow = emptyCurrencyTotals();
  const outflow = emptyCurrencyTotals();
  const balance = emptyCurrencyTotals();

  for (const movement of movements) {
    const amount = toDecimal(movement.amount);

    if (movement.type === "INFLOW") {
      inflow[movement.currencyCode] = inflow[movement.currencyCode].plus(amount);
      balance[movement.currencyCode] = balance[movement.currencyCode].plus(amount);
    }

    if (movement.type === "OUTFLOW") {
      outflow[movement.currencyCode] = outflow[movement.currencyCode].plus(amount);
      balance[movement.currencyCode] = balance[movement.currencyCode].minus(amount);
    }
  }

  return { inflow, outflow, balance };
}

export async function getCapitalSummary() {
  const movements = await prisma.capitalMovement.findMany({
    select: {
      type: true,
      currencyCode: true,
      amount: true,
    },
  });

  return calculateCapitalSummary(movements);
}

export async function getCapitalCashBalances(to = new Date()) {
  const [movements, executions, expenses, commissions] = await Promise.all([
    prisma.capitalMovement.findMany({
      where: { date: { lte: to } },
      select: {
        type: true,
        currencyCode: true,
        amount: true,
      },
    }),
    prisma.transferExecution.findMany({
      where: {
        date: { lte: to },
        transaction: { status: { not: "CANCELLED" } },
      },
      select: {
        type: true,
        currency: true,
        amount: true,
      },
    }),
    prisma.expense.findMany({
      where: { date: { lte: to } },
      select: {
        currencyCode: true,
        amount: true,
      },
    }),
    prisma.commission.findMany({
      where: {
        transaction: {
          date: { lte: to },
          status: { not: "CANCELLED" },
        },
      },
      select: {
        currencyCode: true,
        amount: true,
      },
    }),
  ]);
  const balances = emptyCurrencyTotals();

  for (const movement of movements) {
    const amount = toDecimal(movement.amount);
    balances[movement.currencyCode] =
      movement.type === "INFLOW"
        ? balances[movement.currencyCode].plus(amount)
        : balances[movement.currencyCode].minus(amount);
  }

  for (const execution of executions) {
    const amount = toDecimal(execution.amount);
    balances[execution.currency] =
      execution.type === "RECEIVED"
        ? balances[execution.currency].plus(amount)
        : balances[execution.currency].minus(amount);
  }

  for (const expense of expenses) {
    balances[expense.currencyCode] = balances[expense.currencyCode].minus(expense.amount);
  }

  for (const commission of commissions) {
    balances[commission.currencyCode] = balances[commission.currencyCode].minus(commission.amount);
  }

  return balances;
}

async function sumExternalCapitalMovementsUsd(input: {
  from: Date;
  to: Date;
  rates: CapitalUsdRates;
}) {
  const movements = await prisma.capitalMovement.findMany({
    where: {
      date: {
        gte: input.from,
        lte: input.to,
      },
    },
    select: {
      type: true,
      currencyCode: true,
      amount: true,
    },
  });
  const inflow = new Decimal(0);
  const outflow = new Decimal(0);

  return movements.reduce(
    (totals, movement) => {
      const amountUsd = convertCurrencyToUsd(movement.amount, movement.currencyCode, input.rates);

      if (movement.type === "INFLOW") {
        return { ...totals, inflow: totals.inflow.plus(amountUsd) };
      }

      return { ...totals, outflow: totals.outflow.plus(amountUsd) };
    },
    { inflow, outflow },
  );
}

export async function calculateCapitalClose(input: CapitalCloseInput) {
  const closeDate = startOfDay(input.date);
  const closeEnd = endOfDay(input.date);
  const rates = normalizeCapitalUsdRates(input.usdRates as Partial<Record<CurrencyCode, DecimalInput>>);
  const previousClose = await prisma.capitalClose.findFirst({
    where: { date: { lt: closeDate } },
    orderBy: { date: "desc" },
  });
  const periodStart = previousClose ? nextDayStart(previousClose.date) : closeDate;
  const closingBalances = await getCapitalCashBalances(closeEnd);
  const capitalUsd = convertTotalsToUsd(closingBalances, rates);
  const previousCapitalUsd = previousClose
    ? toDecimal(previousClose.capitalUsd).toDecimalPlaces(4)
    : convertTotalsToUsd(await getCapitalCashBalances(previousMoment(periodStart)), rates);
  const external = await sumExternalCapitalMovementsUsd({
    from: periodStart,
    to: closeEnd,
    rates,
  });
  const externalInflowUsd = external.inflow.toDecimalPlaces(4);
  const externalOutflowUsd = external.outflow.toDecimalPlaces(4);
  const profitUsd = capitalUsd
    .minus(previousCapitalUsd)
    .minus(externalInflowUsd)
    .plus(externalOutflowUsd)
    .toDecimalPlaces(4);

  return {
    date: closeDate,
    periodStart,
    previousClose,
    usdRates: rates,
    balances: closingBalances,
    capitalUsd,
    previousCapitalUsd,
    externalInflowUsd,
    externalOutflowUsd,
    profitUsd,
  };
}

export async function createCapitalClose(input: CapitalCloseInput) {
  const close = await calculateCapitalClose(input);
  const data = {
    date: close.date,
    usdRates: close.usdRates,
    balances: totalsToJson(close.balances),
    capitalUsd: normalizeMoney(close.capitalUsd),
    previousCapitalUsd: normalizeMoney(close.previousCapitalUsd),
    externalInflowUsd: normalizeMoney(close.externalInflowUsd),
    externalOutflowUsd: normalizeMoney(close.externalOutflowUsd),
    profitUsd: normalizeMoney(close.profitUsd),
    notes: nullableString(input.notes),
  };

  return prisma.capitalClose.upsert({
    where: { date: close.date },
    create: data,
    update: {
      usdRates: data.usdRates,
      balances: data.balances,
      capitalUsd: data.capitalUsd,
      previousCapitalUsd: data.previousCapitalUsd,
      externalInflowUsd: data.externalInflowUsd,
      externalOutflowUsd: data.externalOutflowUsd,
      profitUsd: data.profitUsd,
      notes: data.notes,
    },
  });
}

export async function getCapitalCloses(take = 10) {
  return prisma.capitalClose.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take,
  });
}

export async function getLatestCapitalClose() {
  return prisma.capitalClose.findFirst({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

export async function getCapitalCloseRateDefaults() {
  const [latestClose, latestExchangeRate] = await Promise.all([
    getLatestCapitalClose(),
    prisma.exchangeRate.findFirst({ orderBy: { date: "desc" } }),
  ]);
  const rates = blankRateDefaults();

  if (latestExchangeRate) {
    rates.EGP = latestExchangeRate.usdToEgp.toString();
    rates.TRY = latestExchangeRate.usdToTry.toString();
  }

  if (latestClose) {
    return {
      ...rates,
      ...parseCapitalCloseRates(latestClose.usdRates),
      USD: "1",
    };
  }

  return rates;
}
