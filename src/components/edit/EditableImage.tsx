"use client";

import { Pencil, ImageIcon } from "lucide-react";
import { useSiteContent } from "@/context/SiteContentContext";

export default function EditableImage({
  path,
  value,
  className = "",
}: {
  path: string;
  value: string;
  radiusPath?: string;
  className?: string;
}) {
  const { editMode, updatePath } = useSiteContent();

  if (!editMode) {
    return value ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={value} alt="" className={className} />
    ) : (
      <div className={`w-full h-40 bg-white/5 flex items-center justify-center ${className}`}>
        <ImageIcon className="w-8 h-8 text-white/40" />
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className={`w-full h-auto object-cover ${className}`} />
      ) : (
        <div className="w-full h-40 bg-white/5 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-white/40" />
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          const url = window.prompt("Image URL:", value || "");
          if (url !== null) updatePath(path, url);
        }}
        className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white opacity-90 shadow-lg"
        aria-label="Edit image"
      >
        <Pencil className="w-4 h-4" />
      </button>
    </div>
  );
}
