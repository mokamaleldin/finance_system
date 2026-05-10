"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function remove() {
    const confirmed = window.confirm(`سيتم حذف حساب ${email}. هل تريد المتابعة؟`);
    if (!confirmed) return;

    setIsLoading(true);
    const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    setIsLoading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      alert(payload?.message ?? "تعذر حذف المستخدم");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={isLoading}
      className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      <Trash2 className="h-3.5 w-3.5" />
      حذف
    </button>
  );
}
