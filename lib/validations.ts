import Decimal from "decimal.js";
import { z } from "zod";
import {
  currencyValues,
  commissionBaseValues,
  commissionTypeValues,
  customerKindValues,
  deliveredStatusValues,
  expenseCategoryValues,
  movementTypeValues,
  receivedStatusValues,
  transactionStatusValues,
  transferTypeValues,
} from "@/lib/options";

const requiredText = "هذا الحقل مطلوب";

function decimalString(label: string, options?: { allowNegative?: boolean; optional?: boolean }) {
  const textSchema = options?.optional
    ? z.string().trim()
    : z.string().trim().min(1, requiredText);

  const schema = textSchema
    .refine((value) => {
      if (options?.optional && value === "") {
        return true;
      }

      try {
        const decimal = new Decimal(value);
        return decimal.isFinite() && (options?.allowNegative || decimal.gte(0));
      } catch {
        return false;
      }
    }, `${label} غير صحيح`);

  return options?.optional ? schema.optional().default("") : schema;
}

export const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(1, requiredText),
});

export const customerSchema = z.object({
  name: z.string().trim().min(2, "اسم العميل مطلوب"),
  kind: z.enum(customerKindValues).optional().default("CUSTOMER"),
  phone: z.string().trim().optional().default(""),
  country: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default(""),
});

export const movementSchema = z
  .object({
    customerId: z.string().trim().optional().default(""),
    date: z.coerce.date({ message: "التاريخ غير صحيح" }),
    type: z.enum(movementTypeValues),
    currency: z.enum(currencyValues),
    amount: decimalString("المبلغ", { allowNegative: true }),
    rate: decimalString("السعر", { optional: true }),
    transactionGroupId: z.string().trim().optional().default(""),
    notes: z.string().trim().optional().default(""),
  })
  .superRefine((value, context) => {
    const amount = new Decimal(value.amount);

    if (amount.isZero()) {
      context.addIssue({
        code: "custom",
        path: ["amount"],
        message: "المبلغ يجب ألا يساوي صفر",
      });
    }

    if (value.type !== "ADJUSTMENT" && amount.lte(0)) {
      context.addIssue({
        code: "custom",
        path: ["amount"],
        message: "المبلغ يجب أن يكون موجبا لهذه الحركة",
      });
    }
  });

export const transactionGroupSchema = z.object({
  customerId: z.string().trim().min(1, "اختر العميل"),
  title: z.string().trim().optional().default(""),
  status: z.enum(transactionStatusValues).optional().default("OPEN"),
  costRate: decimalString("سعر التكلفة", { optional: true }),
  sellRate: decimalString("سعر التنفيذ", { optional: true }),
  sourceCurrency: z.enum(currencyValues).or(z.literal("")).optional().default(""),
  targetCurrency: z.enum(currencyValues).or(z.literal("")).optional().default(""),
  expectedSourceAmount: decimalString("المبلغ المتوقع", { optional: true }),
  expectedTargetAmount: decimalString("المبلغ المتوقع", { optional: true }),
  notes: z.string().trim().optional().default(""),
});

export const exchangeRateSchema = z.object({
  date: z.coerce.date({ message: "التاريخ غير صحيح" }),
  usdToEgp: decimalString("سعر الدولار مقابل الجنيه"),
  usdToTry: decimalString("سعر الدولار مقابل الليرة"),
  notes: z.string().trim().optional().default(""),
});

export const transferTransactionSchema = z
  .object({
    date: z.coerce.date({ message: "التاريخ غير صحيح" }),
    customerId: z.string().trim().optional().default(""),
    customerName: z.string().trim().optional().default(""),
    quickCustomerName: z.string().trim().optional().default(""),
    phone: z.string().trim().optional().default(""),
    createCustomer: z.boolean().optional().default(false),
    type: z.enum(transferTypeValues),
    receiveLocation: z.string().trim().optional().default(""),
    deliverLocation: z.string().trim().optional().default(""),
    receivedCurrency: z.enum(currencyValues),
    receivedAmount: decimalString("المبلغ المستلم"),
    usdRates: z.record(z.string(), z.string().trim()).optional().default({}),
    usdToEgp: decimalString("سعر الدولار مقابل الجنيه", { optional: true }),
    usdToTry: decimalString("سعر الدولار مقابل الليرة", { optional: true }),
    costRate: decimalString("سعر التكلفة", { optional: true }),
    customerRate: decimalString("سعر العميل"),
    deliveredCurrency: z.enum(currencyValues),
    deliveredAmount: decimalString("المبلغ المطلوب تسليمه", { optional: true }),
    receivedStatus: z.enum(receivedStatusValues),
    deliveredStatus: z.enum(deliveredStatusValues),
    notes: z.string().trim().optional().default(""),
    commissionEnabled: z.boolean().optional().default(false),
    commissionPersonName: z.string().trim().optional().default(""),
    commissionType: z.enum(commissionTypeValues).optional().default("FIXED"),
    commissionBase: z.enum(commissionBaseValues).optional().default("RECEIVED_AMOUNT"),
    commissionValue: decimalString("قيمة العمولة", { optional: true }),
    commissionCurrency: z.enum(currencyValues).optional().default("EGP"),
    commissionNotes: z.string().trim().optional().default(""),
  })
  .superRefine((value, context) => {
    const hasCustomer = Boolean(value.customerId || value.customerName || value.quickCustomerName);

    if (!hasCustomer) {
      context.addIssue({
        code: "custom",
        path: ["customerName"],
        message: "اكتب اسم العميل أو اختر عميلًا موجودًا",
      });
    }

    if (new Decimal(value.receivedAmount).lte(0)) {
      context.addIssue({
        code: "custom",
        path: ["receivedAmount"],
        message: "المبلغ المستلم يجب أن يكون أكبر من صفر",
      });
    }

    if (value.receivedCurrency === value.deliveredCurrency) {
      context.addIssue({
        code: "custom",
        path: ["deliveredCurrency"],
        message: "اختر عملتين مختلفتين للعملية",
      });
    }

    for (const currency of [value.receivedCurrency, value.deliveredCurrency]) {
      if (currency === "USD") continue;

      const rate =
        value.usdRates[currency] ||
        (currency === "EGP" ? value.usdToEgp : "") ||
        (currency === "TRY" ? value.usdToTry : "");

      if (!rate || new Decimal(rate).lte(0)) {
        context.addIssue({
          code: "custom",
          path: ["usdRates"],
          message: `أدخل سعر ${currency} مقابل الدولار`,
        });
      }
    }

    if (new Decimal(value.customerRate).lt(1)) {
      context.addIssue({
        code: "custom",
        path: ["customerRate"],
        message: "سعر العميل يجب أن يكون أكبر أو يساوي 1 (الكبير ÷ الصغير)",
      });
    }

    if (value.deliveredAmount && new Decimal(value.deliveredAmount).lte(0)) {
      context.addIssue({
        code: "custom",
        path: ["deliveredAmount"],
        message: "المبلغ المطلوب تسليمه يجب أن يكون أكبر من صفر",
      });
    }

    if (value.commissionEnabled) {
      if (!value.commissionValue || new Decimal(value.commissionValue).lte(0)) {
        context.addIssue({
          code: "custom",
          path: ["commissionValue"],
          message: "قيمة العمولة يجب أن تكون أكبر من صفر",
        });
      }
    }
  });

export const transferTransactionUpdateSchema = transferTransactionSchema.extend({
  status: z.enum(["OPEN", "COMPLETED", "CANCELLED"]).optional(),
});

export const customerStatementQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  currency: z.enum(currencyValues).optional(),
});

export const expenseSchema = z
  .object({
    date: z.coerce.date({ message: "التاريخ غير صحيح" }),
    category: z.enum(expenseCategoryValues),
    description: z.string().trim().min(2, "الوصف مطلوب"),
    amount: decimalString("المبلغ"),
    currencyCode: z.enum(currencyValues),
    notes: z.string().trim().optional().default(""),
  })
  .superRefine((value, context) => {
    if (new Decimal(value.amount).lte(0)) {
      context.addIssue({
        code: "custom",
        path: ["amount"],
        message: "المبلغ يجب أن يكون أكبر من صفر",
      });
    }
  });

export function nullableString(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function nullableDecimalString(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
