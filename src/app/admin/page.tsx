"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  LogOut,
  Mail,
  Trash2,
  Plus,
  Loader2,
  Eye,
  EyeOff,
  Pencil,
  Search,
  MessageSquare,
  ImageIcon,
  X,
  LayoutDashboard,
  Settings,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  RotateCcw,
  Users,
  HardDrive,
  Square,
} from "lucide-react";
import type { AdminPermission, AdminUser, AdminUserRole, ContactMessage, MediaLibraryItem, SiteContent } from "@/lib/types";
import { ADMIN_ROLE_PERMISSIONS, getAdminRolePermissions } from "@/lib/admin-permissions";
import { defaultContent } from "@/lib/default-content";
import { extractYoutubeId } from "@/lib/youtube";
import { getMediaKind, getMediaThumbnailUrl, getYoutubeIdFromUrl, isGoogleDriveUrl, youtubeThumbnail } from "@/lib/media";
import FileUploadField from "@/components/admin/FileUploadField";
import VideoPlayerPreview from "@/components/admin/VideoPlayerPreview";

type Tab = "overview" | "media" | "storage" | "edit" | "messages" | "accounts" | "settings";
type StorageAsset = { name: string; url: string; size: number; contentType: string; referenced: boolean };
type StorageReport = { assets: StorageAsset[]; totalBytes: number };

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard; permission: AdminPermission }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, permission: "overview:view" },
  { id: "media", label: "Media Library", icon: ImageIcon, permission: "media:manage" },
  { id: "storage", label: "Storage", icon: HardDrive, permission: "media:manage" },
  { id: "edit", label: "Edit Site", icon: Pencil, permission: "site:edit" },
  { id: "messages", label: "Messages", icon: MessageSquare, permission: "messages:view" },
  { id: "accounts", label: "Accounts", icon: Users, permission: "accounts:manage" },
  { id: "settings", label: "Settings", icon: Settings, permission: "settings:view" },
];

const permissionOptions: { id: AdminPermission; label: string }[] = [
  { id: "overview:view", label: "View overview" },
  { id: "media:manage", label: "Manage media and uploads" },
  { id: "site:edit", label: "Edit site content" },
  { id: "messages:view", label: "View and mark messages" },
  { id: "messages:delete", label: "Manage message recycle bin" },
  { id: "accounts:manage", label: "Manage admin accounts" },
  { id: "settings:view", label: "View system settings" },
];

const contentIconOptions = ["CheckCircle", "Sparkles", "FastForward", "Film", "Globe", "PlayCircle", "Settings"] as const;

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

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs uppercase tracking-wider text-white/50">{label}</span>
      <select
        className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-purple-400/60"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

function getMediaPreviewUrl(item: MediaLibraryItem) {
  return getMediaThumbnailUrl(item) || "/logo.png";
}

function createMediaItem(): MediaLibraryItem {
  return {
    id: crypto.randomUUID(),
    title: "Untitled media",
    description: "",
    category: "General",
    type: "video",
    sourceType: "youtube",
    mediaUrl: "",
    thumbnailUrl: "",
    crop: { x: 50, y: 50, scale: 1 },
    published: false,
    featured: false,
    altText: "",
    createdAt: new Date().toISOString(),
  };
}

function isLocalUploadUrl(value: string) {
  return /^\/uploads\/[^?#]+\.(jpe?g|png|webp|gif|mp4|webm)(\?.*)?$/i.test(value.trim());
}

function isManagedUploadUrl(value: string) {
  if (isLocalUploadUrl(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /^\/storage\/v1\/object\/public\/[^/]+\/uploads\/[a-zA-Z0-9._-]+$/.test(url.pathname);
  } catch {
    return false;
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

function isLocalVideoUrl(value: string) {
  return /^\/(?!\/)[^?#]+\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(value.trim());
}

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function getMediaValidationError(draft: MediaLibraryItem) {
  const mediaUrl = draft.mediaUrl.trim();
  const thumbnailUrl = draft.thumbnailUrl.trim();
  const sourceType = draft.sourceType.trim();

  if (!draft.title.trim()) return "Title is required.";
  if (draft.type === "video" && !mediaUrl) return "Add a video URL or upload a video file before saving.";
  if (draft.type === "photo" && !mediaUrl && !thumbnailUrl) return "Add an image URL or upload an image before saving.";

  if (draft.type === "video" && mediaUrl) {
    if (sourceType === "youtube" && !getYoutubeIdFromUrl(mediaUrl)) {
      return "Enter a valid YouTube URL or switch the source type.";
    }
    if (sourceType === "drive" && !isGoogleDriveUrl(mediaUrl)) {
      return "Enter a valid Google Drive URL or switch the source type.";
    }
    if (sourceType === "upload" && !isLocalUploadUrl(mediaUrl) && !isHttpsUrl(mediaUrl)) {
      return "Uploaded media must use a valid saved upload URL.";
    }
    if (
      sourceType === "direct" &&
      (getMediaKind(mediaUrl) !== "video" || (!isHttpsUrl(mediaUrl) && !isLocalVideoUrl(mediaUrl)))
    ) {
      return "Enter a valid direct video URL.";
    }
  }

  if (draft.type === "photo") {
    const imageUrl = mediaUrl || thumbnailUrl;
    if (imageUrl && !isLocalUploadUrl(imageUrl) && !isHttpsUrl(imageUrl)) {
      return "Enter a valid image URL or upload an image.";
    }
  }

  if (thumbnailUrl && !isLocalUploadUrl(thumbnailUrl) && !isHttpsUrl(thumbnailUrl)) {
    return "Enter a valid thumbnail URL or upload a thumbnail.";
  }

  return "";
}

function MediaEditorModal({
  mode,
  item,
  saving,
  onCancel,
  onDelete,
  onSave,
  onUploadSave,
}: {
  mode: "add" | "edit";
  item: MediaLibraryItem;
  saving: boolean;
  onCancel: () => void;
  onDelete?: () => void;
  onSave: (item: MediaLibraryItem) => Promise<boolean>;
  onUploadSave: (item: MediaLibraryItem) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(item);
  const [error, setError] = useState("");

  const updateDraft = (patch: Partial<MediaLibraryItem>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const updateCrop = (patch: Partial<NonNullable<MediaLibraryItem["crop"]>>) => {
    setDraft((current) => ({
      ...current,
      crop: {
        x: current.crop?.x ?? 50,
        y: current.crop?.y ?? 50,
        scale: current.crop?.scale ?? 1,
        ...patch,
      },
    }));
  };

  const handleSave = async () => {
    const title = draft.title.trim();
    const validationError = getMediaValidationError(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    const ok = await onSave({ ...draft, title });
    if (!ok) setError("Save failed. Your changes are still here.");
  };

  const previewUrl = getMediaPreviewUrl(draft);
  const crop = draft.crop ?? { x: 50, y: 50, scale: 1 };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/75 px-3 py-4 backdrop-blur-sm sm:px-5 sm:py-8">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#101010] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#101010]/95 px-4 py-3 backdrop-blur sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-purple-300/80">
              {mode === "add" ? "Add Media" : "Edit Media"}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">{draft.title || "Untitled media"}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
            aria-label="Close media editor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-5">
            <section className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4">
              <h4 className="text-sm font-semibold text-white">Basic Information</h4>
              <Field label="Title" value={draft.title} onChange={(v) => updateDraft({ title: v })} />
              <Field
                label="Description"
                value={draft.description}
                onChange={(v) => updateDraft({ description: v })}
                multiline
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Category"
                  value={draft.category}
                  onChange={(v) => updateDraft({ category: v })}
                />
                <SelectField
                  label="Media type"
                  value={draft.type}
                  onChange={(v) => updateDraft({ type: v as "video" | "photo" })}
                >
                  <option value="video">Video</option>
                  <option value="photo">Image</option>
                </SelectField>
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4">
              <h4 className="text-sm font-semibold text-white">Media Source</h4>
              <SelectField
                label="Source type"
                value={draft.sourceType}
                onChange={(v) => updateDraft({ sourceType: v })}
              >
                <option value="youtube">YouTube URL</option>
                <option value="drive">Google Drive URL</option>
                <option value="upload">Uploaded file</option>
                <option value="direct">Direct URL</option>
              </SelectField>

              {draft.type === "video" ? (
                <FileUploadField
                  label="Upload or replace video"
                  accept="video/mp4,video/webm"
                  currentUrl={draft.mediaUrl?.match(/^\/uploads\//) ? draft.mediaUrl : undefined}
                  hint="MP4/WebM up to 100MB. Upload completes first, then the media record is published automatically."
                  completionMessage="Published and visible in the public Media Library."
                  onUploaded={async (url) => {
                    const uploadedItem = { ...draft, mediaUrl: url, sourceType: "upload", published: true };
                    updateDraft({ mediaUrl: url, sourceType: "upload", published: true });
                    if (!(await onUploadSave(uploadedItem))) {
                      throw new Error("PUBLISH_FAILED: The video uploaded, but its public media record could not be saved. Check the admin status and retry Save Changes.");
                    }
                  }}
                />
              ) : (
                <FileUploadField
                  label="Upload or replace image"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  currentUrl={draft.mediaUrl || draft.thumbnailUrl}
                  hint="JPG/PNG/WebP/GIF up to 100MB. Upload completes first, then the media record is published automatically."
                  completionMessage="Published and visible in the public Media Library."
                  onUploaded={async (url) => {
                    const uploadedItem = { ...draft, mediaUrl: url, thumbnailUrl: url, sourceType: "upload", published: true };
                    updateDraft({ mediaUrl: url, thumbnailUrl: url, sourceType: "upload", published: true });
                    if (!(await onUploadSave(uploadedItem))) {
                      throw new Error("PUBLISH_FAILED: The image uploaded, but its public media record could not be saved. Check the admin status and retry Save Changes.");
                    }
                  }}
                />
              )}

              <Field
                label={draft.type === "video" ? "Video URL" : "Image URL"}
                value={draft.mediaUrl}
                onChange={(v) => {
                  const ytId = getYoutubeIdFromUrl(v);
                  updateDraft({
                    mediaUrl: v,
                    ...(ytId && !draft.thumbnailUrl ? { thumbnailUrl: youtubeThumbnail(ytId) } : {}),
                  });
                }}
              />
            </section>

            <section className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4">
              <h4 className="text-sm font-semibold text-white">Thumbnail</h4>
              <FileUploadField
                label="Upload or replace thumbnail"
                accept="image/jpeg,image/png,image/webp,image/gif"
                currentUrl={draft.thumbnailUrl}
                hint="Used in the public library and admin overview."
                completionMessage="Thumbnail uploaded. Save Changes to apply it to this media item."
                onUploaded={(url) => updateDraft({ thumbnailUrl: url })}
              />
              <Field
                label="Thumbnail URL"
                value={draft.thumbnailUrl}
                onChange={(v) => updateDraft({ thumbnailUrl: v })}
              />

              <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/50">Crop / reposition</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-purple-200">
                    {crop.x}% / {crop.y}% / {crop.scale.toFixed(1)}x
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Thumbnail crop preview"
                      className="h-full w-full object-cover"
                      style={{
                        objectPosition: `${crop.x}% ${crop.y}%`,
                        transform: `scale(${crop.scale})`,
                      }}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block space-y-2 text-xs text-white/70">
                      <span>Horizontal</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={crop.x}
                        onChange={(e) => updateCrop({ x: Number(e.target.value) })}
                        className="w-full accent-purple-500"
                      />
                    </label>
                    <label className="block space-y-2 text-xs text-white/70">
                      <span>Vertical</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={crop.y}
                        onChange={(e) => updateCrop({ y: Number(e.target.value) })}
                        className="w-full accent-purple-500"
                      />
                    </label>
                    <label className="block space-y-2 text-xs text-white/70">
                      <span>Zoom</span>
                      <input
                        type="range"
                        min={1}
                        max={2}
                        step={0.1}
                        value={crop.scale}
                        onChange={(e) => updateCrop({ scale: Number(e.target.value) })}
                        className="w-full accent-purple-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4">
              <h4 className="text-sm font-semibold text-white">Publishing</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    checked={draft.published}
                    onChange={(e) => updateDraft({ published: e.target.checked })}
                  />
                  Published
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    checked={draft.featured}
                    onChange={(e) => {
                      const featured = e.target.checked;
                      updateDraft({ featured, published: featured || draft.published });
                    }}
                  />
                  Featured on homepage
                </label>
              </div>
              <p className="text-xs text-white/45">Featured videos are published automatically so they can appear on the homepage.</p>
            </section>

            <details className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-white">
                Advanced Settings
              </summary>
              <div className="mt-4 space-y-3">
                <Field
                  label="Alt text"
                  value={draft.altText || ""}
                  onChange={(v) => updateDraft({ altText: v })}
                />
                <p className="text-xs leading-5 text-white/45">
                  ID: <span className="font-mono">{draft.id}</span>
                  <br />
                  Created: {draft.createdAt || "Not saved yet"}
                </p>
              </div>
            </details>
          </div>

          <aside className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
              {draft.type === "video" ? (
                <div className="p-3">
                  <VideoPlayerPreview
                    title={draft.title || "Untitled media"}
                    thumbnailUrl={previewUrl}
                    videoUrl={draft.mediaUrl}
                  />
                </div>
              ) : (
                <div className="relative aspect-video overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={draft.altText || draft.title || "Media preview"}
                    className="h-full w-full object-cover"
                    style={{
                      objectPosition: `${crop.x}% ${crop.y}%`,
                      transform: `scale(${crop.scale})`,
                    }}
                  />
                </div>
              )}
              <div className="space-y-2 p-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/70">
                    {draft.type === "photo" ? "Image" : "Video"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${
                      draft.published ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-200"
                    }`}
                  >
                    {draft.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-sm font-medium text-white">{draft.title || "Untitled media"}</p>
              </div>
            </div>
            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </p>
            )}
          </aside>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {mode === "edit" && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/25 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/5 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [username, setUsername] = useState("dheeraj_a");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [accountUsername, setAccountUsername] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountRole, setAccountRole] = useState<AdminUserRole>("editor");
  const [accountPermissions, setAccountPermissions] = useState<AdminPermission[]>(getAdminRolePermissions("editor"));
  const [accountPermissionDrafts, setAccountPermissionDrafts] = useState<Record<string, AdminPermission[]>>({});
  const [accountRoleDrafts, setAccountRoleDrafts] = useState<Record<string, AdminUserRole>>({});
  const [accountPasswordDrafts, setAccountPasswordDrafts] = useState<Record<string, string>>({});
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [refreshingMessages, setRefreshingMessages] = useState(false);
  const [messageFilter, setMessageFilter] = useState<"all" | "read" | "unread">("all");
  const [messageView, setMessageView] = useState<"inbox" | "trash">("inbox");
  const [messageSearch, setMessageSearch] = useState("");
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [selectingMessages, setSelectingMessages] = useState(false);
  const [updatingSelectedMessages, setUpdatingSelectedMessages] = useState(false);
  const [storageReport, setStorageReport] = useState<StorageReport | null>(null);
  const [refreshingStorage, setRefreshingStorage] = useState(false);
  const [deletingStorageAsset, setDeletingStorageAsset] = useState<string | null>(null);
  const [clearingCache, setClearingCache] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [mediaQuery, setMediaQuery] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<"all" | "video" | "photo">("all");
  const [mediaStatusFilter, setMediaStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [mediaEditor, setMediaEditor] = useState<{
    mode: "add" | "edit";
    item: MediaLibraryItem;
  } | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session");
      const data = await res.json();
      setAuthenticated(data.authenticated);
      setCurrentUser(data.user ?? null);
      if (data.authenticated) {
        const [cRes, mRes, usersRes, storageRes] = await Promise.all([
          fetch("/api/content"),
          data.user?.permissions?.includes("messages:view") ? fetch("/api/messages") : Promise.resolve(null),
          data.user?.permissions?.includes("accounts:manage") ? fetch("/api/admin/users") : Promise.resolve(null),
          data.user?.permissions?.includes("media:manage") ? fetch("/api/admin/storage", { cache: "no-store" }) : Promise.resolve(null),
        ]);
        if (!cRes.ok) {
          const error = await cRes.json().catch(() => ({}));
          throw new Error(error.error || "Could not load content.");
        }
        setContent(await cRes.json());
        if (mRes?.ok) {
          setMessages(await mRes.json());
        } else if (data.user?.permissions?.includes("messages:view")) {
          setStatus("Content loaded, but messages could not be loaded.");
        }
        if (usersRes?.ok) setAdminUsers(await usersRes.json());
        if (storageRes?.ok) setStorageReport(await storageRes.json());
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not connect to the admin API.");
      setAuthenticated((current) => current ?? false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkSession();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [checkSession]);

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(""), 10_000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLoginError(data.error || "Login failed.");
      return;
    }
    setUsername("");
    setPassword("");
    await checkSession();
  };

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: accountUsername,
          password: accountPassword,
          role: accountRole,
          permissions: accountPermissions,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not create account.");
      setAdminUsers((users) => [...users, data.user as AdminUser]);
      setAccountUsername("");
      setAccountPassword("");
      setStatus("Admin account created.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create account.");
    }
  };

  const saveAccount = async (user: AdminUser) => {
    const role = accountRoleDrafts[user.id] ?? user.role;
    const permissions = accountPermissionDrafts[user.id] ?? user.permissions;
    const password = accountPasswordDrafts[user.id] || undefined;
    setStatus("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, role, permissions, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update account.");
      setAdminUsers((users) => users.map((current) => current.id === user.id ? data.user as AdminUser : current));
      setAccountPermissionDrafts((drafts) => { const next = { ...drafts }; delete next[user.id]; return next; });
      setAccountRoleDrafts((drafts) => { const next = { ...drafts }; delete next[user.id]; return next; });
      setAccountPasswordDrafts((drafts) => { const next = { ...drafts }; delete next[user.id]; return next; });
      setStatus(`Updated ${user.username}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update account.");
    }
  };

  const setAccountActive = async (user: AdminUser, active: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update account.");
      setAdminUsers((users) => users.map((current) => current.id === user.id ? data.user as AdminUser : current));
      setStatus(`${user.username} is now ${active ? "enabled" : "disabled"}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update account.");
    }
  };

  const deleteAccount = async (user: AdminUser) => {
    if (!window.confirm(`Delete the admin account “${user.username}”?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(user.id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete account.");
      setAdminUsers((users) => users.filter((current) => current.id !== user.id));
      setStatus(`Deleted ${user.username}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete account.");
    }
  };

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthenticated(false);
    setCurrentUser(null);
    router.push("/");
  };

  const visibleTabs = tabs.filter((item) => currentUser?.permissions.includes(item.permission));
  const activeTab = visibleTabs.some((item) => item.id === tab) ? tab : visibleTabs[0]?.id ?? "overview";

  const persistContent = async (nextContent: SiteContent) => {
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextContent),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.content) setContent(data.content);
        setStatus("All changes saved successfully.");
        return true;
      } else {
        setStatus(data.error || "Failed to save. Please log in again.");
        return false;
      }
    } catch {
      setStatus("Network error while saving. Your edits are still on this page.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateContactForm = (patch: Partial<SiteContent["contact"]["form"]>) => {
    setContent((current) => ({
      ...current,
      contact: {
        ...current.contact,
        form: { ...current.contact.form, ...patch },
      },
    }));
  };

  const saveAll = async () => {
    await persistContent(content);
  };

  const refreshMessages = async () => {
    setRefreshingMessages(true);
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      if (res.ok) {
        setMessages(await res.json());
        setStatus("Messages refreshed.");
        return;
      }
      const data = await res.json().catch(() => ({}));
      setStatus(data.error || "Could not refresh messages.");
    } catch {
      setStatus("Could not refresh messages. Check your connection and try again.");
    } finally {
      setRefreshingMessages(false);
    }
  };

  const refreshStorageReport = async () => {
    setRefreshingStorage(true);
    try {
      const res = await fetch("/api/admin/storage", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not inspect managed storage.");
      setStorageReport(data as StorageReport);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not inspect managed storage.");
    } finally {
      setRefreshingStorage(false);
    }
  };

  const permanentlyDeleteUpload = async (asset: StorageAsset) => {
    if (asset.referenced || deletingStorageAsset) return;
    if (!window.confirm(`Permanently delete ${asset.name} (${formatBytes(asset.size)})? This cannot be undone.`)) return;
    setDeletingStorageAsset(asset.url);
    try {
      const res = await fetch("/api/admin/storage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: asset.url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not permanently delete this upload.");
      await refreshStorageReport();
      setStatus(`${asset.name} permanently deleted from managed storage.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not permanently delete this upload.");
    } finally {
      setDeletingStorageAsset(null);
    }
  };

  const clearWebsiteCache = async () => {
    setClearingCache(true);
    try {
      const res = await fetch("/api/admin/cache", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not clear the website cache.");
      setStatus("Website page cache invalidated. Pages will refresh on their next visit.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not clear the website cache.");
    } finally {
      setClearingCache(false);
    }
  };

  const openGmailReply = (message: ContactMessage) => {
    const subject = message.subject || message.projectType || "Project inquiry";
    const body = `Hi ${message.name},\n\nThanks for reaching out about your ${message.projectType.toLowerCase()} project.\n\nOriginal message:\n${message.message}\n\nBest,\nCreativeXCreations`;
    const gmailUrl = new URL("https://mail.google.com/mail/");
    gmailUrl.searchParams.set("view", "cm");
    gmailUrl.searchParams.set("fs", "1");
    gmailUrl.searchParams.set("to", message.email);
    gmailUrl.searchParams.set("su", `Re: ${subject}`);
    gmailUrl.searchParams.set("body", body);
    window.open(gmailUrl.toString(), "_blank", "noopener,noreferrer");
  };

  const markRead = async (id: string, read: boolean) => {
    const res = await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus(data.error || "Could not update message.");
      return;
    }
    await refreshMessages();
  };

  const updateMessageTrashState = async (id: string, deleted: boolean) => {
    const res = await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, deleted }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus(data.error || "Could not update message.");
      return;
    }
    await refreshMessages();
  };

  const filteredMessages = useMemo(() => {
    const query = messageSearch.trim().toLowerCase();
    return messages.filter((msg) => {
      const isTrashed = Boolean(msg.deletedAt);
      if (messageView === "trash" ? !isTrashed : isTrashed) return false;
      const matchesFilter =
        messageFilter === "all"
          ? true
          : messageFilter === "read"
            ? msg.read
            : !msg.read;

      if (!query) return matchesFilter;

      const haystack = [
        msg.name,
        msg.email,
        msg.subject || "",
        msg.projectType,
        msg.message,
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && haystack.includes(query);
    });
  }, [messageFilter, messageSearch, messageView, messages]);

  const updateSelectedMessageTrashState = async (deleted: boolean) => {
    const visibleIds = new Set(filteredMessages.map((message) => message.id));
    const ids = selectedMessageIds.filter((id) => visibleIds.has(id));
    if (ids.length === 0) return;

    setUpdatingSelectedMessages(true);
    let updatedCount = 0;
    try {
      for (let start = 0; start < ids.length; start += 200) {
        const res = await fetch("/api/messages", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: ids.slice(start, start + 200), deleted }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatus(data.error || `${updatedCount} messages updated before an error occurred.`);
          if (updatedCount > 0) await refreshMessages();
          return;
        }
        updatedCount += Number(data.updated) || 0;
      }

      setSelectedMessageIds([]);
      await refreshMessages();
      setStatus(
        deleted
          ? `${updatedCount} messages moved to the recycle bin.`
          : `${updatedCount} messages restored to the inbox.`
      );
    } catch {
      setStatus(`${updatedCount} messages updated before the connection failed.`);
      if (updatedCount > 0) await refreshMessages();
    } finally {
      setUpdatingSelectedMessages(false);
    }
  };

  const permanentlyDeleteMessages = async (ids: string[]) => {
    if (messageView !== "trash" || ids.length === 0) return;
    const messageLabel = ids.length === 1 ? "this message" : `${ids.length} selected messages`;
    if (!window.confirm(`Permanently delete ${messageLabel}? This cannot be undone.`)) return;

    setUpdatingSelectedMessages(true);
    let deletedCount = 0;
    try {
      for (let start = 0; start < ids.length; start += 200) {
        const query = new URLSearchParams({
          ids: ids.slice(start, start + 200).join(","),
          permanent: "true",
        });
        const response = await fetch(`/api/messages?${query}`, { method: "DELETE" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not permanently delete selected messages.");
        deletedCount += Number(data.deleted) || 0;
      }

      setSelectedMessageIds([]);
      await refreshMessages();
      setStatus(`${deletedCount} message${deletedCount === 1 ? "" : "s"} permanently deleted.`);
    } catch (error) {
      if (deletedCount > 0) await refreshMessages();
      setStatus(error instanceof Error ? error.message : "Could not permanently delete selected messages.");
    } finally {
      setUpdatingSelectedMessages(false);
    }
  };

  const addMediaItem = () => {
    if (!currentUser?.permissions.includes("media:manage")) return;
    setMediaEditor({ mode: "add", item: createMediaItem() });
  };

  const filteredMediaItems = useMemo(() => {
    const query = mediaQuery.trim().toLowerCase();
    return content.mediaLibrary.items.filter((item) => {
      const matchesType = mediaTypeFilter === "all" || item.type === mediaTypeFilter;
      const matchesStatus =
        mediaStatusFilter === "all" ||
        (mediaStatusFilter === "published" ? item.published : !item.published);
      const matchesQuery =
        !query ||
        [item.title, item.description, item.category, item.sourceType]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesType && matchesStatus && matchesQuery;
    });
  }, [content.mediaLibrary.items, mediaQuery, mediaStatusFilter, mediaTypeFilter]);

  const adminSummary = useMemo(() => {
    const mediaItems = content.mediaLibrary.items;
    const totalMedia = mediaItems.length;
    const publishedMedia = mediaItems.filter((item) => item.published).length;
    const draftMedia = mediaItems.filter((item) => !item.published).length;
    const featuredMedia = mediaItems.filter(
      (item) => item.type === "video" && item.published && item.featured
    ).length;
    const inboxMessages = messages.filter((message) => !message.deletedAt);
    const unreadMessages = inboxMessages.filter((message) => !message.read).length;
    const recentMedia = [...mediaItems]
      .sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""))
      .slice(0, 4);
    const recentMessages = inboxMessages.slice(0, 4);

    return {
      totalMedia,
      publishedMedia,
      draftMedia,
      featuredMedia,
      unreadMessages,
      recentMedia,
      recentMessages,
    };
  }, [content.mediaLibrary.items, messages]);

  const saveMediaDraft = async (draft: MediaLibraryItem, closeEditor = true) => {
    if (!currentUser?.permissions.includes("media:manage")) {
      setStatus("You do not have permission to manage media.");
      return false;
    }
    const exists = content.mediaLibrary.items.some((item) => item.id === draft.id);
    const previous = content.mediaLibrary.items.find((item) => item.id === draft.id);
    const featuredCount = content.mediaLibrary.items.filter((item) => item.featured && item.type === "video").length;
    if (draft.type === "video" && draft.featured && !previous?.featured && featuredCount >= 9) {
      setStatus("Featured Work supports one main video and up to eight small videos (nine total).");
      return false;
    }
    const itemToSave = draft.featured ? { ...draft, published: true } : draft;
    const nextContent: SiteContent = {
      ...content,
      mediaLibrary: {
        ...content.mediaLibrary,
        items: exists
          ? content.mediaLibrary.items.map((item) => (item.id === draft.id ? itemToSave : item))
          : [itemToSave, ...content.mediaLibrary.items],
      },
    };
    const ok = await persistContent(nextContent);
    if (ok) {
      if (closeEditor) setMediaEditor(null);
      setStatus(
        itemToSave.published
          ? itemToSave.featured
            ? "Published in the Media Library and Featured Work."
            : "Published in the Media Library. Enable Featured on homepage to show it in Featured Work."
          : "Saved as a draft; it is hidden from the public library."
      );
      const replacedUrls = [previous?.mediaUrl, previous?.thumbnailUrl]
        .filter((url): url is string => Boolean(url) && url !== itemToSave.mediaUrl && url !== itemToSave.thumbnailUrl);
      const cleanup = await cleanupUnusedUploads(replacedUrls);
      if (cleanup.failed > 0) setStatus("Media saved, but one or more replaced uploads could not be deleted. Check the storage report.");
      else if (cleanup.deleted > 0) void refreshStorageReport();
    }
    return ok;
  };

  const cleanupUnusedUploads = async (urls: string[]) => {
    const results = { deleted: 0, retained: 0, failed: 0 };
    for (const url of new Set(urls.filter(isManagedUploadUrl))) {
      try {
        const res = await fetch("/api/admin/storage", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (res.status === 409) {
          results.retained += 1;
        } else if (res.ok) {
          results.deleted += 1;
        } else {
          results.failed += 1;
        }
      } catch {
        results.failed += 1;
      }
    }
    return results;
  };

  const deleteMediaDraft = async (id: string) => {
    if (!currentUser?.permissions.includes("media:manage")) {
      setStatus("You do not have permission to manage media.");
      return;
    }
    const nextContent: SiteContent = {
      ...content,
      mediaLibrary: {
        ...content.mediaLibrary,
        items: content.mediaLibrary.items.filter((item) => item.id !== id),
      },
    };
    const ok = await persistContent(nextContent);
    if (ok) {
      setMediaEditor(null);
      const removedItem = content.mediaLibrary.items.find((item) => item.id === id);
      const cleanup = await cleanupUnusedUploads([removedItem?.mediaUrl ?? "", removedItem?.thumbnailUrl ?? ""]);
      if (cleanup.failed > 0) setStatus("Media item removed, but an uploaded file could not be deleted. Check the storage report.");
      else if (cleanup.deleted > 0) setStatus("Media item and unused uploaded files permanently deleted.");
      else if (cleanup.retained > 0) setStatus("Media item removed. Shared uploads still used elsewhere were kept.");
      else setStatus("Media item removed from the library.");
      void refreshStorageReport();
    }
  };

  const toggleMediaFeatured = async (item: MediaLibraryItem) => {
    if (!currentUser?.permissions.includes("media:manage")) return;
    const featured = !item.featured;
    const featuredCount = content.mediaLibrary.items.filter((current) => current.featured && current.type === "video").length;
    if (featured && featuredCount >= 9) {
      setStatus("Featured Work supports one main video and up to eight small videos (nine total).");
      return;
    }
    const nextContent: SiteContent = {
      ...content,
      mediaLibrary: {
        ...content.mediaLibrary,
        items: content.mediaLibrary.items.map((current) =>
          current.id === item.id
            ? { ...current, featured, published: featured || current.published }
            : current
        ),
      },
    };
    await persistContent(nextContent);
  };

  const moveFeaturedMedia = async (item: MediaLibraryItem, direction: -1 | 1) => {
    if (!currentUser?.permissions.includes("media:manage")) return;
    const items = [...content.mediaLibrary.items];
    const featuredItems = items.filter((current) => current.featured && current.type === "video");
    const index = featuredItems.findIndex((current) => current.id === item.id);
    const neighbor = featuredItems[index + direction];
    if (index < 0 || !neighbor) return;
    const firstIndex = items.findIndex((current) => current.id === item.id);
    const secondIndex = items.findIndex((current) => current.id === neighbor.id);
    [items[firstIndex], items[secondIndex]] = [items[secondIndex], items[firstIndex]];
    await persistContent({ ...content, mediaLibrary: { ...content.mediaLibrary, items } });
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
          <p className="text-sm text-white/60">Sign in with your admin account.</p>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-white outline-none focus:border-purple-400/60"
            placeholder="Username"
            autoComplete="username"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-white outline-none focus:border-purple-400/60"
            placeholder="Password"
            autoComplete="current-password"
            required
          />
          {loginError && <p className="text-sm text-red-400">{loginError}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-500"
          >
            Login
          </button>
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

  if (visibleTabs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#111] p-6 text-center">
          <h1 className="text-lg font-semibold">No admin permissions assigned</h1>
          <p className="text-sm text-white/55">Ask an owner to grant access to the tools you need.</p>
          <button type="button" onClick={logout} className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5">Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-compact min-h-screen bg-[#050505] text-white">
      {mediaEditor && (
        <MediaEditorModal
          key={mediaEditor.item.id}
          mode={mediaEditor.mode}
          item={mediaEditor.item}
          saving={saving}
          onCancel={() => setMediaEditor(null)}
          onSave={saveMediaDraft}
          onUploadSave={(item) => saveMediaDraft(item, false)}
          onDelete={
            mediaEditor.mode === "edit"
              ? () => void deleteMediaDraft(mediaEditor.item.id)
              : undefined
          }
        />
      )}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col items-stretch justify-between gap-3 px-3 py-3 sm:flex-row sm:items-center sm:px-4 sm:py-4">
          <div>
            <h1 className="text-lg font-semibold">CreativeX Admin</h1>
            <p className="text-xs text-white/50">Signed in as {currentUser?.username} · {currentUser?.role}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {currentUser?.permissions.includes("site:edit") && (
              <Link
                href="/?edit=1"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-400/40 bg-purple-600/20 px-3 py-2 text-sm font-semibold text-purple-100 hover:bg-purple-600/35 sm:px-4"
              >
                <Pencil className="h-4 w-4" />
                Edit Live Site
              </Link>
            )}
            {currentUser?.permissions.includes("site:edit") && (
              <button
                onClick={saveAll}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-3 py-2 text-sm font-semibold hover:bg-purple-500 disabled:opacity-60 sm:px-4"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
              aria-label="Logout"
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
          {visibleTabs.map((t) => {
            const Icon = t.icon;
            const unread = t.id === "messages" ? messages.filter((m) => !m.deletedAt && !m.read).length : 0;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    activeTab === t.id
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
            value={activeTab}
            onChange={(e) => setTab(e.target.value as Tab)}
            aria-label="Navigation Tabs"
          >
            {visibleTabs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#111] p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-purple-300/80">Dashboard</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Website content overview</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                  Real counts from the current CMS data. Open a card to jump directly into the related manager.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                  {currentUser?.permissions.includes("media:manage") && (
                    <button
                      type="button"
                      onClick={addMediaItem}
                      className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
                    >
                      <Plus className="h-4 w-4" />
                      Add Media
                    </button>
                  )}
                  {currentUser?.permissions.includes("site:edit") && (
                    <Link
                      href="/?edit=1"
                      className="inline-flex items-center gap-2 rounded-xl border border-purple-400/30 bg-purple-600/15 px-4 py-2 text-sm font-semibold text-purple-100 hover:bg-purple-600/25"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Live Site
                    </Link>
                  )}
                  <Link
                    href="/"
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    <Eye className="h-4 w-4" />
                    View Site
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  { label: "Total media", value: adminSummary.totalMedia, target: "media" as Tab },
                  { label: "Published media", value: adminSummary.publishedMedia, target: "media" as Tab },
                  { label: "Draft media", value: adminSummary.draftMedia, target: "media" as Tab },
                  { label: "Homepage videos", value: adminSummary.featuredMedia, target: "media" as Tab },
                  { label: "Unread messages", value: adminSummary.unreadMessages, target: "messages" as Tab },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setTab(item.target)}
                    disabled={item.target === "media" ? !currentUser?.permissions.includes("media:manage") : !currentUser?.permissions.includes("messages:view")}
                    className="rounded-2xl border border-white/10 bg-[#111] p-4 text-left transition hover:border-purple-400/40 hover:bg-white/[0.04] disabled:cursor-default disabled:opacity-60"
                  >
                    <span className="text-xs uppercase tracking-[0.22em] text-white/45">{item.label}</span>
                    <span className="mt-3 block text-3xl font-semibold text-white">{item.value}</span>
                  </button>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-white/10 bg-[#111] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-white">Recent media</h3>
                    <button type="button" disabled={!currentUser?.permissions.includes("media:manage")} onClick={() => setTab("media")} className="text-sm text-purple-200 hover:text-white disabled:cursor-default disabled:opacity-50">
                      Manage
                    </button>
                  </div>
                  {adminSummary.recentMedia.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/50">No media items yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {adminSummary.recentMedia.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setMediaEditor({ mode: "edit", item })}
                          disabled={!currentUser?.permissions.includes("media:manage")}
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-left hover:bg-white/5 disabled:cursor-default"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-white">{item.title || "Untitled media"}</span>
                            <span className="block truncate text-xs text-white/45">{item.category || "Uncategorized"} · {item.type}</span>
                          </span>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${item.published ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-200"}`}>
                            {item.published ? "Published" : "Draft"}
                          </span>
                            {item.type === "video" && item.featured && item.published && (
                              <span className="shrink-0 rounded-full bg-lime-300/15 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-lime-200">
                                Homepage
                              </span>
                            )}
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#111] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-white">Recent messages</h3>
                    <button type="button" onClick={() => setTab("messages")} className="text-sm text-purple-200 hover:text-white">
                      Inbox
                    </button>
                  </div>
                  {adminSummary.recentMessages.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/50">No messages yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {adminSummary.recentMessages.map((message) => (
                        <button
                          key={message.id}
                          type="button"
                          onClick={() => setTab("messages")}
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-left hover:bg-white/5"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-white">{message.name}</span>
                            <span className="block truncate text-xs text-white/45">{message.subject || message.projectType}</span>
                          </span>
                          {!message.read && (
                            <span className="shrink-0 rounded-full bg-purple-600 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white">
                              New
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {activeTab === "media" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111] p-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold text-white">Media Library</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-white/55">
                    Manage videos, images, thumbnails, publishing status, and portfolio media without expanding every item at once.
                  </p>
                </div>
                {currentUser?.permissions.includes("media:manage") && (
                  <button
                    onClick={addMediaItem}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500"
                  >
                    <Plus className="h-4 w-4" /> Add Media
                  </button>
                )}
              </div>

              <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#111] p-4 lg:grid-cols-2">
                <Field
                  label="Library page title"
                  value={content.mediaLibrary.title}
                  onChange={(v) =>
                    setContent((c) => ({
                      ...c,
                      mediaLibrary: { ...c.mediaLibrary, title: v },
                    }))
                  }
                />
                <Field
                  label="Library description"
                  value={content.mediaLibrary.description}
                  onChange={(v) =>
                    setContent((c) => ({
                      ...c,
                      mediaLibrary: { ...c.mediaLibrary, description: v },
                    }))
                  }
                  multiline
                />
              </div>

              <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#111] p-4 xl:grid-cols-[1fr_10rem_11rem_auto]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input
                    value={mediaQuery}
                    onChange={(e) => setMediaQuery(e.target.value)}
                    placeholder="Search media title, category, source"
                    className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-purple-400/60"
                  />
                </label>
                <select
                  value={mediaTypeFilter}
                  onChange={(e) => setMediaTypeFilter(e.target.value as "all" | "video" | "photo")}
                  className="rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60"
                  aria-label="Filter media by type"
                >
                  <option value="all">All types</option>
                  <option value="video">Videos</option>
                  <option value="photo">Images</option>
                </select>
                <select
                  value={mediaStatusFilter}
                  onChange={(e) => setMediaStatusFilter(e.target.value as "all" | "published" | "draft")}
                  className="rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60"
                  aria-label="Filter media by status"
                >
                  <option value="all">All statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                </select>
                <button
                  type="button"
                  onClick={addMediaItem}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-400/30 bg-purple-600/15 px-4 py-2.5 text-sm font-semibold text-purple-100 hover:bg-purple-600/25"
                >
                  <Plus className="h-4 w-4" />
                  Add Media
                </button>
              </div>

              {filteredMediaItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-[#111]/70 p-8 text-center">
                  <p className="text-sm font-medium text-white">No media found</p>
                  <p className="mt-2 text-sm text-white/50">
                    Adjust the filters or add your first video or image.
                  </p>
                  <button
                    type="button"
                    onClick={addMediaItem}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
                  >
                    <Plus className="h-4 w-4" />
                    Add Media
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredMediaItems.map((item) => {
                    const previewUrl = getMediaPreviewUrl(item);
                    const crop = item.crop ?? { x: 50, y: 50, scale: 1 };
                    const featuredVideos = content.mediaLibrary.items.filter((media) => media.type === "video" && media.featured);
                    const featuredPosition = featuredVideos.findIndex((media) => media.id === item.id);
                    return (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-[#111] transition hover:border-purple-400/35"
                      >
                        <button
                          type="button"
                          onClick={() => setMediaEditor({ mode: "edit", item })}
                          className="block w-full text-left"
                          aria-label={`Edit ${item.title}`}
                        >
                          <div className="relative aspect-video overflow-hidden bg-black">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewUrl}
                              alt={item.altText || item.title}
                              className="h-full w-full object-cover transition duration-300 hover:scale-105"
                              style={{
                                objectPosition: `${crop.x}% ${crop.y}%`,
                                transform: `scale(${crop.scale})`,
                              }}
                            />
                            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-black/70 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/80">
                                {item.type === "photo" ? "Image" : "Video"}
                              </span>
                              <span
                                className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${
                                  item.published
                                    ? "bg-emerald-500/20 text-emerald-100"
                                    : "bg-amber-500/20 text-amber-100"
                                }`}
                              >
                                {item.published ? "Published" : "Draft"}
                              </span>
                            </div>
                          </div>
                        </button>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-2.5">
                          <button
                            type="button"
                            onClick={() => setMediaEditor({ mode: "edit", item })}
                            className="min-w-0 text-left"
                          >
                            <h3 className="line-clamp-2 break-words text-xs font-semibold leading-4 text-white sm:text-sm">
                              {item.title || "Untitled media"}
                            </h3>
                            <p className="mt-1 line-clamp-1 text-[10px] leading-3 text-white/45 sm:text-xs">
                              {item.category || "Uncategorized"} · {item.sourceType || "source"}
                            </p>
                          </button>
                          <div className="flex shrink-0 items-center gap-0.5">
                            {item.type === "video" && (
                              <label className="inline-flex items-center gap-1 px-1 text-[10px] text-white/60">
                                <input
                                  type="checkbox"
                                  className="admin-checkbox"
                                  checked={item.featured}
                                  onChange={() => void toggleMediaFeatured(item)}
                                  disabled={saving}
                                  aria-label={`${item.featured ? "Remove" : "Add"} ${item.title} ${item.featured ? "from" : "to"} homepage featured work`}
                                />
                                Home
                              </label>
                            )}
                            {featuredPosition >= 0 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void moveFeaturedMedia(item, -1)}
                                  disabled={saving || featuredPosition === 0}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:bg-white/5 disabled:opacity-35"
                                  aria-label={`Move ${item.title} earlier in homepage features`}
                                  title={featuredPosition === 0 ? "Main homepage video" : "Move earlier"}
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void moveFeaturedMedia(item, 1)}
                                  disabled={saving || featuredPosition === featuredVideos.length - 1}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:bg-white/5 disabled:opacity-35"
                                  aria-label={`Move ${item.title} later in homepage features`}
                                  title={featuredPosition === featuredVideos.length - 1 ? "Last homepage video" : "Move later"}
                                >
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => void deleteMediaDraft(item.id)}
                              disabled={saving}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                              aria-label={`Delete ${item.title}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "storage" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#111] p-5">
                <h2 className="font-semibold text-white">Managed upload storage</h2>
                <p className="mt-1 text-sm text-white/50">Review upload usage and permanently remove unused files. Website code and application files are not included.</p>
              </div>
              <section className="space-y-3 rounded-2xl border border-white/10 bg-[#111] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold text-white"><HardDrive className="h-4 w-4 text-purple-200" /> Upload inventory</h3>
                    <p className="mt-1 text-xs text-white/45">Files still referenced by site content cannot be deleted.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void refreshStorageReport()}
                    disabled={refreshingStorage}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/75 hover:bg-white/5 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshingStorage ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
                {storageReport ? (
                  <>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 border-y border-white/10 py-3 text-sm">
                      <span className="text-white/55">Total: <strong className="text-white">{formatBytes(storageReport.totalBytes)}</strong></span>
                      <span className="text-white/55">Files: <strong className="text-white">{storageReport.assets.length}</strong></span>
                      <span className="text-white/55">Largest: <strong className="text-white">{storageReport.assets[0] ? `${storageReport.assets[0].name} (${formatBytes(storageReport.assets[0].size)})` : "None"}</strong></span>
                    </div>
                    {storageReport.assets.length === 0 ? (
                      <p className="py-3 text-sm text-white/45">No uploaded files in managed storage.</p>
                    ) : (
                      <div className="max-h-80 divide-y divide-white/5 overflow-y-auto">
                        {storageReport.assets.map((asset) => (
                          <div key={asset.url} className="flex flex-wrap items-center justify-between gap-3 py-3">
                            <div className="min-w-0 flex-1">
                              <p className="break-all text-sm font-medium text-white">{asset.name}</p>
                              <p className="mt-1 text-xs text-white/45">{asset.contentType} · {asset.referenced ? "In use" : "Unreferenced"}</p>
                            </div>
                            <span className="shrink-0 text-sm tabular-nums text-white/65">{formatBytes(asset.size)}</span>
                            <button
                              type="button"
                              onClick={() => void permanentlyDeleteUpload(asset)}
                              disabled={asset.referenced || deletingStorageAsset !== null}
                              title={asset.referenced ? "This file is still referenced by site content" : "Permanently delete unused upload"}
                              aria-label={`Permanently delete ${asset.name}`}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-400/20 text-red-200 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              {deletingStorageAsset === asset.url ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="py-3 text-sm text-white/45">{refreshingStorage ? "Loading storage inventory..." : "Storage inventory is not available yet."}</p>
                )}
              </section>
            </div>
          )}

          {activeTab === "edit" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-white">Edit Site Content</h2>
                  <p className="mt-1 text-sm text-white/55">
                    Update copy, branding, showcase video, pricing plans, and contact details. Or use the visual live editor.
                  </p>
                </div>
                <Link
                  href="/?edit=1"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-400/40 bg-purple-600/20 px-4 py-2.5 text-sm font-semibold text-purple-100 hover:bg-purple-600/35"
                >
                  <Pencil className="h-4 w-4" />
                  Open Live Editor
                </Link>
              </div>

              {/* Hero & Branding */}
              <details className="group rounded-2xl border border-white/10 bg-[#111] overflow-hidden" open>
                <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-white hover:bg-white/5 flex items-center justify-between list-none">
                  Hero & Branding
                  <ChevronDown className="h-4 w-4 text-white/50 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-4 px-5 pb-5 border-t border-white/5 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Website Page Title"
                      value={content.metadata.title}
                      onChange={(v) =>
                        setContent((c) => ({ ...c, metadata: { ...c.metadata, title: v } }))
                      }
                    />
                    <Field
                      label="Brand Name"
                      value={content.navbar.brandName}
                      onChange={(v) =>
                        setContent((c) => ({ ...c, navbar: { ...c.navbar, brandName: v } }))
                      }
                    />
                  </div>
                  <Field
                    label="Navigation contact button"
                    value={content.navbar.contactLabel}
                    onChange={(v) => setContent((c) => ({ ...c, navbar: { ...c.navbar, contactLabel: v } }))}
                  />
                  <Field
                    label="Meta Description"
                    value={content.metadata.description}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, metadata: { ...c.metadata, description: v } }))
                    }
                    multiline
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
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
                  </div>
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
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field
                      label="Work button"
                      value={content.hero.ctaWork}
                      onChange={(v) => setContent((c) => ({ ...c, hero: { ...c.hero, ctaWork: v } }))}
                    />
                    <Field
                      label="Demo reel button"
                      value={content.hero.ctaReel}
                      onChange={(v) => setContent((c) => ({ ...c, hero: { ...c.hero, ctaReel: v } }))}
                    />
                    <Field
                      label="Contact button"
                      value={content.hero.ctaContact}
                      onChange={(v) => setContent((c) => ({ ...c, hero: { ...c.hero, ctaContact: v } }))}
                    />
                  </div>
                  <Field
                    label="Hero Background YouTube URL or ID"
                    value={content.hero.youtubeVideoId}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        hero: { ...c.hero, youtubeVideoId: extractYoutubeId(v) || v },
                      }))
                    }
                  />
                  {currentUser?.permissions.includes("media:manage") && (
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
                  )}
                  <Field
                    label="Logo URL"
                    value={content.navbar.logoUrl}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        navbar: { ...c.navbar, logoUrl: v },
                      }))
                    }
                  />
                </div>
              </details>

              {/* Stats & Why Us */}
              <details className="group rounded-2xl border border-white/10 bg-[#111] overflow-hidden">
                <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-white hover:bg-white/5 flex items-center justify-between list-none">
                  Stats & Why Us
                  <ChevronDown className="h-4 w-4 text-white/50 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-4 px-5 pb-5 border-t border-white/5 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Stats Eyebrow"
                      value={content.stats.eyebrow}
                      onChange={(v) =>
                        setContent((c) => ({ ...c, stats: { ...c.stats, eyebrow: v } }))
                      }
                    />
                    <Field
                      label="Stats Title"
                      value={content.stats.title}
                      onChange={(v) =>
                        setContent((c) => ({ ...c, stats: { ...c.stats, title: v } }))
                      }
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Why Us Eyebrow"
                      value={content.whyChooseUs.eyebrow}
                      onChange={(v) =>
                        setContent((c) => ({ ...c, whyChooseUs: { ...c.whyChooseUs, eyebrow: v } }))
                      }
                    />
                    <Field
                      label="Why Us Title"
                      value={content.whyChooseUs.title}
                      onChange={(v) =>
                        setContent((c) => ({ ...c, whyChooseUs: { ...c.whyChooseUs, title: v } }))
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-white">Stats cards</h3>
                      <button type="button" onClick={() => setContent((current) => ({ ...current, stats: { ...current.stats, items: [...current.stats.items, { label: "New statistic", description: "Add a short detail.", icon: "Sparkles" }] } }))} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600/20 px-3 py-2 text-xs font-semibold text-purple-100 hover:bg-purple-600/30">
                        <Plus className="h-3.5 w-3.5" /> Add stat
                      </button>
                    </div>
                    {content.stats.items.map((item, index) => (
                      <div key={`${index}-${item.label}`} className="grid gap-3 rounded-xl border border-white/10 bg-black/25 p-3 sm:grid-cols-[1fr_1fr_auto]">
                        <Field label="Label" value={item.label} onChange={(value) => setContent((current) => ({ ...current, stats: { ...current.stats, items: current.stats.items.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: value } : entry) } }))} />
                        <Field label="Description" value={item.description} onChange={(value) => setContent((current) => ({ ...current, stats: { ...current.stats, items: current.stats.items.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: value } : entry) } }))} multiline />
                        <div className="flex items-end gap-2">
                          <SelectField label="Icon" value={item.icon} onChange={(value) => setContent((current) => ({ ...current, stats: { ...current.stats, items: current.stats.items.map((entry, itemIndex) => itemIndex === index ? { ...entry, icon: value as typeof entry.icon } : entry) } }))}>
                            {contentIconOptions.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                          </SelectField>
                          <button type="button" onClick={() => setContent((current) => ({ ...current, stats: { ...current.stats, items: current.stats.items.filter((_, itemIndex) => itemIndex !== index) } }))} className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-400/20 text-red-300 hover:bg-red-400/10" aria-label={`Remove statistic ${item.label}`}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-white">Why Us cards</h3>
                      <button type="button" onClick={() => setContent((current) => ({ ...current, whyChooseUs: { ...current.whyChooseUs, items: [...current.whyChooseUs.items, { title: "New benefit", description: "Add a short detail.", icon: "Sparkles" }] } }))} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600/20 px-3 py-2 text-xs font-semibold text-purple-100 hover:bg-purple-600/30">
                        <Plus className="h-3.5 w-3.5" /> Add benefit
                      </button>
                    </div>
                    {content.whyChooseUs.items.map((item, index) => (
                      <div key={`${index}-${item.title}`} className="grid gap-3 rounded-xl border border-white/10 bg-black/25 p-3 sm:grid-cols-[1fr_1fr_auto]">
                        <Field label="Title" value={item.title} onChange={(value) => setContent((current) => ({ ...current, whyChooseUs: { ...current.whyChooseUs, items: current.whyChooseUs.items.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: value } : entry) } }))} />
                        <Field label="Description" value={item.description} onChange={(value) => setContent((current) => ({ ...current, whyChooseUs: { ...current.whyChooseUs, items: current.whyChooseUs.items.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: value } : entry) } }))} multiline />
                        <div className="flex items-end gap-2">
                          <SelectField label="Icon" value={item.icon} onChange={(value) => setContent((current) => ({ ...current, whyChooseUs: { ...current.whyChooseUs, items: current.whyChooseUs.items.map((entry, itemIndex) => itemIndex === index ? { ...entry, icon: value as typeof entry.icon } : entry) } }))}>
                            {contentIconOptions.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                          </SelectField>
                          <button type="button" onClick={() => setContent((current) => ({ ...current, whyChooseUs: { ...current.whyChooseUs, items: current.whyChooseUs.items.filter((_, itemIndex) => itemIndex !== index) } }))} className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-400/20 text-red-300 hover:bg-red-400/10" aria-label={`Remove benefit ${item.title}`}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </details>

              {/* Showcase */}
              <details className="group rounded-2xl border border-white/10 bg-[#111] overflow-hidden">
                <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-white hover:bg-white/5 flex items-center justify-between list-none">
                  Showcase
                  <ChevronDown className="h-4 w-4 text-white/50 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-4 px-5 pb-5 border-t border-white/5 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Showcase Badge"
                      value={content.showcase.badge}
                      onChange={(v) =>
                        setContent((c) => ({ ...c, showcase: { ...c.showcase, badge: v } }))
                      }
                    />
                    <Field
                      label="Showcase Title"
                      value={content.showcase.title}
                      onChange={(v) =>
                        setContent((c) => ({ ...c, showcase: { ...c.showcase, title: v } }))
                      }
                    />
                  </div>
                  <Field
                    label="Showcase YouTube ID or URL"
                    value={content.showcase.youtubeVideoId}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        showcase: {
                          ...c.showcase,
                          youtubeVideoId: extractYoutubeId(v) || v,
                        },
                      }))
                    }
                  />
                  <Field
                    label="Showcase Description"
                    value={content.showcase.description}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, showcase: { ...c.showcase, description: v } }))
                    }
                    multiline
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Breakdown Title"
                      value={content.showcase.breakdownTitle}
                      onChange={(v) =>
                        setContent((c) => ({ ...c, showcase: { ...c.showcase, breakdownTitle: v } }))
                      }
                    />
                    <Field
                      label="Breakdown Text"
                      value={content.showcase.breakdownText}
                      onChange={(v) =>
                        setContent((c) => ({ ...c, showcase: { ...c.showcase, breakdownText: v } }))
                      }
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Pacing Title"
                      value={content.showcase.pacingTitle}
                      onChange={(v) =>
                        setContent((c) => ({ ...c, showcase: { ...c.showcase, pacingTitle: v } }))
                      }
                    />
                    <Field
                      label="Pacing Text"
                      value={content.showcase.pacingText}
                      onChange={(v) =>
                        setContent((c) => ({ ...c, showcase: { ...c.showcase, pacingText: v } }))
                      }
                    />
                  </div>
                </div>
              </details>

              {/* Pricing */}
              <details className="group rounded-2xl border border-white/10 bg-[#111] overflow-hidden">
                <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-white hover:bg-white/5 flex items-center justify-between list-none">
                  Pricing Plans
                  <ChevronDown className="h-4 w-4 text-white/50 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-4 px-5 pb-5 border-t border-white/5 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Pricing Eyebrow"
                      value={content.pricing.eyebrow}
                      onChange={(v) =>
                        setContent((c) => ({
                          ...c,
                          pricing: { ...c.pricing, eyebrow: v },
                        }))
                      }
                    />
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
                  </div>
                  <Field
                    label="Pricing Footnote"
                    value={content.pricing.footnote}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        pricing: { ...c.pricing, footnote: v },
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setContent((current) => ({ ...current, pricing: { ...current.pricing, plans: [...current.pricing.plans, { title: "New Package", price: "", priceUSD: undefined, description: "", features: [], highlight: false }] } }))}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600/20 px-3 py-2 text-sm font-semibold text-purple-100 hover:bg-purple-600/30"
                  >
                    <Plus className="h-4 w-4" /> Add pricing plan
                  </button>
                  {content.pricing.plans.map((plan, i) => (
                    <div
                      key={i}
                      className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-purple-300">Plan {i + 1}</span>
                        <button type="button" onClick={() => setContent((current) => ({ ...current, pricing: { ...current.pricing, plans: current.pricing.plans.filter((_, planIndex) => planIndex !== i) } }))} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/20 text-red-300 hover:bg-red-400/10" aria-label={`Remove pricing plan ${plan.title}`}><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <Field
                        label="Plan Title"
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
                      <div className="grid gap-3 sm:grid-cols-2">
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
                      </div>
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
                      <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70">
                        <input type="checkbox" checked={plan.highlight} onChange={(event) => {
                          const plans = [...content.pricing.plans];
                          plans[i] = { ...plans[i], highlight: event.target.checked };
                          setContent((current) => ({ ...current, pricing: { ...current.pricing, plans } }));
                        }} className="admin-checkbox" />
                        Highlight this plan
                      </label>
                    </div>
                  ))}
                </div>
              </details>

              {/* About */}
              <details className="group rounded-2xl border border-white/10 bg-[#111] overflow-hidden">
                <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-white hover:bg-white/5 flex items-center justify-between list-none">
                  About Section
                  <ChevronDown className="h-4 w-4 text-white/50 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-4 px-5 pb-5 border-t border-white/5 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="About Eyebrow"
                      value={content.about.eyebrow}
                      onChange={(v) =>
                        setContent((c) => ({ ...c, about: { ...c.about, eyebrow: v } }))
                      }
                    />
                    <Field
                      label="About Title"
                      value={content.about.title}
                      onChange={(v) =>
                        setContent((c) => ({ ...c, about: { ...c.about, title: v } }))
                      }
                    />
                  </div>
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
                  <Field
                    label="Software Logos / Tools (one per line)"
                    value={content.about.tools.join("\n")}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        about: {
                          ...c.about,
                          tools: v
                            .split("\n")
                            .map((tool) => tool.trim())
                            .filter(Boolean),
                        },
                      }))
                    }
                    multiline
                  />
                  <Field
                    label="Summary Title"
                    value={content.about.summaryTitle}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, about: { ...c.about, summaryTitle: v } }))
                    }
                  />
                  <Field
                    label="Summary Text"
                    value={content.about.summaryText}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, about: { ...c.about, summaryText: v } }))
                    }
                    multiline
                  />
                  <Field
                    label="Workflow Text"
                    value={content.about.workflowText}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, about: { ...c.about, workflowText: v } }))
                    }
                    multiline
                  />
                  <Field
                    label="Delivery Text"
                    value={content.about.deliveryText}
                    onChange={(v) =>
                      setContent((c) => ({ ...c, about: { ...c.about, deliveryText: v } }))
                    }
                    multiline
                  />
                </div>
              </details>

              {/* Contact & Channels */}
              <details className="group rounded-2xl border border-white/10 bg-[#111] overflow-hidden">
                <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-white hover:bg-white/5 flex items-center justify-between list-none">
                  Contact & Channels
                  <ChevronDown className="h-4 w-4 text-white/50 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-4 px-5 pb-5 border-t border-white/5 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Contact Badge"
                      value={content.contact.badge}
                      onChange={(v) =>
                        setContent((c) => ({
                          ...c,
                          contact: { ...c.contact, badge: v },
                        }))
                      }
                    />
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
                  </div>
                  <Field
                    label="Contact Description"
                    value={content.contact.description}
                    onChange={(v) =>
                      setContent((c) => ({
                        ...c,
                        contact: { ...c.contact, description: v },
                      }))
                    }
                    multiline
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Direct contact eyebrow"
                      value={content.contact.directTitle}
                      onChange={(v) => setContent((c) => ({ ...c, contact: { ...c.contact, directTitle: v } }))}
                    />
                    <Field
                      label="Direct contact heading"
                      value={content.contact.directHeading}
                      onChange={(v) => setContent((c) => ({ ...c, contact: { ...c.contact, directHeading: v } }))}
                    />
                  </div>
                  <Field
                    label="Direct contact description"
                    value={content.contact.directDescription}
                    onChange={(v) => setContent((c) => ({ ...c, contact: { ...c.contact, directDescription: v } }))}
                    multiline
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Name label" value={content.contact.form.nameLabel} onChange={(v) => updateContactForm({ nameLabel: v })} />
                    <Field label="Name placeholder" value={content.contact.form.namePlaceholder} onChange={(v) => updateContactForm({ namePlaceholder: v })} />
                    <Field label="Email label" value={content.contact.form.emailLabel} onChange={(v) => updateContactForm({ emailLabel: v })} />
                    <Field label="Email placeholder" value={content.contact.form.emailPlaceholder} onChange={(v) => updateContactForm({ emailPlaceholder: v })} />
                    <Field label="Project type label" value={content.contact.form.projectTypeLabel} onChange={(v) => updateContactForm({ projectTypeLabel: v })} />
                    <Field label="Subject label" value={content.contact.form.subjectLabel} onChange={(v) => updateContactForm({ subjectLabel: v })} />
                    <Field label="Subject placeholder" value={content.contact.form.subjectPlaceholder} onChange={(v) => updateContactForm({ subjectPlaceholder: v })} />
                    <Field label="Message label" value={content.contact.form.messageLabel} onChange={(v) => updateContactForm({ messageLabel: v })} />
                    <Field label="Message placeholder" value={content.contact.form.messagePlaceholder} onChange={(v) => updateContactForm({ messagePlaceholder: v })} />
                    <Field label="Submit button" value={content.contact.form.submitLabel} onChange={(v) => updateContactForm({ submitLabel: v })} />
                    <Field label="Success message" value={content.contact.form.successMessage} onChange={(v) => updateContactForm({ successMessage: v })} />
                  </div>
                  <Field
                    label="Project types (one per line)"
                    value={content.contact.form.projectTypes.join("\n")}
                    onChange={(v) => updateContactForm({ projectTypes: v.split("\n").map((item) => item.trim()).filter(Boolean) })}
                    multiline
                  />
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white">Direct contact channels</h3>
                    <button type="button" onClick={() => setContent((current) => ({ ...current, contact: { ...current.contact, channels: [...current.contact.channels, { label: "New channel", value: "", href: "" }] } }))} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600/20 px-3 py-2 text-xs font-semibold text-purple-100 hover:bg-purple-600/30"><Plus className="h-3.5 w-3.5" /> Add channel</button>
                  </div>
                  {content.contact.channels.map((ch, i) => (
                    <div key={i} className="grid gap-3 rounded-xl border border-white/10 bg-black/25 p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
                      <Field label="Channel label" value={ch.label} onChange={(v) => setContent((current) => ({ ...current, contact: { ...current.contact, channels: current.contact.channels.map((channel, index) => index === i ? { ...channel, label: v } : channel) } }))} />
                      <Field label="Display value" value={ch.value} onChange={(v) => setContent((current) => ({ ...current, contact: { ...current.contact, channels: current.contact.channels.map((channel, index) => index === i ? { ...channel, value: v } : channel) } }))} />
                      <Field label="Destination URL" value={ch.href} onChange={(v) => setContent((current) => ({ ...current, contact: { ...current.contact, channels: current.contact.channels.map((channel, index) => index === i ? { ...channel, href: v } : channel) } }))} />
                      <button type="button" onClick={() => setContent((current) => ({ ...current, contact: { ...current.contact, channels: current.contact.channels.filter((_, index) => index !== i) } }))} className="mb-0.5 inline-flex h-9 w-9 self-end items-center justify-center rounded-lg border border-red-400/20 text-red-300 hover:bg-red-400/10" aria-label={`Remove ${ch.label} contact channel`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </details>

              {/* Navbar Links */}
              <details className="group rounded-2xl border border-white/10 bg-[#111] overflow-hidden">
                <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-white hover:bg-white/5 flex items-center justify-between list-none">
                  Navbar Links
                  <ChevronDown className="h-4 w-4 text-white/50 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-4 px-5 pb-5 border-t border-white/5 pt-4">
                  <button type="button" onClick={() => setContent((current) => ({ ...current, navbar: { ...current.navbar, links: [...current.navbar.links, { name: "New link", href: "#" }] } }))} className="inline-flex items-center gap-2 rounded-xl bg-purple-600/20 px-3 py-2 text-sm font-semibold text-purple-100 hover:bg-purple-600/30"><Plus className="h-4 w-4" /> Add navigation link</button>
                  {content.navbar.links.map((link, i) => (
                    <div key={i} className="grid gap-3 rounded-xl border border-white/10 bg-black/25 p-4 sm:grid-cols-[1fr_1fr_auto]">
                      <Field
                        label={`Link ${i + 1} Label`}
                        value={link.name}
                        onChange={(v) => {
                          const links = [...content.navbar.links];
                          links[i] = { ...links[i], name: v };
                          setContent((c) => ({
                            ...c,
                            navbar: { ...c.navbar, links },
                          }));
                        }}
                      />
                      <Field
                        label={`Link ${i + 1} URL`}
                        value={link.href}
                        onChange={(v) => {
                          const links = [...content.navbar.links];
                          links[i] = { ...links[i], href: v };
                          setContent((c) => ({
                            ...c,
                            navbar: { ...c.navbar, links },
                          }));
                        }}
                      />
                      <button type="button" onClick={() => setContent((current) => ({ ...current, navbar: { ...current.navbar, links: current.navbar.links.filter((_, index) => index !== i) } }))} className="mb-0.5 inline-flex h-9 w-9 self-end items-center justify-center rounded-lg border border-red-400/20 text-red-300 hover:bg-red-400/10" aria-label={`Remove navigation link ${link.name}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </details>

              <details className="group rounded-2xl border border-white/10 bg-[#111] overflow-hidden">
                <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-white hover:bg-white/5 flex items-center justify-between list-none">
                  Video Player Presentation
                  <ChevronDown className="h-4 w-4 text-white/50 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-4 border-t border-white/5 px-5 pb-5 pt-4">
                  <Field
                    label="Player Title"
                    value={content.player.title}
                    onChange={(v) => setContent((c) => ({ ...c, player: { ...c.player, title: v } }))}
                  />
                  <Field
                    label="Player Description"
                    value={content.player.description}
                    onChange={(v) => setContent((c) => ({ ...c, player: { ...c.player, description: v } }))}
                    multiline
                  />
                  {currentUser?.permissions.includes("media:manage") && (
                    <FileUploadField
                      label="Player Background Image"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      currentUrl={content.player.backgroundUrl}
                      hint="Upload or paste a URL for player background visuals"
                      onUploaded={(url) => setContent((c) => ({ ...c, player: { ...c.player, backgroundUrl: url } }))}
                    />
                  )}
                  <Field
                    label="Player Background URL"
                    value={content.player.backgroundUrl}
                    onChange={(v) => setContent((c) => ({ ...c, player: { ...c.player, backgroundUrl: v } }))}
                  />
                  <Field
                    label="Accent Color"
                    value={content.player.accentColor}
                    onChange={(v) => setContent((c) => ({ ...c, player: { ...c.player, accentColor: v } }))}
                  />
                </div>
              </details>

              <details className="group rounded-2xl border border-white/10 bg-[#111] overflow-hidden">
                <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-white hover:bg-white/5 flex items-center justify-between list-none">
                  Founder Profile
                  <ChevronDown className="h-4 w-4 text-white/50 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-4 border-t border-white/5 px-5 pb-5 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Founder Name"
                      value={content.founder.name}
                      onChange={(value) => setContent((current) => ({
                        ...current,
                        founder: { ...current.founder, name: value },
                      }))}
                    />
                    <Field
                      label="Founder Role"
                      value={content.founder.role}
                      onChange={(value) => setContent((current) => ({
                        ...current,
                        founder: { ...current.founder, role: value },
                      }))}
                    />
                  </div>
                  {currentUser?.permissions.includes("media:manage") && (
                    <FileUploadField
                      label="Founder Photo"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      currentUrl={content.founder.photoUrl}
                      hint="Upload a portrait or enter its image URL below."
                      onUploaded={(url) => setContent((current) => ({
                        ...current,
                        founder: { ...current.founder, photoUrl: url },
                      }))}
                    />
                  )}
                  <Field
                    label="Founder Photo URL"
                    value={content.founder.photoUrl}
                    onChange={(value) => setContent((current) => ({
                      ...current,
                      founder: { ...current.founder, photoUrl: value },
                    }))}
                  />
                  <Field
                    label="Founder Biography"
                    value={content.founder.biography}
                    onChange={(value) => setContent((current) => ({
                      ...current,
                      founder: { ...current.founder, biography: value },
                    }))}
                    multiline
                  />
                </div>
              </details>
            </div>
          )}

          {activeTab === "messages" && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111] p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 className="font-semibold text-white">
                    {messageView === "inbox" ? "Inbox" : "Recycle bin"} ({filteredMessages.length}/{messages.filter((message) => messageView === "trash" ? Boolean(message.deletedAt) : !message.deletedAt).length})
                  </h2>
                  <p className="mt-1 text-xs text-white/45">Contact form limit: 5 messages per connection per rolling hour and 20 total per email address.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex items-center rounded-xl border border-white/10 bg-[#050505] p-1 text-xs" aria-label="Message location">
                    {(["inbox", "trash"] as const).map((view) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => {
                          setSelectedMessageIds([]);
                          setMessageView(view);
                        }}
                        aria-pressed={messageView === view}
                        className={`rounded-lg px-3 py-2 capitalize ${messageView === view ? "bg-purple-600 text-white" : "text-white/60"}`}
                      >
                        {view === "trash" ? `Recycle bin (${messages.filter((message) => message.deletedAt).length})` : "Inbox"}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center rounded-xl border border-white/10 bg-[#050505] p-1 text-xs">
                    {(["all", "unread", "read"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setSelectedMessageIds([]);
                          setMessageFilter(value);
                        }}
                        className={`rounded-lg px-2.5 py-1.5 capitalize ${
                          messageFilter === value ? "bg-purple-600 text-white" : "text-white/60"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  <input
                    type="search"
                    value={messageSearch}
                    onChange={(e) => {
                      setSelectedMessageIds([]);
                      setMessageSearch(e.target.value);
                    }}
                    placeholder="Search messages"
                    className="w-full rounded-xl border border-white/10 bg-[#050505] px-3 py-2 text-sm text-white outline-none focus:border-purple-400/60 sm:w-64"
                  />
                  <button
                    type="button"
                    onClick={() => void refreshMessages()}
                    disabled={refreshingMessages}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
                    aria-label="Refresh messages"
                    title="Refresh messages"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshingMessages ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                  {currentUser?.permissions.includes("messages:delete") && filteredMessages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectingMessages((current) => !current);
                        setSelectedMessageIds([]);
                      }}
                      aria-pressed={selectingMessages}
                      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                    >
                      {selectingMessages ? <X className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      {selectingMessages ? "Done" : "Select"}
                    </button>
                  )}
                </div>
              </div>

              {currentUser?.permissions.includes("messages:delete") && selectingMessages && filteredMessages.length > 0 && (
                <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex items-center gap-2 text-sm text-white/75">
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      checked={filteredMessages.every((message) => selectedMessageIds.includes(message.id))}
                      onChange={(event) => {
                        const visibleIds = new Set(filteredMessages.map((message) => message.id));
                        setSelectedMessageIds((current) => event.target.checked
                          ? [...new Set([...current, ...visibleIds])]
                          : current.filter((id) => !visibleIds.has(id)));
                      }}
                      aria-label="Select all filtered messages"
                    />
                    Select all filtered messages
                  </label>
                  {selectedMessageIds.some((id) => filteredMessages.some((message) => message.id === id)) && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void updateSelectedMessageTrashState(messageView === "inbox")}
                        disabled={updatingSelectedMessages}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
                      >
                        {updatingSelectedMessages ? <Loader2 className="h-4 w-4 animate-spin" /> : messageView === "inbox" ? <Trash2 className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                        {updatingSelectedMessages ? "Updating messages" : messageView === "inbox" ? "Move selected to recycle bin" : "Restore selected"}
                        <span>({selectedMessageIds.filter((id) => filteredMessages.some((message) => message.id === id)).length})</span>
                      </button>
                      {messageView === "trash" && (
                        <button
                          type="button"
                          onClick={() => void permanentlyDeleteMessages(selectedMessageIds.filter((id) => filteredMessages.some((message) => message.id === id)))}
                          disabled={updatingSelectedMessages}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-400/25 px-4 py-2 text-sm text-red-200 hover:bg-red-400/10 disabled:cursor-wait disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" /> Delete selected permanently
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {filteredMessages.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-[#111] p-8 text-center text-white/50">
                  {messageView === "trash"
                    ? filteredMessages.length === 0 && messageSearch.trim()
                      ? "No messages match your search."
                      : "Recycle bin is empty."
                    : messages.every((message) => message.deletedAt)
                      ? "No messages yet."
                      : "No messages match your search."}
                </p>
              ) : (
                filteredMessages.map((msg) => (
                  <div key={msg.id} className="flex min-w-0 items-start gap-3">
                    {currentUser?.permissions.includes("messages:delete") && selectingMessages && (
                      <input
                        type="checkbox"
                        checked={selectedMessageIds.includes(msg.id)}
                        onChange={(event) => setSelectedMessageIds((current) => event.target.checked
                          ? [...new Set([...current, msg.id])]
                          : current.filter((id) => id !== msg.id))}
                        aria-label={`Select message from ${msg.name}`}
                        className="admin-checkbox mt-5"
                      />
                    )}
                    <details
                    onToggle={(event) => {
                      if (event.currentTarget.open && messageView === "inbox" && !msg.read) {
                        void markRead(msg.id, true);
                      }
                    }}
                    className={`w-full min-w-0 overflow-hidden rounded-2xl border p-4 sm:p-5 ${
                      msg.read
                        ? "border-white/10 bg-[#111]/60"
                        : "border-purple-400/30 bg-[#1a0a2e]/40"
                    }`}
                  >
                    <summary className="mb-2 flex min-w-0 cursor-pointer list-none flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="break-all font-semibold">{msg.name}</p>
                        <p className="break-all text-sm text-white/60">{msg.email}</p>
                        <p className="mt-1 break-words text-xs uppercase tracking-wider text-purple-300">
                          {msg.subject || msg.projectType}
                        </p>
                      </div>
                      <div className="max-w-[48%] shrink-0 text-right sm:max-w-none">
                        <span className="block break-words text-xs text-white/40">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                        <span className="mt-2 inline-flex rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white/55">
                          Open
                        </span>
                      </div>
                    </summary>
                    <p className="mb-4 min-w-0 max-w-full break-all whitespace-pre-wrap rounded-xl border border-white/10 bg-black/25 p-4 text-sm leading-7 text-white/80">
                      {msg.message}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {messageView === "inbox" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void markRead(msg.id, !msg.read)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
                          >
                            {msg.read ? <><EyeOff className="h-3.5 w-3.5" /> Mark unread</> : <><Eye className="h-3.5 w-3.5" /> Mark read</>}
                          </button>
                          <button
                            type="button"
                            onClick={() => openGmailReply(msg)}
                            className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-600/10 px-3 py-1.5 text-xs text-purple-200 hover:bg-purple-600/20"
                          >
                            <Mail className="h-3.5 w-3.5" /> Reply via Gmail
                          </button>
                          {currentUser?.permissions.includes("messages:delete") && (
                            <button
                              type="button"
                              onClick={() => void updateMessageTrashState(msg.id, true)}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/75 hover:bg-white/5"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Move to recycle bin
                            </button>
                          )}
                        </>
                      ) : currentUser?.permissions.includes("messages:delete") ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void updateMessageTrashState(msg.id, false)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => void permanentlyDeleteMessages([msg.id])}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete permanently
                          </button>
                        </>
                      ) : null}
                    </div>
                  </details>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "accounts" && currentUser?.permissions.includes("accounts:manage") && (
            <div className="space-y-4">
              <section className="rounded-2xl border border-white/10 bg-[#111] p-4 sm:p-5">
                <h2 className="font-semibold text-white">Create admin account</h2>
                <form onSubmit={createAccount} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs text-white/55">
                    Username
                    <input value={accountUsername} onChange={(event) => setAccountUsername(event.target.value)} required minLength={3} maxLength={40} autoComplete="off" className="w-full rounded-xl border border-white/10 bg-[#080808] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60" />
                  </label>
                  <label className="space-y-1.5 text-xs text-white/55">
                    Temporary password
                    <input type="password" value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} required minLength={10} maxLength={128} autoComplete="new-password" className="w-full rounded-xl border border-white/10 bg-[#080808] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60" />
                  </label>
                  <label className="space-y-1.5 text-xs text-white/55">
                    Role
                    <select value={accountRole} onChange={(event) => {
                      const nextRole = event.target.value as AdminUserRole;
                      setAccountRole(nextRole);
                      setAccountPermissions(getAdminRolePermissions(nextRole));
                    }} className="w-full rounded-xl border border-white/10 bg-[#080808] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60">
                      <option value="editor">Editor</option>
                      <option value="media">Media manager</option>
                      <option value="messages">Messages</option>
                      {currentUser.role === "owner" && <option value="owner">Owner</option>}
                    </select>
                  </label>
                  <div className="sm:col-span-2">
                    <p className="mb-2 text-xs text-white/55">Permissions</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {permissionOptions.filter((permission) => ADMIN_ROLE_PERMISSIONS[accountRole].includes(permission.id)).map((permission) => (
                        <label key={permission.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs text-white/75">
                          <input type="checkbox" className="admin-checkbox" checked={accountPermissions.includes(permission.id)} onChange={(event) => setAccountPermissions((current) => event.target.checked ? [...new Set([...current, permission.id])] : current.filter((item) => item !== permission.id))} />
                          {permission.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500">
                    <Plus className="h-4 w-4" /> Create account
                  </button>
                </form>
              </section>

              <section className="space-y-3">
                <h2 className="font-semibold text-white">Admin accounts ({adminUsers.length})</h2>
                {adminUsers.map((user) => {
                  const permissions = accountPermissionDrafts[user.id] ?? user.permissions;
                  const role = accountRoleDrafts[user.id] ?? user.role;
                  return (
                    <article key={user.id} className="rounded-2xl border border-white/10 bg-[#111] p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-white">{user.username}</h3>
                          <p className="mt-1 text-xs text-white/45">Created {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs ${user.active ? "bg-emerald-400/10 text-emerald-300" : "bg-white/10 text-white/45"}`}>
                          {user.active ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1.5 text-xs text-white/55">
                          Role
                          <select value={role} onChange={(event) => {
                            const nextRole = event.target.value as AdminUserRole;
                            setAccountRoleDrafts((drafts) => ({ ...drafts, [user.id]: nextRole }));
                            setAccountPermissionDrafts((drafts) => ({ ...drafts, [user.id]: getAdminRolePermissions(nextRole) }));
                          }} disabled={user.role === "owner" && currentUser.role !== "owner"} className="w-full rounded-xl border border-white/10 bg-[#080808] px-3 py-2.5 text-sm text-white outline-none disabled:opacity-60">
                            <option value="editor">Editor</option>
                            <option value="media">Media manager</option>
                            <option value="messages">Messages</option>
                            {currentUser.role === "owner" && <option value="owner">Owner</option>}
                          </select>
                        </label>
                        <label className="space-y-1.5 text-xs text-white/55">
                          Reset password
                          <input type="password" value={accountPasswordDrafts[user.id] ?? ""} onChange={(event) => setAccountPasswordDrafts((drafts) => ({ ...drafts, [user.id]: event.target.value }))} minLength={10} maxLength={128} autoComplete="new-password" placeholder="Leave blank to keep current" className="w-full rounded-xl border border-white/10 bg-[#080808] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60" />
                        </label>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {permissionOptions.filter((permission) => ADMIN_ROLE_PERMISSIONS[role].includes(permission.id)).map((permission) => (
                          <label key={permission.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs text-white/75">
                            <input type="checkbox" className="admin-checkbox" checked={permissions.includes(permission.id)} disabled={user.role === "owner"} onChange={(event) => setAccountPermissionDrafts((drafts) => ({ ...drafts, [user.id]: event.target.checked ? [...new Set([...permissions, permission.id])] : permissions.filter((item) => item !== permission.id) }))} />
                            {permission.label}
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => void saveAccount(user)} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-500"><Save className="h-4 w-4" /> Save account</button>
                        {user.id !== currentUser.id && <button type="button" onClick={() => void setAccountActive(user, !user.active)} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/75 hover:bg-white/5">{user.active ? "Disable" : "Enable"}</button>}
                        {user.id !== currentUser.id && <button type="button" onClick={() => void deleteAccount(user)} className="inline-flex items-center gap-2 rounded-xl border border-red-400/25 px-3 py-2 text-sm text-red-300 hover:bg-red-400/10"><Trash2 className="h-4 w-4" /> Delete</button>}
                      </div>
                    </article>
                  );
                })}
              </section>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#111] p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-purple-300/80">Configuration</p>
                <h2 className="mt-2 text-xl font-semibold text-white">System Settings</h2>
                <p className="mt-1 text-sm text-white/55">
                  Review administrator access and deployment security. Public website content is managed in Edit Site.
                </p>
              </div>

              <div className="space-y-4 rounded-2xl border border-white/10 bg-[#111] p-5">
                <h3 className="font-semibold text-white">System & Security Information</h3>
                <div className="space-y-3 text-sm text-white/70">
                  <div className="rounded-xl border border-white/5 bg-black/30 p-4">
                    <p className="font-medium text-white">Admin Authentication</p>
                    <p className="mt-1 text-xs leading-5 text-white/50">
                      The administrator password is managed via the <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-purple-200">ADMIN_PASSWORD</code> environment variable (defined in your server’s <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-purple-200">.env.local</code> or hosting dashboard). To change the admin password, update that variable and restart the deployment.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-black/30 p-4">
                    <p className="font-medium text-white">HTTPS Configuration</p>
                    <p className="mt-1 text-xs leading-5 text-white/50">
                      Ensure your production domain is served strictly over HTTPS. The admin session cookie uses secure flags to protect against credential interception over unencrypted networks.
                    </p>
                  </div>
                </div>
              </div>

              {currentUser?.role === "owner" && currentUser.permissions.includes("settings:view") && (
                <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#111] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Website cache</h3>
                    <p className="mt-1 text-sm text-white/50">Invalidate cached pages and server-side CMS data.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void clearWebsiteCache()}
                    disabled={clearingCache}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-purple-400/30 bg-purple-600/15 px-4 py-2 text-sm font-semibold text-purple-100 hover:bg-purple-600/25 disabled:opacity-50"
                  >
                    {clearingCache ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Clear website cache
                  </button>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
