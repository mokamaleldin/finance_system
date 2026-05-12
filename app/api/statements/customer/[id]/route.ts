import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import React from "react";
import { requireApiAuth, serverErrorResponse } from "@/lib/api";
import { CustomerStatementDocument } from "@/lib/pdf/customer-statement-document";
import { getCustomerTransferSummary } from "@/lib/transfer-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const { id } = await context.params;

  try {
    const summary = await getCustomerTransferSummary(id);
    const document = React.createElement(CustomerStatementDocument, { summary }) as Parameters<typeof renderToBuffer>[0];
    const buffer = await renderToBuffer(document);
    const filename = `customer-report-${summary.customer.name.replace(/\s+/g, "-")}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    return serverErrorResponse(error, "GET /api/statements/customer/[id]");
  }
}
