import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { hasAdminPermission } from "@/lib/auth";
import { uploadAsset } from "@/lib/storage";

const MAX_BYTES = 100 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

// Extension allowlist — anything else (e.g. .html, .svg, .php) is rejected so
// an attacker cannot smuggle an executable/served-as-HTML file into /public.
const ALLOWED_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".mp4",
  ".webm",
]);
const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

export async function POST(request: NextRequest) {
  const canUpload = await hasAdminPermission("media:manage");
  if (!canUpload) {
    return NextResponse.json({ code: "PERMISSION_REQUIRED", error: "You do not have permission to upload media." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ code: "FILE_REQUIRED", error: "Choose a file before uploading." }, { status: 400 });
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { code: "UNSUPPORTED_MEDIA_TYPE", error: "Only JPG/PNG/WebP/GIF images or MP4/WebM videos are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ code: "FILE_TOO_LARGE", error: "File must be 100MB or smaller." }, { status: 413 });
    }

    const rawExt = path.extname(file.name).toLowerCase();
    if (rawExt && !ALLOWED_EXT.has(rawExt)) {
      return NextResponse.json(
        { code: "EXTENSION_NOT_ALLOWED", error: "This file extension is not allowed." },
        { status: 400 }
      );
    }

    if (rawExt && MIME_BY_EXTENSION[rawExt] !== file.type) {
      return NextResponse.json(
        { code: "FILE_TYPE_MISMATCH", error: "The file extension does not match its media type." },
        { status: 400 }
      );
    }

    const ext = rawExt || (file.type.includes("video") ? ".mp4" : ".jpg");
    const sanitizedFile = new File([file], `${safeName(path.basename(file.name, ext))}${ext}`, {
      type: file.type,
    });
    const uploaded = await uploadAsset(sanitizedFile);

    return NextResponse.json(uploaded);
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown storage error.";
    console.error("Upload failed:", details);
    return NextResponse.json({
      code: "UPLOAD_STORAGE_FAILED",
      error: "Storage rejected the upload. Check the storage configuration and try again.",
      ...(process.env.NODE_ENV !== "production" ? { details } : {}),
    }, { status: 500 });
  }
}
