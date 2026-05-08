"use client";

import { MoreVertical } from "lucide-react";
import { DeleteCustomerButton } from "@/components/forms/delete-customer-button";

export function CustomerCardMenu({ customerId }: { customerId: string }) {
  return (
    <details className="group relative">
      <summary
        aria-label="خيارات العميل"
        className="inline-flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-muted hover:bg-paper [&::-webkit-details-marker]:hidden"
      >
        <MoreVertical className="h-4 w-4" />
      </summary>
      <div className="absolute right-0 top-10 z-30 w-40 rounded-lg border border-line bg-white p-2 shadow-soft">
        <DeleteCustomerButton
          customerId={customerId}
          className="flex w-full items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
        />
      </div>
    </details>
  );
}
