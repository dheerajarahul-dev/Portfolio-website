// ─────────────────────────────────────────────────────────────────────────────
// Creative X Studio — Authentication Layer
// Separate from the CMS admin auth (cxc_admin cookie).
// Studio uses its own cookie: cxs_session
// ─────────────────────────────────────────────────────────────────────────────

import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { StudioSession, StudioRole } from "./studio-types";

export const STUDIO_COOKIE = "cxs_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function sessionSecret(): string {
  if (process.env.NODE_ENV === "production") {
    const prodSecret = process.env.STUDIO_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
    if (!prodSecret) {
      throw new Error("Studio session signing secret is not configured in production. Set STUDIO_SESSION_SECRET or ADMIN_SESSION_SECRET.");
    }
    return prodSecret;
  }
  return (
    process.env.STUDIO_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "cxs_default_secret_key_studio_session_signing_32b"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export interface StudioSessionPayload {
  userId: string;
  role: StudioRole;
  expiresAt: number;
}

export function createStudioSessionToken(payload: StudioSessionPayload): string {
  const encoded = Buffer.from(
    JSON.stringify({ ...payload, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 })
  ).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function decodeStudioSessionToken(token: string): StudioSessionPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  let expected: string;
  try {
    expected = sign(encoded);
  } catch {
    return null;
  }

  const receivedBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (
    receivedBytes.length !== expectedBytes.length ||
    !timingSafeEqual(receivedBytes, expectedBytes)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8")
    ) as Record<string, unknown>;

    if (
      typeof session.userId !== "string" ||
      typeof session.role !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) {
      return null;
    }

    return {
      userId: session.userId,
      role: session.role as StudioRole,
      expiresAt: session.expiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * Reads the studio session cookie and returns the raw payload.
 * Does NOT verify user still exists and is active — use getStudioSession() for that.
 */
export async function getStudioSessionPayload(): Promise<StudioSessionPayload | null> {
  const token = (await cookies()).get(STUDIO_COOKIE)?.value;
  if (!token) return null;
  return decodeStudioSessionToken(token);
}

/**
 * Returns the full studio session, verifying the user is still active in the DB.
 * This is the primary function to call in API route handlers.
 */
export async function getStudioSession(): Promise<StudioSession | null> {
  const payload = await getStudioSessionPayload();
  if (!payload) return null;

  // Lazy import to avoid circular deps
  const { getStudioUserById } = await import("./studio-db");
  const user = await getStudioUserById(payload.userId);
  if (!user || !user.active) return null;

  return {
    userId: user.id,
    role: user.role,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Require an authenticated studio session, returning it or throwing a 401-worthy error.
 */
export async function requireStudioSession(): Promise<StudioSession> {
  const session = await getStudioSession();
  if (!session) {
    throw new StudioAuthError("Not authenticated");
  }
  return session;
}

/**
 * Require a specific permission for the current session.
 */
export async function requireStudioPermission(
  permission: import("./studio-types").StudioPermission
): Promise<StudioSession> {
  const session = await requireStudioSession();
  const { hasPermission } = await import("./studio-permissions");
  if (!hasPermission(session.role, permission)) {
    throw new StudioAuthError("Insufficient permissions", "FORBIDDEN");
  }
  return session;
}

/**
 * Require one of several roles.
 */
export async function requireStudioRole(
  ...roles: import("./studio-types").StudioRole[]
): Promise<StudioSession> {
  const session = await requireStudioSession();
  if (!roles.includes(session.role)) {
    throw new StudioAuthError("Insufficient permissions", "FORBIDDEN");
  }
  return session;
}

// ── Typed auth error for consistent API responses ─────────────────────────────

export class StudioAuthError extends Error {
  public readonly code: string;
  constructor(message: string, code: "UNAUTHENTICATED" | "FORBIDDEN" = "UNAUTHENTICATED") {
    super(message);
    this.name = "StudioAuthError";
    this.code = code;
  }
}

// ── Invitation token utilities ─────────────────────────────────────────────────

/**
 * Generate a URL-safe invitation token.
 * Only the hash is stored in the DB — the plaintext is sent in the invite email.
 */
export function generateInvitationToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  const hash = createHmac("sha256", sessionSecret()).update(token).digest("hex");
  return { token, hash };
}

export function hashInvitationToken(token: string): string {
  return createHmac("sha256", sessionSecret()).update(token).digest("hex");
}

// ── Cookie helpers used by route handlers ─────────────────────────────────────

export function studioSessionCookieOptions(isHttps: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isHttps || process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
