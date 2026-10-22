// Studio Collaboration API — Deliverables Matrix, Revision Summaries, Share Links, Live Rooms
import { NextRequest, NextResponse } from "next/server";
import { requireStudioSession, StudioAuthError } from "@/lib/studio-auth";
import {
  generateRevisionSummary,
  initializeDeliverableMatrix,
  createSecureShareLink,
  validateShareLink,
  getInitialRoomState,
  syncRoomPresence,
} from "@/lib/studio-collaboration";
import { getProjectById, listComments } from "@/lib/studio-db";
import type { SecureShareLink, ParallelDeliverableVariant } from "@/lib/studio-types";

// In-memory cache for live collaboration rooms and active share links (shared across sessions)
const activeRooms = new Map<string, ReturnType<typeof getInitialRoomState>>();
const activeShareLinks = new Map<string, SecureShareLink>();

export async function GET(request: NextRequest) {
  try {
    const session = await requireStudioSession();
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("projectId");
    const shareToken = searchParams.get("token");

    // Public / Token-based share link validation
    if (shareToken) {
      let link: SecureShareLink | undefined;
      for (const item of activeShareLinks.values()) {
        if (item.token === shareToken) {
          link = item;
          break;
        }
      }

      if (!link) {
        return NextResponse.json({ error: "Share link not found or invalid" }, { status: 404 });
      }

      const validation = validateShareLink(link);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.reason }, { status: 410 });
      }

      link.viewCount += 1;
      link.lastViewedAt = new Date().toISOString();
      return NextResponse.json({ success: true, share: link });
    }

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = await getProjectById(projectId);
    const comments = await listComments(projectId).catch(() => []);

    // 1. Revision summary report
    const revisionSummary = generateRevisionSummary(projectId, 1, 2, comments);

    // 2. Deliverable matrix
    const deliverableMatrix = initializeDeliverableMatrix(projectId, project?.title || "Production");

    // 3. Share links for this project
    const projectShareLinks = Array.from(activeShareLinks.values()).filter(
      (s) => s.projectId === projectId
    );

    // 4. Collaboration Room
    const roomId = `room_${projectId}`;
    let room = activeRooms.get(roomId);
    if (!room) {
      room = getInitialRoomState(roomId, projectId, "ver_latest");
      activeRooms.set(roomId, room);
    }

    return NextResponse.json({
      success: true,
      revisionSummary,
      deliverableMatrix,
      shareLinks: projectShareLinks,
      room,
    });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("GET /api/studio/collaboration error:", err);
    return NextResponse.json({ error: "Failed to load collaboration data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStudioSession();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = body.action as string;

    if (action === "create_share_link") {
      const share = createSecureShareLink({
        projectId: String(body.projectId || ""),
        versionId: String(body.versionId || "ver_latest"),
        shareName: String(body.shareName || "Client Review"),
        clientEmail: body.clientEmail ? String(body.clientEmail) : undefined,
        durationDays: Number(body.durationDays || 7),
        allowDownload: Boolean(body.allowDownload),
        watermarkEnabled: Boolean(body.watermarkEnabled ?? true),
        watermarkText: String(body.watermarkText || "CREATIVE X CONFIDENTIAL REVIEW"),
        userId: session.userId,
      });

      activeShareLinks.set(share.id, share);
      return NextResponse.json({ success: true, share });
    }

    if (action === "revoke_share_link") {
      const shareId = String(body.shareId || "");
      const share = activeShareLinks.get(shareId);
      if (share) {
        share.isRevoked = true;
      }
      return NextResponse.json({ success: true, revokedId: shareId });
    }

    if (action === "sync_room") {
      const roomId = String(body.roomId || "");
      const projectId = String(body.projectId || "");
      let room = activeRooms.get(roomId);
      if (!room) {
        room = getInitialRoomState(roomId, projectId, "ver_latest");
      }

      room = syncRoomPresence(room, {
        userId: session.userId,
        displayName: session.displayName,
        role: session.role,
        avatarUrl: session.avatarUrl,
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        currentPlaybackSec: Number(body.timestampSec || 0),
        isPlaybackLeader: Boolean(body.isLeader),
      });

      if (body.sharedNotes) {
        room.sharedNotes = String(body.sharedNotes);
      }

      activeRooms.set(roomId, room);
      return NextResponse.json({ success: true, room });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("POST /api/studio/collaboration error:", err);
    return NextResponse.json({ error: "Collaboration operation failed" }, { status: 500 });
  }
}
