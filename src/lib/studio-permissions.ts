// ─────────────────────────────────────────────────────────────────────────────
// Creative X Studio — Role-Based Access Control
// ─────────────────────────────────────────────────────────────────────────────

import type { StudioPermission, StudioRole } from "./studio-types";

// ── Permission Definitions ────────────────────────────────────────────────────

export const STUDIO_ROLE_PERMISSIONS: Record<StudioRole, readonly StudioPermission[]> = {
  super_admin: [
    "projects:create",
    "projects:read_all",
    "projects:update",
    "projects:delete",
    "projects:archive",
    "clients:manage",
    "team:manage",
    "media:upload",
    "media:delete",
    "media:read_all",
    "reviews:submit",
    "reviews:approve",
    "reviews:comment",
    "deliverables:download",
    "messages:send",
    "messages:read_internal",
    "tasks:manage",
    "invitations:send",
    "settings:manage",
    "reports:view",
    "audit:view",
  ],
  manager: [
    "projects:create",
    "projects:read_all",
    "projects:update",
    "projects:archive",
    "clients:manage",
    "media:upload",
    "media:delete",
    "media:read_all",
    "reviews:submit",
    "reviews:approve",
    "reviews:comment",
    "deliverables:download",
    "messages:send",
    "messages:read_internal",
    "tasks:manage",
    "invitations:send",
    "reports:view",
  ],
  editor: [
    "media:upload",
    "reviews:submit",
    "reviews:comment",
    "deliverables:download",
    "messages:send",
    "tasks:manage",
  ],
  client: [
    "media:upload",
    "reviews:approve",
    "reviews:comment",
    "deliverables:download",
    "messages:send",
  ],
  reviewer: [
    "reviews:comment",
    "reviews:approve",
  ],
};

export const ALL_STUDIO_PERMISSIONS: StudioPermission[] = [
  "projects:create",
  "projects:read_all",
  "projects:update",
  "projects:delete",
  "projects:archive",
  "clients:manage",
  "team:manage",
  "media:upload",
  "media:delete",
  "media:read_all",
  "reviews:submit",
  "reviews:approve",
  "reviews:comment",
  "deliverables:download",
  "messages:send",
  "messages:read_internal",
  "tasks:manage",
  "invitations:send",
  "settings:manage",
  "reports:view",
  "audit:view",
];

// ── Helper Functions ──────────────────────────────────────────────────────────

export function getRolePermissions(role: StudioRole): StudioPermission[] {
  return [...STUDIO_ROLE_PERMISSIONS[role]];
}

export function hasPermission(role: StudioRole, permission: StudioPermission): boolean {
  return (STUDIO_ROLE_PERMISSIONS[role] as readonly string[]).includes(permission);
}

export function hasAnyPermission(role: StudioRole, permissions: StudioPermission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: StudioRole, permissions: StudioPermission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

// ── Role Display Information ──────────────────────────────────────────────────

export const STUDIO_ROLE_LABELS: Record<StudioRole, string> = {
  super_admin: "Super Administrator",
  manager: "Project Manager",
  editor: "Video Editor",
  client: "Client",
  reviewer: "External Reviewer",
};

export const STUDIO_ROLE_DESCRIPTIONS: Record<StudioRole, string> = {
  super_admin: "Full platform access — can manage users, projects, storage, and settings.",
  manager: "Manages client projects, assigns editors, and monitors production progress.",
  editor: "Receives project assignments, uploads work, and responds to feedback.",
  client: "Submits projects, reviews videos, provides feedback, and approves deliverables.",
  reviewer: "Limited access to review and comment on specific videos.",
};

// ── Sidebar Navigation Configuration ─────────────────────────────────────────
// Each item specifies which roles can see it.

export type StudioNavItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
  roles: StudioRole[];
  badge?: "notifications" | "tasks";
};

export const STUDIO_NAV_ITEMS: StudioNavItem[] = [
  {
    id: "dashboard",
    label: "Overview",
    href: "/studio/dashboard",
    icon: "LayoutDashboard",
    roles: ["super_admin", "manager", "editor", "client", "reviewer"],
  },
  {
    id: "projects",
    label: "My Projects",
    href: "/studio/projects",
    icon: "FolderKanban",
    roles: ["super_admin", "manager", "editor", "client", "reviewer"],
  },
  {
    id: "all-projects",
    label: "All Projects",
    href: "/studio/projects/all",
    icon: "Layers",
    roles: ["super_admin", "manager"],
  },
  {
    id: "inbox",
    label: "Inbox",
    href: "/studio/inbox",
    icon: "MessageSquare",
    roles: ["super_admin", "manager", "editor", "client"],
    badge: "notifications",
  },
  {
    id: "review-queue",
    label: "Review Queue",
    href: "/studio/review",
    icon: "PlaySquare",
    roles: ["super_admin", "manager", "client", "reviewer"],
  },
  {
    id: "media",
    label: "Media & Files",
    href: "/studio/media",
    icon: "HardDrive",
    roles: ["super_admin", "manager", "editor"],
  },
  {
    id: "tasks",
    label: "Tasks",
    href: "/studio/tasks",
    icon: "CheckSquare",
    roles: ["super_admin", "manager", "editor"],
    badge: "tasks",
  },
  {
    id: "team",
    label: "Team",
    href: "/studio/team",
    icon: "Users",
    roles: ["super_admin", "manager"],
  },
  {
    id: "clients",
    label: "Clients",
    href: "/studio/clients",
    icon: "Building2",
    roles: ["super_admin", "manager"],
  },
  {
    id: "reports",
    label: "Reports",
    href: "/studio/reports",
    icon: "BarChart2",
    roles: ["super_admin", "manager"],
  },
  {
    id: "settings",
    label: "Settings",
    href: "/studio/settings",
    icon: "Settings",
    roles: ["super_admin"],
  },
];

// ── Project Status Configuration ──────────────────────────────────────────────

import type { ProjectStatus, TaskStatus, VersionStatus } from "./studio-types";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  request_received: "Request Received",
  awaiting_assignment: "Awaiting Assignment",
  assets_collecting: "Collecting Assets",
  ready_for_editing: "Ready for Editing",
  in_production: "In Production",
  internal_review: "Internal Review",
  client_review: "Client Review",
  revisions_requested: "Revisions Requested",
  final_approval: "Final Approval",
  delivery: "Delivery",
  completed: "Completed",
  archived: "Archived",
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  request_received: "text-zinc-400 bg-zinc-900 border-zinc-700",
  awaiting_assignment: "text-yellow-400 bg-yellow-950 border-yellow-800",
  assets_collecting: "text-blue-400 bg-blue-950 border-blue-800",
  ready_for_editing: "text-cyan-400 bg-cyan-950 border-cyan-800",
  in_production: "text-violet-400 bg-violet-950 border-violet-800",
  internal_review: "text-purple-400 bg-purple-950 border-purple-800",
  client_review: "text-orange-400 bg-orange-950 border-orange-800",
  revisions_requested: "text-red-400 bg-red-950 border-red-800",
  final_approval: "text-emerald-400 bg-emerald-950 border-emerald-800",
  delivery: "text-teal-400 bg-teal-950 border-teal-800",
  completed: "text-green-400 bg-green-950 border-green-800",
  archived: "text-zinc-500 bg-zinc-950 border-zinc-800",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  completed: "Completed",
  done: "Completed",
  cancelled: "Cancelled",
};

export const VERSION_STATUS_LABELS: Record<VersionStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In Review",
  changes_requested: "Changes Requested",
  resubmitted: "Resubmitted",
  approved: "Approved",
  superseded: "Superseded",
  archived: "Archived",
};

// Valid status transitions — prevents invalid moves
export const ALLOWED_PROJECT_TRANSITIONS: Partial<Record<ProjectStatus, ProjectStatus[]>> = {
  request_received: ["awaiting_assignment", "archived"],
  awaiting_assignment: ["assets_collecting", "in_production", "archived"],
  assets_collecting: ["ready_for_editing", "awaiting_assignment"],
  ready_for_editing: ["in_production"],
  in_production: ["internal_review", "client_review"],
  internal_review: ["in_production", "client_review"],
  client_review: ["revisions_requested", "final_approval"],
  revisions_requested: ["in_production", "client_review"],
  final_approval: ["delivery", "revisions_requested"],
  delivery: ["completed"],
  completed: ["archived"],
  archived: ["completed"], // restore path
};

export function isValidProjectTransition(from: ProjectStatus, to: ProjectStatus): boolean {
  const allowed = ALLOWED_PROJECT_TRANSITIONS[from] ?? [];
  return allowed.includes(to);
}
