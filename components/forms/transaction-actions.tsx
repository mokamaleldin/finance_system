"use client";

import { CheckCircle2, PlusCircle, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import {
  currencyLabels,
  transferExecutionTypeLabels,
  transferExecutionTypeValues,
  type CurrencyCode,
  type TransferExecutionTypeCode,
} from "@/lib/options";

export function CancelTransactionButton({ transactionId, compact = false }: { transactionId: string; compact?: boolean }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function cancel() {
    const confirmed = window.confirm("سيتم إلغاء العملية وإخفاؤها من الحسابات. هل تريد المتابعة؟");
    if (!confirmed) return;
    const cancellationReason = window.prompt("سبب الإلغاء، اختياري") || "";

    setIsLoading(true);
    const response = await fetch(`/api/transactions/${transactionId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancellationReason }),
    });
    setIsLoading(false);

    if (!response.ok) {
      alert("تعذر إلغاء العملية");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={cancel}
      disabled={isLoading}
      className={
        compact
          ? "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-60"
          : "inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 md:px-2 md:py-1"
      }
      title="إلغاء"
    >
      <XCircle className="h-3.5 w-3.5" />
      <span className={compact ? "sr-only" : ""}>إلغاء</span>
    </button>
  );
}

export function CompleteStepButton({
  transactionId,
  step,
}: {
  transactionId: string;
  step: "received" | "delivered";
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const label = step === "received" ? "تم الاستلام" : "تم التسليم";

  async function updateStatus() {
    setIsLoading(true);
    const response = await fetch(`/api/transactions/${transactionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "status",
        ...(step === "received" ? { receivedStatus: "RECEIVED" } : { deliveredStatus: "DELIVERED" }),
      }),
    });
    setIsLoading(false);

    if (!response.ok) {
      alert("تعذر تحديث الحالة");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={updateStatus}
      disabled={isLoading}
      className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 md:px-2 md:py-1"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function toEnglishDigits(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";

  return value
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace("٫", ".")
    .replace("٬", "");
}

export function TransferExecutionForm({
  transactionId,
  receivedCurrency,
  deliveredCurrency,
  remainingReceived,
  remainingDelivered,
}: {
  transactionId: string;
  receivedCurrency: CurrencyCode;
  deliveredCurrency: CurrencyCode;
  remainingReceived: string;
  remainingDelivered: string;
}) {
  const router = useRouter();
  const [type, setType] = useState<TransferExecutionTypeCode>("RECEIVED");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const selectedCurrency = type === "RECEIVED" ? receivedCurrency : deliveredCurrency;
  const remaining = type === "RECEIVED" ? remainingReceived : remainingDelivered;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    const response = await fetch(`/api/transactions/${transactionId}/executions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        date,
        amount,
        notes,
      }),
    });
    setIsLoading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      alert(payload?.message ?? "تعذر تسجيل الدفعة");
      return;
    }

    setAmount("");
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-line/80 bg-paper/70 p-3">
      <div className="grid gap-3 md:grid-cols-4">
        <label className="block">
          <span className="text-xs font-semibold text-muted">نوع الدفعة</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as TransferExecutionTypeCode)}
            className="mt-1 min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-olive focus:ring-4 focus:ring-olive/10"
          >
            {transferExecutionTypeValues.map((item) => (
              <option key={item} value={item}>
                {transferExecutionTypeLabels[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted">التاريخ</span>
          <input
            type="date"
            dir="ltr"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-olive focus:ring-4 focus:ring-olive/10"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted">المبلغ</span>
          <input
            inputMode="decimal"
            dir="ltr"
            value={amount}
            onChange={(event) => setAmount(toEnglishDigits(event.target.value))}
            placeholder={`${remaining} ${selectedCurrency}`}
            className="mt-1 min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2 text-left font-mono text-sm tabular-nums outline-none focus:border-olive focus:ring-4 focus:ring-olive/10"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted">العملة</span>
          <input
            value={`${currencyLabels[selectedCurrency]} (${selectedCurrency})`}
            readOnly
            className="mt-1 min-h-11 w-full rounded-lg border border-line bg-white/70 px-3 py-2 text-sm text-muted outline-none"
          />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="ملاحظات اختيارية"
          className="min-h-11 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-olive focus:ring-4 focus:ring-olive/10"
        />
        <button
          type="submit"
          disabled={isLoading || !amount}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-olive disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlusCircle className="h-4 w-4" />
          تسجيل دفعة
        </button>
      </div>
    </form>
  );
}

export function DeleteTransferExecutionButton({ executionId }: { executionId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function remove() {
    const confirmed = window.confirm("حذف هذه الدفعة سيعيد حساب المتبقي. هل تريد المتابعة؟");
    if (!confirmed) return;

    setIsLoading(true);
    const response = await fetch(`/api/transactions/executions/${executionId}`, {
      method: "DELETE",
    });
    setIsLoading(false);

    if (!response.ok) {
      alert("تعذر حذف الدفعة");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={isLoading}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-60"
      title="حذف الدفعة"
    >
      <Trash2 className="h-3.5 w-3.5" />
      <span className="sr-only">حذف الدفعة</span>
    </button>
  );
}
