import { NextResponse } from "next/server";
import { createSessionToken, getSessionCookieOptions, SESSION_COOKIE_NAME, verifyAdminCredentials } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { message: "راجع بيانات الدخول", errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const isValid = verifyAdminCredentials(parsed.data.email, parsed.data.password);

    if (!isValid) {
      return NextResponse.json({ message: "البريد أو كلمة المرور غير صحيحة" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      createSessionToken(parsed.data.email),
      getSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "إعدادات تسجيل الدخول غير مكتملة" },
      { status: 500 },
    );
  }
}
