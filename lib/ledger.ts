import { Currency, MovementType, type FinancialMovement, type TransactionGroup } from "@prisma/client";
import Decimal from "decimal.js";
import {
  calculateBalancesFromMovements,
  calculateTransactionProfit,
  deriveTransactionStatus,
  emptyCurrencyTotals,
  movementBalanceEffect,
  splitEffectDebitCredit,
  sumMovementsByTypeAndCurrency,
  toDecimal,
  toMoneyString,
} from "@/lib/calculations";
import { customerSelect } from "@/lib/customer-select";
import { getDateRange } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export type StatementFilters = {
  from?: Date;
  to?: Date;
  currency?: Currency;
};

export function buildMovementWhere(filters: {
  from?: Date;
  to?: Date;
  customerId?: string;
  type?: MovementType;
  currency?: Currency;
}) {
  return {
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.currency ? { currency: filters.currency } : {}),
    ...(filters.from || filters.to
      ? {
          date: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };
}

export async function getCustomerBalances(customerId: string, to?: Date) {
  const movements = await prisma.financialMovement.findMany({
    where: {
      customerId,
      ...(to ? { date: { lte: to } } : {}),
    },
    select: {
      type: true,
      currency: true,
      amount: true,
    },
  });

  return calculateBalancesFromMovements(movements);
}

export async function getCustomerStatement(customerId: string, filters: StatementFilters = {}) {
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { id: customerId },
    select: customerSelect,
  });

  const periodWhere = buildMovementWhere({
    customerId,
    from: filters.from,
    to: filters.to,
    currency: filters.currency,
  });

  const previousMovements = filters.from
    ? await prisma.financialMovement.findMany({
        where: {
          customerId,
          ...(filters.currency ? { currency: filters.currency } : {}),
          date: { lt: filters.from },
        },
        orderBy: { date: "asc" },
      })
    : [];

  const movements = await prisma.financialMovement.findMany({
    where: periodWhere,
    include: {
      transactionGroup: true,
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  const runningByCurrency = calculateBalancesFromMovements(previousMovements);
  const previousBalance = { ...runningByCurrency };
  const totals = {
    debit: emptyCurrencyTotals(),
    credit: emptyCurrencyTotals(),
  };

  const rows = movements.map((movement) => {
    const effect = movementBalanceEffect(movement.type, movement.amount);
    const { debit, credit } = splitEffectDebitCredit(effect);

    runningByCurrency[movement.currency] = runningByCurrency[movement.currency].plus(effect);
    totals.debit[movement.currency] = totals.debit[movement.currency].plus(debit);
    totals.credit[movement.currency] = totals.credit[movement.currency].plus(credit);

    return {
      movement,
      debit,
      credit,
      runningBalance: runningByCurrency[movement.currency],
    };
  });

  return {
    customer,
    rows,
    previousBalance,
    currentBalance: runningByCurrency,
    totals,
    movementCount: rows.length,
  };
}

export function calculateGroupActualAmounts(
  group: Pick<TransactionGroup, "sourceCurrency" | "targetCurrency">,
  movements: Pick<FinancialMovement, "type" | "currency" | "amount">[],
) {
  let source = new Decimal(0);
  let target = new Decimal(0);

  for (const movement of movements) {
    if (
      movement.type === MovementType.RECEIVED &&
      (!group.sourceCurrency || movement.currency === group.sourceCurrency)
    ) {
      source = source.plus(toDecimal(movement.amount));
    }

    if (
      movement.type === MovementType.PAID &&
      (!group.targetCurrency || movement.currency === group.targetCurrency)
    ) {
      target = target.plus(toDecimal(movement.amount));
    }
  }

  return { source, target };
}

export async function refreshTransactionGroup(groupId: string | null | undefined) {
  if (!groupId) {
    return null;
  }

  const group = await prisma.transactionGroup.findUnique({
    where: { id: groupId },
    include: {
      financialMovements: true,
    },
  });

  if (!group) {
    return null;
  }

  const actual = calculateGroupActualAmounts(group, group.financialMovements);
  const profit = calculateTransactionProfit({
    costRate: group.costRate,
    sellRate: group.sellRate,
    actualTargetAmount: actual.target,
    expectedTargetAmount: group.expectedTargetAmount,
    actualSourceAmount: actual.source,
  });
  const status = deriveTransactionStatus({
    expectedSourceAmount: group.expectedSourceAmount,
    expectedTargetAmount: group.expectedTargetAmount,
    actualSourceAmount: actual.source,
    actualTargetAmount: actual.target,
    movementCount: group.financialMovements.length,
  });

  return prisma.transactionGroup.update({
    where: { id: group.id },
    data: {
      actualSourceAmount: toMoneyString(actual.source),
      actualTargetAmount: toMoneyString(actual.target),
      profit: profit ? toMoneyString(profit) : null,
      status,
    },
  });
}

export async function getDashboardMetrics(today = new Date()) {
  const { start, end } = getDateRange(today);
  const [movements, customersCount, openGroupsCount, profitGroups] = await Promise.all([
    prisma.financialMovement.findMany({
      where: { date: { gte: start, lte: end } },
    }),
    prisma.customer.count(),
    prisma.transactionGroup.count({
      where: { status: { in: ["OPEN", "PARTIALLY_SETTLED"] } },
    }),
    prisma.transactionGroup.findMany({
      where: {
        profit: { not: null },
        OR: [
          { createdAt: { gte: start, lte: end } },
          { status: "SETTLED", updatedAt: { gte: start, lte: end } },
        ],
      },
    }),
  ]);

  const totals = sumMovementsByTypeAndCurrency(movements);
  const todayProfit = profitGroups.reduce(
    (sum, group) => sum.plus(toDecimal(group.profit)),
    new Decimal(0),
  );

  return {
    totals,
    todayProfit,
    movementsCount: movements.length,
    customersCount,
    openGroupsCount,
  };
}

export async function getDailyReport(date: Date) {
  const { start, end } = getDateRange(date);
  const [movements, profitGroups] = await Promise.all([
    prisma.financialMovement.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        customer: { select: customerSelect },
        transactionGroup: true,
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
    prisma.transactionGroup.findMany({
      where: {
        profit: { not: null },
        OR: [
          { createdAt: { gte: start, lte: end } },
          { status: "SETTLED", updatedAt: { gte: start, lte: end } },
        ],
      },
      include: {
        customer: { select: customerSelect },
      },
    }),
  ]);

  const totals = sumMovementsByTypeAndCurrency(movements);
  const customers = Array.from(
    new Map(
      movements
        .filter((movement) => movement.customer)
        .map((movement) => [movement.customerId, movement.customer]),
    ).values(),
  );
  const profit = profitGroups.reduce(
    (sum, group) => sum.plus(toDecimal(group.profit)),
    new Decimal(0),
  );

  return {
    movements,
    totals,
    customers,
    profit,
    profitGroups,
  };
}
