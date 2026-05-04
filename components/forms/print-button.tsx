"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "طباعة" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-mint sm:w-auto"
      title={label}
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
