import { extractYoutubeId } from "./youtube";

export type MediaKind = "youtube" | "video" | "drive" | "unknown";

export function getMediaKind(url: string): MediaKind {
  const trimmed = url.trim();
  if (!trimmed) return "unknown";
  if (extractYoutubeId(trimmed)) return "youtube";
  if (isGoogleDriveUrl(trimmed)) return "drive";
  const videoPath = trimmed.split(/[?#]/, 1)[0];
  if (/\.(mp4|webm|mov|m4v)$/i.test(videoPath)) return "video";
  return "unknown";
}

export function getYoutubeIdFromUrl(url: string): string {
  return extractYoutubeId(url);
}

export function getMediaThumbnailUrl(item: {
  type: "video" | "photo";
  mediaUrl: string;
  thumbnailUrl?: string;
}): string {
  for (const candidate of [item.thumbnailUrl, item.mediaUrl]) {
    const url = candidate?.trim();
    if (!url) continue;

    const youtubeId = extractYoutubeId(url);
    if (youtubeId) return youtubeThumbnail(youtubeId);

    if (isGoogleDriveUrl(url)) {
      const fileId = getGoogleDriveFileId(url);
      if (fileId) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1280`;
      continue;
    }

    if (item.type === "video" && /\.(mp4|webm|mov|m4v)(?:[?#]|$)/i.test(url)) continue;
    return url;
  }
  return "";
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
