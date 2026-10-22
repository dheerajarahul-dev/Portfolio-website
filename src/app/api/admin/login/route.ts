import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSessionToken } from "@/lib/auth";
import { authenticateAdmin } from "@/lib/admin-users";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const THROTTLE_FILE = path.join(process.cwd(), "data", ".login-throttle.json");
const MAX_TRACKED_KEYS = 500;

interface ThrottleEntry {
  count: number;
  lockedUntil: number;
}

type ThrottleState = Record<string, ThrottleEntry>;

/**
 * File-backed brute-force throttle. A file (rather than module state) is used
 * because route-handler module state is not reliably shared across requests
 * in this Next.js runtime, and it also keeps lockouts across restarts.
 * Login attempts are rare, so the extra I/O is negligible.
 */
async function readThrottle(): Promise<ThrottleState> {
  try {
    const raw = await fs.readFile(THROTTLE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as ThrottleState;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

async function writeThrottle(state: ThrottleState): Promise<void> {
  try {
    await fs.mkdir(path.dirname(THROTTLE_FILE), { recursive: true });
    await fs.writeFile(THROTTLE_FILE, JSON.stringify(state), "utf-8");
  } catch (error) {
    console.error("Failed to persist login throttle state:", error);
  }
}

function pruneState(state: ThrottleState): ThrottleState {
  const now = Date.now();
  const entries = Object.entries(state).filter(
    ([, entry]) => now <= entry.lockedUntil || entry.count > 0
  );
  if (entries.length <= MAX_TRACKED_KEYS) return Object.fromEntries(entries);
  // Keep the most recently locked entries when over budget.
  return Object.fromEntries(
    entries.sort((a, b) => b[1].lockedUntil - a[1].lockedUntil).slice(0, MAX_TRACKED_KEYS)
  );
}

function getClientKey(request: NextRequest): string {
  const netlifyAddress = request.headers.get("x-nf-client-connection-ip");
  if (netlifyAddress) return netlifyAddress;
  if (process.env.NETLIFY) return "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json(
      { error: "Admin session signing is not configured on this server." },
      { status: 503 }
    );
  }

  const clientKey = getClientKey(request);

  const state = await readThrottle();
  const entry = state[clientKey];
  if (process.env.NODE_ENV === "production" && entry && Date.now() <= entry.lockedUntil) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  if (!process.env.ADMIN_PASSWORD && !process.env.SUPABASE_URL) {
    console.error(
      "Admin account bootstrap is not configured. Set ADMIN_PASSWORD or configure hosted admin accounts."
    );
    return NextResponse.json(
      { error: "Admin login is not configured on this server." },
      { status: 503 }
    );
  }

  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { username, password } = body as Record<string, unknown>;
    const providedUsername = typeof username === "string" ? username : "";
    const provided = typeof password === "string" ? password : "";
    const user = providedUsername ? await authenticateAdmin(providedUsername, provided) : null;
    if (!user) {
      const next = pruneState(state);
      const current = next[clientKey] ?? { count: 0, lockedUntil: 0 };
      current.count += 1;
      if (current.count >= MAX_FAILED_ATTEMPTS) {
        current.lockedUntil = Date.now() + LOCKOUT_MS;
        current.count = 0;
      }
      next[clientKey] = current;
      await writeThrottle(next);
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Successful login clears any prior failures for this client.
    if (state[clientKey]) {
      delete state[clientKey];
      await writeThrottle(state);
    }

    const response = NextResponse.json({ success: true, user });
    response.cookies.set(ADMIN_COOKIE, createAdminSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" || request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
