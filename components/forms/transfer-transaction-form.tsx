"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  calculateTransfer,
  deriveTransferStatus,
} from "@/lib/transfer-calculations";
import {
  currencyLabels,
  currencyValues,
  deliveredStatusLabels,
  deliveredStatusValues,
  receivedStatusLabels,
  receivedStatusValues,
  transferStatusLabels,
  transferTypeLabels,
  transferTypeValues,
  type CurrencyCode,
  type DeliveredStatusCode,
  type ReceivedStatusCode,
  type TransferTypeCode,
} from "@/lib/options";
import { formatDecimal, formatMoney } from "@/lib/format";

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
  usdToEgp: string;
  usdToTry: string;
  customerRate: string;
  deliveredCurrency: CurrencyCode;
  deliveredAmount: string;
  receivedStatus: ReceivedStatusCode;
  deliveredStatus: DeliveredStatusCode;
  notes: string;
};

type TransferTransactionFormProps = {
  customers: CustomerOption[];
  transactionId?: string;
  initialValues?: Partial<TransferFormValues>;
};

const defaultValues: TransferFormValues = {
  date: new Date().toISOString().slice(0, 10),
  customerId: "",
  customerName: "",
  quickCustomerName: "",
  phone: "",
  createCustomer: false,
  type: "EGYPT_TO_TURKEY",
  receivedCurrency: "EGP",
  receivedAmount: "",
  usdToEgp: "",
  usdToTry: "",
  customerRate: "",
  deliveredCurrency: "TRY",
  deliveredAmount: "",
  receivedStatus: "RECEIVED",
  deliveredStatus: "NOT_DELIVERED",
  notes: "",
};

function inputClassName() {
  return "mt-2 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive";
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
  });
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const preview = useMemo(() => {
    try {
      if (
        !values.receivedAmount ||
        !values.usdToEgp ||
        !values.usdToTry ||
        !values.customerRate
      ) {
        return null;
      }

      return calculateTransfer({
        type: values.type,
        receivedCurrency: values.receivedCurrency,
        receivedAmount: values.receivedAmount,
        deliveredCurrency: values.deliveredCurrency,
        usdToEgp: values.usdToEgp,
        usdToTry: values.usdToTry,
        customerRate: values.customerRate,
        deliveredAmountOverride: values.deliveredAmount || undefined,
      });
    } catch {
      return null;
    }
  }, [values]);
  const status = deriveTransferStatus(values.receivedStatus, values.deliveredStatus);

  function updateValue<K extends keyof TransferFormValues>(key: K, value: TransferFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateType(type: TransferTypeCode) {
    setValues((current) => ({
      ...current,
      type,
      receivedCurrency: type === "EGYPT_TO_TURKEY" ? "EGP" : "TRY",
      deliveredCurrency: type === "EGYPT_TO_TURKEY" ? "TRY" : "EGP",
      deliveredAmount: "",
    }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError("");
    setIsSubmitting(true);

    const response = await fetch(
      transactionId ? `/api/transactions/${transactionId}` : "/api/transactions",
      {
        method: transactionId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      },
    );

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setServerError(payload?.message ?? "تعذر حفظ العملية");
      return;
    }

    router.push("/dashboard/transactions");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="text-sm font-semibold text-ink">التاريخ</label>
          <input
            type="date"
            value={values.date}
            onChange={(event) => updateValue("date", event.target.value)}
            className={inputClassName()}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">اختيار عميل موجود</label>
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
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">اسم جديد أو اسم عام</label>
          <input
            value={values.quickCustomerName}
            onChange={(event) => updateValue("quickCustomerName", event.target.value)}
            className={inputClassName()}
            placeholder="مثال: أحمد من القاهرة"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">رقم الهاتف</label>
          <input
            value={values.phone}
            onChange={(event) => updateValue("phone", event.target.value)}
            className={inputClassName()}
          />
        </div>

        <label className="mt-8 flex items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={values.createCustomer}
            onChange={(event) => updateValue("createCustomer", event.target.checked)}
            className="h-4 w-4"
          />
          حفظ الاسم الجديد في العملاء والتجار
        </label>

        <div>
          <label className="text-sm font-semibold text-ink">نوع العملية</label>
          <select
            value={values.type}
            onChange={(event) => updateType(event.target.value as TransferTypeCode)}
            className={inputClassName()}
          >
            {transferTypeValues.map((type) => (
              <option key={type} value={type}>
                {transferTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">العملة التي استلمناها</label>
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
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">المبلغ الذي استلمناه</label>
          <input
            inputMode="decimal"
            value={values.receivedAmount}
            onChange={(event) => updateValue("receivedAmount", event.target.value)}
            className={inputClassName()}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">سعر الدولار مقابل الجنيه</label>
          <input
            inputMode="decimal"
            value={values.usdToEgp}
            onChange={(event) => updateValue("usdToEgp", event.target.value)}
            className={inputClassName()}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">سعر الدولار مقابل الليرة</label>
          <input
            inputMode="decimal"
            value={values.usdToTry}
            onChange={(event) => updateValue("usdToTry", event.target.value)}
            className={inputClassName()}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">السعر الفعلي للعميل</label>
          <input
            inputMode="decimal"
            value={values.customerRate}
            onChange={(event) => updateValue("customerRate", event.target.value)}
            className={inputClassName()}
          />
          <p className="mt-1 text-xs text-muted">
            مثال تركيا إلى مصر: جنيه لكل 1 ليرة. مثال مصر إلى تركيا: جنيه لكل 1 ليرة.
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">العملة التي سنسلمها</label>
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
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">المبلغ الذي يجب تسليمه</label>
          <input
            inputMode="decimal"
            value={values.deliveredAmount}
            onChange={(event) => updateValue("deliveredAmount", event.target.value)}
            className={inputClassName()}
            placeholder={preview ? preview.deliveredAmount.toFixed(4) : "يحسب تلقائيًا"}
          />
          <p className="mt-1 text-xs text-muted">اتركه فارغًا ليتم حسابه تلقائيًا، أو عدله يدويًا عند الحاجة.</p>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">حالة الاستلام</label>
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
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">حالة التسليم</label>
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
        </div>

        <div className="md:col-span-2 xl:col-span-3">
          <label className="text-sm font-semibold text-ink">ملاحظات</label>
          <textarea
            rows={3}
            value={values.notes}
            onChange={(event) => updateValue("notes", event.target.value)}
            className={inputClassName()}
          />
        </div>
      </div>

      <section className="rounded-lg border border-line bg-mint p-4">
        <h3 className="font-bold text-ink">ملخص العملية قبل الحفظ</h3>
        {preview ? (
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
            <p>
              <span className="block text-muted">المبلغ المستلم</span>
              <strong>{formatMoney(values.receivedAmount, values.receivedCurrency)}</strong>
            </p>
            <p>
              <span className="block text-muted">المبلغ المطلوب تسليمه</span>
              <strong>{formatMoney(preview.deliveredAmount, values.deliveredCurrency)}</strong>
            </p>
            <p>
              <span className="block text-muted">السعر الحسابي/التكلفة</span>
              <strong>{formatDecimal(preview.theoreticalRate)}</strong>
            </p>
            <p>
              <span className="block text-muted">السعر الفعلي للعميل</span>
              <strong>{values.customerRate}</strong>
            </p>
            <p>
              <span className="block text-muted">ربح العملية</span>
              <strong>{formatMoney(preview.profitAmount, preview.profitCurrency)}</strong>
            </p>
            <p>
              <span className="block text-muted">حالة العملية</span>
              <strong>{transferStatusLabels[status]}</strong>
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">أدخل المبلغ والأسعار لعرض الملخص.</p>
        )}
      </section>

      {serverError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-fit items-center gap-2 rounded-lg bg-ink px-4 py-2.5 font-semibold text-white transition hover:bg-olive disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {transactionId ? "حفظ التعديل" : "حفظ العملية"}
      </button>
    </form>
  );
}
