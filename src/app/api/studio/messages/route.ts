// Studio Messages API (Project Discussions & Team Notes)
// GET  /api/studio/messages?projectId=...&internal=true/false
// POST /api/studio/messages

import { NextRequest, NextResponse } from "next/server";
import { requireStudioSession, StudioAuthError } from "@/lib/studio-auth";
import { hasPermission } from "@/lib/studio-permissions";
import { listMessages, createMessage, getProjectById, isProjectMember } from "@/lib/studio-db";

export async function GET(request: NextRequest) {
  try {
    const session = await requireStudioSession();
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("projectId");
    const internalOnly = searchParams.get("internal") === "true";

    if (!projectId) {
      return NextResponse.json({ error: "projectId parameter is required" }, { status: 400 });
    }

    const canAccess =
      session.role === "super_admin" ||
      session.role === "manager" ||
      (await isProjectMember(projectId, session.userId));
    if (!canAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Clients and external reviewers NEVER see internal notes
    const isStaff = hasPermission(session.role, "messages:read_internal");
    if (internalOnly && !isStaff) {
      return NextResponse.json({ error: "Unauthorized to view internal messages" }, { status: 403 });
    }

    const messages = await listMessages(projectId, internalOnly);
    return NextResponse.json({ success: true, data: messages });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("GET /api/studio/messages:", err);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStudioSession();
    if (!hasPermission(session.role, "messages:send")) {
      return NextResponse.json({ error: "Insufficient permissions to send messages" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { projectId, messageText, isInternal } = body as Record<string, unknown>;

    if (typeof projectId !== "string" || !projectId.trim()) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    if (typeof messageText !== "string" || !messageText.trim()) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 });
    }

    // Only staff can mark a message as internal
    const canSendInternal = hasPermission(session.role, "messages:read_internal");
    const internalFlag = Boolean(isInternal && canSendInternal);

    const message = await createMessage({
      projectId,
      authorId: session.userId,
      body: messageText.trim(),
      isInternal: internalFlag,
    });

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("POST /api/studio/messages:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
