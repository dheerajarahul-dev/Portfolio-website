"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  FolderKanban,
  CheckSquare,
  PlaySquare,
  MessageSquare,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { StudioSession, StudioNotification } from "@/lib/studio-types";

interface Props {
  session: StudioSession;
  initialNotifications: StudioNotification[];
}

export default function InboxClient({ session, initialNotifications }: Props) {
  const [notifications, setNotifications] = useState<StudioNotification[]>(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [marking, setMarking] = useState(false);

  async function handleMarkAllRead() {
    if (marking) return;
    setMarking(true);
    try {
      const res = await fetch("/api/studio/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(false);
    }
  }

  const filtered = notifications.filter((n) => (filter === "unread" ? !n.read : true));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-violet-500" />
            Inbox & Notifications
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            System updates, assignments, comment mentions, and approval requests
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === "all" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === "unread" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Unread
          </button>

          <button
            onClick={handleMarkAllRead}
            disabled={marking}
            className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 border border-violet-500/40 hover:bg-violet-600/30 text-violet-300 rounded-lg text-xs font-semibold transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-16 text-center text-zinc-500 text-sm bg-[#111113] rounded-2xl border border-white/[0.06]">
            No notifications in your inbox.
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                n.read
                  ? "bg-[#111113] border-white/[0.06] opacity-75"
                  : "bg-[#161619] border-violet-500/30 shadow-lg shadow-violet-950/20"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  n.read ? "bg-zinc-800 text-zinc-400" : "bg-violet-600 text-white"
                }`}
              >
                <Bell className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-white text-sm font-semibold truncate">{n.title}</h3>
                  <span className="text-[11px] text-zinc-500 flex-shrink-0">
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{n.body}</p>

                {n.link && (
                  <Link
                    href={n.link}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 mt-3 transition-colors"
                  >
                    Open view
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
