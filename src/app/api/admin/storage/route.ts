import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { hasAdminPermission } from "@/lib/auth";
import { deleteUnreferencedAsset, listManagedAssets } from "@/lib/storage";

export async function GET() {
  if (!(await hasAdminPermission("media:manage"))) {
    return NextResponse.json({ error: "You do not have permission to manage media storage." }, { status: 403 });
  }

  try {
    const assets = await listManagedAssets();
    return NextResponse.json({
      assets,
      totalBytes: assets.reduce((total, asset) => total + asset.size, 0),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to inspect managed storage:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not inspect managed media storage." }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await hasAdminPermission("media:manage"))) {
    return NextResponse.json({ error: "You do not have permission to manage media storage." }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body) || typeof (body as Record<string, unknown>).url !== "string") {
      return NextResponse.json({ error: "A managed upload URL is required." }, { status: 400 });
    }

    const result = await deleteUnreferencedAsset((body as { url: string }).url);
    if (result === "referenced") {
      return NextResponse.json({ code: "ASSET_REFERENCED", error: "This file is still used by website content and was kept." }, { status: 409 });
    }
    if (result === "not-found") {
      return NextResponse.json({ error: "The upload no longer exists." }, { status: 404 });
    }

    revalidatePath("/", "layout");
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to permanently delete managed upload:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not permanently delete this upload." }, { status: 500 });
  }
}