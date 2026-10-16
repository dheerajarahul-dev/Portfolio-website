"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Maximize2, Move, ZoomIn, ZoomOut } from "lucide-react";
import { useSiteContent } from "@/context/SiteContentContext";

type BlockLayout = {
  x: number;
  y: number;
  scale: number;
};

type Gesture = {
  kind: "move" | "resize";
  startX: number;
  startY: number;
  origin: BlockLayout;
};

function readNestedValue(value: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((current, key) => (current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined), value);
}

export default function EditableBlock({
  path,
  children,
  className = "",
  defaultLayout = { x: 0, y: 0, scale: 1 },
  allowInteractiveChildren = false,
}: {
  path: string;
  children: React.ReactNode;
  className?: string;
  defaultLayout?: BlockLayout;
  allowInteractiveChildren?: boolean;
}) {
  const { content, editMode, updatePath, selectPath } = useSiteContent();
  const gestureRef = useRef<Gesture | null>(null);
  const previewRef = useRef<BlockLayout | null>(null);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [preview, setPreview] = useState<BlockLayout | null>(null);
  const layout = useMemo<BlockLayout>(() => {
    const current = readNestedValue(content, path) as Partial<BlockLayout> | undefined;
    return {
      x: Number(current?.x ?? defaultLayout.x ?? 0),
      y: Number(current?.y ?? defaultLayout.y ?? 0),
      scale: Number(current?.scale ?? defaultLayout.scale ?? 1),
    };
  }, [content, defaultLayout, path]);
  const activeLayout = preview ?? layout;

  useEffect(() => {
    if (!gesture) return;

    const handleMove = (event: globalThis.PointerEvent) => {
      const currentGesture = gestureRef.current;
      if (!currentGesture) return;

      const dx = event.clientX - currentGesture.startX;
      const dy = event.clientY - currentGesture.startY;
      if (Math.abs(dx) + Math.abs(dy) < 3) return;
      const next = currentGesture.kind === "move"
        ? {
            ...currentGesture.origin,
            x: Math.max(-400, Math.min(400, currentGesture.origin.x + dx)),
            y: Math.max(-400, Math.min(400, currentGesture.origin.y + dy)),
          }
        : {
            ...currentGesture.origin,
            scale: Math.max(0.7, Math.min(1.8, currentGesture.origin.scale + (dx + dy) / 500)),
          };

      previewRef.current = next;
      setPreview(next);
    };

    const handleEnd = () => {
      const finalLayout = previewRef.current;
      if (finalLayout) updatePath(path, finalLayout);
      gestureRef.current = null;
      previewRef.current = null;
      setGesture(null);
      setPreview(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  }, [gesture, path, updatePath]);

  const beginGesture = (kind: Gesture["kind"], event: PointerEvent<HTMLDivElement | HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (kind === "move" && target.closest("input, textarea, select, a")) return;
    if (kind === "move" && !allowInteractiveChildren && target.closest("button")) return;
    event.preventDefault();
    event.stopPropagation();

    const next: Gesture = {
      kind,
      startX: event.clientX,
      startY: event.clientY,
      origin: layout,
    };
    gestureRef.current = next;
    previewRef.current = null;
    setPreview(null);
    setGesture(next);
    selectPath(path);
  };

  const applyZoom = (delta: number) => {
    const scale = Math.min(1.8, Math.max(0.7, Number((layout.scale + delta).toFixed(2))));
    updatePath(path, { ...layout, scale });
  };

  if (!editMode) return <div className={className}>{children}</div>;

  return (
    <div
      className={`relative ${className}`}
      style={{
        transform: `translate(${activeLayout.x}px, ${activeLayout.y}px) scale(${activeLayout.scale})`,
        transformOrigin: "center center",
        transition: gesture ? "none" : "transform 120ms ease-out",
        cursor: gesture?.kind === "move" ? "grabbing" : "grab",
        touchAction: "none",
      }}
      onPointerDown={(event) => beginGesture("move", event)}
    >
      {children}
      <div className="absolute -right-3 -top-3 z-20 flex items-center gap-1 rounded-full border border-white/15 bg-black/85 p-1 shadow-lg backdrop-blur-sm">
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            applyZoom(-0.1);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/80 hover:bg-white/10"
          aria-label="Zoom out block"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            applyZoom(0.1);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/80 hover:bg-white/10"
          aria-label="Zoom in block"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600/90 text-white" aria-hidden="true">
          <Move className="h-3.5 w-3.5" />
        </div>
      </div>
      <button
        type="button"
        onPointerDown={(event) => beginGesture("resize", event)}
        className="absolute -bottom-3 -right-3 z-30 flex h-8 w-8 touch-none items-center justify-center rounded-md border border-white/50 bg-black/90 text-white shadow-lg"
        aria-label="Drag to resize block"
        title="Drag to resize"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}