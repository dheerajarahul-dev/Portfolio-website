"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SiteContent } from "@/lib/types";
import { updateContentPath, insertContentAtPath, removeContentAtPath } from "@/lib/content-path";

type Ctx = {
  content: SiteContent;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  updatePath: (path: string, value: unknown) => void;
  insertAtPath: (path: string, value: unknown, index?: number) => void;
  removeAtPath: (path: string) => void;
  saveContent: () => Promise<boolean>;
  saving: boolean;
};

const SiteContentContext = createContext<Ctx | null>(null);

export function SiteContentProvider({
  initialContent,
  children,
  startInEditMode = false,
}: {
  initialContent: SiteContent;
  children: ReactNode;
  startInEditMode?: boolean;
}) {
  const [content, setContent] = useState(initialContent);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const updatePath = useCallback((path: string, value: unknown) => {
    setContent((c) => updateContentPath(c, path, value));
  }, []);

  const insertAtPath = useCallback((path: string, value: unknown, index?: number) => {
    setContent((c) => insertContentAtPath(c, path, value, index));
  }, []);

  const removeAtPath = useCallback((path: string) => {
    setContent((c) => removeContentAtPath(c, path));
  }, []);

  const saveContent = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.content) setContent(data.content);
      }
      return res.ok;
    } finally {
      setSaving(false);
    }
  }, [content]);

  useEffect(() => {
    if (!startInEditMode) return;
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setEditMode(true);
      });
  }, [startInEditMode]);

  const value = useMemo(
    () => ({
      content,
      editMode,
      setEditMode,
      updatePath,
      insertAtPath,
      removeAtPath,
      saveContent,
      saving,
    }),
    [content, editMode, updatePath, insertAtPath, removeAtPath, saveContent, saving]
  );

  return (
    <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const ctx = useContext(SiteContentContext);
  if (!ctx) throw new Error("useSiteContent must be used within SiteContentProvider");
  return ctx;
}
