"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CustomerForm } from "@/components/forms/customer-form";

export function CustomerCreateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="action-primary min-h-12 w-full px-5 py-3 shadow-sm sm:w-fit">
        <Plus className="h-4 w-4" />
        إضافة عميل / تاجر
      </button>

      {mounted && isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/45 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="customer-create-title"
              onMouseDown={() => setIsOpen(false)}
            >
              <div
                className="w-full max-w-2xl rounded-lg border border-line/80 bg-white p-4 shadow-2xl sm:p-6"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="mb-5 flex items-center justify-between gap-3 border-b border-line/70 pb-4">
                  <div>
                    <h3 id="customer-create-title" className="text-xl font-bold text-ink">
                      إضافة عميل أو تاجر
                    </h3>
                    <p className="mt-1 text-sm text-muted">اكتب بيانات العميل الأساسية، ويمكنك تعديلها لاحقًا من صفحة التفاصيل.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-muted hover:bg-paper hover:text-ink"
                    aria-label="إغلاق"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <CustomerForm onSaved={() => setIsOpen(false)} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
