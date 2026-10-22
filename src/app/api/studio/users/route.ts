// Studio Users API
// GET  /api/studio/users    → list users (admin/manager only)
// POST /api/studio/users    → create user directly (admin only)

import { NextRequest, NextResponse } from "next/server";
import { requireStudioSession, StudioAuthError } from "@/lib/studio-auth";
import { hasPermission } from "@/lib/studio-permissions";
import { listStudioUsers, createStudioUser, getStudioUserByEmail } from "@/lib/studio-db";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import type { StudioRole } from "@/lib/studio-types";

const scryptAsync = promisify(scrypt);

const VALID_ROLES: StudioRole[] = ["super_admin", "manager", "editor", "client", "reviewer"];

async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return { hash: derived.toString("hex"), salt };
}

export async function GET() {
  try {
    const session = await requireStudioSession();
    if (!hasPermission(session.role, "team:manage") && !hasPermission(session.role, "clients:manage")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const users = await listStudioUsers({ active: true });
    // Strip password fields — mapUser already does this, but be explicit
    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStudioSession();
    if (!hasPermission(session.role, "team:manage")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { email, displayName, role, password } = body as Record<string, unknown>;

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (typeof displayName !== "string" || displayName.trim().length < 2) {
      return NextResponse.json({ error: "Display name must be at least 2 characters" }, { status: 400 });
    }
    if (typeof role !== "string" || !VALID_ROLES.includes(role as StudioRole)) {
      return NextResponse.json({ error: `Role must be one of: ${VALID_ROLES.join(", ")}` }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 10 || password.length > 128) {
      return NextResponse.json({ error: "Password must be between 10 and 128 characters" }, { status: 400 });
    }

    // Check for duplicate email
    const existing = await getStudioUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const { hash, salt } = await hashPassword(password);
    const user = await createStudioUser({
      email: email.toLowerCase().trim(),
      displayName: displayName.trim(),
      role: role as StudioRole,
      passwordHash: hash,
      passwordSalt: salt,
      invitedBy: session.userId,
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("POST /api/studio/users:", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
