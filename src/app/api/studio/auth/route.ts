// Studio Auth API — Login, Logout, Session check
// POST /api/studio/auth     → login
// DELETE /api/studio/auth   → logout
// GET /api/studio/auth      → session check

import { NextRequest, NextResponse } from "next/server";
import {
  STUDIO_COOKIE,
  createStudioSessionToken,
  getStudioSession,
  studioSessionCookieOptions,
} from "@/lib/studio-auth";
import { authenticateStudioUser } from "@/lib/studio-db";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

// Simple in-memory throttle (sufficient for a low-traffic Studio endpoint)
// For production scale, replace with a Redis or DB-backed throttle.
const loginThrottle = new Map<string, { count: number; lockedUntil: number }>();

function getClientKey(req: NextRequest): string {
  return (
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function pruneThrottle() {
  const now = Date.now();
  for (const [key, entry] of loginThrottle) {
    if (entry.count === 0 && now > entry.lockedUntil) loginThrottle.delete(key);
  }
}

export async function GET() {
  const session = await getStudioSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, session });
}

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request);
  pruneThrottle();

  const entry = loginThrottle.get(clientKey);
  if (entry && Date.now() <= entry.lockedUntil) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email, password } = body as Record<string, unknown>;
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = await authenticateStudioUser(email, password).catch(() => null);

  if (!user) {
    const current = loginThrottle.get(clientKey) ?? { count: 0, lockedUntil: 0 };
    current.count += 1;
    if (current.count >= MAX_ATTEMPTS) {
      current.lockedUntil = Date.now() + LOCKOUT_MS;
      current.count = 0;
    }
    loginThrottle.set(clientKey, current);
    // Generic error to avoid account enumeration
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Clear throttle on success
  loginThrottle.delete(clientKey);

  const token = createStudioSessionToken({
    userId: user.id,
    role: user.role,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  });

  const isHttps =
    request.nextUrl.protocol === "https:" ||
    process.env.NODE_ENV === "production";

  const response = NextResponse.json({
    success: true,
    session: {
      userId: user.id,
      role: user.role,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
  });

  response.cookies.set(STUDIO_COOKIE, token, studioSessionCookieOptions(isHttps));
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete({
    name: STUDIO_COOKIE,
    path: "/",
  });
  return response;
}
