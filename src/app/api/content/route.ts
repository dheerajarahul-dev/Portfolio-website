import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isDeepStrictEqual } from "util";
import { hasAdminPermission } from "@/lib/auth";
import { readContent, writeContent } from "@/lib/storage";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  try {
    const content = await readContent();
    return NextResponse.json(content);
  } catch (error) {
    console.error("Failed to read content:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Content is temporarily unavailable." },
      { status: 503 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const [canEditSite, canManageMedia] = await Promise.all([
    hasAdminPermission("site:edit"),
    hasAdminPermission("media:manage"),
  ]);
  if (!canEditSite && !canManageMedia) {
    return NextResponse.json({ error: "You do not have permission to edit site content or manage media." }, { status: 403 });
  }

  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Content is too large." }, { status: 413 });
    }
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }
    if (!isObject(body)) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }
    const currentContent = await readContent();
    if (!canEditSite) {
      const proposedNonMedia = { ...body };
      const currentNonMedia = { ...currentContent } as unknown as Record<string, unknown>;
      delete proposedNonMedia.mediaLibrary;
      delete currentNonMedia.mediaLibrary;
      if (!isDeepStrictEqual(proposedNonMedia, currentNonMedia)) {
        return NextResponse.json({ error: "Media managers can only change Media Library content." }, { status: 403 });
      }
    }
    if (!canManageMedia && !isDeepStrictEqual(body.mediaLibrary, currentContent.mediaLibrary)) {
      return NextResponse.json({ error: "You do not have permission to change Media Library content." }, { status: 403 });
    }
    const content = await writeContent(body);
    revalidatePath("/");
    revalidatePath("/library");
    revalidatePath("/founder");
    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("Failed to save content:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Could not save changes. Check CMS storage configuration and try again." },
      { status: 500 }
    );
  }
}
