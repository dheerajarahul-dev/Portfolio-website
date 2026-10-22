"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  PlaySquare,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Send,
  Loader2,
  Film,
  Download,
  Trash2,
} from "lucide-react";
import type { StudioSession, StudioProject, StudioAsset } from "@/lib/studio-types";

interface Props {
  session: StudioSession;
  project: StudioProject;
  videoAssets: StudioAsset[];
}

interface LocalComment {
  id: string;
  authorName: string;
  timestampSec: number;
  body: string;
  resolved: boolean;
  createdAt: string;
}

function formatTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 24); // 24fps approximation
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}

export default function VideoReviewClient({ session, project, videoAssets }: Props) {
  const [selectedAsset, setSelectedAsset] = useState<StudioAsset | null>(
    videoAssets[0] ?? null
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Comments state
  const [comments, setComments] = useState<LocalComment[]>([
    {
      id: "demo-1",
      authorName: session.displayName,
      timestampSec: 2.5,
      body: "Opening logo animation looks clean! Can we add a subtle bass hit on the reveal?",
      resolved: false,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [commentText, setCommentText] = useState("");
  const [commentTimestamp, setCommentTimestamp] = useState<number | null>(null);

  // Approval state
  const [decision, setDecision] = useState<"approved" | "changes_requested" | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  // Sync video time
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stepFrame = (forward: boolean) => {
    if (videoRef.current) {
      const step = 1 / 24; // 1 frame at 24fps
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + (forward ? step : -step)));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const time = commentTimestamp !== null ? commentTimestamp : currentTime;

    const newComment: LocalComment = {
      id: crypto.randomUUID(),
      authorName: session.displayName,
      timestampSec: time,
      body: commentText.trim(),
      resolved: false,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, newComment].sort((a, b) => a.timestampSec - b.timestampSec));
    setCommentText("");
    setCommentTimestamp(null);
  };

  const handleToggleResolve = (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c))
    );
  };

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await fetch(`/api/studio/comments?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete comment on server:", err);
    }
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  async function handleDecisionSubmit(choice: "approved" | "changes_requested") {
    setSubmittingDecision(true);
    setDecisionSuccess(null);

    const nextStatus = choice === "approved" ? "final_approval" : "revisions_requested";

    try {
      await fetch(`/api/studio/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          note: decisionNotes,
        }),
      });

      setDecisionSuccess(
        choice === "approved"
          ? "Video version approved! Moved to Final Approval."
          : "Revision request submitted with feedback."
      );
      setDecision(choice);
    } catch {
      console.error("Failed to submit decision");
    } finally {
      setSubmittingDecision(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <Link
              href={`/studio/projects/${project.id}`}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Project Workspace
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <PlaySquare className="w-6 h-6 text-violet-500" />
            Review Studio & Frame Feedback
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Frame-accurate review for: <span className="text-zinc-200 font-medium">{project.title}</span>
          </p>
        </div>

        {/* Version / Asset Picker if multiple exist */}
        {videoAssets.length > 1 && (
          <select
            value={selectedAsset?.id}
            onChange={(e) => {
              const a = videoAssets.find((x) => x.id === e.target.value);
              if (a) setSelectedAsset(a);
            }}
            className="px-3.5 py-2 bg-zinc-900 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none"
          >
            {videoAssets.map((v, i) => (
              <option key={v.id} value={v.id}>
                Cut v{i + 1}: {v.originalFilename || v.filename}
              </option>
            ))}
          </select>
        )}
      </div>

      {decisionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{decisionSuccess}</span>
        </div>
      )}

      {/* Main Studio Layout: Player on Left, Comments & Approval on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Player */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#111113] rounded-2xl border border-white/[0.06] overflow-hidden shadow-2xl">
            {/* Video Canvas Container */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {selectedAsset?.downloadUrl ? (
                <video
                  ref={videoRef}
                  src={selectedAsset.downloadUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={togglePlay}
                  className="w-full h-full object-contain cursor-pointer"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-500 p-8 text-center space-y-3">
                  <Film className="w-12 h-12 text-zinc-600 animate-pulse" />
                  <p className="text-sm">
                    No video media uploaded yet for this project.
                  </p>
                  <Link
                    href={`/studio/projects/${project.id}`}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Upload Video in Project Workspace
                  </Link>
                </div>
              )}
            </div>

            {/* Custom Playback Controls & Scrubber */}
            <div className="p-4 bg-[#111113] border-t border-white/[0.06] space-y-3">
              {/* Timeline scrubber with comment markers */}
              <div className="relative flex items-center">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.01}
                  value={currentTime}
                  onChange={handleScrubberChange}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />

                {/* Comment Markers on scrubber */}
                {duration > 0 &&
                  comments.map((c) => {
                    const leftPercent = (c.timestampSec / duration) * 100;
                    return (
                      <div
                        key={c.id}
                        onClick={() => seekTo(c.timestampSec)}
                        title={`Comment at ${formatTimecode(c.timestampSec)}: ${c.body}`}
                        style={{ left: `${leftPercent}%` }}
                        className="absolute w-2 h-3 -top-0.5 -translate-x-1/2 bg-amber-400 hover:bg-white rounded-sm cursor-pointer z-10 transition-colors shadow-sm"
                      />
                    );
                  })}
              </div>

              {/* Bottom Buttons */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => stepFrame(false)}
                    title="Previous frame (-1 frame)"
                    className="px-2 py-1 rounded bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:text-white"
                  >
                    -1f
                  </button>
                  <button
                    onClick={() => stepFrame(true)}
                    title="Next frame (+1 frame)"
                    className="px-2 py-1 rounded bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:text-white"
                  >
                    +1f
                  </button>

                  {/* Timecode display */}
                  <div className="font-mono text-zinc-300 ml-2">
                    <span className="text-violet-400 font-bold">{formatTimecode(currentTime)}</span>
                    <span className="text-zinc-600"> / </span>
                    <span className="text-zinc-500">{formatTimecode(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Playback speed */}
                  <select
                    value={playbackRate}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value);
                      setPlaybackRate(rate);
                      if (videoRef.current) videoRef.current.playbackRate = rate;
                    }}
                    className="bg-zinc-900 border border-white/[0.06] text-zinc-300 rounded px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1.0x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2.0x</option>
                  </select>

                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }
                    }}
                    className="text-zinc-400 hover:text-white"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => {
                      if (videoRef.current?.requestFullscreen) {
                        videoRef.current.requestFullscreen();
                      }
                    }}
                    className="text-zinc-400 hover:text-white"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Timestamp Comment Bar */}
          <div className="bg-[#111113] p-4 rounded-2xl border border-white/[0.06] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Clock className="w-4 h-4 text-violet-400" />
              <span>Current marker: <strong className="text-white font-mono">{formatTimecode(currentTime)}</strong></span>
            </div>
            <button
              onClick={() => {
                setCommentTimestamp(currentTime);
                // Pause playback while commenting
                if (videoRef.current) {
                  videoRef.current.pause();
                  setIsPlaying(false);
                }
              }}
              className="px-3.5 py-1.5 bg-violet-600/20 border border-violet-500/40 hover:bg-violet-600/30 text-violet-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Tag Timestamp
            </button>
          </div>
        </div>

        {/* Right Col: Timestamp Comments & Signoff Panel */}
        <div className="space-y-5">
          {/* Signoff / Approval Card */}
          <div className="bg-[#111113] p-5 rounded-2xl border border-white/[0.06] space-y-4">
            <h2 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
              Client Signoff & Decision
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleDecisionSubmit("approved")}
                disabled={submittingDecision}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Video
              </button>
              <button
                onClick={() => handleDecisionSubmit("changes_requested")}
                disabled={submittingDecision}
                className="py-2.5 px-3 bg-amber-600/20 border border-amber-600/40 hover:bg-amber-600/30 text-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <AlertCircle className="w-4 h-4" />
                Request Changes
              </button>
            </div>
          </div>

          {/* Feedback & Markers Thread */}
          <div className="bg-[#111113] p-5 rounded-2xl border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h2 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
                Timestamped Feedback ({comments.length})
              </h2>
            </div>

            {/* Comments List */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <div className="text-zinc-500 text-xs text-center py-8">
                  No timestamped comments yet. Tag a timecode to add feedback!
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      c.resolved
                        ? "bg-zinc-900/30 border-white/[0.04] opacity-60"
                        : "bg-zinc-900/70 border-white/[0.08] hover:border-violet-500/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <button
                        onClick={() => seekTo(c.timestampSec)}
                        className="font-mono text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3" />
                        {formatTimecode(c.timestampSec)}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleResolve(c.id)}
                          className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          {c.resolved ? "Resolved" : "Mark Resolved"}
                        </button>
                        {(session.role === "super_admin" || session.role === "manager") && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            title="Delete comment (Admin)"
                            className="text-zinc-500 hover:text-red-400 transition-colors p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-200 leading-relaxed">{c.body}</p>
                    <div className="text-[10px] text-zinc-500 mt-2">
                      {c.authorName} &bull; {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Composer */}
            <form onSubmit={handleAddComment} className="pt-2 border-t border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>
                  Adding note at:{" "}
                  <strong className="text-amber-400 font-mono">
                    {formatTimecode(commentTimestamp !== null ? commentTimestamp : currentTime)}
                  </strong>
                </span>
                {commentTimestamp !== null && (
                  <button
                    type="button"
                    onClick={() => setCommentTimestamp(null)}
                    className="text-zinc-500 hover:text-zinc-300 text-[11px]"
                  >
                    Clear marker
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Leave frame note..."
                  className="flex-1 px-3.5 py-2 bg-zinc-900 border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
