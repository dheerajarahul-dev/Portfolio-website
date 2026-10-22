"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Gauge, ListVideo, Loader2, Maximize, MessageSquare, Pause, Play, Send, Tag, Volume2, VolumeX, Bookmark, Headphones, Sparkles, SlidersHorizontal, Trash2, ShieldCheck } from "lucide-react";
import type { MediaLibraryItem } from "@/lib/types";
import { getGoogleDrivePreviewUrl, getMediaKind, getMediaThumbnailUrl, getYoutubeIdFromUrl } from "@/lib/media";
import { youtubeEmbedUrl } from "@/lib/youtube";
import SiteFooter from "@/components/SiteFooter";
import EditableText from "@/components/edit/EditableText";
import { useSiteContent } from "@/context/SiteContentContext";

function formatPlayerTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

type VideoComment = { id: string; name: string; body: string; createdAt: string };

export default function PlayerPageClient({
  videoUrl,
  title,
}: {
  videoUrl?: string;
  title: string;
}) {
  const { content } = useSiteContent();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubeFrameRef = useRef<HTMLIFrameElement>(null);
  const [mediaError, setMediaError] = useState("");
  const [playbackSpeed, setPlaybackSpeed] = useState("1");
  const [referenceAdded, setReferenceAdded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [commentData, setCommentData] = useState<{ videoUrl: string; comments: VideoComment[]; error?: string } | null>(null);
  const [commentName, setCommentName] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [commentStatus, setCommentStatus] = useState<"idle" | "sending">("idle");
  const [commentError, setCommentError] = useState("");
  const [commentSort, setCommentSort] = useState<"newest" | "oldest">("newest");
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [soundProfile, setSoundProfile] = useState<"full" | "sfx" | "bass">("full");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const effectiveVideoUrl = videoUrl?.trim() || "";
  const currentMediaIndex = content.mediaLibrary.items.findIndex(
    (item) => item.mediaUrl.trim() === effectiveVideoUrl
  );
  const currentMediaItem = currentMediaIndex >= 0 ? content.mediaLibrary.items[currentMediaIndex] : null;
  const effectiveTitle = currentMediaItem?.title || title || content.player.title;
  const titlePath = currentMediaItem ? `mediaLibrary.items.${currentMediaIndex}.title` : "player.title";
  const comments = commentData?.videoUrl === effectiveVideoUrl ? commentData.comments : [];
  const commentsLoading = Boolean(effectiveVideoUrl && commentData?.videoUrl !== effectiveVideoUrl);
  const commentsError = commentData?.videoUrl === effectiveVideoUrl ? commentData.error : "";
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

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!effectiveVideoUrl || kind === "unknown") return;
    const controller = new AbortController();
    fetch(`/api/video-comments?videoUrl=${encodeURIComponent(effectiveVideoUrl)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Comments are temporarily unavailable.");
        const loadedComments = Array.isArray(data.comments)
          ? data.comments.map((comment: Record<string, unknown>) => ({
              id: String(comment.id),
              name: String(comment.author_name || comment.name || "Viewer"),
              body: String(comment.body || ""),
              createdAt: String(comment.created_at || comment.createdAt || ""),
            }))
          : [];
        setCommentData({ videoUrl: effectiveVideoUrl, comments: loadedComments });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setCommentData({
          videoUrl: effectiveVideoUrl,
          comments: [],
          error: error instanceof Error ? error.message : "Comments are temporarily unavailable.",
        });
      });
    return () => controller.abort();
  }, [effectiveVideoUrl, kind]);
  const recommendations = useMemo(
    () => {
      const currentItem = content.mediaLibrary.items.find((item) => item.mediaUrl === effectiveVideoUrl);
      const uniqueVideos = Array.from(new Map(
        content.mediaLibrary.items
          .filter((item) =>
            item.published &&
            item.type === "video" &&
            item.mediaUrl.trim() &&
            item.title.trim() &&
            !/^untitled media$/i.test(item.title.trim()) &&
            !/^\d+$/.test(item.title.trim())
          )
          .map((item) => [item.mediaUrl.trim(), item])
      ).values());
      const rankedVideos = uniqueVideos
        .map((item, index) => ({
          item,
          index,
          score: Number(item.category === currentItem?.category) * 4 + Number(item.featured) * 2,
          createdAt: Date.parse(item.createdAt || "") || 0,
        }))
        .sort((a, b) => b.score - a.score || b.createdAt - a.createdAt || a.index - b.index)
        .map(({ item }) => item);
      const alternatives = rankedVideos.filter((item) => item.mediaUrl.trim() !== effectiveVideoUrl);
      return alternatives.length ? alternatives : rankedVideos;
    },
    [content.mediaLibrary.items, effectiveVideoUrl]
  );
  const youtubeId = useMemo(
    () =>
      kind === "youtube" && effectiveVideoUrl
        ? getYoutubeIdFromUrl(effectiveVideoUrl)
        : "",
    [kind, effectiveVideoUrl]
  );

  const chapters = useMemo(() => {
    if (currentMediaItem?.chapters && currentMediaItem.chapters.length > 0) {
      return currentMediaItem.chapters;
    }
    return [
      { id: "c1", time: 0, title: "Hook & Visual Intrigue", technique: "Dynamic kinetic typography + sound riser" },
      { id: "c2", time: 15, title: "Sound Design & Foley", technique: "Layered whooshes, tape stop, sub bass impact" },
      { id: "c3", time: 32, title: "3D Motion & Flow", technique: "Speed ramping + directional match cut" },
      { id: "c4", time: 55, title: "Climax & Brand Payoff", technique: "Rhythmic cutdown + custom grade" },
    ];
  }, [currentMediaItem]);

  const activeChapter = useMemo(() => {
    if (!chapters.length) return null;
    const sorted = [...chapters].sort((a, b) => a.time - b.time);
    let active = sorted[0];
    for (const ch of sorted) {
      if (currentTime >= ch.time) {
        active = ch;
      } else {
        break;
      }
    }
    return active;
  }, [chapters, currentTime]);

  const seekToChapter = (chapterTime: number) => {
    if (kind === "video" && videoRef.current) {
      videoRef.current.currentTime = chapterTime;
      setCurrentTime(chapterTime);
      void videoRef.current.play().catch(() => {});
    } else if (kind === "youtube" && youtubeFrameRef.current) {
      youtubeFrameRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "seekTo", args: [chapterTime, true] }),
        "https://www.youtube-nocookie.com"
      );
      setCurrentTime(chapterTime);
    }
  };

  const applySoundProfile = (profile: "full" | "sfx" | "bass") => {
    setSoundProfile(profile);
    const video = videoRef.current;
    if (!video) return;

    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtxRef.current = new AudioContextClass();
        sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(video);
        filterRef.current = audioCtxRef.current.createBiquadFilter();
        sourceNodeRef.current.connect(filterRef.current);
        filterRef.current.connect(audioCtxRef.current.destination);
      }

      if (audioCtxRef.current.state === "suspended") {
        void audioCtxRef.current.resume();
      }

      if (filterRef.current) {
        if (profile === "full") {
          filterRef.current.type = "allpass";
          filterRef.current.frequency.value = 1000;
        } else if (profile === "sfx") {
          filterRef.current.type = "highpass";
          filterRef.current.frequency.value = 360;
        } else if (profile === "bass") {
          filterRef.current.type = "lowshelf";
          filterRef.current.frequency.value = 220;
          filterRef.current.gain.value = 9;
        }
      }
    } catch (err) {
      console.warn("Web Audio filter not available or CORS restricted:", err);
    }
  };
  const changePlaybackSpeed = (speed: string) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = Number(speed);
    youtubeFrameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "setPlaybackRate", args: [Number(speed)] }),
      "https://www.youtube-nocookie.com"
    );
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => setMediaError("Playback could not start. Try the play button again."));
    } else {
      video.pause();
    }
  };

  const setVideoVolume = (nextVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = nextVolume;
    video.muted = nextVolume === 0;
    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const seekVideo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const toggleFullscreen = () => {
    const playerFrame = videoRef.current?.parentElement;
    if (playerFrame && !document.fullscreenElement) {
      void playerFrame.requestFullscreen().catch(() => setMediaError("Fullscreen is unavailable in this browser."));
    } else if (document.fullscreenElement) {
      void document.exitFullscreen();
    }
  };

  const submitComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (commentStatus === "sending") return;
    setCommentError("");
    setCommentStatus("sending");
    try {
      const response = await fetch("/api/video-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: effectiveVideoUrl, name: commentName, comment: commentBody }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your comment could not be saved.");
      const refreshResponse = await fetch(`/api/video-comments?videoUrl=${encodeURIComponent(effectiveVideoUrl)}`);
      const refreshed = refreshResponse.ok ? await refreshResponse.json() : null;
      if (Array.isArray(refreshed?.comments)) {
        setCommentData({
          videoUrl: effectiveVideoUrl,
          comments: refreshed.comments.map((comment: Record<string, unknown>) => ({
            id: String(comment.id),
            name: String(comment.author_name || comment.name || "Viewer"),
            body: String(comment.body || ""),
            createdAt: String(comment.created_at || comment.createdAt || ""),
          })),
        });
      } else if (data.comment) {
        setCommentData((current) => ({
          videoUrl: effectiveVideoUrl,
          comments: [data.comment as VideoComment, ...(current?.videoUrl === effectiveVideoUrl ? current.comments : [])],
        }));
      }
      setCommentBody("");
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "Your comment could not be saved.");
    } finally {
      setCommentStatus("idle");
    }
  };

  const sortedComments = [...comments].sort((first, second) => {
    const timeDifference = Date.parse(first.createdAt) - Date.parse(second.createdAt);
    return commentSort === "newest" ? -timeDifference : timeDifference;
  });

  const handleDeleteComment = async (commentId: string) => {
    if (deletingCommentId) return;
    const confirmed = window.confirm("Are you sure you want to delete this comment as admin?");
    if (!confirmed) return;

    setDeletingCommentId(commentId);
    try {
      const res = await fetch(`/api/video-comments?id=${encodeURIComponent(commentId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete comment");
      }
      setCommentData((prev) => {
        if (!prev || prev.videoUrl !== effectiveVideoUrl) return prev;
        return {
          ...prev,
          comments: prev.comments.filter((c) => c.id !== commentId),
        };
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete comment");
    } finally {
      setDeletingCommentId(null);
    }
  };
  const addVideoReference = () => {
    addReference(effectiveTitle, effectiveVideoUrl);
  };

  const addReference = (referenceTitle: string, referenceUrl: string) => {
    if (!referenceUrl) return;
    setReferenceAdded(true);
    const params = new URLSearchParams({ referenceTitle, referenceUrl });
    router.push(`/?${params.toString()}#contact`);
  };

  const openRecommendation = (item: MediaLibraryItem) => {
    setMediaError("");
    setReferenceAdded(false);
    setPlaybackSpeed("1");
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    const params = new URLSearchParams({ videoUrl: item.mediaUrl, title: item.title });
    router.push(`/player?${params.toString()}`);
  };
  const drivePreviewUrl = useMemo(
    () => (kind === "drive" && effectiveVideoUrl ? getGoogleDrivePreviewUrl(effectiveVideoUrl) : ""),
    [kind, effectiveVideoUrl]
  );
  const backgroundStyle = useMemo(
    () => ({
      background: content.player.backgroundUrl
        ? `linear-gradient(180deg, rgba(5,5,5,0.65), rgba(5,5,5,0.9)), url(${content.player.backgroundUrl}) center/cover no-repeat`
        : "linear-gradient(180deg, rgba(5,5,5,0.72), rgba(8,8,10,0.96))",
    }),
    [content.player.backgroundUrl]
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
                  <EditableText path={titlePath} value={effectiveTitle} as="span" />
                </h1>
                <p className="max-w-3xl text-xs leading-5 text-white/65 sm:text-sm sm:leading-6">
                  <EditableText path="player.description" value={content.player.description} as="span" multiline />
                </p>
              </div>
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <EditableText path="player.backButtonLabel" value={content.player.backButtonLabel} as="span" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] xl:gap-6">
            <div className="min-w-0 space-y-4 sm:space-y-5">
            <div className="min-w-0 rounded-xl border border-white/10 bg-[#111]/95 p-1.5 shadow-2xl shadow-black/20 sm:rounded-2xl sm:p-2">
              {effectiveVideoUrl ? (
                <div className="relative overflow-hidden rounded-lg bg-black sm:rounded-xl">
                <div className="aspect-video w-full bg-black" />
                {kind === "youtube" && youtubeId ? (
                  <iframe
                    ref={youtubeFrameRef}
                    src={youtubeEmbedUrl(youtubeId, {
                      autoplay: false,
                      controls: true,
                      mute: false,
                      modestBranding: true,
                    })}
                    title={effectiveTitle}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    loading="eager"
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="absolute inset-0 h-full w-full border-0"
                  />
                ) : kind === "drive" && drivePreviewUrl ? (
                  <iframe
                    src={drivePreviewUrl}
                    title={effectiveTitle}
                    allow="autoplay; encrypted-media; fullscreen"
                    loading="eager"
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="absolute inset-0 h-full w-full border-0"
                  />
                ) : kind === "video" ? (
                  <video
                    ref={videoRef}
                    key={effectiveVideoUrl}
                    src={effectiveVideoUrl}
                    className="absolute inset-0 h-full w-full object-contain"
                    playsInline
                    preload="metadata"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                    onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
                    onError={() => setMediaError("This video could not be loaded. Check that the file is public, uses MP4/WebM, and the URL is still active.")}
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-sm text-white/60">
                    Unsupported video format.
                  </div>
                )}
              {mediaError && (
                <p role="alert" className="border-t border-red-300/15 bg-red-300/5 px-4 py-3 text-sm leading-6 text-red-100/80">
                  {mediaError}
                </p>
              )}
                </div>
              ) : (
                <div className="aspect-video rounded-lg border border-dashed border-white/10 bg-[#080808]/80 p-12 text-center text-sm text-white/60 sm:rounded-xl">
                <EditableText path="player.noVideoMessage" value={content.player.noVideoMessage} as="span" />
                </div>
              )}

              {content.player.showPlaybackSettings && kind === "video" && effectiveVideoUrl && (
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-t border-white/10 px-2 py-3 sm:gap-3 sm:px-3" aria-label="Video controls">
                  <button
                    type="button"
                    onClick={togglePlayback}
                    aria-label={isPlaying ? content.player.pauseButtonLabel : content.player.playButtonLabel}
                    title={isPlaying ? content.player.pauseButtonLabel : content.player.playButtonLabel}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                  >
                    {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                  </button>
                  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/65 sm:text-xs">{formatPlayerTime(currentTime)}</span>
                    <input
                      type="range"
                      aria-label={content.player.timelineLabel}
                      min={0}
                      max={duration || 0}
                      step={0.1}
                      value={Math.min(currentTime, duration || 0)}
                      onChange={(event) => seekVideo(Number(event.target.value))}
                      disabled={!duration}
                      className="h-1.5 min-w-0 flex-1 cursor-pointer disabled:cursor-default"
                      style={{ accentColor: content.player.accentColor }}
                    />
                    <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/45 sm:text-xs">{formatPlayerTime(duration)}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    <button
                      type="button"
                      onClick={toggleMute}
                      aria-label={isMuted ? content.player.unmuteButtonLabel : content.player.muteButtonLabel}
                      title={isMuted ? content.player.unmuteButtonLabel : content.player.muteButtonLabel}
                      className="grid h-9 w-9 place-items-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                    <input
                      type="range"
                      aria-label={content.player.volumeLabel}
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={(event) => setVideoVolume(Number(event.target.value))}
                      className="hidden h-1 w-16 cursor-pointer sm:block"
                      style={{ accentColor: content.player.accentColor }}
                    />
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      aria-label={content.player.fullscreenButtonLabel}
                      title={content.player.fullscreenButtonLabel}
                      className="grid h-9 w-9 place-items-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                    >
                      <Maximize className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {(content.player.showPlaybackSettings || content.player.showReferenceButton || content.player.showSoundShowcase !== false) && <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-3 sm:px-3 border-t border-white/5">
                {content.player.showPlaybackSettings && <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 text-xs text-white/55">
                    <Gauge className="h-4 w-4" aria-hidden="true" />
                    <EditableText path="player.speedLabel" value={content.player.speedLabel} as="span" />
                    <select
                      aria-label="Playback speed"
                      value={playbackSpeed}
                      onChange={(event) => changePlaybackSpeed(event.target.value)}
                      disabled={kind === "drive"}
                      className="min-h-9 rounded-lg border border-white/10 bg-[#080808] px-2 text-xs text-white outline-none focus:border-cyan-200/50 disabled:opacity-50"
                    >
                      {["0.5", "0.75", "1", "1.25", "1.5", "2"].map((speed) => <option key={speed} value={speed}>{speed}x</option>)}
                    </select>
                  </label>
                  <div className="inline-flex items-center gap-2 text-xs text-white/55">
                    <EditableText path="player.qualityLabel" value={content.player.qualityLabel} as="span" />
                    <span className="rounded-lg border border-white/10 bg-[#080808] px-2 py-2 text-xs text-white/70">
                      <EditableText
                        path={kind === "youtube" ? "player.qualityAutoValue" : "player.qualitySourceValue"}
                        value={kind === "youtube" ? content.player.qualityAutoValue : content.player.qualitySourceValue}
                        as="span"
                      />
                    </span>
                  </div>
                </div>}

                {effectiveVideoUrl && content.player.showReferenceButton && (
                  <button
                    type="button"
                    onClick={addVideoReference}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-cyan-200 px-4 text-xs font-semibold text-[#071316] transition hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                    {referenceAdded
                      ? <EditableText path="player.referenceAddedLabel" value={content.player.referenceAddedLabel} as="span" />
                      : <EditableText path="player.referenceButtonLabel" value={content.player.referenceButtonLabel} as="span" />}
                  </button>
                )}
              </div>}
              <p className="px-3 pb-2 text-[11px] leading-5 text-white/40">
                <EditableText
                  path={kind === "youtube" ? "player.youtubeQualityMessage" : "player.sourceQualityMessage"}
                  value={kind === "youtube" ? content.player.youtubeQualityMessage : content.player.sourceQualityMessage}
                  as="span"
                  multiline
                />
              </p>
            </div>

            {/* Audio Master Experience / Sound Design Showcase Ribbon */}
            {content.player.showSoundShowcase !== false && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-500/25 bg-[#0e0e16]/90 px-4 py-3 shadow-xl backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600/20 text-purple-300">
                    <Headphones className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                      <EditableText path="player.soundShowcaseTitle" value={content.player.soundShowcaseTitle || "Sound Design Showcase"} as="span" />
                    </h3>
                    <p className="text-[10px] text-white/50">
                      <EditableText path="player.soundShowcaseSubtitle" value={content.player.soundShowcaseSubtitle || "Toggle audio layers to inspect editing sound design"} as="span" />
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/50 p-1">
                  {[
                    { id: "full", label: content.player.soundShowcaseFullMixLabel || "Full Mix" },
                    { id: "sfx", label: content.player.soundShowcaseSfxLabel || "Solo SFX & Voice" },
                    { id: "bass", label: content.player.soundShowcaseBassLabel || "Cinema Bass" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => applySoundProfile(mode.id as "full" | "sfx" | "bass")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                        soundProfile === mode.id
                          ? "bg-purple-600 text-white shadow-md shadow-purple-900/50"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Video Chapters & Timeline Breakdown */}
            {content.player.showChapters !== false && chapters.length > 0 && (
              <section className="space-y-3 rounded-2xl border border-white/10 bg-[#0e0e16]/90 p-4 sm:p-5 shadow-xl backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Bookmark className="h-4 w-4 text-purple-400" />
                    <h2 className="text-sm sm:text-base font-semibold text-white">
                      <EditableText path="player.chaptersTitle" value={content.player.chaptersTitle || "Timeline & Technique Breakdown"} as="span" />
                    </h2>
                    <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-300">
                      {chapters.length} {content.player.chaptersBadgeLabel || "Beats"}
                    </span>
                  </div>

                  {activeChapter && (
                    <div className="flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-xs text-purple-300">
                      <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                      <span className="font-mono font-bold text-[11px]">{formatPlayerTime(activeChapter.time)}</span>
                      <span className="text-white/80 truncate max-w-[140px] sm:max-w-none">· {activeChapter.title}</span>
                    </div>
                  )}
                </div>

                {content.player.showActiveTechnique !== false && activeChapter?.technique && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-purple-500/30 bg-purple-950/30 px-3.5 py-2 text-xs text-purple-200">
                    <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
                    <span>
                      <strong className="text-white">{content.player.activeTechniquePrefix || "Active Technique:"}</strong>{" "}
                      {activeChapter.technique}
                    </span>
                  </div>
                )}

                {/* Compact, Clean Beats Row / Grid */}
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {chapters.map((ch) => {
                    const isCurrent = activeChapter?.id === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => seekToChapter(ch.time)}
                        className={`group/beat flex items-center justify-between gap-2 rounded-xl border p-2.5 text-left transition duration-200 cursor-pointer ${
                          isCurrent
                            ? "border-purple-500 bg-purple-600/20 shadow-md shadow-purple-600/20 ring-1 ring-purple-500/40"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-white group-hover/beat:text-purple-200">{ch.title}</p>
                          {ch.technique && (
                            <p className="truncate text-[10px] text-white/50">{ch.technique}</p>
                          )}
                        </div>
                        <span className={`shrink-0 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                          isCurrent ? "bg-purple-600 text-white" : "bg-white/5 text-white/60"
                        }`}>
                          {formatPlayerTime(ch.time)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {content.player.showComments && effectiveVideoUrl && kind !== "unknown" && (
              <section className="rounded-xl border border-white/10 bg-[#101014]/95 p-4 sm:rounded-2xl sm:p-6" aria-labelledby="video-comments-heading">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                    <h2 id="video-comments-heading" className="text-lg font-semibold text-white"><EditableText path="player.commentsTitle" value={content.player.commentsTitle} as="span" /></h2>
                    <span className="text-sm tabular-nums text-white/45">{comments.length}</span>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-200">
                        <ShieldCheck className="h-3 w-3" />
                        Admin
                      </span>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-xs text-white/50">
                    <EditableText path="player.commentsSortLabel" value={content.player.commentsSortLabel} as="span" />
                    <select
                      aria-label="Sort comments"
                      value={commentSort}
                      onChange={(event) => setCommentSort(event.target.value as "newest" | "oldest")}
                      className="min-h-9 rounded-lg border border-white/10 bg-[#080808] px-2 text-xs text-white outline-none focus:border-cyan-200/50"
                    >
                      <option value="newest">{content.player.commentsNewestLabel}</option>
                      <option value="oldest">{content.player.commentsOldestLabel}</option>
                    </select>
                  </label>
                </div>

                <form onSubmit={submitComment} className="mb-6 space-y-3 border-b border-white/10 pb-5">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
                    <div className="min-w-0 space-y-1">
                      <label className="text-[11px] text-white/55" htmlFor="video-comment-name">
                        <EditableText path="player.commentNameLabel" value={content.player.commentNameLabel} as="span" />
                      </label>
                      <input
                        id="video-comment-name"
                        value={commentName}
                        onChange={(event) => setCommentName(event.target.value)}
                        maxLength={80}
                        required
                        placeholder={content.player.commentNamePlaceholder}
                        className="min-h-11 w-full min-w-0 rounded-lg border border-white/10 bg-[#080808] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-200/50"
                      />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <label className="text-[11px] text-white/55" htmlFor="video-comment-body">
                        <EditableText path="player.commentBodyLabel" value={content.player.commentBodyLabel} as="span" />
                      </label>
                      <textarea
                        id="video-comment-body"
                        value={commentBody}
                        onChange={(event) => setCommentBody(event.target.value)}
                        maxLength={1000}
                        required
                        rows={2}
                        placeholder={content.player.commentPlaceholder}
                        className="min-h-11 w-full min-w-0 resize-y rounded-lg border border-white/10 bg-[#080808] px-3 py-2.5 text-sm leading-5 text-white outline-none placeholder:text-white/35 focus:border-cyan-200/50"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] text-white/40"><EditableText path="player.commentsPrivacyNote" value={content.player.commentsPrivacyNote} as="span" multiline /></p>
                    <button
                      type="submit"
                      disabled={commentStatus === "sending" || !commentName.trim() || !commentBody.trim()}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-cyan-200 px-4 text-xs font-semibold text-[#071316] transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {commentStatus === "sending" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
                      <EditableText path="player.commentSubmitLabel" value={content.player.commentSubmitLabel} as="span" />
                    </button>
                  </div>
                  {commentError && <p role="alert" className="text-sm text-red-300">{commentError}</p>}
                </form>

                {commentsLoading ? (
                  <p className="text-sm text-white/45"><EditableText path="player.commentsLoadingMessage" value={content.player.commentsLoadingMessage} as="span" /></p>
                ) : commentsError ? (
                  <p role="status" className="text-sm text-white/50"><EditableText path="player.commentsUnavailableMessage" value={content.player.commentsUnavailableMessage} as="span" /></p>
                ) : sortedComments.length ? (
                  <div className="space-y-5">
                    {sortedComments.map((comment) => (
                      <article key={comment.id} className="flex min-w-0 items-start justify-between gap-3 group rounded-xl p-2 transition hover:bg-white/[0.02]">
                        <div className="flex min-w-0 items-start gap-3 flex-1">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-200/10 text-xs font-semibold uppercase text-cyan-100">
                            {comment.name.trim().slice(0, 2)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <h3 className="text-sm font-semibold text-white">{comment.name}</h3>
                              <time dateTime={comment.createdAt} className="text-[11px] text-white/40">
                                {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : "Just now"}
                              </time>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-white/75">{comment.body}</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deletingCommentId === comment.id}
                            title="Delete comment (Admin)"
                            aria-label={`Delete comment by ${comment.name}`}
                            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300 transition hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-100 disabled:opacity-50"
                          >
                            {deletingCommentId === comment.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-red-300" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            <span>Delete</span>
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="py-2 text-sm text-white/45"><EditableText path="player.commentsEmptyMessage" value={content.player.commentsEmptyMessage} as="span" multiline /></p>
                )}
              </section>
            )}

              </div>

            {content.player.showSuggestions && <aside className="min-w-0 rounded-xl border border-white/10 bg-[#101014]/95 p-4 sm:rounded-2xl sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <ListVideo className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-white">
                  <EditableText
                    path={recommendations[0]?.mediaUrl.trim() === effectiveVideoUrl ? "player.currentVideoLabel" : "player.suggestionsTitle"}
                    value={recommendations[0]?.mediaUrl.trim() === effectiveVideoUrl ? content.player.currentVideoLabel : content.player.suggestionsTitle}
                    as="span"
                  />
                </h2>
              </div>
              {recommendations.length ? (
                <div className="space-y-3">
                  {recommendations.map((item) => {
                    const thumbnail = getMediaThumbnailUrl(item);
                    return (
                      <article
                        key={item.id}
                        className="group flex w-full items-center gap-2 rounded-lg border border-white/5 p-2 transition hover:border-cyan-200/30 hover:bg-white/[0.04]"
                      >
                        {content.player.showReferenceButton && <button
                          type="button"
                          onClick={() => openRecommendation(item)}
                          className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                        >
                          <span className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-black">
                            {thumbnail && <Image src={thumbnail} alt="" fill sizes="96px" className="object-cover transition group-hover:scale-105" />}
                          </span>
                          <span className="min-w-0">
                            <span className="line-clamp-2 block text-xs font-medium leading-5 text-white">{item.title}</span>
                            <span className="mt-1 block truncate text-[10px] text-white/45">{item.category}</span>
                          </span>
                        </button>}
                        <button
                          type="button"
                          onClick={() => addReference(item.title, item.mediaUrl)}
                          aria-label={`Add ${item.title} as reference`}
                          title="Use this video as reference"
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-cyan-100/70 transition hover:bg-cyan-200/10 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                        >
                          <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs leading-5 text-white/45"><EditableText path="player.suggestionsEmptyMessage" value={content.player.suggestionsEmptyMessage} as="span" multiline /></p>
              )}
            </aside>}
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
