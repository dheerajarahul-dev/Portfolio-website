// ─────────────────────────────────────────────────────────────────────────────
// Creative X Studio — Database Layer (Supabase REST)
// All queries go through the service-role key server-side.
// Row-level filters enforce per-user access — never trust client-supplied IDs
// without a corresponding ownership check in the query itself.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  StudioUser,
  StudioClient,
  StudioProject,
  StudioTask,
  StudioDeliverable,
  StudioAsset,
  StudioVersion,
  StudioComment,
  StudioCommentReply,
  StudioApproval,
  StudioMessage,
  StudioNotification,
  StudioEvent,
  StudioInvitation,
  StudioMilestone,
  StudioRole,
  StudioPermission,
  ProjectStatus,
  TaskStatus,
  AssetCategory,
  PaginatedResult,
  ApprovalDecision,
  StudioProjectMember,
} from "./studio-types";

// ── Supabase client ───────────────────────────────────────────────────────────

const DEFAULT_SUPABASE_URL = "https://ejhonioesosayoobeoui.supabase.co";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    (process.env.SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

function getSupabase() {
  const url = (process.env.SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL).replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return { url, key };
}

async function sbFetch<T>(
  path: string,
  init: RequestInit = {},
  fallback = "Database request failed"
): Promise<T> {
  const { url, key } = getSupabase();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`${fallback} [${response.status}]: ${detail.slice(0, 400)}`);
    throw new Error(fallback);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

// PostgREST returns arrays — unwrap single row
function first<T>(arr: T[]): T | null {
  return arr[0] ?? null;
}

// ── Studio Users ──────────────────────────────────────────────────────────────

export const DEFAULT_STUDIO_USER: StudioUser = {
  id: "d0000000-0000-0000-0000-000000000001",
  email: "dheeraj@gmail.com",
  displayName: "Dheeraj A",
  role: "super_admin",
  avatarUrl: null,
  active: true,
  invitedBy: null,
  lastLogin: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

interface DbStudioUser {
  id: string;
  email: string;
  display_name: string;
  role: StudioRole;
  avatar_url: string | null;
  active: boolean;
  invited_by: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

function mapUser(row: DbStudioUser): StudioUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    avatarUrl: row.avatar_url,
    active: row.active,
    invitedBy: row.invited_by,
    lastLogin: row.last_login,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getStudioUserById(id: string): Promise<StudioUser | null> {
  try {
    const rows = await sbFetch<DbStudioUser[]>(
      `/rest/v1/studio_users?id=eq.${encodeURIComponent(id)}&select=*`,
      {},
      "Failed to load studio user"
    );
    const row = first(rows);
    if (row) return mapUser(row);
  } catch {
    // Supabase might not be initialized yet
  }
  if (id === DEFAULT_STUDIO_USER.id) {
    return DEFAULT_STUDIO_USER;
  }
  return null;
}

export async function getStudioUserByEmail(email: string): Promise<StudioUser | null> {
  const normalized = email.toLowerCase().trim();
  try {
    const rows = await sbFetch<DbStudioUser[]>(
      `/rest/v1/studio_users?email=eq.${encodeURIComponent(normalized)}&select=*`,
      {},
      "Failed to load studio user"
    );
    const row = first(rows);
    if (row) return mapUser(row);
  } catch {
    // Supabase might not be initialized yet
  }
  if (normalized === DEFAULT_STUDIO_USER.email) {
    return DEFAULT_STUDIO_USER;
  }
  return null;
}

export async function listStudioUsers(opts: {
  active?: boolean;
  role?: StudioRole;
} = {}): Promise<StudioUser[]> {
  let list: StudioUser[] = [];
  try {
    const params = new URLSearchParams({ select: "*", order: "created_at.asc" });
    if (opts.active !== undefined) params.set("active", `eq.${opts.active}`);
    if (opts.role) params.set("role", `eq.${opts.role}`);
    const rows = await sbFetch<DbStudioUser[]>(`/rest/v1/studio_users?${params}`, {}, "Failed to list users");
    list = rows.map(mapUser);
  } catch {
    // Fallback if Supabase not seeded or unavailable
  }

  // Ensure default super admin is in the list
  if (!list.some((u) => u.email === DEFAULT_STUDIO_USER.email)) {
    if (
      (opts.active === undefined || opts.active === true) &&
      (!opts.role || opts.role === "super_admin")
    ) {
      list.unshift(DEFAULT_STUDIO_USER);
    }
  }

  return list;
}

export async function createStudioUser(input: {
  email: string;
  displayName: string;
  role: StudioRole;
  passwordHash: string;
  passwordSalt: string;
  invitedBy: string | null;
}): Promise<StudioUser> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const row = {
    id,
    email: input.email.toLowerCase().trim(),
    display_name: input.displayName.trim(),
    password_hash: input.passwordHash,
    password_salt: input.passwordSalt,
    role: input.role,
    avatar_url: null,
    active: true,
    invited_by: input.invitedBy,
    last_login: null,
    created_at: now,
    updated_at: now,
  };
  const rows = await sbFetch<DbStudioUser[]>(
    "/rest/v1/studio_users",
    { method: "POST", body: JSON.stringify(row) },
    "Failed to create studio user"
  );
  return mapUser(first(rows)!);
}

export async function updateStudioUser(
  id: string,
  updates: Partial<{
    displayName: string;
    role: StudioRole;
    avatarUrl: string | null;
    active: boolean;
    lastLogin: string;
    passwordHash: string;
    passwordSalt: string;
  }>
): Promise<StudioUser | null> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.displayName !== undefined) patch.display_name = updates.displayName;
  if (updates.role !== undefined) patch.role = updates.role;
  if (updates.avatarUrl !== undefined) patch.avatar_url = updates.avatarUrl;
  if (updates.active !== undefined) patch.active = updates.active;
  if (updates.lastLogin !== undefined) patch.last_login = updates.lastLogin;
  if (updates.passwordHash !== undefined) patch.password_hash = updates.passwordHash;
  if (updates.passwordSalt !== undefined) patch.password_salt = updates.passwordSalt;

  const rows = await sbFetch<DbStudioUser[]>(
    `/rest/v1/studio_users?id=eq.${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(patch), headers: { Prefer: "return=representation" } },
    "Failed to update studio user"
  );
  const row = first(rows);
  return row ? mapUser(row) : null;
}

export async function authenticateStudioUser(
  email: string,
  password: string
): Promise<StudioUser | null> {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Direct authentication check for default studio super admin
  if (normalizedEmail === "dheeraj@gmail.com" && password === "dheeraj1213") {
    // Sync to Supabase in background if Supabase is connected
    try {
      const { url, key } = getSupabase();
      fetch(`${url}/rest/v1/studio_users`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          id: DEFAULT_STUDIO_USER.id,
          email: DEFAULT_STUDIO_USER.email,
          display_name: DEFAULT_STUDIO_USER.displayName,
          password_hash: "c96b401815813a1cf984b2644f01935b0535fbfdb7037b0335380cf48931f241a3da63ad5b8a48ace89a4af1ddc3743690bfeca95f34f3e7793ea99ce3382979",
          password_salt: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
          role: "super_admin",
          active: true,
          last_login: new Date().toISOString(),
        }),
      }).catch(() => null);
    } catch {
      // Supabase is optional in local development
    }
    return DEFAULT_STUDIO_USER;
  }

  // 2. Otherwise verify against Supabase studio_users table
  try {
    const { scrypt, timingSafeEqual } = await import("crypto");
    const { promisify } = await import("util");
    const scryptAsync = promisify(scrypt);

    // Fetch the user including password fields (extra select)
    const { url, key } = getSupabase();
    const response = await fetch(
      `${url}/rest/v1/studio_users?email=eq.${encodeURIComponent(normalizedEmail)}&active=eq.true&select=*,password_hash,password_salt`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) return null;
    const rows = (await response.json()) as Array<DbStudioUser & { password_hash: string; password_salt: string }>;
    const record = first(rows);
    if (!record) return null;

    const candidate = (await scryptAsync(password, record.password_salt, 64)) as Buffer;
    const expected = Buffer.from(record.password_hash, "hex");
    if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) {
      return null;
    }

    // Update last_login
    await updateStudioUser(record.id, { lastLogin: new Date().toISOString() }).catch(() => null);
    return mapUser(record);
  } catch {
    return null;
  }
}

// ── Invitations ───────────────────────────────────────────────────────────────

interface DbInvitation {
  id: string;
  email: string;
  role: StudioRole;
  token_hash: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

function mapInvitation(row: DbInvitation): StudioInvitation {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    invitedBy: row.invited_by,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

export async function createInvitation(input: {
  email: string;
  role: StudioRole;
  tokenHash: string;
  invitedBy: string;
  expiresAt: string;
}): Promise<StudioInvitation> {
  const row = {
    id: crypto.randomUUID(),
    email: input.email.toLowerCase().trim(),
    role: input.role,
    token_hash: input.tokenHash,
    invited_by: input.invitedBy,
    expires_at: input.expiresAt,
    accepted_at: null,
    revoked_at: null,
    created_at: new Date().toISOString(),
  };
  const rows = await sbFetch<DbInvitation[]>(
    "/rest/v1/studio_invitations",
    { method: "POST", body: JSON.stringify(row) },
    "Failed to create invitation"
  );
  return mapInvitation(first(rows)!);
}

export async function getInvitationByTokenHash(hash: string): Promise<StudioInvitation | null> {
  const rows = await sbFetch<DbInvitation[]>(
    `/rest/v1/studio_invitations?token_hash=eq.${encodeURIComponent(hash)}&select=*`,
    {},
    "Failed to load invitation"
  );
  const row = first(rows);
  return row ? mapInvitation(row) : null;
}

export async function acceptInvitation(id: string): Promise<void> {
  await sbFetch(
    `/rest/v1/studio_invitations?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ accepted_at: new Date().toISOString() }),
      headers: { Prefer: "return=minimal" },
    },
    "Failed to accept invitation"
  );
}

export async function listInvitations(): Promise<StudioInvitation[]> {
  const rows = await sbFetch<DbInvitation[]>(
    "/rest/v1/studio_invitations?select=*&order=created_at.desc",
    {},
    "Failed to list invitations"
  );
  return rows.map(mapInvitation);
}

// ── Clients ───────────────────────────────────────────────────────────────────

interface DbClient {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  user_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function mapClient(row: DbClient): StudioClient {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    userId: row.user_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listClients(): Promise<StudioClient[]> {
  if (!isSupabaseConfigured()) {
    const { listLocalClients } = await import("./studio-local-store");
    return listLocalClients();
  }
  try {
    const rows = await sbFetch<DbClient[]>(
      "/rest/v1/studio_clients?select=*&order=company_name.asc",
      {},
      "Failed to list clients"
    );
    return rows.map(mapClient);
  } catch {
    const { listLocalClients } = await import("./studio-local-store");
    return listLocalClients();
  }
}

export async function getClientById(id: string): Promise<StudioClient | null> {
  if (!isSupabaseConfigured()) {
    const { getLocalClientById } = await import("./studio-local-store");
    return getLocalClientById(id);
  }
  try {
    const rows = await sbFetch<DbClient[]>(
      `/rest/v1/studio_clients?id=eq.${encodeURIComponent(id)}&select=*`,
      {},
      "Failed to load client"
    );
    const row = first(rows);
    return row ? mapClient(row) : null;
  } catch {
    const { getLocalClientById } = await import("./studio-local-store");
    return getLocalClientById(id);
  }
}

export async function createClient(input: {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  notes?: string;
  userId?: string;
  createdBy: string;
}): Promise<StudioClient> {
  if (!isSupabaseConfigured()) {
    const { createLocalClient } = await import("./studio-local-store");
    return createLocalClient(input);
  }
  try {
    const row = {
      id: crypto.randomUUID(),
      company_name: input.companyName.trim(),
      contact_name: input.contactName.trim(),
      email: input.email.toLowerCase().trim(),
      phone: input.phone ?? null,
      notes: input.notes ?? null,
      user_id: input.userId ?? null,
      created_by: input.createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const rows = await sbFetch<DbClient[]>(
      "/rest/v1/studio_clients",
      { method: "POST", body: JSON.stringify(row) },
      "Failed to create client"
    );
    return mapClient(first(rows)!);
  } catch {
    const { createLocalClient } = await import("./studio-local-store");
    return createLocalClient(input);
  }
}

// ── Projects ──────────────────────────────────────────────────────────────────

interface DbProject {
  id: string;
  request_id: string | null;
  title: string;
  type: string;
  description: string | null;
  status: ProjectStatus;
  priority: string;
  client_id: string;
  manager_id: string | null;
  deadline: string | null;
  start_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function mapProject(row: DbProject): StudioProject {
  return {
    id: row.id,
    requestId: row.request_id,
    title: row.title,
    type: row.type,
    description: row.description,
    status: row.status,
    priority: row.priority as StudioProject["priority"],
    clientId: row.client_id,
    managerId: row.manager_id,
    deadline: row.deadline,
    startDate: row.start_date,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjects(opts: {
  userId?: string;       // Filter to projects this user is a member of
  clientId?: string;
  status?: ProjectStatus;
  limit?: number;
  offset?: number;
} = {}): Promise<PaginatedResult<StudioProject>> {
  if (!isSupabaseConfigured()) {
    const { listLocalProjects } = await import("./studio-local-store");
    return listLocalProjects(opts);
  }
  try {
    const params = new URLSearchParams({
      select: "*",
      order: "updated_at.desc",
    });
    if (opts.status) params.set("status", `eq.${opts.status}`);
    if (opts.clientId) params.set("client_id", `eq.${opts.clientId}`);
    const limit = opts.limit ?? 20;
    const offset = opts.offset ?? 0;
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    let path = `/rest/v1/studio_projects?${params}`;

    // If userId is specified, filter by membership
    if (opts.userId) {
      const memberRows = await sbFetch<{ project_id: string }[]>(
        `/rest/v1/studio_project_members?user_id=eq.${encodeURIComponent(opts.userId)}&select=project_id`,
        {},
        "Failed to load memberships"
      );
      if (memberRows.length === 0) {
        return { items: [], total: 0, page: Math.floor(offset / limit) + 1, pageSize: limit, hasMore: false };
      }
      const ids = memberRows.map((r) => r.project_id).join(",");
      params.set("id", `in.(${ids})`);
      path = `/rest/v1/studio_projects?${params}`;
    }

    // Count request
    const countResponse = await fetch(
      `${getSupabase().url}${path.replace(/limit=\d+&offset=\d+/, "select=id")}`,
      {
        headers: {
          apikey: getSupabase().key,
          Authorization: `Bearer ${getSupabase().key}`,
          Prefer: "count=exact",
        },
      }
    );
    const total = parseInt(countResponse.headers.get("Content-Range")?.split("/")[1] ?? "0", 10);

    const rows = await sbFetch<DbProject[]>(path, {}, "Failed to list projects");
    return {
      items: rows.map(mapProject),
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + rows.length < total,
    };
  } catch {
    const { listLocalProjects } = await import("./studio-local-store");
    return listLocalProjects(opts);
  }
}

export async function getProjectById(id: string): Promise<StudioProject | null> {
  if (!isSupabaseConfigured()) {
    const { getLocalProjectById } = await import("./studio-local-store");
    return getLocalProjectById(id);
  }
  try {
    const rows = await sbFetch<DbProject[]>(
      `/rest/v1/studio_projects?id=eq.${encodeURIComponent(id)}&select=*`,
      {},
      "Failed to load project"
    );
    const row = first(rows);
    return row ? mapProject(row) : null;
  } catch {
    const { getLocalProjectById } = await import("./studio-local-store");
    return getLocalProjectById(id);
  }
}

export async function createProject(input: {
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
  if (!isSupabaseConfigured()) {
    const { createLocalProject } = await import("./studio-local-store");
    return createLocalProject(input);
  }
  try {
    const now = new Date().toISOString();
    const row: DbProject = {
      id: crypto.randomUUID(),
      request_id: input.requestId ?? null,
      title: input.title.trim(),
      type: input.type,
      description: input.description ?? null,
      status: input.status ?? "awaiting_assignment",
      priority: input.priority ?? "medium",
      client_id: input.clientId,
      manager_id: input.managerId ?? null,
      deadline: input.deadline ?? null,
      start_date: input.startDate ?? null,
      created_by: input.createdBy,
      created_at: now,
      updated_at: now,
    };
    const rows = await sbFetch<DbProject[]>(
      "/rest/v1/studio_projects",
      { method: "POST", body: JSON.stringify(row) },
      "Failed to create project"
    );
    return mapProject(first(rows)!);
  } catch {
    const { createLocalProject } = await import("./studio-local-store");
    return createLocalProject(input);
  }
}

export async function updateProject(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    status: ProjectStatus;
    priority: StudioProject["priority"];
    managerId: string | null;
    deadline: string | null;
    startDate: string | null;
  }>
): Promise<StudioProject | null> {
  if (!isSupabaseConfigured()) {
    const { updateLocalProject } = await import("./studio-local-store");
    return updateLocalProject(id, updates);
  }
  try {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.priority !== undefined) patch.priority = updates.priority;
    if ("managerId" in updates) patch.manager_id = updates.managerId;
    if ("deadline" in updates) patch.deadline = updates.deadline;
    if ("startDate" in updates) patch.start_date = updates.startDate;

    const rows = await sbFetch<DbProject[]>(
      `/rest/v1/studio_projects?id=eq.${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(patch), headers: { Prefer: "return=representation" } },
      "Failed to update project"
    );
    const row = first(rows);
    return row ? mapProject(row) : null;
  } catch {
    const { updateLocalProject } = await import("./studio-local-store");
    return updateLocalProject(id, updates);
  }
}

// ── Project Members ───────────────────────────────────────────────────────────

interface DbProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: "editor" | "reviewer" | "collaborator";
  added_by: string;
  created_at: string;
}

export async function addProjectMember(input: {
  projectId: string;
  userId: string;
  role: "editor" | "reviewer" | "collaborator";
  addedBy: string;
}): Promise<StudioProjectMember> {
  const member: StudioProjectMember = {
    id: crypto.randomUUID(),
    projectId: input.projectId,
    userId: input.userId,
    role: input.role,
    addedBy: input.addedBy,
    createdAt: new Date().toISOString(),
  };
  if (!isSupabaseConfigured()) {
    return member;
  }
  try {
    const row: DbProjectMember = {
      id: member.id,
      project_id: input.projectId,
      user_id: input.userId,
      role: input.role,
      added_by: input.addedBy,
      created_at: member.createdAt,
    };
    const rows = await sbFetch<DbProjectMember[]>(
      "/rest/v1/studio_project_members",
      { method: "POST", body: JSON.stringify(row) },
      "Failed to add project member"
    );
    const r = first(rows);
    return r
      ? { id: r.id, projectId: r.project_id, userId: r.user_id, role: r.role, addedBy: r.added_by, createdAt: r.created_at }
      : member;
  } catch {
    return member;
  }
}

export async function isProjectMember(projectId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }
  try {
    const rows = await sbFetch<{ id: string }[]>(
      `/rest/v1/studio_project_members?project_id=eq.${encodeURIComponent(projectId)}&user_id=eq.${encodeURIComponent(userId)}&select=id`,
      {},
      "Failed to check membership"
    );
    return rows.length > 0;
  } catch {
    return true;
  }
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

interface DbTask {
  id: string;
  project_id: string;
  assignee_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function mapTask(row: DbTask): StudioTask {
  return {
    id: row.id,
    projectId: row.project_id,
    assigneeId: row.assignee_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority as StudioTask["priority"],
    dueDate: row.due_date,
    completedAt: row.completed_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTasks(opts: {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
} = {}): Promise<StudioTask[]> {
  if (!isSupabaseConfigured()) {
    const { listLocalTasks } = await import("./studio-local-store");
    return listLocalTasks(opts);
  }
  try {
    const params = new URLSearchParams({ select: "*", order: "due_date.asc.nullslast,created_at.asc" });
    if (opts.projectId) params.set("project_id", `eq.${opts.projectId}`);
    if (opts.assigneeId) params.set("assignee_id", `eq.${opts.assigneeId}`);
    if (opts.status) params.set("status", `eq.${opts.status}`);
    const rows = await sbFetch<DbTask[]>(`/rest/v1/studio_tasks?${params}`, {}, "Failed to list tasks");
    return rows.map(mapTask);
  } catch {
    const { listLocalTasks } = await import("./studio-local-store");
    return listLocalTasks(opts);
  }
}

export async function createTask(input: {
  projectId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  priority?: StudioTask["priority"];
  dueDate?: string;
  createdBy: string;
}): Promise<StudioTask> {
  if (!isSupabaseConfigured()) {
    const { createLocalTask } = await import("./studio-local-store");
    return createLocalTask(input);
  }
  try {
    const now = new Date().toISOString();
    const row: DbTask = {
      id: crypto.randomUUID(),
      project_id: input.projectId,
      assignee_id: input.assigneeId ?? null,
      title: input.title.trim(),
      description: input.description ?? null,
      status: "todo",
      priority: input.priority ?? "medium",
      due_date: input.dueDate ?? null,
      completed_at: null,
      created_by: input.createdBy,
      created_at: now,
      updated_at: now,
    };
    const rows = await sbFetch<DbTask[]>(
      "/rest/v1/studio_tasks",
      { method: "POST", body: JSON.stringify(row) },
      "Failed to create task"
    );
    return mapTask(first(rows)!);
  } catch {
    const { createLocalTask } = await import("./studio-local-store");
    return createLocalTask(input);
  }
}

export async function updateTask(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: StudioTask["priority"];
    assigneeId: string | null;
    dueDate: string | null;
    completedAt: string | null;
  }>
): Promise<StudioTask | null> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.priority !== undefined) patch.priority = updates.priority;
  if ("assigneeId" in updates) patch.assignee_id = updates.assigneeId;
  if ("dueDate" in updates) patch.due_date = updates.dueDate;
  if ("completedAt" in updates) patch.completed_at = updates.completedAt;

  const rows = await sbFetch<DbTask[]>(
    `/rest/v1/studio_tasks?id=eq.${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(patch), headers: { Prefer: "return=representation" } },
    "Failed to update task"
  );
  const row = first(rows);
  return row ? mapTask(row) : null;
}

// ── Assets ────────────────────────────────────────────────────────────────────

interface DbAsset {
  id: string;
  project_id: string;
  deliverable_id: string | null;
  filename: string;
  original_filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  category: AssetCategory;
  uploaded_by: string;
  created_at: string;
}

function mapAsset(row: DbAsset): StudioAsset {
  return {
    id: row.id,
    projectId: row.project_id,
    deliverableId: row.deliverable_id,
    filename: row.filename,
    originalFilename: row.original_filename,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    category: row.category,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}

export async function listAssets(opts: {
  projectId?: string;
  deliverableId?: string;
  category?: AssetCategory;
} = {}): Promise<StudioAsset[]> {
  const params = new URLSearchParams({ select: "*", order: "created_at.desc" });
  if (opts.projectId) params.set("project_id", `eq.${opts.projectId}`);
  if (opts.deliverableId) params.set("deliverable_id", `eq.${opts.deliverableId}`);
  if (opts.category) params.set("category", `eq.${opts.category}`);
  const rows = await sbFetch<DbAsset[]>(`/rest/v1/studio_assets?${params}`, {}, "Failed to list assets");
  return rows.map(mapAsset);
}

export async function getAssetById(id: string): Promise<StudioAsset | null> {
  const rows = await sbFetch<DbAsset[]>(
    `/rest/v1/studio_assets?id=eq.${encodeURIComponent(id)}&select=*`,
    {},
    "Failed to load asset"
  );
  const row = first(rows);
  return row ? mapAsset(row) : null;
}

export async function createAssetRecord(input: {
  projectId: string;
  deliverableId?: string;
  filename: string;
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  category: AssetCategory;
  uploadedBy: string;
}): Promise<StudioAsset> {
  const row: DbAsset = {
    id: crypto.randomUUID(),
    project_id: input.projectId,
    deliverable_id: input.deliverableId ?? null,
    filename: input.filename,
    original_filename: input.originalFilename,
    storage_path: input.storagePath,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    category: input.category,
    uploaded_by: input.uploadedBy,
    created_at: new Date().toISOString(),
  };
  const rows = await sbFetch<DbAsset[]>(
    "/rest/v1/studio_assets",
    { method: "POST", body: JSON.stringify(row) },
    "Failed to create asset record"
  );
  return mapAsset(first(rows)!);
}

// ── Deliverables & Versions ───────────────────────────────────────────────────

interface DbDeliverable {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface DbVersion {
  id: string;
  deliverable_id: string;
  asset_id: string;
  version_number: number;
  notes: string | null;
  status: string;
  submitted_by: string;
  submitted_at: string;
  created_at: string;
}

export async function listVersions(deliverableId: string): Promise<StudioVersion[]> {
  const rows = await sbFetch<DbVersion[]>(
    `/rest/v1/studio_versions?deliverable_id=eq.${encodeURIComponent(deliverableId)}&select=*&order=version_number.asc`,
    {},
    "Failed to list versions"
  );
  return rows.map((r) => ({
    id: r.id,
    deliverableId: r.deliverable_id,
    assetId: r.asset_id,
    versionNumber: r.version_number,
    notes: r.notes,
    status: r.status as StudioVersion["status"],
    submittedBy: r.submitted_by,
    submittedAt: r.submitted_at,
    createdAt: r.created_at,
  }));
}

export async function getVersionById(id: string): Promise<StudioVersion | null> {
  const rows = await sbFetch<DbVersion[]>(
    `/rest/v1/studio_versions?id=eq.${encodeURIComponent(id)}&select=*`,
    {},
    "Failed to load version"
  );
  const r = first(rows);
  if (!r) return null;
  return {
    id: r.id,
    deliverableId: r.deliverable_id,
    assetId: r.asset_id,
    versionNumber: r.version_number,
    notes: r.notes,
    status: r.status as StudioVersion["status"],
    submittedBy: r.submitted_by,
    submittedAt: r.submitted_at,
    createdAt: r.created_at,
  };
}

export async function createVersion(input: {
  deliverableId: string;
  assetId: string;
  notes?: string;
  submittedBy: string;
}): Promise<StudioVersion> {
  // Get next version number
  const existing = await listVersions(input.deliverableId);
  const nextNumber = existing.length + 1;
  const now = new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    deliverable_id: input.deliverableId,
    asset_id: input.assetId,
    version_number: nextNumber,
    notes: input.notes ?? null,
    status: "submitted",
    submitted_by: input.submittedBy,
    submitted_at: now,
    created_at: now,
  };

  // Mark previous versions as superseded
  if (existing.length > 0) {
    const prev = existing[existing.length - 1];
    if (prev.status === "submitted" || prev.status === "in_review" || prev.status === "changes_requested") {
      await sbFetch(
        `/rest/v1/studio_versions?id=eq.${encodeURIComponent(prev.id)}`,
        { method: "PATCH", body: JSON.stringify({ status: "superseded" }), headers: { Prefer: "return=minimal" } },
        "Failed to supersede version"
      );
    }
  }

  const rows = await sbFetch<DbVersion[]>(
    "/rest/v1/studio_versions",
    { method: "POST", body: JSON.stringify(row) },
    "Failed to create version"
  );
  const r = first(rows)!;
  return {
    id: r.id,
    deliverableId: r.deliverable_id,
    assetId: r.asset_id,
    versionNumber: r.version_number,
    notes: r.notes,
    status: r.status as StudioVersion["status"],
    submittedBy: r.submitted_by,
    submittedAt: r.submitted_at,
    createdAt: r.created_at,
  };
}

export async function updateVersionStatus(id: string, status: StudioVersion["status"]): Promise<void> {
  await sbFetch(
    `/rest/v1/studio_versions?id=eq.${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ status }), headers: { Prefer: "return=minimal" } },
    "Failed to update version status"
  );
}

// ── Comments ──────────────────────────────────────────────────────────────────

interface DbComment {
  id: string;
  version_id: string;
  author_id: string;
  timestamp_sec: number | null;
  end_timestamp_sec: number | null;
  body: string;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapComment(row: DbComment): StudioComment {
  return {
    id: row.id,
    versionId: row.version_id,
    authorId: row.author_id,
    timestampSec: row.timestamp_sec,
    endTimestampSec: row.end_timestamp_sec,
    body: row.body,
    resolved: row.resolved,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listComments(versionId: string, includeResolved = true): Promise<StudioComment[]> {
  const params = new URLSearchParams({
    version_id: `eq.${versionId}`,
    select: "*",
    order: "timestamp_sec.asc.nullslast,created_at.asc",
  });
  if (!includeResolved) params.set("resolved", "eq.false");
  const rows = await sbFetch<DbComment[]>(`/rest/v1/studio_comments?${params}`, {}, "Failed to list comments");
  return rows.map(mapComment);
}

export async function createComment(input: {
  versionId: string;
  authorId: string;
  body: string;
  timestampSec?: number;
  endTimestampSec?: number;
}): Promise<StudioComment> {
  const now = new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    version_id: input.versionId,
    author_id: input.authorId,
    timestamp_sec: input.timestampSec ?? null,
    end_timestamp_sec: input.endTimestampSec ?? null,
    body: input.body.trim(),
    resolved: false,
    resolved_by: null,
    resolved_at: null,
    created_at: now,
    updated_at: now,
  };
  const rows = await sbFetch<DbComment[]>(
    "/rest/v1/studio_comments",
    { method: "POST", body: JSON.stringify(row) },
    "Failed to create comment"
  );
  return mapComment(first(rows)!);
}

export async function resolveComment(id: string, resolvedBy: string): Promise<void> {
  await sbFetch(
    `/rest/v1/studio_comments?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ resolved: true, resolved_by: resolvedBy, resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
      headers: { Prefer: "return=minimal" },
    },
    "Failed to resolve comment"
  );
}

export async function deleteComment(id: string): Promise<void> {
  await sbFetch(
    `/rest/v1/studio_comments?id=eq.${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    },
    "Failed to delete comment"
  );
}


// ── Approvals ─────────────────────────────────────────────────────────────────

interface DbApproval {
  id: string;
  version_id: string;
  project_id: string;
  approved_by: string;
  decision: ApprovalDecision;
  notes: string | null;
  created_at: string;
}

export async function createApproval(input: {
  versionId: string;
  projectId: string;
  approvedBy: string;
  decision: ApprovalDecision;
  notes?: string;
}): Promise<StudioApproval> {
  const row: DbApproval = {
    id: crypto.randomUUID(),
    version_id: input.versionId,
    project_id: input.projectId,
    approved_by: input.approvedBy,
    decision: input.decision,
    notes: input.notes ?? null,
    created_at: new Date().toISOString(),
  };
  const rows = await sbFetch<DbApproval[]>(
    "/rest/v1/studio_approvals",
    { method: "POST", body: JSON.stringify(row) },
    "Failed to create approval"
  );
  const r = first(rows)!;
  return { id: r.id, versionId: r.version_id, projectId: r.project_id, approvedBy: r.approved_by, decision: r.decision, notes: r.notes, createdAt: r.created_at };
}

// ── Messages ──────────────────────────────────────────────────────────────────

interface DbMessage {
  id: string;
  project_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

export async function listMessages(projectId: string, isInternal: boolean): Promise<StudioMessage[]> {
  const rows = await sbFetch<DbMessage[]>(
    `/rest/v1/studio_messages?project_id=eq.${encodeURIComponent(projectId)}&is_internal=eq.${isInternal}&select=*&order=created_at.asc`,
    {},
    "Failed to list messages"
  );
  return rows.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    authorId: r.author_id,
    body: r.body,
    isInternal: r.is_internal,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function createMessage(input: {
  projectId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
}): Promise<StudioMessage> {
  const now = new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    project_id: input.projectId,
    author_id: input.authorId,
    body: input.body.trim(),
    is_internal: input.isInternal,
    created_at: now,
    updated_at: now,
  };
  const rows = await sbFetch<DbMessage[]>(
    "/rest/v1/studio_messages",
    { method: "POST", body: JSON.stringify(row) },
    "Failed to create message"
  );
  const r = first(rows)!;
  return { id: r.id, projectId: r.project_id, authorId: r.author_id, body: r.body, isInternal: r.is_internal, createdAt: r.created_at, updatedAt: r.updated_at };
}

// ── Notifications ─────────────────────────────────────────────────────────────

interface DbNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export async function createNotification(input: {
  userId: string;
  type: StudioNotification["type"];
  title: string;
  body: string;
  link?: string;
}): Promise<void> {
  const row = {
    id: crypto.randomUUID(),
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link ?? null,
    read: false,
    created_at: new Date().toISOString(),
  };
  await sbFetch(
    "/rest/v1/studio_notifications",
    { method: "POST", body: JSON.stringify(row), headers: { Prefer: "return=minimal" } },
    "Failed to create notification"
  );
}

export async function listNotifications(userId: string, unreadOnly = false): Promise<StudioNotification[]> {
  const params = new URLSearchParams({ user_id: `eq.${userId}`, select: "*", order: "created_at.desc", limit: "50" });
  if (unreadOnly) params.set("read", "eq.false");
  const rows = await sbFetch<DbNotification[]>(`/rest/v1/studio_notifications?${params}`, {}, "Failed to list notifications");
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    type: r.type as StudioNotification["type"],
    title: r.title,
    body: r.body,
    link: r.link,
    read: r.read,
    createdAt: r.created_at,
  }));
}

export async function markNotificationsRead(userId: string, ids?: string[]): Promise<void> {
  let path = `/rest/v1/studio_notifications?user_id=eq.${encodeURIComponent(userId)}&read=eq.false`;
  if (ids && ids.length > 0) {
    path += `&id=in.(${ids.map(encodeURIComponent).join(",")})`;
  }
  await sbFetch(
    path,
    { method: "PATCH", body: JSON.stringify({ read: true }), headers: { Prefer: "return=minimal" } },
    "Failed to mark notifications read"
  );
}

// ── Events ────────────────────────────────────────────────────────────────────

export async function recordEvent(input: {
  projectId?: string;
  actorId: string;
  eventType: StudioEvent["eventType"];
  payload?: Record<string, unknown>;
}): Promise<void> {
  const row = {
    id: crypto.randomUUID(),
    project_id: input.projectId ?? null,
    actor_id: input.actorId,
    event_type: input.eventType,
    payload: input.payload ?? {},
    created_at: new Date().toISOString(),
  };
  await sbFetch(
    "/rest/v1/studio_events",
    { method: "POST", body: JSON.stringify(row), headers: { Prefer: "return=minimal" } },
    "Failed to record event"
  ).catch((err) => {
    // Events are non-critical — log but don't fail the request
    console.error("Event recording failed:", err);
  });
}

export async function listEvents(projectId: string, limit = 50): Promise<StudioEvent[]> {
  const rows = await sbFetch<Array<{
    id: string;
    project_id: string;
    actor_id: string;
    event_type: string;
    payload: Record<string, unknown>;
    created_at: string;
  }>>(
    `/rest/v1/studio_events?project_id=eq.${encodeURIComponent(projectId)}&select=*&order=created_at.desc&limit=${limit}`,
    {},
    "Failed to list events"
  );
  return rows.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    actorId: r.actor_id,
    eventType: r.event_type as StudioEvent["eventType"],
    payload: r.payload,
    createdAt: r.created_at,
  }));
}

// ── Signed Upload URL ─────────────────────────────────────────────────────────

const STUDIO_BUCKET = process.env.STUDIO_STORAGE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || "studio-media";

export async function createSignedUploadUrl(storagePath: string): Promise<{ signedUrl: string; token: string }> {
  const { url, key } = getSupabase();
  const response = await fetch(
    `${url}/storage/v1/object/upload/sign/${STUDIO_BUCKET}/${storagePath}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 3600 }),
    }
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Failed to create signed upload URL: ${detail.slice(0, 200)}`);
  }
  return response.json();
}

export async function createSignedDownloadUrl(storagePath: string, expiresIn = 3600): Promise<string> {
  const { url, key } = getSupabase();
  const response = await fetch(
    `${url}/storage/v1/object/sign/${STUDIO_BUCKET}/${storagePath}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn }),
    }
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Failed to create signed download URL: ${detail.slice(0, 200)}`);
  }
  const data = (await response.json()) as { signedURL: string };
  return `${url}${data.signedURL}`;
}

// ── Dashboard Metrics ─────────────────────────────────────────────────────────

export async function getDashboardMetrics(userId: string, role: StudioRole) {
  if (!isSupabaseConfigured()) {
    const { getLocalDashboardMetrics } = await import("./studio-local-store");
    return getLocalDashboardMetrics(userId, role);
  }
  const isStaff = role === "super_admin" || role === "manager";

  if (isStaff) {
    const [allProjects, overdueTasks, pendingReviews] = await Promise.all([
      sbFetch<{ status: string }[]>("/rest/v1/studio_projects?select=status&active=neq.archived", {}, "metrics").catch(() => [] as { status: string }[]),
      sbFetch<{ id: string }[]>(`/rest/v1/studio_tasks?status=in.(todo,in_progress)&due_date=lt.${new Date().toISOString()}&select=id`, {}, "metrics").catch(() => [] as { id: string }[]),
      sbFetch<{ id: string }[]>("/rest/v1/studio_versions?status=in.(submitted,in_review)&select=id", {}, "metrics").catch(() => [] as { id: string }[]),
    ]);

    const byStatus: Record<string, number> = {};
    for (const p of allProjects) {
      byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    }

    return {
      totalProjects: allProjects.length,
      activeProjects: allProjects.filter((p) => !["completed", "archived"].includes(p.status)).length,
      overdueTaskCount: overdueTasks.length,
      pendingReviews: pendingReviews.length,
      byStatus,
    };
  }

  // Editor / client — scoped to their projects
  const memberRows = await sbFetch<{ project_id: string }[]>(
    `/rest/v1/studio_project_members?user_id=eq.${encodeURIComponent(userId)}&select=project_id`,
    {},
    "metrics"
  ).catch(() => [] as { project_id: string }[]);

  const projectIds = memberRows.map((r) => r.project_id);
  if (projectIds.length === 0) return { totalProjects: 0, activeProjects: 0, overdueTaskCount: 0, pendingReviews: 0, byStatus: {} };

  const idFilter = `in.(${projectIds.join(",")})`;
  const [myProjects, myOverdue] = await Promise.all([
    sbFetch<{ status: string }[]>(`/rest/v1/studio_projects?id=${idFilter}&select=status`, {}, "metrics").catch(() => [] as { status: string }[]),
    sbFetch<{ id: string }[]>(`/rest/v1/studio_tasks?project_id=${idFilter}&assignee_id=eq.${userId}&status=in.(todo,in_progress)&due_date=lt.${new Date().toISOString()}&select=id`, {}, "metrics").catch(() => [] as { id: string }[]),
  ]);

  return {
    totalProjects: myProjects.length,
    activeProjects: myProjects.filter((p) => !["completed", "archived"].includes(p.status)).length,
    overdueTaskCount: myOverdue.length,
    pendingReviews: 0,
    byStatus: Object.fromEntries(Object.entries(myProjects.reduce((acc, p) => { acc[p.status] = (acc[p.status] ?? 0) + 1; return acc; }, {} as Record<string, number>))),
  };
}

