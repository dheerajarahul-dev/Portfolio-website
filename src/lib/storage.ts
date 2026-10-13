import { promises as fs } from "fs";
import path from "path";
import { defaultContent } from "./default-content";
import { normalizeWorkItem } from "./media";
import type { ContactMessage, SiteContent } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "site-content.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const MAX_BACKUPS_PER_FILE = 20;

let cachedContent: SiteContent | null = null;
let cachedMessages: ContactMessage[] | null = null;
let contentWriteQueue = Promise.resolve();
let messageWriteQueue = Promise.resolve();

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function ensureBackupDir() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
}

function mergeContent(parsed: Partial<SiteContent>): SiteContent {
  const merged = {
    ...defaultContent,
    ...parsed,
    metadata: { ...defaultContent.metadata, ...parsed.metadata },
    navbar: { ...defaultContent.navbar, ...parsed.navbar },
    hero: { ...defaultContent.hero, ...parsed.hero },
    stats: { ...defaultContent.stats, ...parsed.stats },
    featuredWork: { ...defaultContent.featuredWork, ...parsed.featuredWork },
    whyChooseUs: { ...defaultContent.whyChooseUs, ...parsed.whyChooseUs },
    showcase: { ...defaultContent.showcase, ...parsed.showcase },
    player: { ...defaultContent.player, ...parsed.player },
    pricing: { ...defaultContent.pricing, ...parsed.pricing },
    customSections: parsed.customSections ?? defaultContent.customSections,
    videoSection: {
      ...defaultContent.videoSection,
      ...parsed.videoSection,
      items: parsed.videoSection?.items
        ? parsed.videoSection.items.map((item) =>
            normalizeWorkItem(item as unknown as Record<string, unknown>)
          )
        : defaultContent.videoSection.items,
    },
    about: { ...defaultContent.about, ...parsed.about },
    contact: { ...defaultContent.contact, ...parsed.contact },
  };

  merged.navbar.logoUrl =
    parsed.navbar?.logoUrl || defaultContent.navbar.logoUrl;

  if (parsed.featuredWork?.items) {
    merged.featuredWork.items = parsed.featuredWork.items.map((item) =>
      normalizeWorkItem(item as unknown as Record<string, unknown>)
    );
  }

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
  const tempPath = `${filePath}.${crypto.randomUUID()}.tmp`;
  const json = JSON.stringify(value, null, 2);
  JSON.parse(json);

  await backupJsonFile(filePath);
  await fs.writeFile(tempPath, json, "utf-8");
  await fs.rename(tempPath, filePath);
}

export async function readContent(): Promise<SiteContent> {
  if (cachedContent) return cachedContent;

  try {
    const raw = await fs.readFile(CONTENT_FILE, "utf-8");
    const content = mergeContent(JSON.parse(raw) as Partial<SiteContent>);
    cachedContent = content;
    return content;
  } catch {
    await ensureDataDir();
    await writeContent(defaultContent);
    cachedContent = defaultContent;
    return defaultContent;
  }
}

export async function writeContent(content: Partial<SiteContent>): Promise<SiteContent> {
  return enqueueContentWrite(async () => {
    const nextContent = mergeContent(content);
    await ensureDataDir();
    await writeJsonFile(CONTENT_FILE, nextContent);
    cachedContent = nextContent;
    return nextContent;
  });
}

export async function readMessages(): Promise<ContactMessage[]> {
  if (cachedMessages) return cachedMessages;

  try {
    const raw = await fs.readFile(MESSAGES_FILE, "utf-8");
    const parsed = JSON.parse(raw) as ContactMessage[];
    const messages = Array.isArray(parsed) ? parsed : [];
    cachedMessages = messages;
    return messages;
  } catch {
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
  patch: Partial<Pick<ContactMessage, "read">>
): Promise<ContactMessage | null> {
  return enqueueMessageWrite(async () => {
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

export async function deleteMessage(id: string): Promise<boolean> {
  return enqueueMessageWrite(async () => {
    const messages = await readMessages();
    const filtered = messages.filter((m) => m.id !== id);
    if (filtered.length === messages.length) return false;
    await writeJsonFile(MESSAGES_FILE, filtered);
    cachedMessages = filtered;
    return true;
  });
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
