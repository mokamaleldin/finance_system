import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import React from "react";
import { requireApiAuth, serverErrorResponse } from "@/lib/api";
import { parseDateParam } from "@/lib/format";
import { ReportDocument } from "@/lib/pdf/report-document";
import {
  getReportByDateRange,
  getReportDateRange,
  parseReportPeriod,
} from "@/lib/report-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const params = new URL(request.url).searchParams;
  const period = parseReportPeriod(params.get("period") || undefined);
  const from = parseDateParam(params.get("from") || undefined, new Date());
  const to = parseDateParam(params.get("to") || undefined, new Date());
  const range = getReportDateRange({ period, from, to });

  try {
    const report = await getReportByDateRange(range.start, range.end);
    const document = React.createElement(ReportDocument, { report }) as Parameters<typeof renderToBuffer>[0];
    const buffer = await renderToBuffer(document);
    const filename = `report-${range.period}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    return serverErrorResponse(error, "GET /api/reports/pdf");
  }
}
