"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  calculateCommissionAmount,
  getCommissionCurrency,
} from "@/lib/commission";
import { toDecimal, type DecimalInput } from "@/lib/calculations";
import {
  calculateTransfer,
  deriveTransferStatus,
  getCostRateFromUsdRates,
  getOpenAmountInfo,
  getDisplayRateFromInternal,
  getNormalizedRateDirection,
  normalizeRateByMagnitude,
} from "@/lib/transfer-calculations";
import {
  currencyLabels,
  currencyValues,
  commissionBaseLabels,
  commissionBaseValues,
  commissionTypeLabels,
  commissionTypeValues,
  deliveredStatusLabels,
  deliveredStatusValues,
  operationTypeValues,
  receivedStatusLabels,
  receivedStatusValues,
  transferStatusLabels,
  transferTypeLabels,
  type CurrencyCode,
  type DeliveredStatusCode,
  type ReceivedStatusCode,
  type TransferTypeCode,
} from "@/lib/options";

type CustomerOption = {
  id: string;
  name: string;
  phone?: string | null;
};

type TransferFormValues = {
  date: string;
  customerId: string;
  customerName: string;
  quickCustomerName: string;
  phone: string;
  createCustomer: boolean;
  type: TransferTypeCode;
  receivedCurrency: CurrencyCode;
  receivedAmount: string;
  usdRates: Record<CurrencyCode, string>;
  customerRate: string;
  deliveredCurrency: CurrencyCode;
  deliveredAmount: string;
  receivedStatus: ReceivedStatusCode;
  deliveredStatus: DeliveredStatusCode;
  notes: string;
  commissionEnabled: boolean;
  commissionPersonName: string;
  commissionType: "FIXED" | "PERCENTAGE";
  commissionBase: "RECEIVED_AMOUNT" | "PROFIT";
  commissionValue: string;
  commissionCurrency: CurrencyCode;
  commissionNotes: string;
};

type TransferTransactionFormProps = {
  customers: CustomerOption[];
  transactionId?: string;
  initialValues?: Partial<TransferFormValues>;
};

const defaultUsdRates: Record<CurrencyCode, string> = {
  EGP: "",
  TRY: "",
  USD: "1",
  EUR: "",
};

const defaultValues: TransferFormValues = {
  date: new Date().toISOString().slice(0, 10),
  customerId: "",
  customerName: "",
  quickCustomerName: "",
  phone: "",
  createCustomer: false,
  type: "TRANSFER",
  receivedCurrency: "EGP",
  receivedAmount: "",
  usdRates: defaultUsdRates,
  customerRate: "",
  deliveredCurrency: "TRY",
  deliveredAmount: "",
  receivedStatus: "RECEIVED",
  deliveredStatus: "NOT_DELIVERED",
  notes: "",
  commissionEnabled: false,
  commissionPersonName: "",
  commissionType: "FIXED",
  commissionBase: "RECEIVED_AMOUNT",
  commissionValue: "",
  commissionCurrency: "EGP",
  commissionNotes: "",
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
  numberingSystem: "latn",
});

const rateFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
  minimumFractionDigits: 0,
  numberingSystem: "latn",
});

function toEnglishDigits(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";

  return value
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace("٫", ".")
    .replace("٬", "");
}

function formatNumber(value: DecimalInput, type: "money" | "rate" = "money") {
  const formatter = type === "rate" ? rateFormatter : moneyFormatter;
  return formatter.format(toDecimal(value).toNumber());
}

function formatMoneyLabel(value: DecimalInput, currency: CurrencyCode) {
  return `${formatNumber(value, "money")} ${currency}`;
}

function sectionClassName(extra = "") {
  return `min-w-0 rounded-lg border border-line/80 bg-white/95 p-4 shadow-soft backdrop-blur sm:p-5 ${extra}`;
}

function inputClassName(extra = "") {
  return `mt-2 min-h-12 w-full rounded-lg border border-line bg-white/95 px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-olive focus:ring-4 focus:ring-olive/10 ${extra}`;
}

function numericInputClassName(extra = "") {
  return inputClassName(`text-left font-mono tabular-nums ${extra}`);
}

function Section({
  title,
  hint,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={sectionClassName(className)}>
      <div className="mb-5 border-b border-line/70 pb-3">
        <h3 className="text-base font-bold text-ink">{title}</h3>
        {hint ? <p className="mt-1 text-sm leading-6 text-muted">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs leading-5 text-muted">{hint}</span> : null}
    </label>
  );
}

function SummaryRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "success" | "warning";
}) {
  const toneClassName =
    tone === "success"
      ? "border-emerald-100 bg-emerald-50 text-ink"
      : tone === "warning"
        ? "border-red-100 bg-red-50 text-red-700"
        : "border-line/80 bg-white text-ink";

  return (
    <div className={`rounded-lg border px-3 py-2.5 shadow-sm ${toneClassName}`}>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <div className="mt-1 text-sm font-bold leading-6">{value}</div>
    </div>
  );
}

export function TransferTransactionForm({
  customers,
  transactionId,
  initialValues,
}: TransferTransactionFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<TransferFormValues>({
    ...defaultValues,
    ...initialValues,
    usdRates: {
      ...defaultUsdRates,
      ...(initialValues?.usdRates ?? {}),
      USD: "1",
    },
    type: initialValues?.type === "DIRECT_EXCHANGE" ? "DIRECT_EXCHANGE" : "TRANSFER",
  });
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const neededReferenceCurrencies = useMemo(() => {
    return Array.from(new Set([values.receivedCurrency, values.deliveredCurrency])).filter(
      (currency): currency is Exclude<CurrencyCode, "USD"> => currency !== "USD",
    );
  }, [values.deliveredCurrency, values.receivedCurrency]);

  const costRatePreview = useMemo(() => {
    try {
      return getCostRateFromUsdRates(values.receivedCurrency, values.deliveredCurrency, values.usdRates);
    } catch {
      return null;
    }
  }, [values.deliveredCurrency, values.receivedCurrency, values.usdRates]);

  const rateDifferencePreview = useMemo(() => {
    try {
      if (!costRatePreview || !values.customerRate) {
        return null;
      }

      const direction = getNormalizedRateDirection(values.receivedCurrency, values.deliveredCurrency, values.usdRates);
      const displayCostRate = getDisplayRateFromInternal(costRatePreview, values.deliveredCurrency, direction);
      const displayCustomerRate = normalizeRateByMagnitude(values.customerRate);

      return displayCostRate.minus(displayCustomerRate).toDecimalPlaces(8);
    } catch {
      return null;
    }
  }, [
    costRatePreview,
    values.customerRate,
    values.deliveredCurrency,
    values.receivedCurrency,
    values.usdRates,
  ]);

  const preview = useMemo(() => {
    try {
      if (!values.receivedAmount || !values.customerRate || !costRatePreview) {
        return null;
      }

      return calculateTransfer({
        type: values.type,
        receivedCurrency: values.receivedCurrency,
        receivedAmount: values.receivedAmount,
        deliveredCurrency: values.deliveredCurrency,
        usdRates: values.usdRates,
        customerRate: values.customerRate,
        deliveredAmountOverride: values.deliveredAmount || undefined,
      });
    } catch {
      return null;
    }
  }, [costRatePreview, values]);

  const status = deriveTransferStatus(values.receivedStatus, values.deliveredStatus);
  const rateDirection = useMemo(
    () => getNormalizedRateDirection(values.receivedCurrency, values.deliveredCurrency, values.usdRates),
    [values.deliveredCurrency, values.receivedCurrency, values.usdRates],
  );
  const rateBaseLabel = currencyLabels[rateDirection.rateBaseCurrency];
  const rateQuoteLabel = currencyLabels[rateDirection.rateQuoteCurrency];
  const displayCustomerRate = useMemo(() => {
    if (!values.customerRate) {
      return "";
    }

    try {
      return formatNumber(normalizeRateByMagnitude(values.customerRate), "rate");
    } catch {
      return values.customerRate;
    }
  }, [values.customerRate]);
  const displayCostRate = useMemo(() => {
    if (!costRatePreview) {
      return null;
    }

    try {
      return getDisplayRateFromInternal(costRatePreview, values.deliveredCurrency, rateDirection);
    } catch {
      return null;
    }
  }, [costRatePreview, rateDirection, values.deliveredCurrency]);
  const openInfo =
    preview && status === "OPEN"
      ? getOpenAmountInfo({
          receivedStatus: values.receivedStatus,
          deliveredStatus: values.deliveredStatus,
          status,
          receivedCurrency: values.receivedCurrency,
          receivedAmount: values.receivedAmount,
          deliveredCurrency: values.deliveredCurrency,
          deliveredAmount: preview.deliveredAmount,
        })
      : null;
  const commissionPreview = useMemo(() => {
    if (!preview || !values.commissionEnabled || !values.commissionValue) {
      return null;
    }

    const context = {
      receivedAmount: values.receivedAmount,
      receivedCurrency: values.receivedCurrency,
      profitAmount: preview.profitAmount,
      profitCurrency: preview.profitCurrency,
    };

    try {
      return {
        amount: calculateCommissionAmount(values, context),
        currency: getCommissionCurrency(values, context),
      };
    } catch {
      return null;
    }
  }, [preview, values]);

  function updateValue<K extends keyof TransferFormValues>(key: K, value: TransferFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateNumberValue<K extends keyof TransferFormValues>(key: K, value: string) {
    updateValue(key, toEnglishDigits(value) as TransferFormValues[K]);
  }

  function updateUsdRate(currency: CurrencyCode, value: string) {
    setValues((current) => ({
      ...current,
      usdRates: {
        ...current.usdRates,
        [currency]: toEnglishDigits(value),
        USD: "1",
      },
    }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setServerError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        transactionId ? `/api/transactions/${transactionId}` : "/api/transactions",
        {
          method: transactionId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setServerError(payload?.message ?? "تعذر حفظ العملية");
        return;
      }

      router.replace("/dashboard/transactions");
    } catch {
      setServerError("تعذر الاتصال بالسيرفر. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="grid min-w-0 gap-5">
        <Section title="بيانات العميل">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="اختيار عميل موجود">
              <select
                value={values.customerId}
                onChange={(event) => {
                  const customer = customers.find((item) => item.id === event.target.value);
                  setValues((current) => ({
                    ...current,
                    customerId: event.target.value,
                    customerName: customer?.name ?? "",
                    phone: customer?.phone ?? current.phone,
                  }));
                }}
                className={inputClassName()}
              >
                <option value="">بدون اختيار</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="اسم العميل أو اسم عام">
              <input
                value={values.quickCustomerName}
                onChange={(event) => updateValue("quickCustomerName", event.target.value)}
                className={inputClassName()}
                placeholder="مثال: أحمد من القاهرة"
              />
            </Field>

            <Field label="رقم الهاتف">
              <input
                dir="ltr"
                value={values.phone}
                onChange={(event) => updateValue("phone", toEnglishDigits(event.target.value))}
                className={numericInputClassName()}
                placeholder="01000000000"
              />
            </Field>

            <label className="flex items-center gap-2 rounded-lg border border-line/80 bg-mint/70 px-3 py-3 text-sm font-semibold text-ink md:mt-7">
              <input
                type="checkbox"
                checked={values.createCustomer}
                onChange={(event) => updateValue("createCustomer", event.target.checked)}
                className="h-4 w-4"
              />
              حفظ الاسم في العملاء والتجار
            </label>
          </div>
        </Section>

        <Section title="بيانات العملية">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="التاريخ">
              <input
                type="date"
                dir="ltr"
                value={values.date}
                onChange={(event) => updateValue("date", event.target.value)}
                className={numericInputClassName()}
              />
            </Field>

            <Field label="نوع العملية">
              <select
                value={values.type}
                onChange={(event) => updateValue("type", event.target.value as TransferTypeCode)}
                className={inputClassName()}
              >
                {operationTypeValues.map((type) => (
                  <option key={type} value={type}>
                    {transferTypeLabels[type]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        <Section title="المبلغ المستلم">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="العملة التي استلمناها">
              <select
                value={values.receivedCurrency}
                onChange={(event) => {
                  updateValue("receivedCurrency", event.target.value as CurrencyCode);
                  updateValue("deliveredAmount", "");
                }}
                className={inputClassName()}
              >
                {currencyValues.map((currency) => (
                  <option key={currency} value={currency}>
                    {currencyLabels[currency]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="المبلغ الذي استلمناه">
              <input
                inputMode="decimal"
                dir="ltr"
                value={values.receivedAmount}
                onChange={(event) => updateNumberValue("receivedAmount", event.target.value)}
                className={numericInputClassName()}
                placeholder="1000"
              />
            </Field>
          </div>
        </Section>

        <Section title="المبلغ المطلوب تسليمه">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="العملة التي سنسلمها">
              <select
                value={values.deliveredCurrency}
                onChange={(event) => {
                  updateValue("deliveredCurrency", event.target.value as CurrencyCode);
                  updateValue("deliveredAmount", "");
                }}
                className={inputClassName()}
              >
                {currencyValues.map((currency) => (
                  <option key={currency} value={currency}>
                    {currencyLabels[currency]}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="المبلغ الذي يجب تسليمه"
              hint="اتركه فارغًا ليتم حسابه تلقائيًا، أو اكتبه يدويًا عند الحاجة."
            >
              <input
                inputMode="decimal"
                dir="ltr"
                value={values.deliveredAmount}
                onChange={(event) => updateNumberValue("deliveredAmount", event.target.value)}
                className={numericInputClassName()}
                placeholder={preview ? formatNumber(preview.deliveredAmount, "money") : "يحسب تلقائيًا"}
              />
            </Field>
          </div>
        </Section>

        <Section title="الأسعار" hint="سعر العميل دائمًا = الكبير ÷ الصغير حسب أسعار الدولار.">
          <div className="grid gap-4">
            <div className="rounded-lg border border-line/80 bg-paper/80 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-ink">أسعار العملات مقابل الدولار</p>
                  <p className="mt-1 text-xs text-muted">الدولار = 1. تظهر هنا فقط العملات المطلوبة لهذه العملية.</p>
                </div>
              </div>

              {neededReferenceCurrencies.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {neededReferenceCurrencies.map((currency) => (
                    <Field key={currency} label={currencyLabels[currency]}>
                      <input
                        inputMode="decimal"
                        dir="ltr"
                        value={values.usdRates[currency] || ""}
                        onChange={(event) => updateUsdRate(currency, event.target.value)}
                        className={numericInputClassName()}
                        placeholder={`كم ${currencyLabels[currency]} لكل 1 دولار`}
                      />
                    </Field>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-lg border border-line/70 bg-white px-3 py-2 text-sm text-muted">لا توجد أسعار مرجعية مطلوبة لهذه العملات.</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="سعر التكلفة" hint="يحسب تلقائيًا من أسعار العملات مقابل الدولار.">
                <input
                  inputMode="decimal"
                  dir="ltr"
                  value={displayCostRate ? formatNumber(displayCostRate, "rate") : ""}
                  readOnly
                  className={numericInputClassName("bg-paper/80 text-muted")}
                  placeholder="يحسب تلقائيًا"
                />
                {displayCostRate ? (
                  <span className="mt-2 block rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-ink">
                    سعر التكلفة: كل 1 {rateBaseLabel} = {formatNumber(displayCostRate, "rate")} {rateQuoteLabel}
                  </span>
                ) : null}
              </Field>

              <Field label="سعر العميل">
                <input
                  inputMode="decimal"
                  dir="ltr"
                  value={values.customerRate}
                  onChange={(event) => updateNumberValue("customerRate", event.target.value)}
                  onBlur={() => {
                    if (!values.customerRate) return;
                    try {
                      const normalized = normalizeRateByMagnitude(values.customerRate);
                      updateValue("customerRate", normalized.toString());
                    } catch {
                      return;
                    }
                  }}
                  className={numericInputClassName()}
                  placeholder="0"
                />
                <span className="mt-2 block rounded-lg border border-line/70 bg-paper/80 px-3 py-2 text-xs text-muted">
                  كل 1 {rateBaseLabel} = {displayCustomerRate || "0"} {rateQuoteLabel}
                </span>
              </Field>
            </div>
          </div>
        </Section>

        <Section title="الحالة">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="حالة الاستلام">
              <select
                value={values.receivedStatus}
                onChange={(event) => updateValue("receivedStatus", event.target.value as ReceivedStatusCode)}
                className={inputClassName()}
              >
                {receivedStatusValues.map((item) => (
                  <option key={item} value={item}>
                    {receivedStatusLabels[item]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="حالة التسليم">
              <select
                value={values.deliveredStatus}
                onChange={(event) => updateValue("deliveredStatus", event.target.value as DeliveredStatusCode)}
                className={inputClassName()}
              >
                {deliveredStatusValues.map((item) => (
                  <option key={item} value={item}>
                    {deliveredStatusLabels[item]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        <Section title="العمولة" hint="اختيارية، وتخصم من صافي الربح في التقارير بدون تغيير ربح العملية نفسه.">
          <div className="grid gap-4">
            <label className="flex items-center gap-2 rounded-lg border border-line/80 bg-mint/70 px-3 py-3 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={values.commissionEnabled}
                onChange={(event) => updateValue("commissionEnabled", event.target.checked)}
                className="h-4 w-4"
              />
              هل يوجد عمولة؟
            </label>

            {values.commissionEnabled ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="اسم صاحب العمولة">
                  <input
                    value={values.commissionPersonName}
                    onChange={(event) => updateValue("commissionPersonName", event.target.value)}
                    className={inputClassName()}
                    placeholder="اختياري"
                  />
                </Field>

                <Field label="نوع العمولة">
                  <select
                    value={values.commissionType}
                    onChange={(event) => updateValue("commissionType", event.target.value as TransferFormValues["commissionType"])}
                    className={inputClassName()}
                  >
                    {commissionTypeValues.map((type) => (
                      <option key={type} value={type}>
                        {commissionTypeLabels[type]}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="قيمة العمولة" hint={values.commissionType === "PERCENTAGE" ? "اكتب النسبة فقط، مثال: 10" : undefined}>
                  <input
                    inputMode="decimal"
                    dir="ltr"
                    value={values.commissionValue}
                    onChange={(event) => updateNumberValue("commissionValue", event.target.value)}
                    className={numericInputClassName()}
                    placeholder={values.commissionType === "PERCENTAGE" ? "10" : "500"}
                  />
                </Field>

                {values.commissionType === "PERCENTAGE" ? (
                  <Field label="تُحسب من">
                    <select
                      value={values.commissionBase}
                      onChange={(event) => updateValue("commissionBase", event.target.value as TransferFormValues["commissionBase"])}
                      className={inputClassName()}
                    >
                      {commissionBaseValues.map((base) => (
                        <option key={base} value={base}>
                          {commissionBaseLabels[base]}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <Field label="عملة العمولة">
                    <select
                      value={values.commissionCurrency}
                      onChange={(event) => updateValue("commissionCurrency", event.target.value as CurrencyCode)}
                      className={inputClassName()}
                    >
                      {currencyValues.map((currency) => (
                        <option key={currency} value={currency}>
                          {currencyLabels[currency]}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm md:col-span-2">
                  <p className="font-semibold text-ink">قيمة العمولة المحسوبة</p>
                  <p className="mt-1 text-muted">
                    {commissionPreview
                      ? formatMoneyLabel(commissionPreview.amount, commissionPreview.currency)
                      : "ستظهر بعد إدخال بيانات العملية والعمولة"}
                  </p>
                  {values.commissionType === "PERCENTAGE" ? (
                    <p className="mt-1 text-xs text-muted">
                      عملة العمولة تتبع أساس الحساب المختار حتى لا يتم تحويل العملات بدون سعر واضح.
                    </p>
                  ) : null}
                </div>

                <Field label="ملاحظات العمولة">
                  <input
                    value={values.commissionNotes}
                    onChange={(event) => updateValue("commissionNotes", event.target.value)}
                    className={inputClassName()}
                    placeholder="اختياري"
                  />
                </Field>
              </div>
            ) : null}
          </div>
        </Section>

        <Section title="ملاحظات">
          <textarea
            rows={4}
            value={values.notes}
            onChange={(event) => updateValue("notes", event.target.value)}
            className={inputClassName("resize-y leading-7")}
            placeholder="أي ملاحظات خاصة بالعملية"
          />
        </Section>
      </div>

      <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
        <section className="rounded-lg border border-olive/25 bg-white/95 p-5 shadow-soft backdrop-blur">
          <div className="border-b border-line pb-4">
            <h3 className="text-lg font-bold text-ink">ملخص العملية</h3>
            <p className="mt-1 text-sm text-muted">راجع الأرقام قبل الحفظ.</p>
          </div>

          {preview ? (
            <div className="mt-4 grid gap-3">
              <SummaryRow label="استلمنا" value={<span dir="ltr">{formatMoneyLabel(values.receivedAmount, values.receivedCurrency)}</span>} />
              <SummaryRow label="سنسلم" value={<span dir="ltr">{formatMoneyLabel(preview.deliveredAmount, values.deliveredCurrency)}</span>} />
              <SummaryRow
                label="سعر التكلفة"
                value={
                  <span>
                    كل 1 {rateBaseLabel} = <span dir="ltr">{formatNumber(preview.costRate, "rate")}</span> {rateQuoteLabel}
                  </span>
                }
              />
              <SummaryRow
                label="سعر العميل"
                value={
                  <span>
                    كل 1 {rateBaseLabel} = <span dir="ltr">{displayCustomerRate || "0"}</span> {rateQuoteLabel}
                  </span>
                }
              />
              <SummaryRow
                label="فرق السعر"
                value={
                  <span>
                    <span dir="ltr">{formatNumber(rateDifferencePreview ?? preview.rateDifference, "money")}</span> {rateQuoteLabel}
                  </span>
                }
              />
              <SummaryRow
                label="ربح العملية"
                value={<span dir="ltr">{formatMoneyLabel(preview.profitAmount, preview.profitCurrency)}</span>}
                tone={preview.profitAmount.isNegative() ? "warning" : "success"}
              />
              <SummaryRow
                label="العمولة"
                value={
                  commissionPreview
                    ? <span dir="ltr">{formatMoneyLabel(commissionPreview.amount, commissionPreview.currency)}</span>
                    : values.commissionEnabled
                      ? "أكمل بيانات العمولة"
                      : "لا توجد عمولة"
                }
              />
              <SummaryRow label="حالة العملية" value={transferStatusLabels[status]} />
              <SummaryRow
                label="المتبقي"
                value={
                  openInfo
                    ? openInfo.side === "PENDING"
                      ? openInfo.label
                      : (
                          <span>
                            {openInfo.label}: <span dir="ltr">{formatMoneyLabel(openInfo.amount, openInfo.currency)}</span>
                          </span>
                        )
                    : "لا يوجد مبلغ مفتوح"
                }
              />
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-line bg-paper px-4 py-6 text-center">
              <p className="font-semibold text-ink">الملخص سيظهر هنا</p>
              <p className="mt-1 text-sm leading-6 text-muted">أدخل المبلغ، العملات، الأسعار، وسعر العميل لرؤية الحسابات.</p>
            </div>
          )}

          {preview?.profitAmount.isNegative() ? (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700">
              تنبيه: هذه العملية تظهر خسارة وليست ربحًا.
            </p>
          ) : null}

          {serverError ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-700">{serverError}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 font-semibold text-white transition hover:bg-olive disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {transactionId ? "حفظ التعديل" : "حفظ العملية"}
          </button>
        </section>
      </aside>
    </form>
  );
}
