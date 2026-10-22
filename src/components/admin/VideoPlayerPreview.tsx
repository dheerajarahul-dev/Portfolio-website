"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Trash2, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { getGoogleDrivePreviewUrl, getMediaKind, getYoutubeIdFromUrl } from "@/lib/media";
import { youtubeEmbedUrl } from "@/lib/youtube";
import AmbientMediaFrame from "../ui/AmbientMediaFrame";

interface VideoCommentItem {
  id: string;
  name: string;
  body: string;
  createdAt: string;
}

export default function VideoPlayerPreview({
  title,
  thumbnailUrl,
  videoUrl,
  showComments = true,
}: {
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  showComments?: boolean;
}) {
  const kind = getMediaKind(videoUrl);
  const youtubeId = kind === "youtube" ? getYoutubeIdFromUrl(videoUrl) : "";
  const drivePreviewUrl = kind === "drive" ? getGoogleDrivePreviewUrl(videoUrl) : "";

  const [comments, setComments] = useState<VideoCommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchComments = useCallback(async () => {
    if (!videoUrl || !showComments) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/video-comments?videoUrl=${encodeURIComponent(videoUrl)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.comments)) {
        setComments(
          data.comments.map((c: Record<string, unknown>) => ({
            id: String(c.id),
            name: String(c.author_name || c.name || "Viewer"),
            body: String(c.body || c.comment || ""),
            createdAt: String(c.created_at || c.createdAt || ""),
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch comments in VideoPlayerPreview:", err);
    } finally {
      setLoadingComments(false);
    }
  }, [videoUrl, showComments]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  const handleDeleteComment = async (commentId: string) => {
    if (deletingId) return;
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this comment?");
    if (!confirmDelete) return;

    setDeletingId(commentId);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/video-comments?id=${encodeURIComponent(commentId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete comment");
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setStatusMessage({ type: "success", text: "Comment deleted successfully." });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "Failed to delete comment";
      setStatusMessage({ type: "error", text: errorText });
    } finally {
      setDeletingId(null);
    }
  };

  if (!videoUrl) {
    return (
      <p className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 text-center text-sm text-white/40">
        Add a video URL to preview the player
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-purple-300/70 mb-2">Video player preview</p>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <AmbientMediaFrame thumbnailUrl={thumbnailUrl} className="aspect-video w-full">
            <div className="relative aspect-video w-full">
              {kind === "youtube" && youtubeId ? (
                <iframe
                  src={youtubeEmbedUrl(youtubeId, { autoplay: false, controls: true, mute: false })}
                  title={title}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; encrypted-media"
                />
              ) : kind === "drive" && drivePreviewUrl ? (
                <iframe
                  src={drivePreviewUrl}
                  title={title}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; encrypted-media"
                />
              ) : (
                <video
                  src={videoUrl}
                  className="absolute inset-0 h-full w-full object-contain"
                  controls
                  playsInline
                />
              )}
            </div>
          </AmbientMediaFrame>
        </div>
      </div>

      {showComments && (
        <div className="rounded-xl border border-white/10 bg-[#0d0d10] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-400" />
              <h5 className="text-xs font-semibold uppercase tracking-wider text-white/90">
                Viewer Comments ({comments.length})
              </h5>
            </div>
            <button
              type="button"
              onClick={() => void fetchComments()}
              disabled={loadingComments}
              title="Refresh comments"
              className="inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loadingComments ? "animate-spin text-purple-400" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {statusMessage && (
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-200"
                  : "bg-red-500/15 border border-red-500/30 text-red-200"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {loadingComments && comments.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-white/40 text-xs">
              <Loader2 className="h-4 w-4 animate-spin text-purple-400 mr-2" />
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/10 py-5 text-center text-xs text-white/40">
              No comments on this video yet.
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="group relative flex items-start justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-2.5 transition hover:border-white/10 hover:bg-white/[0.05]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-xs text-white truncate max-w-[140px]">
                        {comment.name}
                      </span>
                      <span className="text-[10px] text-white/40">
                        {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 whitespace-pre-wrap break-words leading-relaxed">
                      {comment.body}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deletingId === comment.id}
                    title="Delete comment (Admin)"
                    className="shrink-0 inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-300 transition hover:bg-red-500/25 hover:text-red-100 disabled:opacity-50"
                  >
                    {deletingId === comment.id ? (
                      <Loader2 className="h-3 w-3 animate-spin text-red-300" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    <span>Delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
