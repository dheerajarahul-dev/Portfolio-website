import { promises as fs } from "fs";
import path from "path";

export interface VideoCommentRecord {
  id: string;
  videoUrl: string;
  name: string;
  comment: string;
  createdAt: string;
}

export interface VideoCommentDto {
  id: string;
  videoUrl: string;
  name: string;
  author_name: string;
  comment: string;
  body: string;
  createdAt: string;
  created_at: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const COMMENTS_FILE = path.join(DATA_DIR, "video-comments.json");

let writeQueue = Promise.resolve();

function toDto(record: VideoCommentRecord): VideoCommentDto {
  return {
    id: record.id,
    videoUrl: record.videoUrl,
    name: record.name,
    author_name: record.name,
    comment: record.comment,
    body: record.comment,
    createdAt: record.createdAt,
    created_at: record.createdAt,
  };
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

async function ensureCommentsFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(COMMENTS_FILE);
  } catch {
    await fs.writeFile(COMMENTS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

async function readAllComments(): Promise<VideoCommentRecord[]> {
  try {
    await ensureCommentsFile();
    const raw = await fs.readFile(COMMENTS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      id: String(item.id || crypto.randomUUID()),
      videoUrl: String(item.videoUrl || item.video_url || ""),
      name: String(item.name || item.author_name || "Viewer"),
      comment: String(item.comment || item.body || ""),
      createdAt: String(item.createdAt || item.created_at || new Date().toISOString()),
    }));
  } catch (err) {
    console.error("Failed to read video-comments.json:", err);
    return [];
  }
}

export async function listVideoComments(videoUrl?: string): Promise<VideoCommentDto[]> {
  const records = await readAllComments();
  const normalizedTarget = videoUrl ? normalizeUrl(videoUrl) : null;

  const filtered = normalizedTarget
    ? records.filter((r) => normalizeUrl(r.videoUrl) === normalizedTarget)
    : records;

  // Newest first
  filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return filtered.map(toDto);
}

export async function createVideoComment(input: {
  videoUrl: string;
  name: string;
  comment: string;
}): Promise<VideoCommentDto> {
  return new Promise((resolve, reject) => {
    writeQueue = writeQueue.then(async () => {
      try {
        const records = await readAllComments();
        const newRecord: VideoCommentRecord = {
          id: crypto.randomUUID(),
          videoUrl: input.videoUrl.trim(),
          name: input.name.trim() || "Viewer",
          comment: input.comment.trim(),
          createdAt: new Date().toISOString(),
        };

        records.unshift(newRecord);
        await fs.writeFile(COMMENTS_FILE, JSON.stringify(records, null, 2), "utf-8");
        resolve(toDto(newRecord));
      } catch (err) {
        reject(err);
      }
    });
  });
}

export async function deleteVideoComment(id: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    writeQueue = writeQueue.then(async () => {
      try {
        const records = await readAllComments();
        const initialLength = records.length;
        const updated = records.filter((r) => r.id !== id);

        if (updated.length === initialLength) {
          resolve(false);
          return;
        }

        await fs.writeFile(COMMENTS_FILE, JSON.stringify(updated, null, 2), "utf-8");
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  });
}
