import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { userUpdateSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function countFullAdmins() {
  return prisma.user.count({ where: { role: "FULL_ADMIN" } });
}

export async function PATCH(request: Request, context: RouteContext) {
  const authError = await requireApiAuth("users:manage");
  if (authError) return authError;

  const parsed = userUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return validationErrorResponse(parsed.error);

  const { id } = await context.params;

  try {
    const session = await getCurrentAdmin();
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });
    }

    if (session?.email === currentUser.email && parsed.data.role !== currentUser.role) {
      return NextResponse.json({ message: "لا يمكن تغيير صلاحية الحساب المستخدم حاليًا" }, { status: 400 });
    }

    if (currentUser.role === "FULL_ADMIN" && parsed.data.role !== "FULL_ADMIN" && await countFullAdmins() <= 1) {
      return NextResponse.json({ message: "لا يمكن إزالة آخر مدير كامل" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        role: parsed.data.role,
        ...(parsed.data.password
          ? { passwordHash: await bcrypt.hash(parsed.data.password, 10) }
          : {}),
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authError = await requireApiAuth("users:manage");
  if (authError) return authError;

  const session = await getCurrentAdmin();
  const { id } = await context.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });
    }

    if (session?.email === user.email) {
      return NextResponse.json({ message: "لا يمكن حذف الحساب المستخدم حاليًا" }, { status: 400 });
    }

    if (user.role === "FULL_ADMIN" && await countFullAdmins() <= 1) {
      return NextResponse.json({ message: "لا يمكن حذف آخر مدير كامل" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id }, select: { id: true } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
