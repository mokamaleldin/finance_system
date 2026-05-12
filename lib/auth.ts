import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";
import { hasPermission, isUserRole, type Permission, type UserRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-logging";

export { SESSION_COOKIE_NAME };

type SessionPayload = {
  email: string;
  role: UserRole;
  exp: number;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 16) {
    console.error("[env-check] AUTH_SECRET is missing or shorter than 16 characters.");
    throw new Error("AUTH_SECRET must be set to a long random value.");
  }

  return secret;
}

function base64UrlJson(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function sign(value: string) {
  return crypto.createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

async function verifyPassword(password: string, storedPassword: string) {
  if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
    return bcrypt.compare(password, storedPassword);
  }

  return safeCompare(password, storedPassword);
}

export async function verifyAdminCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  let canUseEnvFallback = false;

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { email: true, passwordHash: true, role: true },
    });

    if (user && await verifyPassword(password, user.passwordHash)) {
      return { email: user.email, role: user.role as UserRole };
    }

    canUseEnvFallback = await prisma.user.count() === 0;
  } catch (error) {
    console.error(error);
    return null;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (canUseEnvFallback && adminEmail && adminPassword && safeCompare(normalizedEmail, adminEmail.toLowerCase()) && safeCompare(password, adminPassword)) {
    return { email: adminEmail, role: "FULL_ADMIN" as const };
  }

  return null;
}

export function createSessionToken(session: Pick<SessionPayload, "email" | "role">) {
  const payload = base64UrlJson({
    email: session.email,
    role: session.role,
    exp: Date.now() + 1000 * 60 * 60 * 12,
  });

  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  let payload: string | undefined;
  let signature: string | undefined;

  try {
    [payload, signature] = token.split(".");
  } catch (error) {
    logServerError("auth.verifySessionToken: malformed session token", error);
    return null;
  }

  try {
    if (!payload || !signature || !safeCompare(signature, sign(payload))) {
      return null;
    }
  } catch (error) {
    logServerError("auth.verifySessionToken: unable to verify signature", error);
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;

    if (!session.email || !isUserRole(session.role) || session.exp < Date.now()) {
      return null;
    }

    return session;
  } catch (error) {
    logServerError("auth.verifySessionToken", error);
    return null;
  }
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function requireAdminSession() {
  const session = await getCurrentAdmin();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireApiSession() {
  return await getCurrentAdmin();
}

export async function requirePagePermission(permission: Permission) {
  const session = await requireAdminSession();

  if (!hasPermission(session.role, permission)) {
    redirect("/dashboard");
  }

  return session;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}
