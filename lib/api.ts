import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiSession } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/permissions";
import { logServerError } from "@/lib/server-logging";

export async function requireApiAuth(permission?: Permission) {
  let session;
  try {
    session = await requireApiSession();
  } catch (error) {
    logServerError("requireApiAuth: failed to read session", error);
    return NextResponse.json({ message: "تعذر التحقق من الجلسة" }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
  }

  if (permission && !hasPermission(session.role, permission)) {
    return NextResponse.json({ message: "ليست لديك صلاحية لتنفيذ هذا الإجراء" }, { status: 403 });
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

export function serverErrorResponse(error: unknown, context = "api route") {
  logServerError(context, error);
  return NextResponse.json(
    { message: "حدث خطأ غير متوقع. حاول مرة أخرى." },
    { status: 500 },
  );
}
