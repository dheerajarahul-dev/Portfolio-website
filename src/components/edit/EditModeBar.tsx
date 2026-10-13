"use client";

import { useRouter } from "next/navigation";
import { Save, X, Loader2, Pencil, Plus } from "lucide-react";
import { useSiteContent } from "@/context/SiteContentContext";

export default function EditModeBar() {
  const router = useRouter();
  const { editMode, setEditMode, saveContent, saving, insertAtPath } = useSiteContent();

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
      textBlocks: ["Add a text box content here."],
      imageUrl: "",
      imageRounded: true,
    });
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-purple-400/30 bg-black/90 px-4 py-3 shadow-2xl backdrop-blur-md">
      <Pencil className="h-4 w-4 text-purple-300" />
      <span className="text-sm font-medium text-white">Live edit — hover text & click pencil</span>
      <button
        onClick={handleAddSection}
        className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
      >
        <Plus className="h-4 w-4" /> Add section
      </button>
      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save
      </button>
      <button
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
