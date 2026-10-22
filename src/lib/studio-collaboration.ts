// ─────────────────────────────────────────────────────────────────────────────
// Creative X Studio — Collaboration, Revision Intelligence & Sharing Engine
// ─────────────────────────────────────────────────────────────────────────────

import { randomBytes } from "crypto";
import type {
  RevisionSummaryReport,
  ParallelDeliverableVariant,
  SecureShareLink,
  CollaborationRoomState,
  RoomPresenceUser,
  StudioComment,
} from "./studio-types";

// ── Revision Intelligence: Version Diff & Unresolved Feedback ────────────────

/**
 * Evaluates feedback across versions and produces an audit report of resolved vs open points.
 */
export function generateRevisionSummary(
  projectId: string,
  fromVersionNumber: number,
  toVersionNumber: number,
  allComments: StudioComment[]
): RevisionSummaryReport {
  const resolved = allComments.filter((c) => c.resolved);
  const open = allComments.filter((c) => !c.resolved);

  const keyFeedbackAddressed = resolved.slice(0, 5).map((c) => {
    const timeStr = c.timestampSec !== null ? `[${Math.floor(c.timestampSec)}s] ` : "";
    return `${timeStr}${c.body.slice(0, 80)}`;
  });

  const pendingOpenPoints = open.slice(0, 5).map((c) => {
    const timeStr = c.timestampSec !== null ? `[${Math.floor(c.timestampSec)}s] ` : "";
    return `${timeStr}${c.body.slice(0, 80)}`;
  });

  return {
    projectId,
    fromVersion: fromVersionNumber,
    toVersion: toVersionNumber,
    generatedAt: new Date().toISOString(),
    totalComments: allComments.length,
    resolvedCount: resolved.length,
    unresolvedCount: open.length,
    summaryHighlights: [
      `Version ${toVersionNumber} successfully implemented ${resolved.length} client revision note(s).`,
      open.length === 0
        ? "All previous revision feedback has been resolved!"
        : `${open.length} action item(s) remain open for discussion.`,
    ],
    keyFeedbackAddressed:
      keyFeedbackAddressed.length > 0 ? keyFeedbackAddressed : ["Initial cut — baseline timeline"],
    pendingOpenPoints:
      pendingOpenPoints.length > 0 ? pendingOpenPoints : ["No unresolved client feedback flagged"],
  };
}

// ── Parallel Deliverable Workflows ───────────────────────────────────────────

/**
 * Builds standard parallel deliverable matrix for a project.
 */
export function initializeDeliverableMatrix(
  projectId: string,
  projectTitle: string
): ParallelDeliverableVariant[] {
  const now = new Date().toISOString();
  return [
    {
      id: `var_${Date.now()}_16_9`,
      projectId,
      title: `${projectTitle} — YouTube 4K Master`,
      format: "16:9_master",
      language: "Original (English)",
      campaignCut: "full_length",
      assignedEditorId: null,
      status: "queued",
      targetPresetId: "preset_youtube_4k",
      lastUpdated: now,
    },
    {
      id: `var_${Date.now()}_9_16`,
      projectId,
      title: `${projectTitle} — Vertical Hook (Reel / Short)`,
      format: "9:16_vertical",
      language: "Original (English)",
      campaignCut: "60s_cutdown",
      assignedEditorId: null,
      status: "queued",
      targetPresetId: "preset_ig_reels",
      lastUpdated: now,
    },
    {
      id: `var_${Date.now()}_broadcast`,
      projectId,
      title: `${projectTitle} — SMPTE Broadcast Master`,
      format: "16:9_master",
      language: "Broadcast Clean (No Lower-Thirds)",
      campaignCut: "full_length",
      assignedEditorId: null,
      status: "queued",
      targetPresetId: "preset_broadcast_smpte",
      lastUpdated: now,
    },
    {
      id: `var_${Date.now()}_1_1`,
      projectId,
      title: `${projectTitle} — Social Feed Square Cut`,
      format: "1:1_square",
      language: "Original + Burned Subtitles",
      campaignCut: "30s_teaser",
      assignedEditorId: null,
      status: "queued",
      targetPresetId: "preset_web_square",
      lastUpdated: now,
    },
  ];
}

// ── Secure Client Sharing ─────────────────────────────────────────────────────

/**
 * Generates an expiring secure share link for external clients or executive review.
 */
export function createSecureShareLink(input: {
  projectId: string;
  versionId: string;
  shareName: string;
  clientEmail?: string;
  durationDays?: number;
  allowDownload?: boolean;
  watermarkEnabled?: boolean;
  watermarkText?: string;
  userId: string;
}): SecureShareLink {
  const token = randomBytes(24).toString("base64url");
  const duration = (input.durationDays ?? 7) * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + duration).toISOString();

  return {
    id: `share_${Date.now()}_${randomBytes(4).toString("hex")}`,
    projectId: input.projectId,
    versionId: input.versionId,
    token,
    shareName: input.shareName,
    clientEmail: input.clientEmail?.toLowerCase().trim(),
    expiresAt,
    allowDownload: input.allowDownload ?? false,
    watermarkEnabled: input.watermarkEnabled ?? true,
    watermarkText: input.watermarkText || "CREATIVE X CONFIDENTIAL REVIEW",
    isRevoked: false,
    viewCount: 0,
    lastViewedAt: null,
    createdBy: input.userId,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Validates a share link token and enforces expiration & revocation.
 */
export function validateShareLink(share: SecureShareLink): {
  valid: boolean;
  reason?: string;
} {
  if (share.isRevoked) {
    return { valid: false, reason: "This client review link has been revoked by the production manager." };
  }

  if (new Date(share.expiresAt) < new Date()) {
    return { valid: false, reason: "This review link has expired. Request an updated link from your producer." };
  }

  return { valid: true };
}

// ── Collaboration Room State ──────────────────────────────────────────────────

/**
 * Initializes or syncs a shared client-editor room.
 */
export function getInitialRoomState(roomId: string, projectId: string, versionId: string): CollaborationRoomState {
  return {
    roomId,
    projectId,
    versionId,
    activeUsers: [],
    playbackTimestampSec: 0,
    playbackState: "paused",
    sharedNotes: "Shared live collaboration session initialized. Comments posted here sync frame markers in real-time.",
    updatedAt: new Date().toISOString(),
  };
}

export function syncRoomPresence(
  room: CollaborationRoomState,
  user: RoomPresenceUser
): CollaborationRoomState {
  const existingIndex = room.activeUsers.findIndex((u) => u.userId === user.userId);
  const now = new Date().toISOString();

  const updatedUsers = [...room.activeUsers];
  if (existingIndex >= 0) {
    updatedUsers[existingIndex] = { ...user, lastActiveAt: now };
  } else {
    updatedUsers.push({ ...user, joinedAt: now, lastActiveAt: now });
  }

  // Filter out inactive users (> 3 minutes without heartbeat)
  const threeMinutesAgo = Date.now() - 3 * 60 * 1000;
  const activeOnly = updatedUsers.filter(
    (u) => new Date(u.lastActiveAt).getTime() > threeMinutesAgo
  );

  return {
    ...room,
    activeUsers: activeOnly,
    updatedAt: now,
  };
}
