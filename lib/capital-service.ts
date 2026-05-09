import { Prisma } from "@prisma/client";
import { emptyCurrencyTotals, toDecimal, type DecimalInput } from "@/lib/calculations";
import {
  type CapitalMovementTypeCode,
  type CurrencyCode,
} from "@/lib/options";
import { prisma } from "@/lib/prisma";
import { capitalMovementSchema, nullableString } from "@/lib/validations";
import type { z } from "zod";

type CapitalMovementInput = z.output<typeof capitalMovementSchema>;

function normalizeMoney(value: DecimalInput, scale = 4) {
  return toDecimal(value).toDecimalPlaces(scale).toFixed(scale);
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
