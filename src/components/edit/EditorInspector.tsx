"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, RotateCcw, SlidersHorizontal, Upload, X, ZoomIn, ZoomOut } from "lucide-react";
import { useSiteContent } from "@/context/SiteContentContext";
import type { VisualElementSettings } from "@/lib/types";
import { settingsPath } from "./visual-settings";

function getAtPathValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, obj);
}

function asSettings(value: unknown): VisualElementSettings {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as VisualElementSettings)
    : {};
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-xs">
      <span className="text-white/60">{label}</span>
      {children}
    </label>
  );
}

export default function EditorInspector() {
  const {
    content,
    editMode,
    selectedPath,
    selectedMeta,
    selectPath,
    updatePath,
    resetPath,
    canvasZoom,
    setCanvasZoom,
    error,
  } = useSiteContent();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [canManageMedia, setCanManageMedia] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((response) => response.json())
      .then((data) => setCanManageMedia(data.user?.permissions?.includes("media:manage") === true))
      .catch(() => setCanManageMedia(false));
  }, []);

  if (!editMode || !selectedPath) return null;

  const selectedValue = getAtPathValue(content, selectedPath);
  const settingsValue = getAtPathValue(content, settingsPath(selectedPath));
  const settings = asSettings(settingsValue);
  const layout =
    selectedValue && typeof selectedValue === "object" && !Array.isArray(selectedValue)
      ? (selectedValue as Record<string, unknown>)
      : null;

  const updateSetting = (patch: Partial<VisualElementSettings>) => {
    updatePath(settingsPath(selectedPath), { ...settings, ...patch });
  };

  const updateTransformSetting = (field: "x" | "y" | "scale", value: number) => {
    const ranges = {
      x: Math.max(-400, Math.min(400, value || 0)),
      y: Math.max(-400, Math.min(400, value || 0)),
      scale: Math.max(0.7, Math.min(1.8, value || 1)),
    };
    updateSetting({ [field]: ranges[field] });
  };

  const updateLayoutNumber = (field: "x" | "y" | "scale", value: number) => {
    if (!layout) return;
    const ranges = {
      x: Math.max(-220, Math.min(220, value || 0)),
      y: Math.max(-220, Math.min(220, value || 0)),
      scale: Math.max(0.7, Math.min(1.8, value || 1)),
    };
    updatePath(selectedPath, { ...layout, [field]: ranges[field] });
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Upload failed.");
      updatePath(selectedMeta?.sourcePath || selectedPath, data.url);
    } catch (uploadIssue) {
      setUploadError(uploadIssue instanceof Error ? uploadIssue.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <aside className="fixed right-2 top-16 z-[180] max-h-[calc(100vh-5rem)] w-[min(340px,calc(100vw-1rem))] overflow-y-auto rounded-2xl border border-purple-400/30 bg-[#0d0d12]/95 p-3 text-white shadow-2xl backdrop-blur-md sm:right-4 sm:top-20 sm:p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-purple-300/80">Inspector</p>
          <h3 className="mt-1 text-base font-semibold">{selectedMeta?.label || "Selected element"}</h3>
          <p className="mt-1 text-xs text-white/50">{selectedMeta?.section || selectedPath}</p>
        </div>
        <button
          type="button"
          onClick={() => selectPath(null)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 text-sm text-white/80">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">Path</p>
          <p className="mt-1 break-all text-xs text-white/85">{selectedPath}</p>
        </div>

        {typeof selectedValue === "string" ? (
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">Content</p>
            <textarea
              value={selectedValue}
              onChange={(event) => updatePath(selectedPath, event.target.value)}
              rows={selectedMeta?.multiline ? 5 : 2}
              className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-purple-400/60"
            />
          </div>
        ) : null}

        {selectedMeta?.kind === "image" ? (
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/50">
              <ImagePlus className="h-3.5 w-3.5" />
              Image
            </div>
            <Field label="Source URL">
              <input
                value={String(selectedValue || "")}
                onChange={(event) => updatePath(selectedMeta.sourcePath || selectedPath, event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white outline-none focus:border-purple-400/60"
              />
            </Field>
            <Field label="Alt text / fallback label">
              <input
                value={settings.altText || settings.label || ""}
                onChange={(event) => updateSetting({ altText: event.target.value, label: event.target.value })}
                className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white outline-none focus:border-purple-400/60"
              />
            </Field>
            {canManageMedia && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadImage(file);
                  }}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload replacement"}
                </button>
                {uploadError ? <p className="text-xs text-red-300">{uploadError}</p> : null}
              </>
            )}
          </div>
        ) : null}

        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/50">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Size and Layout
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Width">
              <input value={settings.width || ""} placeholder="auto" onChange={(e) => updateSetting({ width: e.target.value })} className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white outline-none focus:border-purple-400/60" />
            </Field>
            <Field label="Height">
              <input value={settings.height || ""} placeholder="auto" onChange={(e) => updateSetting({ height: e.target.value })} className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white outline-none focus:border-purple-400/60" />
            </Field>
            <Field label="Padding">
              <input value={settings.padding || ""} placeholder="0" onChange={(e) => updateSetting({ padding: e.target.value })} className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white outline-none focus:border-purple-400/60" />
            </Field>
            <Field label="Margin">
              <input value={settings.margin || ""} placeholder="0" onChange={(e) => updateSetting({ margin: e.target.value })} className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white outline-none focus:border-purple-400/60" />
            </Field>
            <Field label="X position">
              <input type="number" value={settings.x ?? 0} onChange={(e) => updateTransformSetting("x", Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white outline-none focus:border-purple-400/60" />
            </Field>
            <Field label="Y position">
              <input type="number" value={settings.y ?? 0} onChange={(e) => updateTransformSetting("y", Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white outline-none focus:border-purple-400/60" />
            </Field>
          </div>
          <Field label={`Scale ${Number(settings.scale ?? 1).toFixed(2)}x`}>
            <input type="range" min={0.7} max={1.8} step={0.05} value={settings.scale ?? 1} onChange={(e) => updateTransformSetting("scale", Number(e.target.value))} className="w-full accent-purple-500" />
          </Field>
          <Field label="Alignment">
            <select value={settings.textAlign || ""} onChange={(e) => updateSetting({ textAlign: (e.target.value || undefined) as VisualElementSettings["textAlign"] })} className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white outline-none focus:border-purple-400/60">
              <option value="">Default</option>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </Field>
        </div>

        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">Typography</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Font size">
              <input value={settings.fontSize || ""} placeholder="inherit" onChange={(e) => updateSetting({ fontSize: e.target.value })} className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white outline-none focus:border-purple-400/60" />
            </Field>
            <Field label="Weight">
              <input value={settings.fontWeight || ""} placeholder="inherit" onChange={(e) => updateSetting({ fontWeight: e.target.value })} className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white outline-none focus:border-purple-400/60" />
            </Field>
            <Field label="Line height">
              <input value={settings.lineHeight || ""} placeholder="normal" onChange={(e) => updateSetting({ lineHeight: e.target.value })} className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white outline-none focus:border-purple-400/60" />
            </Field>
            <Field label="Letter spacing">
              <input value={settings.letterSpacing || ""} placeholder="0" onChange={(e) => updateSetting({ letterSpacing: e.target.value })} className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white outline-none focus:border-purple-400/60" />
            </Field>
          </div>
          <Field label="Text color">
            <input type="color" value={settings.color || "#ffffff"} onChange={(e) => updateSetting({ color: e.target.value })} className="h-9 w-full rounded-lg border border-white/10 bg-[#0a0a0a]" />
          </Field>
        </div>

        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">Appearance</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Background">
              <input type="color" value={settings.backgroundColor || "#000000"} onChange={(e) => updateSetting({ backgroundColor: e.target.value })} className="h-9 w-full rounded-lg border border-white/10 bg-[#0a0a0a]" />
            </Field>
            <Field label="Radius">
              <input value={settings.borderRadius || ""} placeholder="0" onChange={(e) => updateSetting({ borderRadius: e.target.value })} className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white outline-none focus:border-purple-400/60" />
            </Field>
          </div>
          <Field label={`Opacity ${settings.opacity ?? 1}`}>
            <input type="range" min={0.15} max={1} step={0.05} value={settings.opacity ?? 1} onChange={(e) => updateSetting({ opacity: Number(e.target.value) })} className="w-full accent-purple-500" />
          </Field>
        </div>

        {layout ? (
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">Drag transform</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="X">
                <input value={Number(layout.x ?? 0)} onChange={(e) => updateLayoutNumber("x", Number(e.target.value))} type="number" className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white outline-none focus:border-purple-400/60" />
              </Field>
              <Field label="Y">
                <input value={Number(layout.y ?? 0)} onChange={(e) => updateLayoutNumber("y", Number(e.target.value))} type="number" className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-2 py-1.5 text-white outline-none focus:border-purple-400/60" />
              </Field>
            </div>
            <Field label={`Scale ${Number(layout.scale ?? 1).toFixed(2)}x`}>
              <input value={Number(layout.scale ?? 1)} min={0.7} max={1.8} step={0.05} onChange={(e) => updateLayoutNumber("scale", Number(e.target.value))} className="w-full accent-purple-500" type="range" />
            </Field>
          </div>
        ) : null}

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-white/50">
            <span>Canvas zoom</span>
            <span>{canvasZoom.toFixed(2)}x</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCanvasZoom(canvasZoom - 0.1)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10" aria-label="Zoom out canvas">
              <ZoomOut className="h-4 w-4" />
            </button>
            <input type="range" min={0.65} max={1.75} step={0.05} value={canvasZoom} onChange={(event) => setCanvasZoom(Number(event.target.value))} className="w-full accent-purple-500" />
            <button type="button" onClick={() => setCanvasZoom(canvasZoom + 0.1)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10" aria-label="Zoom in canvas">
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => resetPath(settingsPath(selectedPath))}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4" />
          Reset selected styles
        </button>

        {error ? <p className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-xs text-red-200">{error}</p> : null}
      </div>
    </aside>
  );
}
