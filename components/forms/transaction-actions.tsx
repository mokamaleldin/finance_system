"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelTransactionButton({ transactionId }: { transactionId: string }) {
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
      className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 md:px-2 md:py-1"
    >
      <XCircle className="h-3.5 w-3.5" />
      إلغاء
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
