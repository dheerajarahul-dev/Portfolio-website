"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  HardDrive,
  Upload,
  Search,
  Filter,
  FileVideo,
  FileAudio,
  FileImage,
  FileText,
  Download,
  FolderKanban,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import type { StudioSession, StudioAsset, StudioProject, AssetCategory } from "@/lib/studio-types";

interface Props {
  session: StudioSession;
  initialAssets: StudioAsset[];
  projects: StudioProject[];
  isStaff: boolean;
}

const CATEGORY_TABS: { label: string; value: string }[] = [
  { label: "All Files", value: "all" },
  { label: "Videos & WIP", value: "video" },
  { label: "Audio & Music", value: "audio" },
  { label: "Images & Logos", value: "image" },
  { label: "Documents", value: "document" },
];

export default function MediaLibraryClient({
  session,
  initialAssets,
  projects,
  isStaff,
}: Props) {
  const [assets, setAssets] = useState<StudioAsset[]>(initialAssets);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState(projects[0]?.id ?? "");
  const [targetCategory, setTargetCategory] = useState<AssetCategory>("wip_export");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchSearch =
        !search ||
        asset.originalFilename?.toLowerCase().includes(search.toLowerCase()) ||
        asset.filename.toLowerCase().includes(search.toLowerCase());

      const matchProject =
        selectedProject === "all" || asset.projectId === selectedProject;

      let matchCat = true;
      if (selectedCategory === "video") {
        matchCat = asset.mimeType.startsWith("video/") || asset.category === "wip_export" || asset.category === "raw_video";
      } else if (selectedCategory === "audio") {
        matchCat = asset.mimeType.startsWith("audio/") || asset.category === "audio" || asset.category === "music";
      } else if (selectedCategory === "image") {
        matchCat = asset.mimeType.startsWith("image/") || asset.category === "image" || asset.category === "logo";
      } else if (selectedCategory === "document") {
        matchCat = asset.category === "document" || asset.mimeType.includes("pdf");
      }

      return matchSearch && matchProject && matchCat;
    });
  }, [assets, search, selectedCategory, selectedProject]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !targetProjectId) return;
    setUploadError(null);
    setUploading(true);

    try {
      // 1. Get signed upload URL
      const signRes = await fetch("/api/studio/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          projectId: targetProjectId,
          category: targetCategory,
        }),
      });
      const signData = await signRes.json();
      if (!signRes.ok) {
        setUploadError(signData.error || "Failed to sign upload request");
        setUploading(false);
        return;
      }

      // 2. Put file to Supabase storage URL
      const uploadRes = await fetch(signData.data.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!uploadRes.ok) {
        setUploadError("Storage upload failed. Please verify Supabase storage.");
        setUploading(false);
        return;
      }

      // 3. Register asset
      const recordRes = await fetch("/api/studio/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: targetProjectId,
          filename: signData.data.filename,
          originalFilename: file.name,
          storagePath: signData.data.storagePath,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          category: targetCategory,
        }),
      });
      const recordData = await recordRes.json();
      if (recordRes.ok && recordData.data) {
        setAssets((prev) => [recordData.data, ...prev]);
        setIsUploadOpen(false);
      }
    } catch {
      setUploadError("Network error during file upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => map.set(p.id, p.title));
    return map;
  }, [projects]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <HardDrive className="w-6 h-6 text-violet-500" />
            Media & Master Assets
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Central repository for all project footage, WIP cuts, masters, stems, and collateral
          </p>
        </div>

        {projects.length > 0 && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-violet-600/20"
          >
            <Upload className="w-4 h-4" />
            Upload Asset
          </button>
        )}
      </div>

      {/* Control bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#111113] p-3 rounded-2xl border border-white/[0.06]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename..."
            className="w-full pl-9 pr-3.5 py-2 bg-zinc-900/80 border border-white/[0.06] rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Tabs */}
          <div className="flex bg-zinc-900 rounded-xl p-1 border border-white/[0.06]">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedCategory(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedCategory === tab.value
                    ? "bg-violet-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Project filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 bg-zinc-900/80 border border-white/[0.06] rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer max-w-[180px] truncate"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAssets.length === 0 ? (
          <div className="col-span-full py-20 text-center text-zinc-500 text-sm bg-[#111113] rounded-2xl border border-white/[0.06]">
            No assets found matching your selection.
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const isVideo = asset.mimeType.startsWith("video/");
            const isAudio = asset.mimeType.startsWith("audio/");
            const isImg = asset.mimeType.startsWith("image/");
            const Icon = isVideo
              ? FileVideo
              : isAudio
              ? FileAudio
              : isImg
              ? FileImage
              : FileText;

            const projectName = projectMap.get(asset.projectId) || "Project";

            return (
              <div
                key={asset.id}
                className="bg-[#111113] p-4 rounded-2xl border border-white/[0.06] hover:border-violet-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-950/40 border border-violet-800/40 flex items-center justify-center text-violet-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md">
                      {asset.category.replace("_", " ")}
                    </span>
                  </div>

                  <h3
                    className="text-white text-sm font-semibold truncate"
                    title={asset.originalFilename || asset.filename}
                  >
                    {asset.originalFilename || asset.filename}
                  </h3>
                  <p className="text-zinc-500 text-xs mt-1 truncate">
                    {projectName}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-zinc-400">
                  <span>{(asset.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                  <Link
                    href={`/studio/projects/${asset.projectId}`}
                    className="text-violet-400 hover:text-violet-300 font-medium"
                  >
                    View Project &rarr;
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161619] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-violet-500" />
              Upload Production Asset
            </h2>

            {uploadError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-semibold mb-1.5">
                  Target Project
                </label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-semibold mb-1.5">
                  Asset Category
                </label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value as AssetCategory)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none"
                >
                  <option value="wip_export">WIP Export Cut</option>
                  <option value="raw_video">Raw Video Footage</option>
                  <option value="final_video">Final Master Video</option>
                  <option value="audio">Audio / Music Stem</option>
                  <option value="image">Image / Graphic / Thumbnail</option>
                  <option value="document">Document / Script</option>
                  <option value="other">Other Asset</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-semibold mb-1.5">
                  Select File
                </label>
                <input
                  type="file"
                  disabled={uploading}
                  onChange={handleFileUpload}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-violet-600 file:text-white cursor-pointer"
                />
              </div>

              {uploading && (
                <div className="flex items-center gap-2 text-violet-400 pt-2 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading asset directly to Supabase storage...</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                disabled={uploading}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
