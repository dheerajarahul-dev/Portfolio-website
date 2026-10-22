// Studio Deliverable Detail & Download API
// GET /api/studio/deliver/[id] → get deliverable details, versions, and signed download links

import { NextRequest, NextResponse } from "next/server";
import { requireStudioSession, StudioAuthError } from "@/lib/studio-auth";
import {
  listVersions,
  getProjectById,
  isProjectMember,
  createSignedDownloadUrl,
  recordEvent,
} from "@/lib/studio-db";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await requireStudioSession();
    const { id } = await params;

    const versions = await listVersions(id);
    if (!versions || versions.length === 0) {
      return NextResponse.json({ error: "Deliverable or versions not found" }, { status: 404 });
    }

    // Attach signed download URLs for every version asset
    const versionsWithUrls = await Promise.all(
      versions.map(async (v) => {
        if (!v.asset?.storagePath) return v;
        try {
          const downloadUrl = await createSignedDownloadUrl(v.asset.storagePath, 3600);
          return {
            ...v,
            asset: { ...v.asset, downloadUrl },
          };
        } catch {
          return v;
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        deliverableId: id,
        versions: versionsWithUrls,
      },
    });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("GET /api/studio/deliver/[id]:", err);
    return NextResponse.json({ error: "Failed to load deliverable" }, { status: 500 });
  }
}
