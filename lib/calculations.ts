import type { Currency, MovementType, TransactionStatus } from "@prisma/client";
import Decimal from "decimal.js";
import {
  currencyLabels,
  currencyValues,
  movementTypeLabels,
  transactionStatusLabels,
} from "@/lib/options";

export type DecimalInput = Decimal.Value | { toString(): string } | null | undefined;

export const currencies = [...currencyValues] as Currency[];
export { currencyLabels, movementTypeLabels, transactionStatusLabels };

export function toDecimal(value: DecimalInput, fallback = "0") {
  if (value === null || value === undefined || value === "") {
    return new Decimal(fallback);
  }

  return value instanceof Decimal ? value : new Decimal(value.toString());
}

export function toMoneyString(value: DecimalInput, decimalPlaces = 4) {
  return toDecimal(value).toDecimalPlaces(decimalPlaces).toFixed(decimalPlaces);
}

export function movementBalanceEffect(type: MovementType, amount: DecimalInput) {
  const value = toDecimal(amount);

  switch (type) {
    case "RECEIVED":
      return value.negated();
    case "PAID":
      return value;
    case "FEE":
      return value;
    case "ADJUSTMENT":
      return value;
    default:
      return new Decimal(0);
  }
}

export function emptyCurrencyTotals() {
  return currencies.reduce(
    (totals, currency) => ({
      ...totals,
      [currency]: new Decimal(0),
    }),
    {} as Record<Currency, Decimal>,
  );
}

export type LedgerMovementLike = {
  type: MovementType;
  currency: Currency;
  amount: DecimalInput;
};

export function calculateBalancesFromMovements(movements: LedgerMovementLike[]) {
  const balances = emptyCurrencyTotals();

  for (const movement of movements) {
    balances[movement.currency] = balances[movement.currency].plus(
      movementBalanceEffect(movement.type, movement.amount),
    );
  }

  return balances;
}

export function splitEffectDebitCredit(effect: DecimalInput) {
  const signedEffect = toDecimal(effect);

  return {
    debit: signedEffect.isPositive() ? signedEffect : new Decimal(0),
    credit: signedEffect.isNegative() ? signedEffect.abs() : new Decimal(0),
  };
}

export function getBalanceStatus(balance: DecimalInput) {
  const value = toDecimal(balance);

  if (value.isZero()) {
    return "مسدد";
  }

  return value.isPositive() ? "مدين لنا" : "دائن علينا";
}

export function calculateCrossRate(usdToEgp: DecimalInput, usdToTry: DecimalInput) {
  const egp = toDecimal(usdToEgp);
  const tryRate = toDecimal(usdToTry);

  if (tryRate.isZero()) {
    return new Decimal(0);
  }

  return egp.dividedBy(tryRate).toDecimalPlaces(6);
}

export type ProfitInput = {
  costRate?: DecimalInput;
  sellRate?: DecimalInput;
  actualTargetAmount?: DecimalInput;
  expectedTargetAmount?: DecimalInput;
  actualSourceAmount?: DecimalInput;
};

export function calculateTransactionProfit(input: ProfitInput) {
  if (!input.costRate || !input.sellRate) {
    return null;
  }

  const amount =
    input.actualTargetAmount ??
    input.expectedTargetAmount ??
    input.actualSourceAmount ??
    null;

  if (!amount) {
    return null;
  }

  const quantity = toDecimal(amount);
  if (quantity.isZero()) {
    return null;
  }

  return toDecimal(input.costRate)
    .minus(toDecimal(input.sellRate))
    .times(quantity)
    .toDecimalPlaces(4);
}

export type TransactionStatusInput = {
  expectedSourceAmount?: DecimalInput;
  expectedTargetAmount?: DecimalInput;
  actualSourceAmount?: DecimalInput;
  actualTargetAmount?: DecimalInput;
  movementCount?: number;
};

export function deriveTransactionStatus(input: TransactionStatusInput) {
  const expectedSource = toDecimal(input.expectedSourceAmount);
  const expectedTarget = toDecimal(input.expectedTargetAmount);
  const actualSource = toDecimal(input.actualSourceAmount);
  const actualTarget = toDecimal(input.actualTargetAmount);

  const hasExpectedSource = expectedSource.gt(0);
  const hasExpectedTarget = expectedTarget.gt(0);
  const sourceSettled = !hasExpectedSource || actualSource.gte(expectedSource);
  const targetSettled = !hasExpectedTarget || actualTarget.gte(expectedTarget);
  const hasAnyActual = actualSource.gt(0) || actualTarget.gt(0) || Boolean(input.movementCount);

  if ((hasExpectedSource || hasExpectedTarget) && sourceSettled && targetSettled && hasAnyActual) {
    return "SETTLED" as TransactionStatus;
  }

  if (hasAnyActual) {
    return "PARTIALLY_SETTLED" as TransactionStatus;
  }

  return "OPEN" as TransactionStatus;
}

export function sumMovementsByTypeAndCurrency(movements: LedgerMovementLike[]) {
  const received = emptyCurrencyTotals();
  const paid = emptyCurrencyTotals();
  const fee = emptyCurrencyTotals();
  const adjustment = emptyCurrencyTotals();

  for (const movement of movements) {
    const value = toDecimal(movement.amount);

    if (movement.type === "RECEIVED") {
      received[movement.currency] = received[movement.currency].plus(value);
    }

    if (movement.type === "PAID") {
      paid[movement.currency] = paid[movement.currency].plus(value);
    }

    if (movement.type === "FEE") {
      fee[movement.currency] = fee[movement.currency].plus(value);
    }

    if (movement.type === "ADJUSTMENT") {
      adjustment[movement.currency] = adjustment[movement.currency].plus(value);
    }
  }

  return { received, paid, fee, adjustment };
}
