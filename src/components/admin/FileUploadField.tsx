"use client";

import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";

export default function FileUploadField({
  label,
  accept,
  currentUrl,
  onUploaded,
  hint,
}: {
  label: string;
  accept: string;
  currentUrl?: string;
  onUploaded: (url: string, type: "image" | "video") => void;
  hint?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onUploaded(data.url, data.type === "video" ? "video" : "image");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <span className="text-xs uppercase tracking-wider text-white/50">{label}</span>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-[#0a0a0a] px-4 py-6 transition hover:border-purple-400/40 hover:bg-purple-500/5">
        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={loading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
        ) : (
          <Upload className="h-6 w-6 text-purple-300/80" />
        )}
        <span className="text-xs text-white/50">
          {loading ? "Uploading…" : "Click to upload"}
        </span>
      </label>
      {hint && <p className="text-xs text-white/35">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {currentUrl && (
        <div className="overflow-hidden rounded-lg border border-white/10">
          {currentUrl.match(/\.(mp4|webm)$/i) ? (
            <video src={currentUrl} className="h-28 w-full object-cover" muted playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUrl} alt="Preview" className="h-28 w-full object-cover" />
          )}
        </div>
      )}
    </div>
  );
}
