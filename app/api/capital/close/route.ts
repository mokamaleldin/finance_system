import { NextResponse } from "next/server";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { createCapitalClose, getCapitalCloses } from "@/lib/capital-service";
import { capitalCloseSchema } from "@/lib/validations";

export async function GET() {
  const authError = await requireApiAuth("capital:read");
  if (authError) return authError;

  try {
    const closes = await getCapitalCloses();
    return NextResponse.json({ closes });
  } catch (error) {
    return serverErrorResponse(error, "GET /api/capital/close");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAuth("capital:write");
  if (authError) return authError;

  const parsed = capitalCloseSchema.safeParse(await request.json());
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const close = await createCapitalClose(parsed.data);
    return NextResponse.json({ close }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error, "POST /api/capital/close");
  }
}
