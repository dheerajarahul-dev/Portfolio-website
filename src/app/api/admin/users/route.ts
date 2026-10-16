import { NextRequest, NextResponse } from "next/server";
import { createAdminUser, listAdminUsers, removeAdminUser, updateAdminUser } from "@/lib/admin-users";
import { isAdminPermissionSetAllowed } from "@/lib/admin-permissions";
import { getCurrentAdminUser, hasAdminPermission } from "@/lib/auth";
import type { AdminPermission, AdminUserRole } from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRole(value: unknown): value is AdminUserRole {
  return value === "owner" || value === "editor" || value === "media" || value === "messages";
}

function isPermissionList(value: unknown): value is AdminPermission[] {
  return Array.isArray(value) && value.every((permission) =>
    ["overview:view", "media:manage", "site:edit", "messages:view", "messages:delete", "accounts:manage", "settings:view"].includes(permission)
  );
}

export async function GET() {
  if (!(await hasAdminPermission("accounts:manage"))) {
    return NextResponse.json({ error: "You do not have permission to manage accounts." }, { status: 403 });
  }
  try {
    return NextResponse.json(await listAdminUsers(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load accounts." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const current = await getCurrentAdminUser();
  if (!current?.permissions.includes("accounts:manage")) {
    return NextResponse.json({ error: "You do not have permission to manage accounts." }, { status: 403 });
  }
  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || typeof body.username !== "string" || typeof body.password !== "string" || !isRole(body.role) || !isPermissionList(body.permissions)) {
      return NextResponse.json({ error: "Username, password, role, and permissions are required." }, { status: 400 });
    }
    if (body.role === "owner" && current.role !== "owner") {
      return NextResponse.json({ error: "Only an owner can create another owner." }, { status: 403 });
    }
    if (!isAdminPermissionSetAllowed(body.role, body.permissions)) {
      return NextResponse.json({ error: "One or more permissions are not allowed for this role." }, { status: 400 });
    }
    if (current.role !== "owner" && body.permissions.some((permission) => !current.permissions.includes(permission))) {
      return NextResponse.json({ error: "You can only grant permissions that you currently have." }, { status: 403 });
    }
    const user = await createAdminUser({
      username: body.username,
      password: body.password,
      role: body.role,
      permissions: body.permissions,
    });
    return NextResponse.json({ user }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create account." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const current = await getCurrentAdminUser();
  if (!current?.permissions.includes("accounts:manage")) {
    return NextResponse.json({ error: "You do not have permission to manage accounts." }, { status: 403 });
  }
  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || typeof body.id !== "string") {
      return NextResponse.json({ error: "A valid account ID is required." }, { status: 400 });
    }
    const role = body.role === undefined ? undefined : isRole(body.role) ? body.role : null;
    const permissions = body.permissions === undefined ? undefined : isPermissionList(body.permissions) ? body.permissions : null;
    if (role === null || permissions === null || (body.active !== undefined && typeof body.active !== "boolean") || (body.password !== undefined && typeof body.password !== "string")) {
      return NextResponse.json({ error: "Invalid account update." }, { status: 400 });
    }
    const existingUsers = await listAdminUsers();
    const target = existingUsers.find((user) => user.id === body.id);
    if (!target) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    const targetRole = role ?? target.role;
    if (permissions && !isAdminPermissionSetAllowed(targetRole, permissions)) {
      return NextResponse.json({ error: "One or more permissions are not allowed for this role." }, { status: 400 });
    }
    if (target.role === "owner" && current.role !== "owner") {
      return NextResponse.json({ error: "Only an owner can change an owner account." }, { status: 403 });
    }
    if (current.role !== "owner" && permissions?.some((permission) => !current.permissions.includes(permission))) {
      return NextResponse.json({ error: "You can only grant permissions that you currently have." }, { status: 403 });
    }
    if (body.id === current.id && (body.active === false || (role && role !== "owner"))) {
      return NextResponse.json({ error: "You cannot disable or demote your own owner account." }, { status: 400 });
    }
    if ((role === "owner" || body.active === false) && current.role !== "owner") {
      return NextResponse.json({ error: "Only an owner can change owner access." }, { status: 403 });
    }
    const removesActiveOwner = target.role === "owner" && target.active && (role !== undefined && role !== "owner" || body.active === false);
    if (removesActiveOwner && existingUsers.filter((user) => user.role === "owner" && user.active).length <= 1) {
      return NextResponse.json({ error: "At least one active owner account must remain." }, { status: 400 });
    }
    const user = await updateAdminUser({
      id: body.id,
      role: role || undefined,
      permissions: permissions || undefined,
      active: typeof body.active === "boolean" ? body.active : undefined,
      password: typeof body.password === "string" ? body.password : undefined,
    });
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update account." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const current = await getCurrentAdminUser();
  if (!current?.permissions.includes("accounts:manage")) {
    return NextResponse.json({ error: "You do not have permission to manage accounts." }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "A valid account ID is required." }, { status: 400 });
  if (id === current.id) return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  try {
    const users = await listAdminUsers();
    const target = users.find((user) => user.id === id);
    if (!target) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    if (target.role === "owner" && current.role !== "owner") {
      return NextResponse.json({ error: "Only an owner can delete an owner account." }, { status: 403 });
    }
    if (target.role === "owner" && target.active && users.filter((user) => user.role === "owner" && user.active).length <= 1) {
      return NextResponse.json({ error: "At least one active owner account must remain." }, { status: 400 });
    }
    const removed = await removeAdminUser(id);
    return removed
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Account not found." }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete account." }, { status: 500 });
  }
}