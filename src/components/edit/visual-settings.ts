"use client";

import type { CSSProperties } from "react";
import type { VisualElementSettings } from "@/lib/types";

const LENGTH_RE = /^-?\d{1,4}(\.\d{1,2})?(px|rem|em|%|vh|vw)?$/;

export type EditableElementKind = "text" | "image" | "block" | "link";

export type EditableElementMeta = {
  path: string;
  kind: EditableElementKind;
  label: string;
  section: string;
  multiline?: boolean;
  sourcePath?: string;
};

function safeLength(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!LENGTH_RE.test(trimmed)) return undefined;
  return /[a-z%]+$/i.test(trimmed) ? trimmed : `${trimmed}px`;
}

function safeColor(value?: string) {
  if (!value) return undefined;
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim())
    ? value.trim()
    : undefined;
}

export function toEditableStyle(settings?: VisualElementSettings): CSSProperties {
  if (!settings) return {};

  const x = Math.max(-400, Math.min(400, Number(settings.x ?? 0)));
  const y = Math.max(-400, Math.min(400, Number(settings.y ?? 0)));
  const scale = Math.max(0.7, Math.min(1.8, Number(settings.scale ?? 1)));

  return {
    width: safeLength(settings.width),
    height: safeLength(settings.height),
    maxWidth: safeLength(settings.maxWidth) || (settings.width ? "100%" : undefined),
    padding: safeLength(settings.padding),
    margin: safeLength(settings.margin),
    textAlign: settings.textAlign,
    fontSize: safeLength(settings.fontSize),
    fontWeight: settings.fontWeight,
    lineHeight: safeLength(settings.lineHeight),
    letterSpacing: safeLength(settings.letterSpacing),
    color: safeColor(settings.color),
    backgroundColor: safeColor(settings.backgroundColor),
    borderRadius: safeLength(settings.borderRadius),
    opacity:
      typeof settings.opacity === "number"
        ? Math.min(1, Math.max(0.15, settings.opacity))
        : undefined,
    objectFit: settings.objectFit,
    transform: x || y || scale !== 1 ? `translate(${x}px, ${y}px) scale(${scale})` : undefined,
    transformOrigin: "center center",
  };
}

export function settingsPath(path: string) {
  return `editor.elements.${path.replace(/\./g, "__")}`;
}

export function settingsKey(path: string) {
  return path.replace(/\./g, "__");
}
