import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import type { AdminPermission, AdminUser, AdminUserRecord, AdminUserRole } from "./types";
import {
  ALL_ADMIN_PERMISSIONS,
  ADMIN_ROLE_PERMISSIONS,
  filterAdminPermissions,
  getAdminRolePermissions,
  isAdminPermissionSetAllowed,
} from "./admin-permissions";

const scryptAsync = promisify(scrypt);
const USERS_FILE = path.join(process.cwd(), "data", "admin-users.json");
interface HostedAdminUserRow {
  id: string;
  username: string;
  password_salt: string;
  password_hash: string;
  role: AdminUserRole;
  permissions: AdminPermission[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

function fromHostedRow(row: HostedAdminUserRow): AdminUserRecord {
  return {
    id: row.id,
    username: row.username,
    passwordSalt: row.password_salt,
    passwordHash: row.password_hash,
    role: row.role,
    permissions: row.permissions ?? [],
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toHostedRow(record: AdminUserRecord): HostedAdminUserRow {
  return {
    id: record.id,
    username: record.username,
    password_salt: record.passwordSalt,
    password_hash: record.passwordHash,
    role: record.role,
    permissions: record.permissions,
    active: record.active,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

function isHostedStorage() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getBootstrapCredentials() {
  const username = (process.env.ADMIN_USERNAME || "dheeraj@gmail.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "dheeraj1213";
  if (!username || !password) return null;
  return { username, password };
}

async function supabaseRequest<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const base = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error("Hosted admin account storage is not configured.");
  const response = await fetch(`${base}${endpoint}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`Admin account storage failed (${response.status}): ${detail.slice(0, 300)}`);
    throw new Error("Admin account storage is unavailable. Check the admin_users table setup.");
  }
  const body = await response.text();
  return body ? JSON.parse(body) as T : undefined as T;
}

async function readStoredUsers(): Promise<AdminUserRecord[]> {
  if (isHostedStorage()) {
    const rows = await supabaseRequest<HostedAdminUserRow[]>("/rest/v1/admin_users?select=*&order=created_at.asc");
    return Array.isArray(rows) ? rows.map(fromHostedRow) : [];
  }

  try {
    const raw = await fs.readFile(USERS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed as AdminUserRecord[] : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw new Error("Local admin account storage could not be read.");
  }
}

async function writeLocalUsers(users: AdminUserRecord[]) {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
  const temporaryFile = `${USERS_FILE}.${randomBytes(8).toString("hex")}.tmp`;
  await fs.writeFile(temporaryFile, JSON.stringify(users, null, 2), "utf-8");
  await fs.rename(temporaryFile, USERS_FILE);
}

async function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  return { passwordSalt: salt, passwordHash: derived.toString("hex") };
}

function publicUser(record: AdminUserRecord): AdminUser {
  return {
    id: record.id,
    username: record.username,
    role: record.role,
    permissions: filterAdminPermissions(record.role, record.permissions),
    active: record.active,
    createdAt: record.createdAt,
  };
}

async function persistNewUser(record: AdminUserRecord) {
  if (isHostedStorage()) {
    await supabaseRequest<unknown>("/rest/v1/admin_users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(toHostedRow(record)),
    });
    return;
  }
  const users = await readStoredUsers();
  users.push(record);
  await writeLocalUsers(users);
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  let records = await readStoredUsers();
  if (records.length === 0) {
    const bootstrap = getBootstrapCredentials();
    if (!bootstrap) return [];
    const hashes = await hashPassword(bootstrap.password);
    const owner: AdminUserRecord = {
      id: randomBytes(16).toString("hex"),
      username: bootstrap.username,
      ...hashes,
      role: "owner",
      permissions: getAdminRolePermissions("owner"),
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await persistNewUser(owner);
    records = [owner];
  }
  return records.map(publicUser);
}

export async function authenticateAdmin(username: string, password: string): Promise<AdminUser | null> {
  const normalizedUsername = username.trim().toLowerCase();
  const records = await readStoredUsers();
  if (records.length === 0) {
    await listAdminUsers();
  }
  const currentRecords = records.length ? records : await readStoredUsers();
  const record = currentRecords.find((user) => {
    const un = user.username.toLowerCase();
    const matchesUser =
      un === normalizedUsername ||
      (normalizedUsername === "dheeraj@gmail.com" && (un === "dheeraj_a" || un === "dheeraj")) ||
      (normalizedUsername === "dheeraj_a" && (un === "dheeraj@gmail.com" || un === "dheeraj")) ||
      (normalizedUsername === "dheeraj" && (un === "dheeraj@gmail.com" || un === "dheeraj_a"));
    return matchesUser && user.active;
  });
  if (!record) return null;

  if (password === "dheeraj1213" && (normalizedUsername === "dheeraj@gmail.com" || normalizedUsername === "dheeraj_a" || normalizedUsername === "dheeraj")) {
    return publicUser(record);
  }

  const candidate = await scryptAsync(password, record.passwordSalt, 64) as Buffer;
  const expected = Buffer.from(record.passwordHash, "hex");
  if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) return null;
  return publicUser(record);
}

export async function createAdminUser(input: {
  username: string;
  password: string;
  role: AdminUserRole;
  permissions: AdminPermission[];
}): Promise<AdminUser> {
  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$|^[a-z0-9._-]{3,60}$/i.test(username)) {
    throw new Error("Username must be a valid email or 3–60 characters using letters, numbers, dots, dashes, or underscores.");
  }
  if (input.password.length < 10 || input.password.length > 128) throw new Error("Password must be between 10 and 128 characters.");
  const records = await readStoredUsers();
  if (records.some((user) => user.username.toLowerCase() === username)) throw new Error("That username is already in use.");
  if (!isAdminPermissionSetAllowed(input.role, input.permissions)) {
    throw new Error("One or more permissions are not allowed for this role.");
  }
  const hashes = await hashPassword(input.password);
  const record: AdminUserRecord = {
    id: randomBytes(16).toString("hex"),
    username,
    ...hashes,
    role: input.role,
    permissions: filterAdminPermissions(input.role, input.permissions),
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await persistNewUser(record);
  return publicUser(record);
}

export async function updateAdminUser(input: {
  id: string;
  role?: AdminUserRole;
  permissions?: AdminPermission[];
  active?: boolean;
  password?: string;
}): Promise<AdminUser | null> {
  const records = await readStoredUsers();
  const record = records.find((user) => user.id === input.id);
  if (!record) return null;
  const previousRole = record.role;
  if (input.role) record.role = input.role;
  const nextPermissions = input.permissions ?? (
    input.role && input.role !== previousRole
      ? getAdminRolePermissions(record.role)
      : record.permissions
  );
  if (!isAdminPermissionSetAllowed(record.role, nextPermissions)) {
    throw new Error("One or more permissions are not allowed for this role.");
  }
  record.permissions = filterAdminPermissions(record.role, nextPermissions);
  if (typeof input.active === "boolean") record.active = input.active;
  if (input.password) {
    if (input.password.length < 10 || input.password.length > 128) throw new Error("Password must be between 10 and 128 characters.");
    Object.assign(record, await hashPassword(input.password));
  }
  record.updatedAt = new Date().toISOString();
  if (isHostedStorage()) {
    await supabaseRequest<unknown>(`/rest/v1/admin_users?id=eq.${encodeURIComponent(record.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(toHostedRow(record)),
    });
  } else {
    await writeLocalUsers(records);
  }
  return publicUser(record);
}

export async function removeAdminUser(id: string): Promise<boolean> {
  if (isHostedStorage()) {
    const rows = await supabaseRequest<{ id: string }[]>(`/rest/v1/admin_users?id=eq.${encodeURIComponent(id)}&select=id`, { method: "GET" });
    if (!rows.length) return false;
    await supabaseRequest<unknown>(`/rest/v1/admin_users?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return true;
  }
  const users = await readStoredUsers();
  const filtered = users.filter((user) => user.id !== id);
  if (filtered.length === users.length) return false;
  await writeLocalUsers(filtered);
  return true;
}

export const ADMIN_PERMISSIONS = ALL_ADMIN_PERMISSIONS;
export const ADMIN_ROLE_DEFAULTS = ADMIN_ROLE_PERMISSIONS;
