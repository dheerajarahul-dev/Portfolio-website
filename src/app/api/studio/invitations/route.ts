// Studio Invitations API
// GET  /api/studio/invitations → list invitations
// POST /api/studio/invitations → create invitation

import { NextRequest, NextResponse } from "next/server";
import { requireStudioSession, StudioAuthError, generateInvitationToken } from "@/lib/studio-auth";
import { hasPermission } from "@/lib/studio-permissions";
import { listInvitations, createInvitation, getStudioUserByEmail } from "@/lib/studio-db";
import type { StudioRole } from "@/lib/studio-types";

export async function GET() {
  try {
    const session = await requireStudioSession();
    if (!hasPermission(session.role, "invitations:send")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const invitations = await listInvitations();
    return NextResponse.json({ success: true, data: invitations });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("GET /api/studio/invitations:", err);
    return NextResponse.json({ error: "Failed to list invitations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStudioSession();
    if (!hasPermission(session.role, "invitations:send")) {
      return NextResponse.json({ error: "Insufficient permissions to invite users" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { email, role } = body as Record<string, unknown>;

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const validRoles: StudioRole[] = ["super_admin", "manager", "editor", "client", "reviewer"];
    if (typeof role !== "string" || !validRoles.includes(role as StudioRole)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` }, { status: 400 });
    }

    // Check if user already exists
    const existing = await getStudioUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "A user with this email is already registered" }, { status: 409 });
    }

    const { token, hash } = generateInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const invitation = await createInvitation({
      email: email.toLowerCase().trim(),
      role: role as StudioRole,
      tokenHash: hash,
      invitedBy: session.userId,
      expiresAt,
    });

    const inviteUrl = `${request.nextUrl.origin}/studio/invite?token=${token}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          ...invitation,
          inviteUrl, // provided so admin can copy the link directly if emails aren't configured
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("POST /api/studio/invitations:", err);
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }
}
