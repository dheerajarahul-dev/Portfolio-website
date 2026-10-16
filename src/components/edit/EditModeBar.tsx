"use client";

import { useRouter } from "next/navigation";
import { Save, X, Loader2, Pencil, Plus, RotateCcw, RotateCw } from "lucide-react";
import { useSiteContent } from "@/context/SiteContentContext";

export default function EditModeBar() {
  const router = useRouter();
  const {
    editMode,
    setEditMode,
    saveContent,
    saving,
    insertAtPath,
    undo,
    redo,
    canUndo,
    canRedo,
    dirty,
    cancelChanges,
  } = useSiteContent();

  if (!editMode) return null;

  const handleSave = async () => {
    const ok = await saveContent();
    if (ok) router.refresh();
  };

  const handleAddSection = () => {
    insertAtPath("customSections", {
      id: `${Date.now()}`,
      eyebrow: "New section",
      title: "New headline",
      textBlocks: ["Add text box content here."],
      imageUrl: "",
      imageRounded: true,
      layout: { x: 0, y: 0, scale: 1 },
    });
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-[200] flex max-w-[calc(100vw-1rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-2xl border border-purple-400/30 bg-black/90 px-4 py-3 shadow-2xl backdrop-blur-md">
      <Pencil className="h-4 w-4 text-purple-300" />
      <span className="text-sm font-medium text-white">Live edit</span>
      <span className={`rounded-full px-2 py-1 text-xs ${dirty ? "bg-amber-400/15 text-amber-200" : "bg-emerald-400/10 text-emerald-200"}`}>
        {dirty ? "Unsaved" : "Saved"}
      </span>
      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/15 disabled:opacity-40"
        aria-label="Undo"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/15 disabled:opacity-40"
        aria-label="Redo"
      >
        <RotateCw className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={handleAddSection}
        className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
      >
        <Plus className="h-4 w-4" /> Add section
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !dirty}
        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Publish
      </button>
      <button
        type="button"
        onClick={cancelChanges}
        disabled={!dirty || saving}
        className="inline-flex items-center gap-1 rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/5 disabled:opacity-40"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => {
          setEditMode(false);
          router.push("/");
        }}
        className="inline-flex items-center gap-1 rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
      >
        <X className="h-4 w-4" /> Exit
      </button>
    </div>
  );
}
