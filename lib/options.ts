export const currencyValues = ["EGP", "USD", "TRY"] as const;
export const movementTypeValues = ["RECEIVED", "PAID", "FEE", "ADJUSTMENT"] as const;
export const transactionStatusValues = ["OPEN", "PARTIALLY_SETTLED", "SETTLED"] as const;
export const transferTypeValues = ["EGYPT_TO_TURKEY", "TURKEY_TO_EGYPT"] as const;
export const receivedStatusValues = ["RECEIVED", "NOT_RECEIVED"] as const;
export const deliveredStatusValues = ["DELIVERED", "NOT_DELIVERED"] as const;
export const transferStatusValues = ["OPEN", "COMPLETED", "CANCELLED"] as const;

export type CurrencyCode = (typeof currencyValues)[number];
export type MovementTypeCode = (typeof movementTypeValues)[number];
export type TransactionStatusCode = (typeof transactionStatusValues)[number];
export type TransferTypeCode = (typeof transferTypeValues)[number];
export type ReceivedStatusCode = (typeof receivedStatusValues)[number];
export type DeliveredStatusCode = (typeof deliveredStatusValues)[number];
export type TransferStatusCode = (typeof transferStatusValues)[number];

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

export const transferTypeLabels: Record<TransferTypeCode, string> = {
  EGYPT_TO_TURKEY: "من مصر إلى تركيا",
  TURKEY_TO_EGYPT: "من تركيا إلى مصر",
};

export const receivedStatusLabels: Record<ReceivedStatusCode, string> = {
  RECEIVED: "تم الاستلام",
  NOT_RECEIVED: "لم يتم الاستلام",
};

export const deliveredStatusLabels: Record<DeliveredStatusCode, string> = {
  DELIVERED: "تم التسليم",
  NOT_DELIVERED: "لم يتم التسليم",
};

export const transferStatusLabels: Record<TransferStatusCode, string> = {
  OPEN: "مفتوحة",
  COMPLETED: "مكتملة",
  CANCELLED: "ملغاة",
};
