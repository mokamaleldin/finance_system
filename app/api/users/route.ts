import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireApiAuth, serverErrorResponse, validationErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { userCreateSchema } from "@/lib/validations";

export async function GET() {
  const authError = await requireApiAuth("users:manage");
  if (authError) return authError;

  try {
    const users = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { email: "asc" }],
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAuth("users:manage");
  if (authError) return authError;

  const parsed = userCreateSchema.safeParse(await request.json());
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
        role: parsed.data.role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "هذا البريد مسجل بالفعل" }, { status: 409 });
    }

    return serverErrorResponse(error);
  }
}
