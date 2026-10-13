"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  LogOut,
  Mail,
  Trash2,
  Plus,
  Loader2,
  Eye,
  EyeOff,
  Video,
  Type,
  PlayCircle,
  DollarSign,
  MessageSquare,
  Palette,
} from "lucide-react";
import type { ContactMessage, SiteContent, WorkItem } from "@/lib/types";
import { defaultContent } from "@/lib/default-content";
import { extractYoutubeId } from "@/lib/youtube";
import { getYoutubeIdFromUrl, youtubeThumbnail } from "@/lib/media";
import FileUploadField from "@/components/admin/FileUploadField";
import VideoPlayerPreview from "@/components/admin/VideoPlayerPreview";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

type Tab = "hero" | "player" | "portfolio" | "videos" | "sections" | "pricing" | "contact" | "messages";

const tabs: { id: Tab; label: string; icon: typeof Type }[] = [
  { id: "hero", label: "Hero & Site", icon: Type },
  { id: "player", label: "Player", icon: PlayCircle },
  { id: "portfolio", label: "Portfolio", icon: Video },
  { id: "videos", label: "Videos", icon: Video },
  { id: "sections", label: "Sections", icon: Type },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "contact", label: "Contact", icon: Mail },
  { id: "messages", label: "Messages", icon: MessageSquare },
];

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const cls =
    "w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-purple-400/60";
  return (
    <label className="block space-y-1.5">
      <span className="text-xs uppercase tracking-wider text-white/50">{label}</span>
      {multiline ? (
        <textarea
          rows={3}
          className={cls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [tab, setTab] = useState<Tab>("hero");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const checkSession = useCallback(async () => {
    const res = await fetch("/api/admin/session");
    const data = await res.json();
    setAuthenticated(data.authenticated);
    if (data.authenticated) {
      const [cRes, mRes] = await Promise.all([
        fetch("/api/content"),
        fetch("/api/messages"),
      ]);
      setContent(await cRes.json());
      setMessages(await mRes.json());
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkSession();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [checkSession]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setLoginError("Wrong password.");
      return;
    }
    setPassword("");
    await checkSession();
  };

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthenticated(false);
    router.push("/");
  };

  const saveAll = async () => {
    setSaving(true);
    setStatus("");
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      if (data.content) setContent(data.content);
      setStatus("All changes saved successfully.");
    } else {
      setStatus("Failed to save. Please log in again.");
    }
  };

  const refreshMessages = async () => {
    const res = await fetch("/api/messages");
    if (res.ok) setMessages(await res.json());
  };

  const markRead = async (id: string, read: boolean) => {
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read }),
    });
    await refreshMessages();
  };

  const removeMessage = async (id: string) => {
    await fetch(`/api/messages?id=${id}`, { method: "DELETE" });
    await refreshMessages();
  };

  const addWorkItem = () => {
    const item: WorkItem = {
      id: crypto.randomUUID(),
      title: "New Project",
      category: "Category",
      thumbnailUrl: "",
      videoUrl: "",
    };
    setContent((c) => ({
      ...c,
      featuredWork: {
        ...c.featuredWork,
        items: [...c.featuredWork.items, item],
      },
    }));
  };

  const updateWorkItem = (id: string, patch: Partial<WorkItem>) => {
    setContent((c) => ({
      ...c,
      featuredWork: {
        ...c.featuredWork,
        items: c.featuredWork.items.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      },
    }));
  };

  const removeWorkItem = (id: string) => {
    setContent((c) => ({
      ...c,
      featuredWork: {
        ...c.featuredWork,
        items: c.featuredWork.items.filter((item) => item.id !== id),
      },
    }));
  };

  const addVideoItem = () => {
    const item: WorkItem = {
      id: crypto.randomUUID(),
      title: "New Video",
      category: "Video",
      thumbnailUrl: "",
      videoUrl: "",
      description: "",
    };
    setContent((c) => ({
      ...c,
      videoSection: {
        ...c.videoSection,
        items: [...c.videoSection.items, item],
      },
    }));
  };

  const updateVideoItem = (id: string, patch: Partial<WorkItem>) => {
    setContent((c) => ({
      ...c,
      videoSection: {
        ...c.videoSection,
        items: c.videoSection.items.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      },
    }));
  };

  const removeVideoItem = (id: string) => {
    setContent((c) => ({
      ...c,
      videoSection: {
        ...c.videoSection,
        items: c.videoSection.items.filter((item) => item.id !== id),
      },
    }));
  };

  if (authenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4">
        <form
          onSubmit={login}
          className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#111] p-8"
        >
          <h1 className="text-xl font-semibold text-white">Admin Login</h1>
          <p className="text-sm text-white/60">Enter your admin password.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-white outline-none focus:border-purple-400/60"
            placeholder="Password"
            autoComplete="current-password"
          />
          {loginError && <p className="text-sm text-red-400">{loginError}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-500"
          >
            Login
          </button>
          <Link
            href="/settings"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-400/30 bg-purple-600/15 py-2.5 text-sm font-semibold text-purple-100 hover:bg-purple-600/25"
          >
            <Palette className="h-4 w-4" />
            Customize
          </Link>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full text-sm text-white/50 hover:text-white"
          >
            Back to site
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-compact min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col items-stretch justify-between gap-3 px-3 py-3 sm:flex-row sm:items-center sm:px-4 sm:py-4">
          <div>
            <h1 className="text-lg font-semibold">CreativeX Admin</h1>
            <p className="text-xs text-white/50">Edit site content & view messages</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Link
              href="/settings"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/10 sm:px-4"
            >
              <Palette className="h-4 w-4" />
              Customize
            </Link>
            <Link
              href="/?edit=1"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-400/40 bg-purple-600/20 px-3 py-2 text-sm font-semibold text-purple-100 hover:bg-purple-600/35 sm:px-4"
            >
              <ExternalLink className="h-4 w-4" />
              Edit Live Site
            </Link>
            <button
              onClick={saveAll}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-3 py-2 text-sm font-semibold hover:bg-purple-500 disabled:opacity-60 sm:px-4"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        {status && (
          <p className="mx-auto max-w-6xl px-4 pb-3 text-sm text-green-400">{status}</p>
        )}
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-3 py-4 sm:px-4 sm:py-6">
        <nav className="hidden w-44 shrink-0 flex-col gap-1 md:flex">
          {tabs.map((t) => {
            const Icon = t.icon;
            const unread = t.id === "messages" ? messages.filter((m) => !m.read).length : 0;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  tab === t.id
                    ? "bg-purple-600/20 text-purple-200"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t.label}
                {unread > 0 && (
                  <span className="ml-auto rounded-full bg-purple-600 px-1.5 text-xs">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1 space-y-4 pb-20">
          <select
            className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-sm md:hidden"
            value={tab}
            onChange={(e) => setTab(e.target.value as Tab)}
          >
            {tabs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          {tab === "hero" && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-[#111] p-5">
              <h2 className="font-semibold">Hero & Site Meta</h2>
              <Field
                label="Page Title"
                value={content.metadata.title}
                onChange={(v) =>
                  setContent((c) => ({ ...c, metadata: { ...c.metadata, title: v } }))
                }
              />
              <Field
                label="Meta Description"
                value={content.metadata.description}
                onChange={(v) =>
                  setContent((c) => ({ ...c, metadata: { ...c.metadata, description: v } }))
                }
                multiline
              />
              <Field
                label="Hero Line 1"
                value={content.hero.line1}
                onChange={(v) => setContent((c) => ({ ...c, hero: { ...c.hero, line1: v } }))}
              />
              <Field
                label="Hero Line 2"
                value={content.hero.line2}
                onChange={(v) => setContent((c) => ({ ...c, hero: { ...c.hero, line2: v } }))}
              />
              <Field
                label="Punchline"
                value={content.hero.punchline}
                onChange={(v) =>
                  setContent((c) => ({ ...c, hero: { ...c.hero, punchline: v } }))
                }
              />
              <Field
                label="Subheading"
                value={content.hero.subheading}
                onChange={(v) =>
                  setContent((c) => ({ ...c, hero: { ...c.hero, subheading: v } }))
                }
                multiline
              />
              <Field
                label="Hero Background YouTube URL"
                value={content.hero.youtubeVideoId}
                onChange={(v) =>
                  setContent((c) => ({
                    ...c,
                    hero: { ...c.hero, youtubeVideoId: extractYoutubeId(v) || v },
                  }))
                }
              />
              <FileUploadField
                label="Upload Logo"
                accept="image/jpeg,image/png,image/webp,image/gif"
                currentUrl={content.navbar.logoUrl}
                hint="Or paste URL below"
                onUploaded={(url) =>
                  setContent((c) => ({
                    ...c,
                    navbar: { ...c.navbar, logoUrl: url },
                  }))
                }
              />
              <Field
                label="Logo URL (optional)"
                value={content.navbar.logoUrl}
                onChange={(v) =>
                  setContent((c) => ({
                    ...c,
                    navbar: { ...c.navbar, logoUrl: v },
                  }))
                }
              />
              <p className="text-xs text-white/40">
                Hero uses YouTube URL. Projects: upload thumbnail + paste YouTube or upload mp4.
              </p>
            </div>
          )}

          {tab === "player" && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-[#111] p-5">
              <h2 className="font-semibold">Player Experience</h2>
              <Field
                label="Player Title"
                value={content.player.title}
                onChange={(v) =>
                  setContent((c) => ({ ...c, player: { ...c.player, title: v } }))
                }
              />
              <Field
                label="Player Description"
                value={content.player.description}
                onChange={(v) =>
                  setContent((c) => ({ ...c, player: { ...c.player, description: v } }))
                }
                multiline
              />
              <FileUploadField
                label="Player Background Image"
                accept="image/jpeg,image/png,image/webp,image/gif"
                currentUrl={content.player.backgroundUrl}
                hint="Upload or paste a URL for player background visuals"
                onUploaded={(url) =>
                  setContent((c) => ({ ...c, player: { ...c.player, backgroundUrl: url } }))
                }
              />
              <Field
                label="Player Background URL"
                value={content.player.backgroundUrl}
                onChange={(v) =>
                  setContent((c) => ({ ...c, player: { ...c.player, backgroundUrl: v } }))
                }
              />
              <Field
                label="Accent Color"
                value={content.player.accentColor}
                onChange={(v) =>
                  setContent((c) => ({ ...c, player: { ...c.player, accentColor: v } }))
                }
              />
              <p className="text-xs text-white/40">
                These settings determine the visuals when a guest opens the dedicated player page.
              </p>
            </div>
          )}

          {tab === "portfolio" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Portfolio Videos</h2>
                <button
                  onClick={addWorkItem}
                  className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-sm hover:bg-purple-500"
                >
                  <Plus className="h-4 w-4" /> Add Video
                </button>
              </div>
              <Field
                label="Section Title"
                value={content.featuredWork.title}
                onChange={(v) =>
                  setContent((c) => ({
                    ...c,
                    featuredWork: { ...c.featuredWork, title: v },
                  }))
                }
              />
              {content.featuredWork.items.map((item) => (
                <div
                  key={item.id}
                  className="space-y-3 rounded-2xl border border-white/10 bg-[#111] p-5"
                >
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-purple-300">Project</span>
                    <button
                      onClick={() => removeWorkItem(item.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Field
                    label="Title"
                    value={item.title}
                    onChange={(v) => updateWorkItem(item.id, { title: v })}
                  />
                  <Field
                    label="Category"
                    value={item.category}
                    onChange={(v) => updateWorkItem(item.id, { category: v })}
                  />
                  <FileUploadField
                    label="Upload Thumbnail"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    currentUrl={item.thumbnailUrl}
                    hint="JPG/PNG/WebP up to 8MB"
                    onUploaded={(url) =>
                      updateWorkItem(item.id, { thumbnailUrl: url })
                    }
                  />
                  <Field
                    label="Thumbnail URL (optional)"
                    value={item.thumbnailUrl}
                    onChange={(v) => updateWorkItem(item.id, { thumbnailUrl: v })}
                  />
                  <FileUploadField
                    label="Upload Video File (mp4/webm)"
                    accept="video/mp4,video/webm"
                    currentUrl={
                      item.videoUrl?.match(/^\/uploads\//) ? item.videoUrl : undefined
                    }
                    hint="Or paste YouTube / Google Drive link below"
                    onUploaded={(url) => updateWorkItem(item.id, { videoUrl: url })}
                  />
                  <Field
                    label="Video URL (YouTube, Google Drive, or uploaded path)"
                    value={item.videoUrl}
                    onChange={(v) => {
                      const ytId = getYoutubeIdFromUrl(v);
                      updateWorkItem(item.id, {
                        videoUrl: v,
                        ...(ytId && !item.thumbnailUrl
                          ? { thumbnailUrl: youtubeThumbnail(ytId) }
                          : {}),
                      });
                    }}
                  />
                  <VideoPlayerPreview
                    title={item.title}
                    thumbnailUrl={item.thumbnailUrl}
                    videoUrl={item.videoUrl}
                  />
                </div>
              ))}
              <Field
                label="Showcase YouTube ID or URL"
                value={content.showcase.youtubeVideoId}
                onChange={(v) =>
                  setContent((c) => ({
                    ...c,
                    showcase: {
                      ...c.showcase,
                      youtubeVideoId: extractYoutubeId(v),
                    },
                  }))
                }
              />
            </div>
          )}
          {tab === "videos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Video Section</h2>
                <button
                  onClick={addVideoItem}
                  className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-sm hover:bg-purple-500"
                >
                  <Plus className="h-4 w-4" /> Add Video
                </button>
              </div>
              <Field
                label="Section Eyebrow"
                value={content.videoSection.eyebrow}
                onChange={(v) =>
                  setContent((c) => ({
                    ...c,
                    videoSection: { ...c.videoSection, eyebrow: v },
                  }))
                }
              />
              <Field
                label="Section Title"
                value={content.videoSection.title}
                onChange={(v) =>
                  setContent((c) => ({
                    ...c,
                    videoSection: { ...c.videoSection, title: v },
                  }))
                }
              />
              <Field
                label="Section Description"
                value={content.videoSection.description}
                onChange={(v) =>
                  setContent((c) => ({
                    ...c,
                    videoSection: { ...c.videoSection, description: v },
                  }))
                }
                multiline
              />
              {content.videoSection.items.map((item) => (
                <div
                  key={item.id}
                  className="space-y-3 rounded-2xl border border-white/10 bg-[#111] p-5"
                >
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-purple-300">Video</span>
                    <button
                      onClick={() => removeVideoItem(item.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Field
                    label="Title"
                    value={item.title}
                    onChange={(v) => updateVideoItem(item.id, { title: v })}
                  />
                  <Field
                    label="Category"
                    value={item.category}
                    onChange={(v) => updateVideoItem(item.id, { category: v })}
                  />
                  <Field
                    label="Description"
                    value={item.description || ""}
                    onChange={(v) => updateVideoItem(item.id, { description: v })}
                    multiline
                  />
                  <FileUploadField
                    label="Upload Thumbnail"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    currentUrl={item.thumbnailUrl}
                    hint="JPG/PNG/WebP up to 8MB"
                    onUploaded={(url) => updateVideoItem(item.id, { thumbnailUrl: url })}
                  />
                  <Field
                    label="Thumbnail URL (optional)"
                    value={item.thumbnailUrl}
                    onChange={(v) => updateVideoItem(item.id, { thumbnailUrl: v })}
                  />
                  <FileUploadField
                    label="Upload Video File (mp4/webm)"
                    accept="video/mp4,video/webm"
                    currentUrl={
                      item.videoUrl?.match(/^\/uploads\//) ? item.videoUrl : undefined
                    }
                    hint="Or paste YouTube / Google Drive link below"
                    onUploaded={(url) => updateVideoItem(item.id, { videoUrl: url })}
                  />
                  <Field
                    label="Video URL (YouTube, Google Drive, or uploaded path)"
                    value={item.videoUrl}
                    onChange={(v) => {
                      const ytId = getYoutubeIdFromUrl(v);
                      updateVideoItem(item.id, {
                        videoUrl: v,
                        ...(ytId && !item.thumbnailUrl
                          ? { thumbnailUrl: youtubeThumbnail(ytId) }
                          : {}),
                      });
                    }}
                  />
                  <VideoPlayerPreview
                    title={item.title}
                    thumbnailUrl={item.thumbnailUrl}
                    videoUrl={item.videoUrl}
                  />
                </div>
              ))}
            </div>
          )}

          {tab === "sections" && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-[#111] p-5">
              <h2 className="font-semibold">Section Text</h2>
              <Field
                label="Stats Title"
                value={content.stats.title}
                onChange={(v) =>
                  setContent((c) => ({ ...c, stats: { ...c.stats, title: v } }))
                }
              />
              <Field
                label="Why Us Title"
                value={content.whyChooseUs.title}
                onChange={(v) =>
                  setContent((c) => ({
                    ...c,
                    whyChooseUs: { ...c.whyChooseUs, title: v },
                  }))
                }
              />
              <Field
                label="Showcase Title"
                value={content.showcase.title}
                onChange={(v) =>
                  setContent((c) => ({
                    ...c,
                    showcase: { ...c.showcase, title: v },
                  }))
                }
              />
              <Field
                label="Showcase Description"
                value={content.showcase.description}
                onChange={(v) =>
                  setContent((c) => ({
                    ...c,
                    showcase: { ...c.showcase, description: v },
                  }))
                }
                multiline
              />
              <Field
                label="About Paragraph 1"
                value={content.about.paragraph1}
                onChange={(v) =>
                  setContent((c) => ({ ...c, about: { ...c.about, paragraph1: v } }))
                }
                multiline
              />
              <Field
                label="About Paragraph 2"
                value={content.about.paragraph2}
                onChange={(v) =>
                  setContent((c) => ({ ...c, about: { ...c.about, paragraph2: v } }))
                }
                multiline
              />
            </div>
          )}

          {tab === "pricing" && (
            <div className="space-y-4">
              <Field
                label="Pricing Section Title"
                value={content.pricing.title}
                onChange={(v) =>
                  setContent((c) => ({
                    ...c,
                    pricing: { ...c.pricing, title: v },
                  }))
                }
              />
              {content.pricing.plans.map((plan, i) => (
                <div
                  key={plan.title}
                  className="space-y-3 rounded-2xl border border-white/10 bg-[#111] p-5"
                >
                  <span className="text-sm text-purple-300">Plan {i + 1}</span>
                  <Field
                    label="Title"
                    value={plan.title}
                    onChange={(v) => {
                      const plans = [...content.pricing.plans];
                      plans[i] = { ...plans[i], title: v };
                      setContent((c) => ({
                        ...c,
                        pricing: { ...c.pricing, plans },
                      }));
                    }}
                  />
                  <Field
                    label="Indian Price (₹)"
                    value={plan.price}
                    onChange={(v) => {
                      const plans = [...content.pricing.plans];
                      plans[i] = { ...plans[i], price: v };
                      setContent((c) => ({
                        ...c,
                        pricing: { ...c.pricing, plans },
                      }));
                    }}
                  />
                  <Field
                    label="International Price ($)"
                    value={String(plan.priceUSD ?? "")}
                    onChange={(v) => {
                      const plans = [...content.pricing.plans];
                      plans[i] = { ...plans[i], priceUSD: v ? parseFloat(v) : undefined };
                      setContent((c) => ({
                        ...c,
                        pricing: { ...c.pricing, plans },
                      }));
                    }}
                  />
                  <Field
                    label="Description"
                    value={plan.description}
                    onChange={(v) => {
                      const plans = [...content.pricing.plans];
                      plans[i] = { ...plans[i], description: v };
                      setContent((c) => ({
                        ...c,
                        pricing: { ...c.pricing, plans },
                      }));
                    }}
                    multiline
                  />
                  <Field
                    label="Features (one per line)"
                    value={plan.features.join("\n")}
                    onChange={(v) => {
                      const plans = [...content.pricing.plans];
                      plans[i] = {
                        ...plans[i],
                        features: v.split("\n").filter(Boolean),
                      };
                      setContent((c) => ({
                        ...c,
                        pricing: { ...c.pricing, plans },
                      }));
                    }}
                    multiline
                  />
                </div>
              ))}
            </div>
          )}

          {tab === "contact" && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-[#111] p-5">
              <h2 className="font-semibold">Contact & Social</h2>
              <Field
                label="Contact Title"
                value={content.contact.title}
                onChange={(v) =>
                  setContent((c) => ({
                    ...c,
                    contact: { ...c.contact, title: v },
                  }))
                }
              />
              {content.contact.channels.map((ch, i) => (
                <div key={i} className="space-y-2 rounded-xl border border-white/5 p-4">
                  <Field
                    label={`${ch.label} - Display`}
                    value={ch.value}
                    onChange={(v) => {
                      const channels = [...content.contact.channels];
                      channels[i] = { ...channels[i], value: v };
                      setContent((c) => ({
                        ...c,
                        contact: { ...c.contact, channels },
                      }));
                    }}
                  />
                  <Field
                    label={`${ch.label} - Link`}
                    value={ch.href}
                    onChange={(v) => {
                      const channels = [...content.contact.channels];
                      channels[i] = { ...channels[i], href: v };
                      setContent((c) => ({
                        ...c,
                        contact: { ...c.contact, channels },
                      }));
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {tab === "messages" && (
            <div className="space-y-3">
              <h2 className="font-semibold">
                Messages ({messages.length})
              </h2>
              {messages.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-[#111] p-8 text-center text-white/50">
                  No messages yet.
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-2xl border p-5 ${
                      msg.read
                        ? "border-white/10 bg-[#111]/60"
                        : "border-purple-400/30 bg-[#1a0a2e]/40"
                    }`}
                  >
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{msg.name}</p>
                        <p className="text-sm text-white/60">{msg.email}</p>
                      </div>
                      <span className="text-xs text-white/40">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mb-1 text-xs uppercase tracking-wider text-purple-300">
                      {msg.projectType}
                    </p>
                    <p className="mb-4 text-sm leading-7 text-white/80">{msg.message}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => markRead(msg.id, !msg.read)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
                      >
                        {msg.read ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" /> Mark unread
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" /> Mark read
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => removeMessage(msg.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
