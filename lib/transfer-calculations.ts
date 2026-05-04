import Decimal from "decimal.js";
import { toDecimal, type DecimalInput } from "@/lib/calculations";
import type {
  CurrencyCode,
  DeliveredStatusCode,
  ReceivedStatusCode,
  TransferStatusCode,
  TransferTypeCode,
} from "@/lib/options";

export type UsdRateMap = Partial<Record<CurrencyCode, DecimalInput>>;

export type TransferCalculationInput = {
  type: TransferTypeCode;
  receivedCurrency: CurrencyCode;
  receivedAmount: DecimalInput;
  deliveredCurrency: CurrencyCode;
  usdRates?: UsdRateMap;
  usdToEgp?: DecimalInput;
  usdToTry?: DecimalInput;
  costRate?: DecimalInput;
  customerRate: DecimalInput;
  deliveredAmountOverride?: DecimalInput;
};

export type TransferCalculationResult = {
  costRate: Decimal;
  theoreticalRate: Decimal;
  rateDifference: Decimal;
  rateBaseCurrency: CurrencyCode;
  rateQuoteCurrency: CurrencyCode;
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

export function getRateDirection(
  receivedCurrency: CurrencyCode,
  deliveredCurrency: CurrencyCode,
) {
  return {
    rateBaseCurrency: deliveredCurrency,
    rateQuoteCurrency: receivedCurrency,
  };
}

function buildRateMap(input: {
  usdRates?: UsdRateMap;
  usdToEgp?: DecimalInput;
  usdToTry?: DecimalInput;
}) {
  return {
    USD: "1",
    ...(input.usdRates ?? {}),
    ...(input.usdToEgp !== undefined && input.usdToEgp !== null && input.usdToEgp !== ""
      ? { EGP: input.usdToEgp }
      : {}),
    ...(input.usdToTry !== undefined && input.usdToTry !== null && input.usdToTry !== ""
      ? { TRY: input.usdToTry }
      : {}),
  } satisfies UsdRateMap;
}

export function getUsdReferenceRate(currency: CurrencyCode, usdRates?: UsdRateMap) {
  if (currency === "USD") {
    return new Decimal(1);
  }

  const value = usdRates?.[currency];
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const decimal = toDecimal(value);
  return decimal.gt(0) ? decimal : null;
}

export function getCostRateFromUsdRates(
  receivedCurrency: CurrencyCode,
  deliveredCurrency: CurrencyCode,
  usdRates?: UsdRateMap,
) {
  const receivedRate = getUsdReferenceRate(receivedCurrency, usdRates);
  const deliveredRate = getUsdReferenceRate(deliveredCurrency, usdRates);

  if (!receivedRate || !deliveredRate || deliveredRate.isZero()) {
    return null;
  }

  return receivedRate.dividedBy(deliveredRate).toDecimalPlaces(8);
}

export function getTheoreticalRate(
  receivedCurrency: CurrencyCode,
  deliveredCurrency: CurrencyCode,
  usdToEgpInput: DecimalInput,
  usdToTryInput: DecimalInput,
) {
  return (
    getCostRateFromUsdRates(receivedCurrency, deliveredCurrency, {
      USD: "1",
      EGP: usdToEgpInput,
      TRY: usdToTryInput,
    }) ?? new Decimal(0)
  );
}

function resolveCostRate(input: TransferCalculationInput) {
  const costRateFromReferences = getCostRateFromUsdRates(
    input.receivedCurrency,
    input.deliveredCurrency,
    buildRateMap(input),
  );

  if (costRateFromReferences) {
    return costRateFromReferences;
  }

  if (input.costRate !== undefined && input.costRate !== null && input.costRate !== "") {
    return toDecimal(input.costRate).toDecimalPlaces(8);
  }

  return new Decimal(0);
}

export function calculateTransfer(input: TransferCalculationInput): TransferCalculationResult {
  const receivedAmount = toDecimal(input.receivedAmount);
  const customerRate = toDecimal(input.customerRate);
  const costRate = resolveCostRate(input);
  const direction = getRateDirection(input.receivedCurrency, input.deliveredCurrency);

  const deliveredAmount =
    input.deliveredAmountOverride !== undefined &&
    input.deliveredAmountOverride !== null &&
    input.deliveredAmountOverride !== ""
      ? toDecimal(input.deliveredAmountOverride).toDecimalPlaces(4)
      : receivedAmount.dividedBy(customerRate).toDecimalPlaces(4);
  const costValue = deliveredAmount.times(costRate);

  return {
    costRate,
    theoreticalRate: costRate,
    rateDifference: costRate.minus(customerRate).toDecimalPlaces(8),
    rateBaseCurrency: direction.rateBaseCurrency,
    rateQuoteCurrency: direction.rateQuoteCurrency,
    deliveredAmount,
    profitCurrency: input.receivedCurrency,
    profitAmount: receivedAmount.minus(costValue).toDecimalPlaces(4),
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

export function getOpenAmountInfo(transaction: {
  receivedStatus: ReceivedStatusCode;
  deliveredStatus: DeliveredStatusCode;
  status: TransferStatusCode;
  receivedCurrency: CurrencyCode;
  receivedAmount: DecimalInput;
  deliveredCurrency: CurrencyCode;
  deliveredAmount: DecimalInput;
}) {
  const side = getRemainingSide(transaction);

  if (side === "OWE_CUSTOMER") {
    return {
      side,
      label: "علينا للعميل",
      amount: toDecimal(transaction.deliveredAmount),
      currency: transaction.deliveredCurrency,
    };
  }

  if (side === "CUSTOMER_OWES_US") {
    return {
      side,
      label: "لنا عند العميل",
      amount: toDecimal(transaction.receivedAmount),
      currency: transaction.receivedCurrency,
    };
  }

  if (transaction.status === "OPEN") {
    return {
      side: "PENDING" as const,
      label: "بانتظار استلام وتسليم",
      amount: new Decimal(0),
      currency: transaction.receivedCurrency,
    };
  }

  return null;
}
