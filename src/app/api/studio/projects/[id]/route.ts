// Studio Project Detail API
// GET   /api/studio/projects/[id]  → project details (membership check)
// PATCH /api/studio/projects/[id]  → update project
// DELETE /api/studio/projects/[id] → archive/delete (admin only)

import { NextRequest, NextResponse } from "next/server";
import { requireStudioSession, StudioAuthError } from "@/lib/studio-auth";
import { hasPermission } from "@/lib/studio-permissions";
import {
  getProjectById,
  updateProject,
  isProjectMember,
  recordEvent,
  getClientById,
  getStudioUserById,
  listTasks,
  listAssets,
  listMessages,
  listEvents,
} from "@/lib/studio-db";
import { isValidProjectTransition } from "@/lib/studio-permissions";
import type { ProjectStatus } from "@/lib/studio-types";

type Params = { params: Promise<{ id: string }> };

async function authorizeProjectAccess(projectId: string, userId: string, role: string): Promise<boolean> {
  // Staff always see all projects
  if (role === "super_admin" || role === "manager") return true;
  // Others must be a member
  return isProjectMember(projectId, userId);
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await requireStudioSession();
    const { id } = await params;

    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const canAccess = await authorizeProjectAccess(id, session.userId, session.role);
    if (!canAccess) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Include related data
    const [client, manager, tasks, assets, events] = await Promise.all([
      getClientById(project.clientId).catch(() => null),
      project.managerId ? getStudioUserById(project.managerId).catch(() => null) : null,
      listTasks({ projectId: id }).catch(() => []),
      listAssets({ projectId: id }).catch(() => []),
      listEvents(id, 30).catch(() => []),
    ]);

    // Clients don't see internal messages
    const isInternal = session.role !== "client" && session.role !== "reviewer";
    const messages = await listMessages(id, false).catch(() => []);
    const internalMessages = isInternal ? await listMessages(id, true).catch(() => []) : [];

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        client,
        manager,
        tasks,
        assets,
        messages,
        internalMessages,
        events,
      },
    });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("GET /api/studio/projects/[id]:", err);
    return NextResponse.json({ error: "Failed to load project" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireStudioSession();
    const { id } = await params;

    if (!hasPermission(session.role, "projects:update")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const canAccess = await authorizeProjectAccess(id, session.userId, session.role);
    if (!canAccess) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const updates = body as Record<string, unknown>;

    // Validate status transition if status is changing
    if (updates.status && updates.status !== project.status) {
      if (!isValidProjectTransition(project.status, updates.status as ProjectStatus)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from "${project.status}" to "${updates.status}"`,
          },
          { status: 422 }
        );
      }
    }

    const updated = await updateProject(id, {
      title: typeof updates.title === "string" ? updates.title : undefined,
      description: typeof updates.description === "string" ? updates.description : undefined,
      status: typeof updates.status === "string" ? (updates.status as ProjectStatus) : undefined,
      priority: typeof updates.priority === "string" ? (updates.priority as "low" | "medium" | "high" | "urgent") : undefined,
      managerId: "managerId" in updates ? (updates.managerId as string | null) : undefined,
      deadline: "deadline" in updates ? (updates.deadline as string | null) : undefined,
      startDate: "startDate" in updates ? (updates.startDate as string | null) : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: "Project not found after update" }, { status: 404 });
    }

    // Record status change event
    if (updates.status && updates.status !== project.status) {
      await recordEvent({
        projectId: id,
        actorId: session.userId,
        eventType: "project_status_changed",
        payload: { from: project.status, to: updates.status, note: updates.note ?? null },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("PATCH /api/studio/projects/[id]:", err);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await requireStudioSession();
    const { id } = await params;

    if (!hasPermission(session.role, "projects:archive")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Archive rather than hard-delete
    await updateProject(id, { status: "archived" });

    await recordEvent({
      projectId: id,
      actorId: session.userId,
      eventType: "project_archived",
      payload: { title: project.title },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("DELETE /api/studio/projects/[id]:", err);
    return NextResponse.json({ error: "Failed to archive project" }, { status: 500 });
  }
}
