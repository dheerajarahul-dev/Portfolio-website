"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import { youtubeThumbnail } from "@/lib/media";
import { youtubeEmbedUrl } from "@/lib/youtube";
import AmbientMediaFrame from "./AmbientMediaFrame";

const HERO_VOLUME = 50;

export type YouTubePlayerHandle = {
  setMuted: (muted: boolean) => void;
};

type YTPlayer = {
  mute: () => void;
  unMute: () => void;
  setVolume: (n: number) => void;
  playVideo: () => void;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: Record<string, unknown>
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYoutubeApi(timeout = 2000): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();

  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    let timer: ReturnType<typeof setTimeout> | null = null;

    window.onYouTubeIframeAPIReady = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      prev?.();
      resolve();
    };

    // If the API doesn't load within `timeout` ms, fall back to iframe mode.
    timer = setTimeout(() => {
      window.onYouTubeIframeAPIReady = prev;
      resolve();
    }, timeout);

    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });
}

const YouTubeBackground = forwardRef<
  YouTubePlayerHandle,
  { videoId: string; muted?: boolean; onReady?: () => void }
>(function YouTubeBackground({ videoId, muted = true, onReady }, ref) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const onReadyRef = useRef(onReady);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const poster = videoId ? youtubeThumbnail(videoId, "max") : "";

  onReadyRef.current = onReady;

  useImperativeHandle(ref, () => ({
    setMuted: (m: boolean) => {
      const player = playerRef.current;
      if (!player) return;
      if (m) player.mute();
      else {
        player.unMute();
        player.setVolume(HERO_VOLUME);
      }
    },
  }));

  // Only start loading the YouTube API/player when the hero enters the viewport.
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let obs: IntersectionObserver | null = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e.isIntersecting) {
          setShouldLoad(true);
          obs?.disconnect();
          obs = null;
        }
      },
      { rootMargin: "200px" }
    );

    obs.observe(el);
    return () => {
      obs?.disconnect();
      obs = null;
    };
  }, []);

  useEffect(() => {
    if (!videoId || !mountRef.current || !shouldLoad) return;

    let destroyed = false;

    const createPlayer = async () => {
      await loadYoutubeApi();
      if (destroyed || !mountRef.current) return;

      // If the YT API didn't become available, fall back to a plain iframe.
      if (!window.YT?.Player) {
        setUseIframeFallback(true);
        onReadyRef.current?.();
        return;
      }

      playerRef.current = new window.YT!.Player(mountRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          loop: 1,
          playlist: videoId,
          playsinline: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          cc_load_policy: 0,
          showinfo: 0,
          branding: 0,
          enablejsapi: 1,
          vq: "small",
          widget_referrer: "",
          origin: typeof window !== "undefined" ? window.location.origin : "",
        },
        events: {
          onReady: (event: { target: YTPlayer }) => {
            try {
              event.target.mute();
              event.target.playVideo();
            } catch {}
            onReadyRef.current?.();
          },
          // Prevent user pause/seek by immediately resuming playback if paused or ended
          onStateChange: (e: { data: number; target?: YTPlayer }) => {
            const state = e.data;
            try {
              if (state === 0 || state === 2) {
                e.target?.playVideo();
              }
            } catch {
              // ignore
            }
          },
          onError: (e: { data: number }) => {
            console.warn("YouTube player error:", e.data);
            setTimeout(() => {
              try {
                playerRef.current?.playVideo();
              } catch {}
            }, 500);
          },
        },
      });
    };

    createPlayer();

    return () => {
      destroyed = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, shouldLoad]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (muted) player.mute();
    else {
      player.unMute();
      player.setVolume(HERO_VOLUME);
    }
  }, [muted]);

  if (!videoId) return null;

  const iframeSrc = youtubeEmbedUrl(videoId, {
    autoplay: true,
    mute: Boolean(muted),
    controls: false,
    loop: true,
    modestBranding: true,
    vq: "small",
  });

  return (
    <AmbientMediaFrame thumbnailUrl={poster} className="absolute inset-0 h-full w-full">
      <div className="absolute inset-0 overflow-hidden">
        {useIframeFallback ? (
          <>
            <iframe
              src={iframeSrc}
              title="hero-video"
              loading="lazy"
              className="yt-hero-player absolute left-1/2 top-1/2 h-[max(100vh,56.25vw)] w-[max(100vw,177.78vh)] min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
              allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen={false}
              onLoad={() => {
                onReadyRef.current?.();
              }}
              style={{ pointerEvents: "none" }}
            />
            {/* Transparent overlay to block user interactions on iframe */}
            <div
              className="absolute inset-0 z-10 cursor-default"
              style={{ pointerEvents: "auto" }}
              onContextMenu={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onClick={(e) => e.preventDefault()}
            />
          </>
        ) : (
          <div
            ref={mountRef}
            className="yt-hero-player absolute left-1/2 top-1/2 h-[max(100vh,56.25vw)] w-[max(100vw,177.78vh)] min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 [&_iframe]:border-0"
          />
        )}
      </div>
    </AmbientMediaFrame>
  );
});

export default YouTubeBackground;
