export const currencyValues = ["EGP", "TRY", "USD", "EUR"] as const;
export const movementTypeValues = ["RECEIVED", "PAID", "FEE", "ADJUSTMENT"] as const;
export const transactionStatusValues = ["OPEN", "PARTIALLY_SETTLED", "SETTLED"] as const;
export const transferTypeValues = ["TRANSFER", "DIRECT_EXCHANGE", "EGYPT_TO_TURKEY", "TURKEY_TO_EGYPT"] as const;
export const operationTypeValues = ["TRANSFER", "DIRECT_EXCHANGE"] as const;
export const receivedStatusValues = ["RECEIVED", "NOT_RECEIVED"] as const;
export const deliveredStatusValues = ["DELIVERED", "NOT_DELIVERED"] as const;
export const transferStatusValues = ["OPEN", "COMPLETED", "CANCELLED"] as const;
export const expenseCategoryValues = ["RENT", "HOSPITALITY", "TRANSPORTATION", "INTERNET", "OPERATIONS", "OTHER"] as const;
export const commissionTypeValues = ["FIXED", "PERCENTAGE"] as const;
export const commissionBaseValues = ["RECEIVED_AMOUNT", "PROFIT"] as const;

export type CurrencyCode = (typeof currencyValues)[number];
export type MovementTypeCode = (typeof movementTypeValues)[number];
export type TransactionStatusCode = (typeof transactionStatusValues)[number];
export type TransferTypeCode = (typeof transferTypeValues)[number];
export type ReceivedStatusCode = (typeof receivedStatusValues)[number];
export type DeliveredStatusCode = (typeof deliveredStatusValues)[number];
export type TransferStatusCode = (typeof transferStatusValues)[number];
export type ExpenseCategoryCode = (typeof expenseCategoryValues)[number];
export type CommissionTypeCode = (typeof commissionTypeValues)[number];
export type CommissionBaseCode = (typeof commissionBaseValues)[number];

export const currencyLabels: Record<CurrencyCode, string> = {
  EGP: "جنيه مصري",
  TRY: "ليرة تركية",
  USD: "دولار أمريكي",
  EUR: "يورو",
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
  TRANSFER: "حوالة",
  DIRECT_EXCHANGE: "تبديل عملة مباشر",
  EGYPT_TO_TURKEY: "حوالة من مصر إلى تركيا",
  TURKEY_TO_EGYPT: "حوالة من تركيا إلى مصر",
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

export const expenseCategoryLabels: Record<ExpenseCategoryCode, string> = {
  RENT: "إيجار",
  HOSPITALITY: "ضيافة",
  TRANSPORTATION: "مواصلات",
  INTERNET: "إنترنت",
  OPERATIONS: "تشغيل",
  OTHER: "أخرى",
};

export const commissionTypeLabels: Record<CommissionTypeCode, string> = {
  FIXED: "مبلغ ثابت",
  PERCENTAGE: "نسبة مئوية",
};

export const commissionBaseLabels: Record<CommissionBaseCode, string> = {
  RECEIVED_AMOUNT: "المبلغ المستلم",
  PROFIT: "ربح العملية",
};
