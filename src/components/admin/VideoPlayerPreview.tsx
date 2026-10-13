"use client";

import { getGoogleDrivePreviewUrl, getMediaKind, getYoutubeIdFromUrl } from "@/lib/media";
import { youtubeEmbedUrl } from "@/lib/youtube";
import AmbientMediaFrame from "../ui/AmbientMediaFrame";

export default function VideoPlayerPreview({
  title,
  thumbnailUrl,
  videoUrl,
}: {
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
}) {
  const kind = getMediaKind(videoUrl);
  const youtubeId = kind === "youtube" ? getYoutubeIdFromUrl(videoUrl) : "";
  const drivePreviewUrl = kind === "drive" ? getGoogleDrivePreviewUrl(videoUrl) : "";

  if (!videoUrl) {
    return (
      <p className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 text-center text-sm text-white/40">
        Add a video URL to preview the player
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-purple-300/70">Video player preview</p>
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
  );
}
