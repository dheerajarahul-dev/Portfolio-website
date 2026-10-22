import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";
import {
  listVideoComments,
  createVideoComment,
  deleteVideoComment,
} from "@/lib/video-comments";

export async function GET(request: NextRequest) {
  try {
    const videoUrl = request.nextUrl.searchParams.get("videoUrl") || undefined;
    const comments = await listVideoComments(videoUrl);
    return NextResponse.json({ success: true, comments });
  } catch (err) {
    console.error("GET /api/video-comments:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load video comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { videoUrl, name, comment } = body;

    if (typeof videoUrl !== "string" || !videoUrl.trim()) {
      return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });
    }
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (typeof comment !== "string" || !comment.trim()) {
      return NextResponse.json({ error: "comment is required" }, { status: 400 });
    }

    const newComment = await createVideoComment({
      videoUrl: videoUrl.trim(),
      name: name.trim().slice(0, 80),
      comment: comment.trim().slice(0, 1000),
    });

    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
  } catch (err) {
    console.error("POST /api/video-comments:", err);
    return NextResponse.json(
      { success: false, error: "Failed to post comment" },
      { status: 500 }
    );
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
        // body might be empty when using query param
      }
    }

    if (!commentId || !commentId.trim()) {
      return NextResponse.json({ error: "Comment id is required" }, { status: 400 });
    }

    const deleted = await deleteVideoComment(commentId.trim());
    if (!deleted) {
      return NextResponse.json({ error: "Comment not found or already deleted" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
      id: commentId.trim(),
    });
  } catch (err) {
    console.error("DELETE /api/video-comments:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
