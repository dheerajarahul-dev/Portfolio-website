import type { SiteContent } from "./types";

function getAtPath(obj: unknown, parts: string[]): unknown {
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    const key = /^\d+$/.test(part) ? Number(part) : part;
    current = (current as Record<string | number, unknown>)[key];
  }
  return current;
}

function updateAtPath(obj: unknown, parts: string[], value: unknown): unknown {
  if (parts.length === 0) return value;
  if (obj === null || obj === undefined) return obj;

  const [part, ...rest] = parts;
  const key = /^\d+$/.test(part) ? Number(part) : part;

  if (Array.isArray(obj)) {
    const clone = [...obj];
    clone[key as number] = updateAtPath(clone[key as number], rest, value);
    return clone;
  }

  if (typeof obj === "object") {
    const clone = { ...(obj as Record<string | number, unknown>) };
    clone[key] = updateAtPath(clone[key], rest, value);
    return clone;
  }

  return obj;
}

function insertAtPath(obj: unknown, parts: string[], value: unknown, index?: number): unknown {
  if (parts.length === 0) return obj;
  const [part, ...rest] = parts;
  const key = /^\d+$/.test(part) ? Number(part) : part;

  if (rest.length === 0) {
    if (Array.isArray(obj)) {
      const clone = [...obj];
      if (index === undefined) clone.push(value);
      else clone.splice(index, 0, value);
      return clone;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    const clone = [...obj];
    clone[key as number] = insertAtPath(clone[key as number], rest, value, index);
    return clone;
  }

  if (typeof obj === "object" && obj !== null) {
    const clone = { ...(obj as Record<string | number, unknown>) };
    clone[key] = insertAtPath(clone[key], rest, value, index);
    return clone;
  }

  return obj;
}

function removeAtPath(obj: unknown, parts: string[]): unknown {
  if (parts.length === 0) return obj;
  const [part, ...rest] = parts;
  const key = /^\d+$/.test(part) ? Number(part) : part;

  if (rest.length === 0) {
    if (Array.isArray(obj)) {
      const clone = [...obj];
      clone.splice(key as number, 1);
      return clone;
    }
    if (typeof obj === "object" && obj !== null) {
      const clone = { ...(obj as Record<string | number, unknown>) };
      delete clone[key];
      return clone;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    const clone = [...obj];
    clone[key as number] = removeAtPath(clone[key as number], rest);
    return clone;
  }

  if (typeof obj === "object" && obj !== null) {
    const clone = { ...(obj as Record<string | number, unknown>) };
    clone[key] = removeAtPath(clone[key], rest);
    return clone;
  }

  return obj;
}

export function updateContentPath(
  content: SiteContent,
  path: string,
  value: unknown
): SiteContent {
  return updateAtPath(content, path.split("."), value) as SiteContent;
}

export function insertContentAtPath(
  content: SiteContent,
  path: string,
  value: unknown,
  index?: number
): SiteContent {
  return insertAtPath(content, path.split("."), value, index) as SiteContent;
}

export function removeContentAtPath(content: SiteContent, path: string): SiteContent {
  return removeAtPath(content, path.split(".")) as SiteContent;
}

export function getContentPath(content: SiteContent, path: string): string {
  const result = getAtPath(content, path.split("."));
  return typeof result === "string" ? result : "";
}
