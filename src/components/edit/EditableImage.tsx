"use client";

import { useEffect, useState } from "react";
import { Pencil, ImageIcon } from "lucide-react";
import { useSiteContent } from "@/context/SiteContentContext";
import { settingsKey, toEditableStyle } from "./visual-settings";
import EditableSurface from "./EditableSurface";

export default function EditableImage({
  path,
  value,
  className = "",
  alt = "",
}: {
  path: string;
  value: string;
  alt?: string;
  radiusPath?: string;
  className?: string;
}) {
  const { content, editMode, updatePath, selectPath, registerElement } = useSiteContent();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const elementSettings = content.editor?.elements?.[settingsKey(path)];
  const style = toEditableStyle(elementSettings);

  const failed = Boolean(value && failedSrc === value);

  useEffect(() => {
    registerElement({
      path,
      kind: "image",
      label: elementSettings?.label || "Image",
      section: path.split(".")[0] || "Page",
      sourcePath: path,
    });
  }, [elementSettings?.label, path, registerElement]);

  if (!editMode) {
    return value && !failed ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={value} alt={elementSettings?.altText || alt} className={className} style={style} onError={() => setFailedSrc(value)} />
    ) : (
      <div className={`flex min-h-12 w-full items-center justify-center bg-white/5 px-3 py-2 text-center text-xs font-semibold text-white/70 ${className}`} style={style}>
        {elementSettings?.label || elementSettings?.altText || <ImageIcon className="w-8 h-8 text-white/40" />}
      </div>
    );
  }

  return (
    <EditableSurface path={path} className={`group ${className}`} style={style}>
      <div className="relative h-full w-full">
        {value && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={elementSettings?.altText || alt} className={`block h-full w-full ${className}`} onError={() => setFailedSrc(value)} />
        ) : (
          <div className="flex min-h-12 w-full items-center justify-center bg-white/5 px-3 py-2 text-center text-xs font-semibold text-white/70">
            {elementSettings?.label || elementSettings?.altText || <ImageIcon className="w-8 h-8 text-white/40" />}
          </div>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            selectPath(path);
            const url = window.prompt("Image URL:", value || "");
            if (url !== null) updatePath(path, url);
          }}
          className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white opacity-90 shadow-lg"
          aria-label="Edit image"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    </EditableSurface>
  );
}
