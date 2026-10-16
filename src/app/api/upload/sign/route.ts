import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { hasAdminPermission } from "@/lib/auth";
import { createSignedAssetUpload } from "@/lib/storage";

const MAX_BYTES = 100 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);
const EXTENSIONS_BY_TYPE: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
};

export async function POST(request: NextRequest) {
  if (!(await hasAdminPermission("media:manage"))) {
    return NextResponse.json({ code: "PERMISSION_REQUIRED", error: "You do not have permission to upload media." }, { status: 403 });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ code: "DIRECT_UPLOAD_UNAVAILABLE", directUploadUnavailable: true }, { status: 501 });
  }

  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ code: "INVALID_UPLOAD_REQUEST", error: "Upload details must be sent as a JSON object." }, { status: 400 });
    }
    const { fileName, contentType, size } = body as Record<string, unknown>;
    if (typeof fileName !== "string" || typeof contentType !== "string" || typeof size !== "number") {
      return NextResponse.json({ code: "UPLOAD_FIELDS_REQUIRED", error: "File name, type, and size are required." }, { status: 400 });
    }
    if (size <= 0 || size > MAX_BYTES) {
      return NextResponse.json({ code: "FILE_TOO_LARGE", error: "File must be larger than 0 bytes and no more than 100MB." }, { status: 413 });
    }
    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json({ code: "UNSUPPORTED_MEDIA_TYPE", error: "Only JPG/PNG/WebP/GIF images or MP4/WebM videos are allowed." }, { status: 400 });
    }
    const extension = path.extname(fileName).toLowerCase();
    if (extension && !EXTENSIONS_BY_TYPE[contentType].includes(extension)) {
      return NextResponse.json({ code: "FILE_TYPE_MISMATCH", error: "The file extension does not match its media type." }, { status: 400 });
    }
    return NextResponse.json(await createSignedAssetUpload(fileName, contentType), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Signed upload setup failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({
      code: "SIGNED_UPLOAD_SETUP_FAILED",
      error: "Could not prepare the storage upload. Check the Supabase bucket and service-role configuration.",
      ...(process.env.NODE_ENV !== "production" && error instanceof Error ? { details: error.message } : {}),
    }, { status: 500 });
  }
}