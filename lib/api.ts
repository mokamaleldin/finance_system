import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiSession } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/permissions";

export async function requireApiAuth(permission?: Permission) {
  const session = await requireApiSession();

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

export function serverErrorResponse(error: unknown) {
  console.error(error);
  return NextResponse.json(
    { message: "حدث خطأ غير متوقع. حاول مرة أخرى." },
    { status: 500 },
  );
}
