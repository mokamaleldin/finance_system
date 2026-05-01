import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiSession } from "@/lib/auth";

export async function requireApiAuth() {
  if (!(await requireApiSession())) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
  }

  return null;
}

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json(
    {
      message: "راجع البيانات المدخلة",
      errors: error.flatten().fieldErrors,
    },
    { status: 400 },
  );
}

export function serverErrorResponse(error: unknown) {
  console.error(error);
  return NextResponse.json(
    { message: "حدث خطأ غير متوقع. حاول مرة أخرى." },
    { status: 500 },
  );
}
