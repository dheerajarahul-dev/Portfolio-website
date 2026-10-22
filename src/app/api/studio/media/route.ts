// Studio Media API
// GET  /api/studio/media         → list assets with signed download URLs
// POST /api/studio/media         → register uploaded asset record

import { NextRequest, NextResponse } from "next/server";
import { requireStudioSession, StudioAuthError } from "@/lib/studio-auth";
import { hasPermission } from "@/lib/studio-permissions";
import {
  listAssets,
  createAssetRecord,
  createSignedDownloadUrl,
  getProjectById,
  isProjectMember,
  recordEvent,
} from "@/lib/studio-db";
import type { AssetCategory } from "@/lib/studio-types";

export async function GET(request: NextRequest) {
  try {
    const session = await requireStudioSession();
    const { searchParams } = request.nextUrl;

    const projectId = searchParams.get("projectId") ?? undefined;
    const category = (searchParams.get("category") as AssetCategory) ?? undefined;

    if (projectId) {
      const canAccess =
        session.role === "super_admin" ||
        session.role === "manager" ||
        (await isProjectMember(projectId, session.userId));
      if (!canAccess) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const assets = await listAssets({ projectId, category });

    // Generate expiring signed download URLs for assets
    const assetsWithUrls = await Promise.all(
      assets.map(async (asset) => {
        try {
          const downloadUrl = await createSignedDownloadUrl(asset.storagePath, 3600);
          return { ...asset, downloadUrl };
        } catch {
          return asset;
        }
      })
    );

    return NextResponse.json({ success: true, data: assetsWithUrls });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("GET /api/studio/media:", err);
    return NextResponse.json({ error: "Failed to load media assets" }, { status: 500 });
  }
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

    const {
      projectId,
      deliverableId,
      filename,
      originalFilename,
      storagePath,
      mimeType,
      sizeBytes,
      category,
    } = body as Record<string, unknown>;

    if (typeof projectId !== "string" || !projectId.trim()) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    if (typeof storagePath !== "string" || !storagePath.trim()) {
      return NextResponse.json({ error: "storagePath is required" }, { status: 400 });
    }
    if (typeof filename !== "string" || !filename.trim()) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const canAccess =
      session.role === "super_admin" ||
      session.role === "manager" ||
      (await isProjectMember(projectId, session.userId));
    if (!canAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const asset = await createAssetRecord({
      projectId,
      deliverableId: typeof deliverableId === "string" ? deliverableId : undefined,
      filename,
      originalFilename: typeof originalFilename === "string" ? originalFilename : filename,
      storagePath,
      mimeType: typeof mimeType === "string" ? mimeType : "application/octet-stream",
      sizeBytes: typeof sizeBytes === "number" ? sizeBytes : 0,
      category: (category as AssetCategory) || "other",
      uploadedBy: session.userId,
    });

    await recordEvent({
      projectId,
      actorId: session.userId,
      eventType: "file_uploaded",
      payload: { assetId: asset.id, filename: asset.filename, category: asset.category },
    }).catch(() => null);

    return NextResponse.json({ success: true, data: asset }, { status: 201 });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("POST /api/studio/media:", err);
    return NextResponse.json({ error: "Failed to record asset" }, { status: 500 });
  }
}
