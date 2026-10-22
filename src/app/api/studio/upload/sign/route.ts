// Studio Upload Sign API
// POST /api/studio/upload/sign → get a signed upload URL for Supabase Storage

import { NextRequest, NextResponse } from "next/server";
import { requireStudioSession, StudioAuthError } from "@/lib/studio-auth";
import { hasPermission } from "@/lib/studio-permissions";
import { getProjectById, isProjectMember, createSignedUploadUrl } from "@/lib/studio-db";
import { randomBytes } from "crypto";
import path from "path";

const ALLOWED_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/srt",
  "application/zip",
  "application/x-zip-compressed",
]);

const MAX_FILE_SIZE = 4 * 1024 * 1024 * 1024; // 4 GB

function sanitizeFilename(original: string): string {
  const ext = path.extname(original).toLowerCase();
  const base = path.basename(original, ext)
    .replace(/[^a-z0-9_-]/gi, "_")
    .slice(0, 80);
  return `${base}${ext}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStudioSession();

    if (!hasPermission(session.role, "media:upload")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { filename, mimeType, sizeBytes, projectId, category } = body as Record<string, unknown>;

    if (typeof filename !== "string" || !filename.trim()) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }
    if (typeof mimeType !== "string" || !ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: `File type "${mimeType}" is not allowed` },
        { status: 400 }
      );
    }
    if (typeof sizeBytes !== "number" || sizeBytes <= 0 || sizeBytes > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size must be between 1 byte and ${MAX_FILE_SIZE / 1024 / 1024 / 1024} GB` },
        { status: 400 }
      );
    }
    if (typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Authorization: verify the user can upload to this project
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const canAccess =
      session.role === "super_admin" ||
      session.role === "manager" ||
      (await isProjectMember(projectId, session.userId));
    if (!canAccess) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Build a safe, unique storage path
    const safe = sanitizeFilename(filename);
    const token = randomBytes(8).toString("hex");
    const storagePath = `projects/${projectId}/${session.userId}/${token}_${safe}`;

    const { signedUrl } = await createSignedUploadUrl(storagePath);

    return NextResponse.json({
      success: true,
      data: {
        signedUrl,
        storagePath,
        filename: safe,
        originalFilename: filename,
      },
    });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("POST /api/studio/upload/sign:", err);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}
