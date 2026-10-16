"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Maximize2 } from "lucide-react";
import { useSiteContent } from "@/context/SiteContentContext";
import type { VisualElementSettings } from "@/lib/types";
import { settingsKey, settingsPath } from "./visual-settings";

const EMPTY_SETTINGS: VisualElementSettings = {};

type Interaction = {
  kind: "move" | "resize";
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  originWidth: number;
  originHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
  moved: boolean;
};

export default function EditableSurface({
  path,
  children,
  className = "",
  style,
  as = "div",
}: {
  path: string;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "span";
}) {
  const { content, editMode, selectedPath, selectPath, updatePath } = useSiteContent();
  const settings = content.editor?.elements?.[settingsKey(path)] ?? EMPTY_SETTINGS;
  const settingsRef = useRef(settings);
  const surfaceRef = useRef<HTMLDivElement | HTMLSpanElement>(null);
  const interactionRef = useRef<Interaction | null>(null);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const isSelected = selectedPath === path;
  const isInteracting = interaction !== null;

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!isInteracting) return;

    const handleMove = (event: globalThis.PointerEvent) => {
      const current = interactionRef.current;
      if (!current) return;

      const dx = event.clientX - current.startX;
      const dy = event.clientY - current.startY;
      const moved = current.moved || Math.abs(dx) + Math.abs(dy) > 3;
      const next = current.kind === "move"
        ? {
            ...current,
            x: Math.max(-400, Math.min(400, current.originX + dx)),
            y: Math.max(-400, Math.min(400, current.originY + dy)),
            moved,
          }
        : {
            ...current,
            width: Math.max(96, Math.min(1200, current.originWidth + dx)),
            height: Math.max(36, Math.min(900, current.originHeight + dy)),
            moved,
          };

      interactionRef.current = next;
      setInteraction(interactionRef.current);
    };

    const handleEnd = () => {
      const current = interactionRef.current;
      if (current?.moved) {
        updatePath(settingsPath(path), {
          ...settingsRef.current,
          ...(current.kind === "move"
            ? { x: current.x, y: current.y }
            : { width: `${Math.round(current.width)}px`, height: `${Math.round(current.height)}px` }),
        });
      }
      interactionRef.current = null;
      setInteraction(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  }, [isInteracting, path, updatePath]);

  if (!editMode) return <>{children}</>;

  const beginInteraction = (kind: Interaction["kind"], event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if (kind === "move" && (event.target as HTMLElement).closest("button, input, textarea, select, a")) return;
    event.preventDefault();
    event.stopPropagation();
    const surface = surfaceRef.current;
    if (!surface) return;

    const next: Interaction = {
      kind,
      startX: event.clientX,
      startY: event.clientY,
      originX: Number(settings.x ?? 0),
      originY: Number(settings.y ?? 0),
      originWidth: surface.offsetWidth,
      originHeight: surface.offsetHeight,
      x: Number(settings.x ?? 0),
      y: Number(settings.y ?? 0),
      width: surface.offsetWidth,
      height: surface.offsetHeight,
      moved: false,
    };
    interactionRef.current = next;
    setInteraction(next);
    selectPath(path);
  };

  const x = interaction?.kind === "move" ? interaction.x : Number(settings.x ?? 0);
  const y = interaction?.kind === "move" ? interaction.y : Number(settings.y ?? 0);
  const scale = Math.max(0.7, Math.min(1.8, Number(settings.scale ?? 1)));

  const surfaceClassName = `editable-surface relative inline-block max-w-full ${isSelected ? "outline outline-2 outline-lime-300 outline-offset-2" : "hover:outline hover:outline-1 hover:outline-white/40 hover:outline-offset-2"} ${className}`;
  const surfaceStyle: CSSProperties = {
    ...style,
    display: "inline-block",
    maxWidth: style?.maxWidth || "100%",
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
    transformOrigin: "center center",
    width: interaction?.kind === "resize" ? `${interaction.width}px` : style?.width,
    height: interaction?.kind === "resize" ? `${interaction.height}px` : style?.height,
    cursor: interaction?.kind === "move" ? "grabbing" : "grab",
    touchAction: "none",
  };
  const selectionHandle = isSelected ? (
    <button
      type="button"
      className="absolute -bottom-3 -right-3 z-30 flex h-7 w-7 touch-none items-center justify-center rounded-md border border-white/50 bg-black/90 text-white shadow-lg"
      aria-label="Resize selected element"
      title="Drag to resize"
      onPointerDown={(event) => beginInteraction("resize", event)}
    >
      <Maximize2 className="h-3.5 w-3.5" />
    </button>
  ) : null;
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    selectPath(path);
  };

  return as === "span" ? (
    <span
      ref={surfaceRef as React.RefObject<HTMLSpanElement>}
      className={surfaceClassName}
      style={surfaceStyle}
      data-editable-path={path}
      data-settings-path={settingsPath(path)}
      onPointerDown={(event) => beginInteraction("move", event)}
      onClick={handleClick}
    >
      {children}
      {selectionHandle}
    </span>
  ) : (
    <div
      ref={surfaceRef as React.RefObject<HTMLDivElement>}
      className={surfaceClassName}
      style={surfaceStyle}
      data-editable-path={path}
      data-settings-path={settingsPath(path)}
      onPointerDown={(event) => beginInteraction("move", event)}
      onClick={handleClick}
    >
      {children}
      {selectionHandle}
    </div>
  );
}