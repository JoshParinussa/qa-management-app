import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import type { Role } from "@/types";

const SESSION_COOKIE = "qa_session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (process.env.NODE_ENV === "production" && (!secret || secret === "change-me")) {
    throw new Error("SESSION_SECRET is required in production");
  }

  if (!secret || secret === "change-me") {
    return "dev-session-secret";
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function encodeSession(userId: string) {
  return `${userId}.${sign(userId)}`;
}

function decodeSession(value?: string) {
  if (!value) return null;

  const [userId, signature] = value.split(".");
  if (!userId || !signature) return null;

  const expected = sign(userId);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  return userId;
}

export async function createSession(userId: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, encodeSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userId = decodeSession(cookieStore.get(SESSION_COOKIE)?.value);

  if (!userId) return null;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return user;
}
