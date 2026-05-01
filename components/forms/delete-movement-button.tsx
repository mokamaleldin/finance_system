"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteMovementButton({ movementId }: { movementId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function remove() {
    const confirmed = window.confirm(
      "تحذير: حذف حركة مالية سيغير أرصدة العميل والمعاملة المرتبطة. هل تريد المتابعة؟",
    );

    if (!confirmed) {
      return;
    }

    setIsLoading(true);
    const response = await fetch(`/api/movements/${movementId}`, { method: "DELETE" });
    setIsLoading(false);

    if (!response.ok) {
      alert("تعذر حذف الحركة");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={isLoading}
      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
      title="حذف الحركة"
    >
      <Trash2 className="h-3.5 w-3.5" />
      حذف
    </button>
  );
}
