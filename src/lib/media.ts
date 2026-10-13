import { extractYoutubeId } from "./youtube";

export type MediaKind = "youtube" | "video" | "drive" | "unknown";

export function getMediaKind(url: string): MediaKind {
  const trimmed = url.trim();
  if (!trimmed) return "unknown";
  if (extractYoutubeId(trimmed)) return "youtube";
  if (isGoogleDriveUrl(trimmed)) return "drive";
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(trimmed)) return "video";
  if (trimmed.startsWith("http")) return "video";
  return "unknown";
}

export function getYoutubeIdFromUrl(url: string): string {
  return extractYoutubeId(url);
}

export function isGoogleDriveUrl(url: string): boolean {
  return /https?:\/\/(drive\.google\.com|docs\.google\.com)\//i.test(url);
}

export function getGoogleDrivePreviewUrl(url: string): string {
  const id = getGoogleDriveFileId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : url;
}

export function getGoogleDriveFileId(url: string): string {
  const trimmed = url.trim();
  const fileIdMatch = trimmed.match(/(?:\/file\/d\/|id=)([a-zA-Z0-9_-]+)/);
  if (fileIdMatch?.[1]) return fileIdMatch[1];
  const openMatch = trimmed.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  return openMatch?.[1] ?? "";
}

export function youtubeThumbnail(
  videoId: string,
  quality: "default" | "hq" | "max" = "hq"
): string {
  const map = {
    default: "default",
    hq: "hqdefault",
    max: "maxresdefault",
  };
  return `https://img.youtube.com/vi/${videoId}/${map[quality]}.jpg`;
}

export function normalizeWorkItem(raw: Record<string, unknown>): {
  id: string;
  title: string;
  category: string;
  thumbnailUrl: string;
  videoUrl: string;
} {
  const legacy = raw as {
    id?: string;
    title?: string;
    category?: string;
    thumbnailUrl?: string;
    thumbnail?: string;
    videoUrl?: string;
    video?: string;
    youtubeId?: string;
  };

  let videoUrl = legacy.videoUrl || legacy.video || "";
  if (!videoUrl && legacy.youtubeId) {
    videoUrl = `https://www.youtube.com/watch?v=${legacy.youtubeId}`;
  }

  let thumbnailUrl = legacy.thumbnailUrl || legacy.thumbnail || "";
  const ytId = getYoutubeIdFromUrl(videoUrl);
  if (!thumbnailUrl && ytId) {
    thumbnailUrl = youtubeThumbnail(ytId);
  }

  return {
    id: String(legacy.id || crypto.randomUUID()),
    title: String(legacy.title || "Untitled"),
    category: String(legacy.category || "Project"),
    thumbnailUrl,
    videoUrl,
  };
}
