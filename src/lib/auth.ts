import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { listAdminUsers } from "./admin-users";
import type { AdminPermission, AdminUser } from "./types";

export const ADMIN_COOKIE = "cxc_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function sessionSecret() {
  if (process.env.NODE_ENV === "production") return process.env.ADMIN_SESSION_SECRET || "";
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(payload: string) {
  const secret = sessionSecret();
  if (!secret) throw new Error("Admin session signing is not configured.");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAdminSessionToken(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function getSessionUserId(token: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return null;
  }
  const receivedBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (receivedBytes.length !== expectedBytes.length || !timingSafeEqual(receivedBytes, expectedBytes)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as {
      userId?: unknown;
      expiresAt?: unknown;
    };
    if (typeof session.userId !== "string" || typeof session.expiresAt !== "number" || session.expiresAt <= Date.now()) return null;
    return session.userId;
  } catch {
    return null;
  }
}

export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const userId = getSessionUserId(token);
  if (!userId) return null;
  const users = await listAdminUsers();
  return users.find((user) => user.id === userId && user.active) ?? null;
}

export async function hasAdminPermission(permission: AdminPermission): Promise<boolean> {
  const user = await getCurrentAdminUser();
  return Boolean(user?.permissions.includes(permission));
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return Boolean(await getCurrentAdminUser());
}