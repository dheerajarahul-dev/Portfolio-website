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
import type { EditableElementMeta } from "@/components/edit/visual-settings";

type Ctx = {
  content: SiteContent;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  selectedPath: string | null;
  selectPath: (path: string | null) => void;
  selectedMeta: EditableElementMeta | null;
  registerElement: (meta: EditableElementMeta) => void;
  canvasZoom: number;
  setCanvasZoom: (zoom: number) => void;
  updatePath: (path: string, value: unknown) => void;
  insertAtPath: (path: string, value: unknown, index?: number) => void;
  removeAtPath: (path: string) => void;
  deleteCustomSection: (sectionId: string) => void;
  resetPath: (path: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  dirty: boolean;
  cancelChanges: () => void;
  saveContent: () => Promise<boolean>;
  saving: boolean;
  error: string | null;
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
  const [lastSavedContent, setLastSavedContent] = useState(initialContent);
  const [editMode, setEditMode] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [registry, setRegistry] = useState<Record<string, EditableElementMeta>>({});
  const [canvasZoom, setCanvasZoomState] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [past, setPast] = useState<SiteContent[]>([]);
  const [future, setFuture] = useState<SiteContent[]>([]);

  const selectPath = useCallback((path: string | null) => {
    setSelectedPath(path);
  }, []);

  const registerElement = useCallback((meta: EditableElementMeta) => {
    setRegistry((current) => {
      const existing = current[meta.path];
      if (
        existing &&
        existing.kind === meta.kind &&
        existing.label === meta.label &&
        existing.section === meta.section &&
        existing.sourcePath === meta.sourcePath
      ) {
        return current;
      }
      return { ...current, [meta.path]: meta };
    });
  }, []);

  const commitContent = useCallback((updater: (current: SiteContent) => SiteContent) => {
    setContent((current) => {
      const next = updater(current);
      if (next === current) return current;
      setPast((items) => [...items.slice(-39), current]);
      setFuture([]);
      setError(null);
      return next;
    });
  }, []);

  const setCanvasZoom = useCallback((zoom: number) => {
    setCanvasZoomState(Math.min(1.75, Math.max(0.65, Number(zoom.toFixed(2)))));
  }, []);

  const updatePath = useCallback((path: string, value: unknown) => {
    commitContent((c) => updateContentPath(c, path, value));
  }, [commitContent]);

  const insertAtPath = useCallback((path: string, value: unknown, index?: number) => {
    commitContent((c) => insertContentAtPath(c, path, value, index));
  }, [commitContent]);

  const removeAtPath = useCallback((path: string) => {
    commitContent((c) => removeContentAtPath(c, path));
  }, [commitContent]);

  const deleteCustomSection = useCallback(
    (sectionId: string) => {
      if (!sectionId) return;
      const removalCandidate = selectedPath
        ? (() => {
            const match = selectedPath.match(/^customSections\.(\d+)(?:\.|$)/);
            if (!match) return null;
            const sectionIndex = Number(match[1]);
            return content.customSections?.[sectionIndex]?.id === sectionId
              ? sectionIndex
              : null;
          })()
        : null;

      commitContent((current) => {
        const sections = current.customSections ?? [];
        const nextSections = sections.filter((section) => section.id !== sectionId);
        if (nextSections.length === sections.length) return current;
        return { ...current, customSections: nextSections };
      });

      if (removalCandidate !== null) {
        setSelectedPath(null);
      }
    },
    [commitContent, content.customSections, selectedPath]
  );

  const resetPath = useCallback((path: string) => {
    commitContent((c) => removeContentAtPath(c, path));
  }, [commitContent]);

  const undo = useCallback(() => {
    setPast((items) => {
      const previous = items.at(-1);
      if (!previous) return items;
      setFuture((futureItems) => [content, ...futureItems]);
      setContent(previous);
      return items.slice(0, -1);
    });
  }, [content]);

  const redo = useCallback(() => {
    setFuture((items) => {
      const next = items[0];
      if (!next) return items;
      setPast((pastItems) => [...pastItems.slice(-39), content]);
      setContent(next);
      return items.slice(1);
    });
  }, [content]);

  const cancelChanges = useCallback(() => {
    setContent(lastSavedContent);
    setPast([]);
    setFuture([]);
    setSelectedPath(null);
    setError(null);
  }, [lastSavedContent]);

  const saveContent = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          setContent(data.content);
          setLastSavedContent(data.content);
          setPast([]);
          setFuture([]);
        }
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Could not save changes.");
      }
      return res.ok;
    } catch {
      setError("Network error while saving. Your unsaved changes are still in the editor.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [content]);

  useEffect(() => {
    if (!startInEditMode) return;
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.user?.permissions?.includes("site:edit")) setEditMode(true);
      });
  }, [startInEditMode]);

  const value = useMemo(
    () => ({
      content,
      editMode,
      setEditMode,
      selectedPath,
      selectPath,
      selectedMeta: selectedPath ? registry[selectedPath] ?? null : null,
      registerElement,
      canvasZoom,
      setCanvasZoom,
      updatePath,
      insertAtPath,
      removeAtPath,
      deleteCustomSection,
      resetPath,
      undo,
      redo,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      dirty: JSON.stringify(content) !== JSON.stringify(lastSavedContent),
      cancelChanges,
      saveContent,
      saving,
      error,
    }),
    [
      content,
      editMode,
      selectedPath,
      selectPath,
      registry,
      registerElement,
      canvasZoom,
      setCanvasZoom,
      updatePath,
      insertAtPath,
      removeAtPath,
      deleteCustomSection,
      resetPath,
      undo,
      redo,
      past.length,
      future.length,
      lastSavedContent,
      cancelChanges,
      saveContent,
      saving,
      error,
    ]
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
