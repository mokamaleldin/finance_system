"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("[app/error] Unhandled app error", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <main className="min-h-screen bg-paper px-4 py-10">
          <section className="mx-auto max-w-xl rounded-lg border border-red-100 bg-white p-6 text-center shadow-soft">
            <h1 className="text-2xl font-bold text-ink">حدث خطأ أثناء تحميل الصفحة</h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              لم يتمكن النظام من تحميل البيانات الآن. تم تسجيل الخطأ للمراجعة.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-5 rounded-lg bg-ink px-4 py-2.5 font-semibold text-white hover:bg-olive"
            >
              إعادة المحاولة
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
