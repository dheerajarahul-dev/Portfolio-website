"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import type { SiteContent } from "@/lib/types";
import { getGoogleDrivePreviewUrl, getMediaKind, getYoutubeIdFromUrl } from "@/lib/media";
import { youtubeEmbedUrl } from "@/lib/youtube";

export default function PlayerPageClient({
  content,
  videoUrl,
  title,
}: {
  content: SiteContent;
  videoUrl?: string;
  title: string;
}) {
  const effectiveVideoUrl = videoUrl || "";
  const effectiveTitle = title || content.player.title;
  const kind = useMemo(
    () => (effectiveVideoUrl ? getMediaKind(effectiveVideoUrl) : ""),
    [effectiveVideoUrl]
  );
  const youtubeId = useMemo(
    () =>
      kind === "youtube" && effectiveVideoUrl
        ? getYoutubeIdFromUrl(effectiveVideoUrl)
        : "",
    [kind, effectiveVideoUrl]
  );
  const drivePreviewUrl = useMemo(
    () => (kind === "drive" && effectiveVideoUrl ? getGoogleDrivePreviewUrl(effectiveVideoUrl) : ""),
    [kind, effectiveVideoUrl]
  );
  const backgroundStyle = useMemo(
    () => ({
      background: content.player.backgroundUrl
        ? `linear-gradient(180deg, rgba(5,5,5,0.65), rgba(5,5,5,0.9)), url(${content.player.backgroundUrl}) center/cover no-repeat`
        : "linear-gradient(180deg, rgba(5,5,5,0.72), rgba(8,8,10,0.96))",
      borderColor: content.player.accentColor,
    }),
    [content.player.backgroundUrl, content.player.accentColor]
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-40" style={backgroundStyle} />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative mx-auto max-w-6xl space-y-8">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-[#0c0c11]/95 p-6 backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.35em] text-purple-300/80">{content.player.title}</p>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {effectiveTitle}
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
                  {content.player.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to site
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#111]/95 p-3 shadow-2xl shadow-black/20 sm:p-4">
            {effectiveVideoUrl ? (
              <div className="relative overflow-hidden rounded-[1.75rem] bg-black">
                <div className="aspect-video w-full bg-black" />
                {kind === "youtube" && youtubeId ? (
                  <iframe
                    src={youtubeEmbedUrl(youtubeId, {
                      autoplay: true,
                      controls: true,
                      mute: false,
                      modestBranding: true,
                    })}
                    title={effectiveTitle}
                    allow="autoplay; encrypted-media; fullscreen"
                    className="absolute inset-0 h-full w-full border-0"
                  />
                ) : kind === "drive" && drivePreviewUrl ? (
                  <iframe
                    src={drivePreviewUrl}
                    title={effectiveTitle}
                    allow="autoplay; encrypted-media; fullscreen"
                    className="absolute inset-0 h-full w-full border-0"
                  />
                ) : kind === "video" ? (
                  <video
                    src={effectiveVideoUrl}
                    className="absolute inset-0 h-full w-full object-cover"
                    controls
                    autoPlay
                    playsInline
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-sm text-white/60">
                    Unsupported video format.
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-[#080808]/80 p-12 text-center text-sm text-white/60">
                No video selected. Open a project from the site to play it here.
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0b0c12]/95 p-6 text-white/80">
            <p className="text-sm leading-7">
              {content.player.description}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
