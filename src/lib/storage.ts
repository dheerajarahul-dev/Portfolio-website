import { promises as fs } from "fs";
import path from "path";
import { defaultContent } from "./default-content";
import type { ContactMessage, SiteContent } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "site-content.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const MAX_BACKUPS_PER_FILE = 20;
const isServerlessRuntime = Boolean(
  process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
);
const DEFAULT_SUPABASE_URL = "https://ejhonioesosayoobeoui.supabase.co";
const hasHostedStorageConfig = Boolean(
  (process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY
);
const allowLocalJsonFallback = process.env.ALLOW_LOCAL_JSON_STORAGE === "true";
const supabaseUrl = (process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).trim().replace(/\/+$/, "");
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || "cxc-media";
const MAX_ASSET_BYTES = 100 * 1024 * 1024;
const ASSET_MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

let cachedContent: SiteContent | null = null;
let cachedContentAt = 0;
let cachedMessages: ContactMessage[] | null = null;
let contentWriteQueue = Promise.resolve();
let messageWriteQueue = Promise.resolve();

function getStorageMode() {
  if (hasHostedStorageConfig || process.env.CMS_STORAGE_PROVIDER === "supabase") return "hosted";
  if (!isServerlessRuntime || allowLocalJsonFallback) return "local";
  return "serverless-blocked";
}

function getSupabaseConfig(): { url: string; key: string } {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase CMS storage is selected but SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not both configured."
    );
  }
  try {
    const parsedUrl = new URL(supabaseUrl);
    if (!parsedUrl.hostname || !["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error();
    }
  } catch {
    throw new Error("SUPABASE_URL must be a valid absolute HTTP(S) project URL.");
  }
  return { url: supabaseUrl, key: supabaseKey };
}

function assertSafeWriteTarget(): void {
  const mode = getStorageMode();
  if (mode === "serverless-blocked") {
    throw new Error(
      "Serverless deployment detected without a hosted CMS store. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or set ALLOW_LOCAL_JSON_STORAGE=true only for local development."
    );
  }
}

export function clearContentCache() {
  cachedContent = null;
  cachedContentAt = 0;
}

export function clearMessagesCache() {
  cachedMessages = null;
}

async function supabaseFetch<T>(
  endpoint: string,
  init: RequestInit = {},
  fallbackMessage = "Supabase request failed"
): Promise<T> {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}${endpoint}`, {
    ...init,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`${fallbackMessage}: ${response.status} ${body.slice(0, 500)}`);
    throw new Error(fallbackMessage);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function ensureBackupDir() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
}

function mergeContent(parsed: Partial<SiteContent>): SiteContent {
  const contentWithoutLegacySection = { ...parsed } as Partial<SiteContent> & Record<string, unknown>;
  delete contentWithoutLegacySection.videoSection;

  const links = parsed.navbar?.links?.length
    ? parsed.navbar.links
    : defaultContent.navbar.links;
  const navOrder = ["/library", "#work", "#why-us", "#pricing", "#about"];
  const byHref = new Map(links.map((link) => [link.href, link]));
  const orderedLinks = [
    ...navOrder.map((href) => byHref.get(href)).filter(Boolean),
    ...links.filter((link) => !navOrder.includes(link.href)),
  ] as SiteContent["navbar"]["links"];

  const normalizedMediaItems = parsed.mediaLibrary?.items
    ? parsed.mediaLibrary.items
        .map((item) => ({
          ...item,
          id: String(item.id || crypto.randomUUID()),
          title: String(item.title || "Untitled media").trim(),
          description: String(item.description || ""),
          category: String(item.category || "General").trim() || "General",
          type: item.type === "photo" ? ("photo" as const) : ("video" as const),
          sourceType: String(item.sourceType || "youtube").trim() || "youtube",
          mediaUrl: String(item.mediaUrl || "").trim(),
          thumbnailUrl: String(item.thumbnailUrl || "").trim(),
          crop: item.crop
            ? {
                x: Number(item.crop.x ?? 50),
                y: Number(item.crop.y ?? 50),
                scale: Number(item.crop.scale ?? 1),
              }
            : undefined,
          published: Boolean(item.published ?? true),
          featured: Boolean(item.featured ?? false),
          altText: item.altText ? String(item.altText) : undefined,
          createdAt: item.createdAt ? String(item.createdAt) : new Date().toISOString(),
        }))
        .filter((item) => {
          const hasTitle = Boolean(item.title && item.title !== "Untitled media");
          const hasMedia = Boolean(item.mediaUrl || item.thumbnailUrl);
          return hasTitle || hasMedia || item.type === "photo";
        })
    : defaultContent.mediaLibrary.items;
  const projectTypes = parsed.contact?.form?.projectTypes?.length
    ? parsed.contact.form.projectTypes.filter((type) => typeof type === "string" && type.trim())
    : defaultContent.contact.form.projectTypes;

  const merged: SiteContent = {
    ...defaultContent,
    ...contentWithoutLegacySection,
    metadata: { ...defaultContent.metadata, ...parsed.metadata },
    navbar: {
      ...defaultContent.navbar,
      ...parsed.navbar,
      links: orderedLinks.length ? orderedLinks : defaultContent.navbar.links,
    },
    hero: { ...defaultContent.hero, ...parsed.hero },
    stats: { ...defaultContent.stats, ...parsed.stats },
    featuredWork: {
      eyebrow: parsed.featuredWork?.eyebrow ?? defaultContent.featuredWork.eyebrow,
      title: parsed.featuredWork?.title ?? defaultContent.featuredWork.title,
    },
    whyChooseUs: { ...defaultContent.whyChooseUs, ...parsed.whyChooseUs },
    showcase: { ...defaultContent.showcase, ...parsed.showcase },
    player: { ...defaultContent.player, ...parsed.player },
    founder: { ...defaultContent.founder, ...parsed.founder },
    pricing: { ...defaultContent.pricing, ...parsed.pricing },
    customSections: parsed.customSections ?? defaultContent.customSections,
    mediaLibrary: {
      ...defaultContent.mediaLibrary,
      ...parsed.mediaLibrary,
      items: normalizedMediaItems,
    },
    about: {
      ...defaultContent.about,
      ...parsed.about,
      toolLogos: parsed.about?.toolLogos?.length
        ? parsed.about.toolLogos
        : defaultContent.about.toolLogos,
    },
    contact: {
      ...defaultContent.contact,
      ...parsed.contact,
      form: {
        ...defaultContent.contact.form,
        ...parsed.contact?.form,
        projectTypes: [...new Set([
          ...projectTypes.filter((type) => type !== "Other"),
          ...defaultContent.contact.form.projectTypes.filter((type) => type !== "Other"),
          "Other",
        ])],
      },
    },
    editor: {
      ...defaultContent.editor,
      ...parsed.editor,
      elements: {
        ...(defaultContent.editor?.elements ?? {}),
        ...(parsed.editor?.elements ?? {}),
      },
    },
  };

  merged.navbar.logoUrl =
    parsed.navbar?.logoUrl || defaultContent.navbar.logoUrl;

  return merged;
}

async function backupJsonFile(filePath: string): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    return;
  }

  await ensureBackupDir();
  const baseName = path.basename(filePath, ".json");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(BACKUP_DIR, `${baseName}.${timestamp}.json`);
  await fs.copyFile(filePath, backupPath);
  await pruneBackups(baseName);
}

async function pruneBackups(baseName: string): Promise<void> {
  const entries = await fs.readdir(BACKUP_DIR);
  const backups = entries
    .filter((entry) => entry.startsWith(`${baseName}.`) && entry.endsWith(".json"))
    .sort()
    .reverse();

  await Promise.all(
    backups.slice(MAX_BACKUPS_PER_FILE).map((entry) =>
      fs.unlink(path.join(BACKUP_DIR, entry)).catch(() => undefined)
    )
  );
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  assertSafeWriteTarget();

  const tempPath = `${filePath}.${crypto.randomUUID()}.tmp`;
  const json = JSON.stringify(value, null, 2);
  JSON.parse(json);

  await backupJsonFile(filePath);
  await fs.writeFile(tempPath, json, "utf-8");
  await fs.rename(tempPath, filePath);
}

function isFileMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === "ENOENT";
}

export async function readContent(): Promise<SiteContent> {
  const storageMode = getStorageMode();
  if (cachedContent && storageMode === "hosted" && Date.now() - cachedContentAt < 3_000) {
    return cachedContent;
  }

  if (storageMode === "hosted") {
    const rows = await supabaseFetch<{ content: Partial<SiteContent> }[]>(
      "/rest/v1/site_content?id=eq.default&select=content&limit=1",
      { method: "GET", next: { revalidate: 15, tags: ["site-content"] } },
      "Failed to read hosted CMS content"
    );
    const content = mergeContent(rows[0]?.content ?? defaultContent);
    cachedContent = content;
    cachedContentAt = Date.now();
    return content;
  }

  try {
    const raw = await fs.readFile(CONTENT_FILE, "utf-8");
    const content = mergeContent(JSON.parse(raw) as Partial<SiteContent>);
    cachedContent = content;
    cachedContentAt = Date.now();
    return content;
  } catch (error) {
    if (!isFileMissing(error)) {
      // The file exists but is unreadable or corrupt. Never overwrite user
      // data in that case — serve defaults from memory and let an admin
      // save to repair the file.
      console.error(
        `Failed to read ${CONTENT_FILE}:`,
        error instanceof Error ? error.message : error
      );
      return defaultContent;
    }
    await ensureDataDir();
    await writeContent(defaultContent);
    cachedContent = defaultContent;
    cachedContentAt = Date.now();
    return defaultContent;
  }
}

export async function writeContent(content: Partial<SiteContent>): Promise<SiteContent> {
  return enqueueContentWrite(async () => {
    const nextContent = mergeContent(content);
    if (getStorageMode() === "hosted") {
      const rows = await supabaseFetch<{ content: Partial<SiteContent> }[]>(
        "/rest/v1/site_content?on_conflict=id&select=content",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=representation",
          },
          body: JSON.stringify({
            id: "default",
            content: nextContent,
            updated_at: new Date().toISOString(),
          }),
        },
        "Failed to save hosted CMS content"
      );
      cachedContent = mergeContent(rows[0]?.content ?? nextContent);
      cachedContentAt = Date.now();
      return cachedContent;
    }

    await ensureDataDir();
    await writeJsonFile(CONTENT_FILE, nextContent);
    cachedContent = nextContent;
    cachedContentAt = Date.now();
    return nextContent;
  });
}

export async function readMessages(): Promise<ContactMessage[]> {
  if (cachedMessages) return cachedMessages;

  if (getStorageMode() === "hosted") {
    const rows = await supabaseFetch<
      {
        id: string;
        name: string;
        email: string;
        subject: string | null;
        project_type: string;
        message: string;
        created_at: string;
        read: boolean;
        deleted_at: string | null;
      }[]
    >(
      "/rest/v1/contact_messages?select=*&order=created_at.desc",
      { method: "GET" },
      "Failed to read hosted contact messages"
    );
    const messages = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      subject: row.subject ?? undefined,
      projectType: row.project_type,
      message: row.message,
      createdAt: row.created_at,
      read: row.read,
      deletedAt: row.deleted_at,
    }));
    cachedMessages = messages;
    return messages;
  }

  try {
    const raw = await fs.readFile(MESSAGES_FILE, "utf-8");
    const parsed = JSON.parse(raw) as ContactMessage[];
    const messages = Array.isArray(parsed) ? parsed : [];
    cachedMessages = messages;
    return messages;
  } catch (error) {
    if (!isFileMissing(error)) {
      // Never clobber an unreadable messages file — return an empty list.
      console.error(
        `Failed to read ${MESSAGES_FILE}:`,
        error instanceof Error ? error.message : error
      );
      return [];
    }
    await ensureDataDir();
    await writeJsonFile(MESSAGES_FILE, []);
    cachedMessages = [];
    return [];
  }
}

export async function appendMessage(
  message: Omit<ContactMessage, "id" | "createdAt" | "read">
): Promise<ContactMessage> {
  return enqueueMessageWrite(async () => {
    if (getStorageMode() === "hosted") {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const rows = await supabaseFetch<
        {
          id: string;
          name: string;
          email: string;
          subject: string | null;
          project_type: string;
          message: string;
          created_at: string;
          read: boolean;
          deleted_at: string | null;
        }[]
      >(
        "/rest/v1/contact_messages?select=*",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            id,
            name: message.name,
            email: message.email,
            subject: message.subject ?? null,
            project_type: message.projectType,
            message: message.message,
            created_at: createdAt,
            read: false,
            deleted_at: null,
          }),
        },
        "Failed to save hosted contact message"
      );
      const row = rows[0];
      const entry: ContactMessage = {
        id: row.id,
        name: row.name,
        email: row.email,
        subject: row.subject ?? undefined,
        projectType: row.project_type,
        message: row.message,
        createdAt: row.created_at,
        read: row.read,
        deletedAt: row.deleted_at,
      };
      cachedMessages = [entry, ...(cachedMessages ?? [])];
      return entry;
    }

    const messages = await readMessages();
    const entry: ContactMessage = {
      ...message,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    const nextMessages = [entry, ...messages];
    await ensureDataDir();
    await writeJsonFile(MESSAGES_FILE, nextMessages);
    cachedMessages = nextMessages;
    return entry;
  });
}

export async function updateMessage(
  id: string,
  patch: Partial<Pick<ContactMessage, "read" | "deletedAt" | "repliedAt">>
): Promise<ContactMessage | null> {
  return enqueueMessageWrite(async () => {
    if (getStorageMode() === "hosted") {
      const rows = await supabaseFetch<
        {
          id: string;
          name: string;
          email: string;
          subject: string | null;
          project_type: string;
          message: string;
          created_at: string;
          read: boolean;
          deleted_at: string | null;
        }[]
      >(
        `/rest/v1/contact_messages?id=eq.${encodeURIComponent(id)}&select=*`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            ...(Object.hasOwn(patch, "read") ? { read: Boolean(patch.read) } : {}),
            ...(Object.hasOwn(patch, "deletedAt") ? { deleted_at: patch.deletedAt } : {}),
          }),
        },
        "Failed to update hosted contact message"
      );
      const row = rows[0];
      if (!row) return null;
      const updated: ContactMessage = {
        id: row.id,
        name: row.name,
        email: row.email,
        subject: row.subject ?? undefined,
        projectType: row.project_type,
        message: row.message,
        createdAt: row.created_at,
        read: row.read,
        deletedAt: row.deleted_at,
      };
      cachedMessages = null;
      return updated;
    }

    const messages = await readMessages();
    const index = messages.findIndex((m) => m.id === id);
    if (index === -1) return null;
    const nextMessages = [...messages];
    nextMessages[index] = { ...nextMessages[index], ...patch };
    await writeJsonFile(MESSAGES_FILE, nextMessages);
    cachedMessages = nextMessages;
    return nextMessages[index];
  });
}

export async function updateMessages(ids: string[], deletedAt: string | null): Promise<number> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return 0;

  return enqueueMessageWrite(async () => {
    if (getStorageMode() === "hosted") {
      const query = new URLSearchParams({
        id: `in.(${uniqueIds.join(",")})`,
        select: "id",
      });
      const rows = await supabaseFetch<{ id: string }[]>(
        `/rest/v1/contact_messages?${query}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ deleted_at: deletedAt }),
        },
        "Failed to update hosted contact messages"
      );
      cachedMessages = null;
      return rows.length;
    }

    const messages = await readMessages();
    const selectedIds = new Set(uniqueIds);
    let updatedCount = 0;
    const updatedMessages = messages.map((message) => {
      if (!selectedIds.has(message.id)) return message;
      updatedCount += 1;
      return { ...message, deletedAt };
    });
    if (updatedCount > 0) {
      await writeJsonFile(MESSAGES_FILE, updatedMessages);
      cachedMessages = updatedMessages;
    }
    return updatedCount;
  });
}

export async function deleteMessages(ids: string[]): Promise<number> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return 0;

  return enqueueMessageWrite(async () => {
    if (getStorageMode() === "hosted") {
      const query = new URLSearchParams({
        id: `in.(${uniqueIds.join(",")})`,
        deleted_at: "not.is.null",
        select: "id",
      });
      const rows = await supabaseFetch<{ id: string }[]>(
        `/rest/v1/contact_messages?${query}`,
        { method: "GET" },
        "Failed to locate trashed hosted messages"
      );
      if (rows.length === 0) return 0;

      const deleteQuery = new URLSearchParams({
        id: `in.(${uniqueIds.join(",")})`,
        deleted_at: "not.is.null",
      });
      await supabaseFetch<void>(
        `/rest/v1/contact_messages?${deleteQuery}`,
        { method: "DELETE" },
        "Failed to permanently delete trashed hosted messages"
      );
      cachedMessages = null;
      return rows.length;
    }

    const messages = await readMessages();
    const selectedIds = new Set(uniqueIds);
    let deletedCount = 0;
    const remainingMessages = messages.filter((message) => {
      const shouldDelete = selectedIds.has(message.id) && Boolean(message.deletedAt);
      if (shouldDelete) deletedCount += 1;
      return !shouldDelete;
    });
    if (deletedCount > 0) {
      await writeJsonFile(MESSAGES_FILE, remainingMessages);
      cachedMessages = remainingMessages;
    }
    return deletedCount;
  });
}

export async function uploadAsset(file: File): Promise<{ url: string; type: "image" | "video" }> {
  if (file.size > MAX_ASSET_BYTES) throw new Error("File must be 100MB or smaller.");
  if (getStorageMode() !== "hosted") {
    const ext = path.extname(file.name).toLowerCase();
    const filename = `${Date.now()}-${file.name
      .replace(ext, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80)}${ext}`;
    await fs.mkdir(path.join(process.cwd(), "public", "uploads"), { recursive: true });
    await fs.writeFile(
      path.join(process.cwd(), "public", "uploads", filename),
      Buffer.from(await file.arrayBuffer())
    );
    return {
      url: `/uploads/${filename}`,
      type: file.type.startsWith("video/") ? "video" : "image",
    };
  }

  const config = getSupabaseConfig();
  const ext = path.extname(file.name).toLowerCase() || (file.type.startsWith("video/") ? ".mp4" : ".jpg");
  const base = path.basename(file.name, ext).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const objectPath = `uploads/${Date.now()}-${crypto.randomUUID()}-${base}${ext}`;
  const response = await fetch(
    `${config.url}/storage/v1/object/${supabaseBucket}/${objectPath}`,
    {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "false",
      },
      body: Buffer.from(await file.arrayBuffer()),
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`Failed to upload hosted asset: ${response.status} ${body.slice(0, 500)}`);
    throw new Error("Upload failed in hosted storage");
  }

  return {
    url: `${config.url}/storage/v1/object/public/${supabaseBucket}/${objectPath}`,
    type: file.type.startsWith("video/") ? "video" : "image",
  };
}

export type ManagedAsset = {
  name: string;
  url: string;
  size: number;
  contentType: string;
  referenced: boolean;
};

function getManagedAssetObjectPath(value: string): string | null {
  let pathname: string;
  if (value.startsWith("/uploads/")) {
    pathname = value.split(/[?#]/, 1)[0];
  } else {
    if (!supabaseUrl) return null;
    try {
      const assetUrl = new URL(value);
      if (assetUrl.origin !== new URL(supabaseUrl).origin) return null;
      const prefix = `/storage/v1/object/public/${supabaseBucket}/`;
      if (!assetUrl.pathname.startsWith(prefix)) return null;
      pathname = `/${decodeURIComponent(assetUrl.pathname.slice(prefix.length))}`;
    } catch {
      return null;
    }
  }

  const objectPath = pathname.replace(/^\/+/, "");
  if (!objectPath.startsWith("uploads/")) return null;
  const fileName = objectPath.slice("uploads/".length);
  return /^[a-zA-Z0-9._-]+$/.test(fileName) ? objectPath : null;
}

function collectReferencedAssetPaths(value: unknown, paths: Set<string>): void {
  if (typeof value === "string") {
    const objectPath = getManagedAssetObjectPath(value);
    if (objectPath) paths.add(objectPath);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectReferencedAssetPaths(entry, paths);
    return;
  }
  if (typeof value === "object" && value !== null) {
    for (const entry of Object.values(value)) collectReferencedAssetPaths(entry, paths);
  }
}

export async function listManagedAssets(): Promise<ManagedAsset[]> {
  const referencedPaths = new Set<string>();
  collectReferencedAssetPaths(await readContent(), referencedPaths);

  if (getStorageMode() === "hosted") {
    const assets: ManagedAsset[] = [];
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const rows = await supabaseFetch<{
        name: string;
        metadata?: { size?: number; mimetype?: string } | null;
      }[]>(
        `/storage/v1/object/list/${encodeURIComponent(supabaseBucket)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prefix: "uploads",
            limit: pageSize,
            offset,
            sortBy: { column: "name", order: "asc" },
          }),
        },
        "Failed to list hosted uploads"
      );
      for (const row of rows) {
        const objectPath = getManagedAssetObjectPath(
          `${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/uploads/${row.name}`
        );
        if (!objectPath) continue;
        assets.push({
          name: row.name,
          url: `${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/${objectPath}`,
          size: Math.max(0, Number(row.metadata?.size) || 0),
          contentType: row.metadata?.mimetype || "application/octet-stream",
          referenced: referencedPaths.has(objectPath),
        });
      }
      if (rows.length < pageSize) break;
    }
    return assets.sort((a, b) => b.size - a.size);
  }

  if (getStorageMode() === "serverless-blocked") assertSafeWriteTarget();
  const uploadDirectory = path.join(process.cwd(), "public", "uploads");
  let entries: string[];
  try {
    entries = await fs.readdir(uploadDirectory);
  } catch (error) {
    if (isFileMissing(error)) return [];
    throw error;
  }

  const assets = await Promise.all(entries.map(async (name): Promise<ManagedAsset | null> => {
    const objectPath = getManagedAssetObjectPath(`/uploads/${name}`);
    if (!objectPath) return null;
    const filePath = path.join(uploadDirectory, name);
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) return null;
    return {
      name,
      url: `/uploads/${name}`,
      size: stats.size,
      contentType: ASSET_MIME_BY_EXTENSION[path.extname(name).toLowerCase()] || "application/octet-stream",
      referenced: referencedPaths.has(objectPath),
    };
  }));
  return assets.filter((asset): asset is ManagedAsset => asset !== null).sort((a, b) => b.size - a.size);
}

export async function deleteUnreferencedAsset(value: string): Promise<"deleted" | "referenced" | "not-found"> {
  const objectPath = getManagedAssetObjectPath(value);
  if (!objectPath) throw new Error("Only files from the managed uploads folder can be deleted.");

  const referencedPaths = new Set<string>();
  collectReferencedAssetPaths(await readContent(), referencedPaths);
  if (referencedPaths.has(objectPath)) return "referenced";

  if (getStorageMode() === "hosted") {
    await supabaseFetch<void>(
      `/storage/v1/object/${encodeURIComponent(supabaseBucket)}/${objectPath}`,
      { method: "DELETE" },
      "Failed to permanently delete hosted upload"
    );
    return "deleted";
  }
  if (getStorageMode() === "serverless-blocked") assertSafeWriteTarget();

  const filePath = path.join(process.cwd(), "public", "uploads", objectPath.slice("uploads/".length));
  try {
    await fs.unlink(filePath);
    return "deleted";
  } catch (error) {
    if (isFileMissing(error)) return "not-found";
    throw error;
  }
}

export async function createSignedAssetUpload(fileName: string, contentType: string) {
  const config = getSupabaseConfig();
  const ext = path.extname(fileName).toLowerCase() || (contentType.startsWith("video/") ? ".mp4" : ".jpg");
  const base = path.basename(fileName, ext).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const objectPath = `uploads/${Date.now()}-${crypto.randomUUID()}-${base}${ext}`;
  const response = await fetch(
    `${config.url}/storage/v1/object/upload/sign/${supabaseBucket}/${objectPath}`,
    {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ upsert: false }),
    }
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`Failed to create signed asset upload: ${response.status} ${detail.slice(0, 300)}`);
    throw new Error("Could not prepare the hosted upload.");
  }
  const result = await response.json() as { token?: string };
  if (!result.token) throw new Error("Hosted storage did not return an upload token.");
  return {
    uploadUrl: `${config.url}/storage/v1/object/upload/sign/${supabaseBucket}/${objectPath}?token=${encodeURIComponent(result.token)}`,
    url: `${config.url}/storage/v1/object/public/${supabaseBucket}/${objectPath}`,
    type: contentType.startsWith("video/") ? "video" as const : "image" as const,
  };
}

function enqueueMessageWrite<T>(operation: () => Promise<T>): Promise<T> {
  const next = messageWriteQueue.then(operation, operation);
  messageWriteQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function enqueueContentWrite<T>(operation: () => Promise<T>): Promise<T> {
  const next = contentWriteQueue.then(operation, operation);
  contentWriteQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}
