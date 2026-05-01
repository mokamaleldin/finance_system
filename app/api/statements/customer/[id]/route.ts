import { Currency } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import React from "react";
import { CustomerStatementDocument } from "@/lib/pdf/customer-statement-document";
import { requireApiAuth, serverErrorResponse } from "@/lib/api";
import { formatDateInput, parseOptionalDateParam } from "@/lib/format";
import { getCustomerStatement } from "@/lib/ledger";
import { currencyValues } from "@/lib/options";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const from = parseOptionalDateParam(searchParams.get("from") || undefined);
  const to = parseOptionalDateParam(searchParams.get("to") || undefined, true);
  const currencyParam = searchParams.get("currency");
  const currency =
    currencyParam && currencyValues.includes(currencyParam as never)
      ? (currencyParam as Currency)
      : undefined;

  try {
    const statement = await getCustomerStatement(id, { from, to, currency });
    const document = React.createElement(CustomerStatementDocument, {
      statement,
      from,
      to,
      currency,
    }) as Parameters<typeof renderToBuffer>[0];
    const buffer = await renderToBuffer(document);
    const filenameParts = [
      "customer-statement",
      statement.customer.name.replace(/\s+/g, "-"),
      from ? formatDateInput(from) : "start",
      to ? formatDateInput(to) : "now",
    ];

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filenameParts.join("-"))}.pdf`,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
