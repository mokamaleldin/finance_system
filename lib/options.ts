export const currencyValues = ["EGP", "USD", "TRY"] as const;
export const movementTypeValues = ["RECEIVED", "PAID", "FEE", "ADJUSTMENT"] as const;
export const transactionStatusValues = ["OPEN", "PARTIALLY_SETTLED", "SETTLED"] as const;

export type CurrencyCode = (typeof currencyValues)[number];
export type MovementTypeCode = (typeof movementTypeValues)[number];
export type TransactionStatusCode = (typeof transactionStatusValues)[number];

export const currencyLabels: Record<CurrencyCode, string> = {
  EGP: "جنيه مصري",
  USD: "دولار",
  TRY: "ليرة تركية",
};

export const movementTypeLabels: Record<MovementTypeCode, string> = {
  RECEIVED: "وارد",
  PAID: "صادر",
  FEE: "أجور",
  ADJUSTMENT: "تعديل",
};

export const transactionStatusLabels: Record<TransactionStatusCode, string> = {
  OPEN: "مفتوحة",
  PARTIALLY_SETTLED: "مسددة جزئيا",
  SETTLED: "مسددة",
};
