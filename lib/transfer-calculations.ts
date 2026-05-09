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
  customerRate: Decimal;
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

export function deriveTransferStatusFromAmounts(input: {
  receivedAmount: DecimalInput;
  deliveredAmount: DecimalInput;
  totalReceived: DecimalInput;
  totalDelivered: DecimalInput;
  cancelled?: boolean;
}): {
  receivedStatus: ReceivedStatusCode;
  deliveredStatus: DeliveredStatusCode;
  status: TransferStatusCode;
} {
  if (input.cancelled) {
    return {
      receivedStatus: "RECEIVED" as const,
      deliveredStatus: "DELIVERED" as const,
      status: "CANCELLED" as const,
    };
  }

  const receivedStatus: ReceivedStatusCode = toDecimal(input.totalReceived).gte(toDecimal(input.receivedAmount))
    ? "RECEIVED"
    : "NOT_RECEIVED";
  const deliveredStatus: DeliveredStatusCode = toDecimal(input.totalDelivered).gte(toDecimal(input.deliveredAmount))
    ? "DELIVERED"
    : "NOT_DELIVERED";

  return {
    receivedStatus,
    deliveredStatus,
    status: deriveTransferStatus(receivedStatus, deliveredStatus),
  };
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

export function getNormalizedRateDirection(
  receivedCurrency: CurrencyCode,
  deliveredCurrency: CurrencyCode,
  usdRates?: UsdRateMap,
) {
  const receivedRate = getUsdReferenceRate(receivedCurrency, usdRates);
  const deliveredRate = getUsdReferenceRate(deliveredCurrency, usdRates);

  if (receivedRate && deliveredRate && !receivedRate.equals(deliveredRate)) {
    return receivedRate.gt(deliveredRate)
      ? {
          rateBaseCurrency: deliveredCurrency,
          rateQuoteCurrency: receivedCurrency,
        }
      : {
          rateBaseCurrency: receivedCurrency,
          rateQuoteCurrency: deliveredCurrency,
        };
  }

  return getRateDirection(receivedCurrency, deliveredCurrency);
}

export function normalizeRateByMagnitude(value: DecimalInput) {
  const rate = toDecimal(value);

  if (rate.gt(0) && rate.lt(1)) {
    return new Decimal(1).dividedBy(rate).toDecimalPlaces(8);
  }

  return rate.toDecimalPlaces(8);
}

export function getDisplayRateFromInternal(
  rate: DecimalInput,
  deliveredCurrency: CurrencyCode,
  direction: ReturnType<typeof getRateDirection>,
) {
  const internalRate = toDecimal(rate);

  if (direction.rateBaseCurrency === deliveredCurrency || internalRate.isZero()) {
    return internalRate.toDecimalPlaces(8);
  }

  return new Decimal(1).dividedBy(internalRate).toDecimalPlaces(8);
}

function getInternalRateFromDisplay(
  rate: DecimalInput,
  deliveredCurrency: CurrencyCode,
  direction: ReturnType<typeof getRateDirection>,
) {
  const displayRate = normalizeRateByMagnitude(rate);

  if (direction.rateBaseCurrency === deliveredCurrency || displayRate.isZero()) {
    return displayRate.toDecimalPlaces(8);
  }

  return new Decimal(1).dividedBy(displayRate).toDecimalPlaces(8);
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
  const rateMap = buildRateMap(input);
  const internalCostRate = resolveCostRate(input);
  const direction = getNormalizedRateDirection(input.receivedCurrency, input.deliveredCurrency, rateMap);
  const displayCostRate = getDisplayRateFromInternal(internalCostRate, input.deliveredCurrency, direction);
  const displayCustomerRate = normalizeRateByMagnitude(input.customerRate);
  const internalCustomerRate = getInternalRateFromDisplay(displayCustomerRate, input.deliveredCurrency, direction);

  const deliveredAmount =
    input.deliveredAmountOverride !== undefined &&
    input.deliveredAmountOverride !== null &&
    input.deliveredAmountOverride !== ""
      ? toDecimal(input.deliveredAmountOverride).toDecimalPlaces(4)
      : receivedAmount.dividedBy(internalCustomerRate).toDecimalPlaces(4);
  const costValue = deliveredAmount.times(internalCostRate);

  return {
    costRate: displayCostRate,
    theoreticalRate: displayCostRate,
    customerRate: displayCustomerRate,
    rateDifference: displayCostRate.minus(displayCustomerRate).toDecimalPlaces(8),
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

export type TransferExecutionLike = {
  type: "RECEIVED" | "DELIVERED";
  amount: DecimalInput;
};

export function getTransferSettlement(transaction: {
  status: TransferStatusCode;
  receivedAmount: DecimalInput;
  deliveredAmount: DecimalInput;
  executions?: TransferExecutionLike[] | null;
}) {
  const totalReceived = (transaction.executions ?? [])
    .filter((execution) => execution.type === "RECEIVED")
    .reduce((total, execution) => total.plus(toDecimal(execution.amount)), new Decimal(0))
    .toDecimalPlaces(4);
  const totalDelivered = (transaction.executions ?? [])
    .filter((execution) => execution.type === "DELIVERED")
    .reduce((total, execution) => total.plus(toDecimal(execution.amount)), new Decimal(0))
    .toDecimalPlaces(4);
  const expectedReceived = toDecimal(transaction.receivedAmount).toDecimalPlaces(4);
  const expectedDelivered = toDecimal(transaction.deliveredAmount).toDecimalPlaces(4);
  const remainingReceived = Decimal.max(expectedReceived.minus(totalReceived), 0).toDecimalPlaces(4);
  const remainingDelivered = Decimal.max(expectedDelivered.minus(totalDelivered), 0).toDecimalPlaces(4);
  const extraReceived = Decimal.max(totalReceived.minus(expectedReceived), 0).toDecimalPlaces(4);
  const extraDelivered = Decimal.max(totalDelivered.minus(expectedDelivered), 0).toDecimalPlaces(4);
  const derived = deriveTransferStatusFromAmounts({
    receivedAmount: expectedReceived,
    deliveredAmount: expectedDelivered,
    totalReceived,
    totalDelivered,
    cancelled: transaction.status === "CANCELLED",
  });

  return {
    expectedReceived,
    expectedDelivered,
    totalReceived,
    totalDelivered,
    remainingReceived,
    remainingDelivered,
    extraReceived,
    extraDelivered,
    receivedStatus: derived.receivedStatus,
    deliveredStatus: derived.deliveredStatus,
    status: derived.status,
    isReceivedComplete: remainingReceived.isZero(),
    isDeliveredComplete: remainingDelivered.isZero(),
  };
}

export function getOpenAmountInfos(transaction: {
  status: TransferStatusCode;
  receivedCurrency: CurrencyCode;
  receivedAmount: DecimalInput;
  deliveredCurrency: CurrencyCode;
  deliveredAmount: DecimalInput;
  executions?: TransferExecutionLike[] | null;
}) {
  if (transaction.status === "CANCELLED") {
    return [];
  }

  const settlement = getTransferSettlement(transaction);
  const items: Array<{
    side: "CUSTOMER_OWES_US" | "OWE_CUSTOMER";
    label: string;
    amount: Decimal;
    currency: CurrencyCode;
  }> = [];

  if (settlement.remainingReceived.gt(0)) {
    items.push({
      side: "CUSTOMER_OWES_US",
      label: "لنا عند العميل",
      amount: settlement.remainingReceived,
      currency: transaction.receivedCurrency,
    });
  }

  if (settlement.remainingDelivered.gt(0)) {
    items.push({
      side: "OWE_CUSTOMER",
      label: "علينا للعميل",
      amount: settlement.remainingDelivered,
      currency: transaction.deliveredCurrency,
    });
  }

  return items;
}

export function getOpenAmountInfo(transaction: {
  receivedStatus: ReceivedStatusCode;
  deliveredStatus: DeliveredStatusCode;
  status: TransferStatusCode;
  receivedCurrency: CurrencyCode;
  receivedAmount: DecimalInput;
  deliveredCurrency: CurrencyCode;
  deliveredAmount: DecimalInput;
  executions?: TransferExecutionLike[] | null;
}) {
  const amountInfos = getOpenAmountInfos(transaction);
  if (amountInfos.length === 1) {
    return amountInfos[0];
  }

  if (amountInfos.length > 1) {
    return {
      side: "PENDING" as const,
      label: "باقي استلام وتسليم",
      amount: new Decimal(0),
      currency: transaction.receivedCurrency,
    };
  }

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
