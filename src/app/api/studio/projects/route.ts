// Studio Projects API
// GET  /api/studio/projects         → list projects (scoped by role)
// POST /api/studio/projects         → create project (manager/admin only)

import { NextRequest, NextResponse } from "next/server";
import { requireStudioSession, StudioAuthError } from "@/lib/studio-auth";
import { hasPermission } from "@/lib/studio-permissions";
import {
  listProjects,
  createProject,
  createClient,
  addProjectMember,
  recordEvent,
  createNotification,
  getStudioUserById,
} from "@/lib/studio-db";
import type { ProjectStatus } from "@/lib/studio-types";

export async function GET(request: NextRequest) {
  try {
    const session = await requireStudioSession();
    const { searchParams } = request.nextUrl;

    const status = searchParams.get("status") as ProjectStatus | null;
    const clientId = searchParams.get("clientId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));

    const isStaff = hasPermission(session.role, "projects:read_all");

    const result = await listProjects({
      userId: isStaff ? undefined : session.userId, // clients/editors only see their projects
      clientId: clientId ?? undefined,
      status: status ?? undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("GET /api/studio/projects:", err);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStudioSession();
    if (!hasPermission(session.role, "projects:create")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const {
      title,
      type,
      description,
      priority,
      clientId,
      managerId,
      deadline,
      startDate,
      requestId,
      // If clientId is not supplied, allow creating a client inline
      clientEmail,
      clientCompanyName,
      clientContactName,
    } = body as Record<string, unknown>;

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    }
    if (typeof type !== "string" || !type.trim()) {
      return NextResponse.json({ error: "Project type is required" }, { status: 400 });
    }

    let resolvedClientId = typeof clientId === "string" ? clientId : null;

    // If no clientId, create client inline (convenience for admins)
    if (!resolvedClientId) {
      if (
        typeof clientEmail !== "string" ||
        typeof clientCompanyName !== "string" ||
        typeof clientContactName !== "string"
      ) {
        return NextResponse.json(
          { error: "Either clientId or client details (email, company, contact) are required" },
          { status: 400 }
        );
      }
      const newClient = await createClient({
        companyName: clientCompanyName,
        contactName: clientContactName,
        email: clientEmail,
        createdBy: session.userId,
      });
      resolvedClientId = newClient.id;
    }

    const project = await createProject({
      title: (title as string).trim(),
      type: (type as string).trim(),
      description: typeof description === "string" ? description : undefined,
      priority: (priority as "low" | "medium" | "high" | "urgent") ?? "medium",
      clientId: resolvedClientId,
      managerId: typeof managerId === "string" ? managerId : session.userId,
      deadline: typeof deadline === "string" ? deadline : undefined,
      startDate: typeof startDate === "string" ? startDate : undefined,
      requestId: typeof requestId === "string" ? requestId : undefined,
      createdBy: session.userId,
    });

    // Auto-add creator as member
    await addProjectMember({
      projectId: project.id,
      userId: session.userId,
      role: "collaborator",
      addedBy: session.userId,
    }).catch(() => null);

    await recordEvent({
      projectId: project.id,
      actorId: session.userId,
      eventType: "project_created",
      payload: { title: project.title, type: project.type },
    });

    // Notify assigned manager if different from creator
    if (project.managerId && project.managerId !== session.userId) {
      const manager = await getStudioUserById(project.managerId).catch(() => null);
      if (manager) {
        await createNotification({
          userId: manager.id,
          type: "assignment",
          title: "Project assigned to you",
          body: `You have been assigned as manager of "${project.title}"`,
          link: `/studio/projects/${project.id}`,
        }).catch(() => null);
      }
    }

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("POST /api/studio/projects:", err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
