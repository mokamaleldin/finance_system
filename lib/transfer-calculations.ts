import Decimal from "decimal.js";
import { toDecimal, type DecimalInput } from "@/lib/calculations";
import type {
  CurrencyCode,
  DeliveredStatusCode,
  ReceivedStatusCode,
  TransferStatusCode,
  TransferTypeCode,
} from "@/lib/options";

export type TransferCalculationInput = {
  type: TransferTypeCode;
  receivedCurrency: CurrencyCode;
  receivedAmount: DecimalInput;
  deliveredCurrency: CurrencyCode;
  usdToEgp: DecimalInput;
  usdToTry: DecimalInput;
  customerRate: DecimalInput;
  deliveredAmountOverride?: DecimalInput;
};

export type TransferCalculationResult = {
  theoreticalRate: Decimal;
  deliveredAmount: Decimal;
  profitCurrency: CurrencyCode;
  profitAmount: Decimal;
};

export function deriveTransferStatus(
  receivedStatus: ReceivedStatusCode,
  deliveredStatus: DeliveredStatusCode,
  cancelled = false,
): TransferStatusCode {
  if (cancelled) {
    return "CANCELLED";
  }

  return receivedStatus === "RECEIVED" && deliveredStatus === "DELIVERED"
    ? "COMPLETED"
    : "OPEN";
}

export function getTheoreticalRate(
  receivedCurrency: CurrencyCode,
  deliveredCurrency: CurrencyCode,
  usdToEgpInput: DecimalInput,
  usdToTryInput: DecimalInput,
) {
  const usdToEgp = toDecimal(usdToEgpInput);
  const usdToTry = toDecimal(usdToTryInput);

  if (receivedCurrency === deliveredCurrency) {
    return new Decimal(1);
  }

  if (
    (receivedCurrency === "EGP" && deliveredCurrency === "TRY") ||
    (receivedCurrency === "TRY" && deliveredCurrency === "EGP")
  ) {
    return usdToEgp.dividedBy(usdToTry).toDecimalPlaces(8);
  }

  if (
    (receivedCurrency === "EGP" && deliveredCurrency === "USD") ||
    (receivedCurrency === "USD" && deliveredCurrency === "EGP")
  ) {
    return usdToEgp.toDecimalPlaces(8);
  }

  if (
    (receivedCurrency === "TRY" && deliveredCurrency === "USD") ||
    (receivedCurrency === "USD" && deliveredCurrency === "TRY")
  ) {
    return usdToTry.toDecimalPlaces(8);
  }

  return new Decimal(1);
}

function shouldDivideByCustomerRate(
  receivedCurrency: CurrencyCode,
  deliveredCurrency: CurrencyCode,
) {
  return (
    (receivedCurrency === "EGP" && deliveredCurrency === "TRY") ||
    (receivedCurrency === "EGP" && deliveredCurrency === "USD") ||
    (receivedCurrency === "TRY" && deliveredCurrency === "USD")
  );
}

function getProfitCurrency(receivedCurrency: CurrencyCode, deliveredCurrency: CurrencyCode) {
  return shouldDivideByCustomerRate(receivedCurrency, deliveredCurrency)
    ? receivedCurrency
    : deliveredCurrency;
}

function calculateProfitAmount(
  receivedCurrency: CurrencyCode,
  deliveredCurrency: CurrencyCode,
  receivedAmount: Decimal,
  deliveredAmount: Decimal,
  theoreticalRate: Decimal,
) {
  if (receivedCurrency === deliveredCurrency) {
    return new Decimal(0);
  }

  if (shouldDivideByCustomerRate(receivedCurrency, deliveredCurrency)) {
    return receivedAmount.minus(deliveredAmount.times(theoreticalRate));
  }

  return receivedAmount.times(theoreticalRate).minus(deliveredAmount);
}

export function calculateTransfer(input: TransferCalculationInput): TransferCalculationResult {
  const receivedAmount = toDecimal(input.receivedAmount);
  const customerRate = toDecimal(input.customerRate);
  const theoreticalRate = getTheoreticalRate(
    input.receivedCurrency,
    input.deliveredCurrency,
    input.usdToEgp,
    input.usdToTry,
  );

  let deliveredAmount =
    input.deliveredAmountOverride !== undefined &&
    input.deliveredAmountOverride !== null &&
    input.deliveredAmountOverride !== ""
      ? toDecimal(input.deliveredAmountOverride)
      : shouldDivideByCustomerRate(input.receivedCurrency, input.deliveredCurrency)
        ? receivedAmount.dividedBy(customerRate)
        : receivedAmount.times(customerRate);

  deliveredAmount = deliveredAmount.toDecimalPlaces(4);

  return {
    theoreticalRate,
    deliveredAmount,
    profitCurrency: getProfitCurrency(input.receivedCurrency, input.deliveredCurrency),
    profitAmount: calculateProfitAmount(
      input.receivedCurrency,
      input.deliveredCurrency,
      receivedAmount,
      deliveredAmount,
      theoreticalRate,
    ).toDecimalPlaces(4),
  };
}

export function getRemainingSide(transaction: {
  receivedStatus: ReceivedStatusCode;
  deliveredStatus: DeliveredStatusCode;
  status: TransferStatusCode;
}) {
  if (transaction.status === "CANCELLED") {
    return null;
  }

  if (transaction.receivedStatus === "RECEIVED" && transaction.deliveredStatus !== "DELIVERED") {
    return "OWE_CUSTOMER" as const;
  }

  if (transaction.receivedStatus !== "RECEIVED" && transaction.deliveredStatus === "DELIVERED") {
    return "CUSTOMER_OWES_US" as const;
  }

  return null;
}
