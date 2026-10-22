import { promises as fs } from "fs";
import path from "path";
import type {
  StudioProject,
  StudioClient,
  StudioTask,
  StudioNotification,
  PaginatedResult,
  ProjectStatus,
  StudioRole,
} from "./studio-types";

const STUDIO_DATA_DIR = path.join(process.cwd(), "data", "studio");

async function readJsonFile<T>(filename: string): Promise<T[]> {
  try {
    const filePath = path.join(STUDIO_DATA_DIR, filename);
    const content = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function writeJsonFile<T>(filename: string, items: T[]): Promise<void> {
  try {
    await fs.mkdir(STUDIO_DATA_DIR, { recursive: true });
    const filePath = path.join(STUDIO_DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.error(`Failed to write local studio file ${filename}:`, err);
  }
}

// ── Projects ─────────────────────────────────────────────────────────────────

export async function listLocalProjects(opts: {
  userId?: string;
  clientId?: string;
  status?: ProjectStatus;
  limit?: number;
  offset?: number;
} = {}): Promise<PaginatedResult<StudioProject>> {
  let list = await readJsonFile<StudioProject>("projects.json");

  if (opts.status) {
    list = list.filter((p) => p.status === opts.status);
  }
  if (opts.clientId) {
    list = list.filter((p) => p.clientId === opts.clientId);
  }

  // Sort by updatedAt desc
  list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const total = list.length;
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;
  const page = Math.floor(offset / limit) + 1;
  const items = list.slice(offset, offset + limit);

  return {
    items,
    total,
    page,
    pageSize: limit,
    hasMore: offset + items.length < total,
  };
}

export async function getLocalProjectById(id: string): Promise<StudioProject | null> {
  const list = await readJsonFile<StudioProject>("projects.json");
  return list.find((p) => p.id === id) ?? null;
}

export async function createLocalProject(input: {
  title: string;
  type: string;
  description?: string;
  status?: ProjectStatus;
  priority?: StudioProject["priority"];
  clientId: string;
  managerId?: string;
  deadline?: string;
  startDate?: string;
  requestId?: string;
  createdBy: string;
}): Promise<StudioProject> {
  const list = await readJsonFile<StudioProject>("projects.json");
  const now = new Date().toISOString();
  const project: StudioProject = {
    id: crypto.randomUUID(),
    requestId: input.requestId ?? null,
    title: input.title.trim(),
    type: input.type,
    description: input.description ?? null,
    status: input.status ?? "awaiting_assignment",
    priority: input.priority ?? "medium",
    clientId: input.clientId,
    managerId: input.managerId ?? null,
    deadline: input.deadline ?? null,
    startDate: input.startDate ?? null,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  list.unshift(project);
  await writeJsonFile("projects.json", list);
  return project;
}

export async function updateLocalProject(
  id: string,
  updates: Partial<StudioProject>
): Promise<StudioProject | null> {
  const list = await readJsonFile<StudioProject>("projects.json");
  const index = list.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updated: StudioProject = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  list[index] = updated;
  await writeJsonFile("projects.json", list);
  return updated;
}

// ── Clients ───────────────────────────────────────────────────────────────────

export async function listLocalClients(): Promise<StudioClient[]> {
  const list = await readJsonFile<StudioClient>("clients.json");
  return list.sort((a, b) => a.companyName.localeCompare(b.companyName));
}

export async function getLocalClientById(id: string): Promise<StudioClient | null> {
  const list = await readJsonFile<StudioClient>("clients.json");
  return list.find((c) => c.id === id) ?? null;
}

export async function createLocalClient(input: {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  notes?: string;
  userId?: string;
  createdBy: string;
}): Promise<StudioClient> {
  const list = await readJsonFile<StudioClient>("clients.json");
  const now = new Date().toISOString();
  const client: StudioClient = {
    id: crypto.randomUUID(),
    companyName: input.companyName.trim(),
    contactName: input.contactName.trim(),
    email: input.email.toLowerCase().trim(),
    phone: input.phone ?? null,
    notes: input.notes ?? null,
    userId: input.userId ?? null,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  list.push(client);
  await writeJsonFile("clients.json", list);
  return client;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function listLocalTasks(opts: {
  projectId?: string;
  assigneeId?: string;
  status?: string;
} = {}): Promise<StudioTask[]> {
  let list = await readJsonFile<StudioTask>("tasks.json");
  if (opts.projectId) list = list.filter((t) => t.projectId === opts.projectId);
  if (opts.assigneeId) list = list.filter((t) => t.assigneeId === opts.assigneeId);
  if (opts.status) list = list.filter((t) => t.status === opts.status);
  return list;
}

export async function createLocalTask(taskInput: Record<string, unknown>): Promise<StudioTask> {
  const list = await readJsonFile<StudioTask>("tasks.json");
  const now = new Date().toISOString();
  const task: StudioTask = {
    id: crypto.randomUUID(),
    projectId: String(taskInput.projectId || ""),
    title: String(taskInput.title || ""),
    description: (taskInput.description as string) || null,
    status: (taskInput.status as StudioTask["status"]) || "todo",
    priority: (taskInput.priority as StudioTask["priority"]) || "medium",
    assigneeId: (taskInput.assigneeId as string) || null,
    dueDate: (taskInput.dueDate as string) || null,
    completedAt: (taskInput.completedAt as string) || null,
    orderIndex: Number(taskInput.orderIndex ?? list.length),
    createdBy: String(taskInput.createdBy || ""),
    createdAt: now,
    updatedAt: now,
  };
  list.push(task);
  await writeJsonFile("tasks.json", list);
  return task;
}

// ── Notifications & Events ───────────────────────────────────────────────────

export async function createLocalNotification(input: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  actionUrl?: string;
}): Promise<StudioNotification> {
  const list = await readJsonFile<StudioNotification>("notifications.json");
  const notif: StudioNotification = {
    id: crypto.randomUUID(),
    userId: input.userId,
    title: input.title,
    body: input.message,
    message: input.message,
    type: (input.type as StudioNotification["type"]) ?? "system",
    link: input.actionUrl ?? null,
    actionUrl: input.actionUrl ?? null,
    read: false,
    createdAt: new Date().toISOString(),
  };
  list.unshift(notif);
  await writeJsonFile("notifications.json", list);
  return notif;
}

export async function recordLocalEvent(event: Record<string, unknown>): Promise<void> {
  const list = await readJsonFile<Record<string, unknown>>("events.json");
  list.unshift({
    id: crypto.randomUUID(),
    ...event,
    created_at: new Date().toISOString(),
  });
  await writeJsonFile("events.json", list);
}

// ── Metrics ──────────────────────────────────────────────────────────────────

export async function getLocalDashboardMetrics(_userId: string, _role: StudioRole) {
  const [projects, tasks] = await Promise.all([
    readJsonFile<StudioProject>("projects.json"),
    readJsonFile<StudioTask>("tasks.json"),
  ]);

  const byStatus: Record<string, number> = {};
  for (const p of projects) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
  }

  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done" && t.status !== "completed"
  );

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => !["completed", "archived"].includes(p.status)).length,
    overdueTaskCount: overdue.length,
    pendingReviews: 0,
    byStatus,
  };
}
