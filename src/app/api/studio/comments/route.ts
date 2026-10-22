// Studio Comments API (Timestamped Video Review Comments)
// GET   /api/studio/comments?versionId=... → list comments
// POST  /api/studio/comments               → create timestamped comment
// PATCH /api/studio/comments               → resolve comment

import { NextRequest, NextResponse } from "next/server";
import { requireStudioSession, StudioAuthError } from "@/lib/studio-auth";
import { hasPermission } from "@/lib/studio-permissions";
import { listComments, createComment, resolveComment, deleteComment, recordEvent } from "@/lib/studio-db";

export async function GET(request: NextRequest) {
  try {
    const session = await requireStudioSession();
    const versionId = request.nextUrl.searchParams.get("versionId");

    if (!versionId) {
      return NextResponse.json({ error: "versionId parameter is required" }, { status: 400 });
    }

    const comments = await listComments(versionId, true);
    return NextResponse.json({ success: true, data: comments });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("GET /api/studio/comments:", err);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStudioSession();
    if (!hasPermission(session.role, "reviews:comment")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { versionId, timestampSec, endTimestampSec, commentText } = body as Record<string, unknown>;

    if (typeof versionId !== "string" || !versionId.trim()) {
      return NextResponse.json({ error: "versionId is required" }, { status: 400 });
    }
    if (typeof commentText !== "string" || !commentText.trim()) {
      return NextResponse.json({ error: "commentText is required" }, { status: 400 });
    }

    const comment = await createComment({
      versionId,
      authorId: session.userId,
      timestampSec: typeof timestampSec === "number" ? timestampSec : undefined,
      endTimestampSec: typeof endTimestampSec === "number" ? endTimestampSec : undefined,
      body: commentText.trim(),
    });

    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("POST /api/studio/comments:", err);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireStudioSession();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { id } = body as Record<string, unknown>;
    if (typeof id !== "string" || !id.trim()) {
      return NextResponse.json({ error: "Comment id is required" }, { status: 400 });
    }

    await resolveComment(id, session.userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("PATCH /api/studio/comments:", err);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireStudioSession();

    if (session.role !== "super_admin" && session.role !== "manager") {
      return NextResponse.json({ error: "Only admins and managers can delete comments" }, { status: 403 });
    }

    const queryId = request.nextUrl.searchParams.get("id");
    let id = queryId;

    if (!id) {
      try {
        const body = (await request.json()) as Record<string, unknown>;
        if (typeof body?.id === "string") id = body.id;
      } catch {}
    }

    if (!id || !id.trim()) {
      return NextResponse.json({ error: "Comment id is required" }, { status: 400 });
    }

    await deleteComment(id.trim());
    return NextResponse.json({ success: true, id: id.trim() });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("DELETE /api/studio/comments:", err);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}

