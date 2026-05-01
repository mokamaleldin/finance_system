"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function remove() {
    const confirmed = window.confirm(
      "سيتم حذف العميل من القائمة، وستبقى العمليات القديمة محفوظة باسم العميل وقت العملية. هل تريد المتابعة؟",
    );
    if (!confirmed) return;

    setIsLoading(true);
    const response = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
    setIsLoading(false);

    if (!response.ok) {
      alert("تعذر حذف العميل");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={isLoading}
      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      <Trash2 className="h-3.5 w-3.5" />
      حذف
    </button>
  );
}
