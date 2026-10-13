"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useSiteContent } from "@/context/SiteContentContext";

type Tag = "span" | "p" | "h1" | "h2" | "h3" | "h4";

export default function EditableText({
  path,
  value,
  as: Tag = "span",
  className = "",
  multiline = false,
}: {
  path: string;
  value: string;
  as?: Tag;
  className?: string;
  multiline?: boolean;
}) {
  const { editMode, updatePath } = useSiteContent();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  if (!editMode) {
    return <Tag className={className}>{value}</Tag>;
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
      />
    );
  }

  return (
    <span
      className={`group/edit relative inline-block max-w-full rounded-md transition-all hover:outline hover:outline-2 hover:outline-purple-400/70 hover:outline-offset-4 ${className}`}
    >
      <Tag className={className}>{value || " "}</Tag>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDraft(value);
          setEditing(true);
        }}
        className="absolute -right-2 -top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-white opacity-0 shadow-lg transition group-hover/edit:opacity-100"
        aria-label="Edit text"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
