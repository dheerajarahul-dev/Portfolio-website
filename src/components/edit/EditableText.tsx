"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useSiteContent } from "@/context/SiteContentContext";
import { settingsKey, toEditableStyle } from "./visual-settings";
import EditableSurface from "./EditableSurface";

type Tag = "span" | "p" | "h1" | "h2" | "h3" | "h4";

function formatText(value: string, highlightX: boolean) {
  if (!highlightX) return value;
  const match = value.match(/^(.*?)\s*([xX])\s*(.*)$/);
  if (match) {
    const [, before, xChar, after] = match;
    return (
      <span className="inline-flex items-center justify-center whitespace-nowrap leading-none">
        {before && <span className="inline-block shrink-0">{before}</span>}
        <span className="brand-x-bulb mx-1.5 shrink-0 select-none">{xChar}</span>
        {after && <span className="inline-block shrink-0">{after}</span>}
      </span>
    );
  }

  return value.split(/(x)/gi).map((part, index) =>
    part.toLowerCase() === "x"
      ? <span key={`${part}-${index}`} className="brand-x-bulb mx-1.5 shrink-0 select-none">{part}</span>
      : part
  );
}

export default function EditableText({
  path,
  value,
  as: Tag = "span",
  className = "",
  multiline = false,
  showEditButton = true,
  highlightX = false,
}: {
  path: string;
  value: string;
  as?: Tag;
  className?: string;
  multiline?: boolean;
  showEditButton?: boolean;
  highlightX?: boolean;
}) {
  const { editMode, updatePath, selectPath } = useSiteContent();
  const { content, registerElement } = useSiteContent();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const elementSettings = content.editor?.elements?.[settingsKey(path)];
  const style = toEditableStyle(elementSettings);

  useEffect(() => {
    registerElement({
      path,
      kind: "text",
      label: elementSettings?.label || value || path,
      section: path.split(".")[0] || "Page",
      multiline,
    });
  }, [elementSettings?.label, multiline, path, registerElement, value]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  if (!editMode) {
    return <Tag className={className} style={style}>{formatText(value, highlightX)}</Tag>;
  }

  const commit = () => {
    updatePath(path, draft);
    setEditing(false);
  };

  if (editing) {
    const shared =
      "w-full min-w-[120px] rounded-lg border-2 border-purple-400 bg-black/90 px-2 py-1 text-inherit outline-none ring-2 ring-purple-500/30";
    return multiline ? (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        rows={3}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
        className={`${shared} ${className}`}
        style={style}
      />
    ) : (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className={`${shared} ${className}`}
        style={style}
      />
    );
  }

  return (
    <EditableSurface path={path} as={Tag === "span" ? "span" : "div"} className={className} style={style}>
      <Tag className="group/edit relative max-w-full rounded-md transition-all">
        {formatText(value || " ", highlightX)}
        {showEditButton && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              selectPath(path);
              setDraft(value);
              setEditing(true);
            }}
            className="absolute -right-2 -top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-white opacity-0 shadow-lg transition group-hover/edit:opacity-100"
            aria-label="Edit text"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </Tag>
    </EditableSurface>
  );
}
