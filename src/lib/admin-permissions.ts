import type { AdminPermission, AdminUserRole } from "./types";

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  "overview:view",
  "media:manage",
  "site:edit",
  "messages:view",
  "messages:delete",
  "accounts:manage",
  "settings:view",
];

export const ADMIN_ROLE_PERMISSIONS: Record<AdminUserRole, readonly AdminPermission[]> = {
  owner: ALL_ADMIN_PERMISSIONS,
  editor: ["overview:view", "media:manage", "site:edit", "settings:view"],
  media: ["overview:view", "media:manage"],
  messages: ["overview:view", "messages:view"],
};

export function getAdminRolePermissions(role: AdminUserRole): AdminPermission[] {
  return [...ADMIN_ROLE_PERMISSIONS[role]];
}

export function isAdminPermissionSetAllowed(
  role: AdminUserRole,
  permissions: readonly AdminPermission[]
): boolean {
  const allowed = new Set(ADMIN_ROLE_PERMISSIONS[role]);
  return permissions.every((permission) => allowed.has(permission));
}

export function filterAdminPermissions(
  role: AdminUserRole,
  permissions: readonly AdminPermission[]
): AdminPermission[] {
  const allowed = new Set(ADMIN_ROLE_PERMISSIONS[role]);
  return [...new Set(permissions.filter((permission) => allowed.has(permission)))];
}