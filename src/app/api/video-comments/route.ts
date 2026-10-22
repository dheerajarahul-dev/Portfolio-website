import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";
import { getMediaKind } from "@/lib/media";
import { reserveContactMessageSlot } from "@/lib/contact-limits";
import {
  listVideoComments,
  createVideoComment,
  deleteVideoComment,
} from "@/lib/video-comments";

const MAX_REQUEST_BYTES = 4 * 1024;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

function getClientKey(request: NextRequest) {
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function isSupportedVideoUrl(value: string) {
  const url = value.trim();
  if (!url || url.length > 2000 || getMediaKind(url) === "unknown") return false;
  if (url.startsWith("/")) return !url.startsWith("//");
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

async function supabaseRequest<T>(
  config: { url: string; key: string },
  endpoint: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${config.url}${endpoint}`, {
    ...init,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Comment storage failed: ${response.status}`);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function GET(request: NextRequest) {
  const videoUrl = request.nextUrl.searchParams.get("videoUrl")?.trim() || "";
  if (!videoUrl) {
    const localComments = await listVideoComments();
    return NextResponse.json({ success: true, comments: localComments });
  }

  const config = getSupabaseConfig();
  if (config && isSupportedVideoUrl(videoUrl)) {
    try {
      const params = new URLSearchParams({
        select: "id,author_name,body,created_at",
        video_url: `eq.${videoUrl}`,
        order: "created_at.desc",
        limit: "100",
      });
      const rows = await supabaseRequest<{ id: string; author_name: string; body: string; created_at: string }[]>(
        config,
        `/rest/v1/video_comments?${params.toString()}`
      );
      const comments = rows.map((c) => ({
        id: c.id,
        name: c.author_name,
        author_name: c.author_name,
        body: c.body,
        comment: c.body,
        createdAt: c.created_at,
        created_at: c.created_at,
      }));
      return NextResponse.json({ success: true, comments }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      console.warn("Supabase comments read failed, falling back to local:", error);
    }
  }

  try {
    const comments = await listVideoComments(videoUrl);
    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error("Could not load video comments:", error);
    return NextResponse.json({ error: "Comments are temporarily unavailable.", comments: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Comment is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid comment." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid comment." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  // Honeypot check
  if (typeof input.website === "string" && input.website.trim()) {
    return NextResponse.json({ success: true });
  }

  const videoUrl = typeof input.videoUrl === "string" ? input.videoUrl.trim() : "";
  const authorName = typeof input.name === "string" ? input.name.trim() : "";
  const commentText = typeof input.comment === "string" ? input.comment.trim() : "";

  if (!videoUrl || !authorName || authorName.length > 80 || !commentText || commentText.length > 1000) {
    return NextResponse.json({ error: "Enter a name and a comment of up to 1,000 characters." }, { status: 400 });
  }

  const requestClientKey = getClientKey(request);
  const clientKey =
    requestClientKey === "unknown" && process.env.NODE_ENV !== "production"
      ? "local-video-comments"
      : requestClientKey;

  if (clientKey !== "unknown") {
    const slot = reserveContactMessageSlot(`video-comment:${clientKey}`, Date.now());
    if (!slot.allowed) {
      const retryAfter = Math.max(1, Math.ceil((slot.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { error: "You have reached the comment limit. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }

  const config = getSupabaseConfig();
  if (config && isSupportedVideoUrl(videoUrl)) {
    try {
      const rows = await supabaseRequest<{ id: string; author_name: string; body: string; created_at: string }[]>(
        config,
        "/rest/v1/video_comments",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify({ video_url: videoUrl, author_name: authorName, body: commentText }),
        }
      );
      const created = rows[0];
      return NextResponse.json(
        {
          success: true,
          comment: {
            id: created.id,
            name: created.author_name,
            author_name: created.author_name,
            body: created.body,
            comment: created.body,
            createdAt: created.created_at,
            created_at: created.created_at,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      console.warn("Supabase comment create failed, falling back to local:", error);
    }
  }

  try {
    const newComment = await createVideoComment({
      videoUrl,
      name: authorName,
      comment: commentText,
    });
    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
  } catch (error) {
    console.error("Could not save video comment:", error);
    return NextResponse.json({ error: "Your comment could not be saved. Please try again." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json(
        { error: "Unauthorized. Admin credentials required to delete comments." },
        { status: 401 }
      );
    }

    const queryId = request.nextUrl.searchParams.get("id");
    let commentId = queryId;

    if (!commentId) {
      try {
        const body = (await request.json()) as Record<string, unknown>;
        if (typeof body?.id === "string") {
          commentId = body.id;
        }
      } catch {
        // empty body allowed when using query param
      }
    }

    if (!commentId || !commentId.trim()) {
      return NextResponse.json({ error: "Comment id is required" }, { status: 400 });
    }

    const trimmedId = commentId.trim();

    const config = getSupabaseConfig();
    if (config) {
      try {
        await supabaseRequest(
          config,
          `/rest/v1/video_comments?id=eq.${encodeURIComponent(trimmedId)}`,
          { method: "DELETE" }
        );
      } catch (err) {
        console.warn("Supabase delete failed or comment was not in Supabase:", err);
      }
    }

    await deleteVideoComment(trimmedId);

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
      id: trimmedId,
    });
  } catch (err) {
    console.error("DELETE /api/video-comments:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
