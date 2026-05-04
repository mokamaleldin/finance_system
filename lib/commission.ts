import Decimal from "decimal.js";
import { toDecimal, type DecimalInput } from "@/lib/calculations";
import type {
  CommissionBaseCode,
  CommissionTypeCode,
  CurrencyCode,
} from "@/lib/options";

export type CommissionInput = {
  commissionEnabled?: boolean;
  commissionPersonName?: string;
  commissionType?: CommissionTypeCode;
  commissionBase?: CommissionBaseCode;
  commissionValue?: DecimalInput;
  commissionCurrency?: CurrencyCode;
  commissionNotes?: string;
};

export type CommissionContext = {
  receivedAmount: DecimalInput;
  receivedCurrency: CurrencyCode;
  profitAmount: DecimalInput;
  profitCurrency: CurrencyCode;
};

export function getCommissionBaseCurrency(input: CommissionInput, context: CommissionContext) {
  return input.commissionBase === "PROFIT" ? context.profitCurrency : context.receivedCurrency;
}

export function getCommissionCurrency(input: CommissionInput, context: CommissionContext) {
  if (input.commissionType === "PERCENTAGE") {
    return getCommissionBaseCurrency(input, context);
  }

  return input.commissionCurrency ?? context.receivedCurrency;
}

export function calculateCommissionAmount(input: CommissionInput, context: CommissionContext) {
  if (!input.commissionEnabled || !input.commissionValue) {
    return new Decimal(0);
  }

  const value = toDecimal(input.commissionValue);

  if (input.commissionType === "PERCENTAGE") {
    const baseAmount =
      input.commissionBase === "PROFIT"
        ? toDecimal(context.profitAmount)
        : toDecimal(context.receivedAmount);

    return baseAmount.times(value).dividedBy(100).toDecimalPlaces(4);
  }

  return value.toDecimalPlaces(4);
}
