"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { SiteContent } from "@/lib/types";
import { getGoogleDrivePreviewUrl, getMediaKind, getYoutubeIdFromUrl } from "@/lib/media";
import { youtubeEmbedUrl } from "@/lib/youtube";
import SiteFooter from "@/components/SiteFooter";

export default function PlayerPageClient({
  content,
  videoUrl,
  title,
}: {
  content: SiteContent;
  videoUrl?: string;
  title: string;
}) {
  const router = useRouter();
  const effectiveVideoUrl = videoUrl || "";
  const effectiveTitle = title || content.player.title;
  const goBack = () => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(sessionStorage.getItem("cxc-return-target") || "null") as {
          path?: string;
        } | null;
        if (saved?.path) {
          router.push(saved.path);
          return;
        }
      } catch {
        // ignore malformed state and fall back to site home
      }
    }
    router.push("/");
  };
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
    <>
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="relative overflow-hidden px-2 py-5 sm:px-5 sm:py-8 lg:px-8">
        <div className="absolute inset-0 opacity-40" style={backgroundStyle} />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative mx-auto max-w-[92rem] space-y-4 sm:space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0c0c11]/95 px-4 py-3 backdrop-blur-sm sm:rounded-3xl sm:px-6 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-1.5">
                <h1 className="break-words text-xl font-semibold text-white sm:text-3xl">
                  {effectiveTitle}
                </h1>
                <p className="hidden max-w-3xl text-sm leading-6 text-white/65 sm:block">
                  {content.player.description}
                </p>
              </div>
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to library
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111]/95 p-1.5 shadow-2xl shadow-black/20 sm:rounded-2xl sm:p-2">
            {effectiveVideoUrl ? (
              <div className="relative overflow-hidden rounded-lg bg-black sm:rounded-xl">
                <div className="aspect-[4/3] w-full bg-black sm:aspect-video" />
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
                    className="absolute inset-0 h-full w-full object-contain"
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

        </div>
      </section>
    </main>
    <SiteFooter
      brandName={content.navbar.brandName}
      founderName={content.founder.name}
      founderRole={content.founder.role}
      founderPhotoUrl={content.founder.photoUrl}
      contactChannels={content.contact.channels}
    />
    </>
  );
}
