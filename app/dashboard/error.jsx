"use client";

import { useEffect } from "react";

export default function DashboardError({ error, reset }) {
  useEffect(() => {
    console.error("[app/dashboard/error] Unhandled dashboard error", error);
  }, [error]);

  return (
    <div className="grid gap-4">
      <section className="rounded-lg border border-red-100 bg-red-50 p-5 text-red-800 shadow-sm">
        <h2 className="text-xl font-bold">تعذر تحميل الصفحة</h2>
        <p className="mt-2 text-sm leading-6">حدث خطأ أثناء تحميل بيانات هذه الصفحة. تم تسجيل الخطأ للمراجعة.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg bg-ink px-4 py-2.5 font-semibold text-white hover:bg-olive"
        >
          إعادة المحاولة
        </button>
      </section>
    </div>
  );
}
