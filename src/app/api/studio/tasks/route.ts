// Studio Tasks API
// GET   /api/studio/tasks         → list tasks (by project, assignee, or status)
// POST  /api/studio/tasks         → create task
// PATCH /api/studio/tasks         → update task status/assignee/priority

import { NextRequest, NextResponse } from "next/server";
import { requireStudioSession, StudioAuthError } from "@/lib/studio-auth";
import { hasPermission } from "@/lib/studio-permissions";
import { listTasks, createTask, updateTask, recordEvent, createNotification, getStudioUserById } from "@/lib/studio-db";
import type { TaskStatus, TaskPriority } from "@/lib/studio-types";

export async function GET(request: NextRequest) {
  try {
    const session = await requireStudioSession();
    const { searchParams } = request.nextUrl;

    const projectId = searchParams.get("projectId") ?? undefined;
    const assigneeId = searchParams.get("assigneeId") ?? undefined;
    const status = (searchParams.get("status") as TaskStatus) ?? undefined;
    const filter = searchParams.get("filter");

    // Staff can view all or filtered; editor/client defaults to their own unless project specified
    const targetAssigneeId =
      assigneeId || (filter === "mine" ? session.userId : undefined);

    const tasks = await listTasks({
      projectId,
      assigneeId: targetAssigneeId,
      status,
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("GET /api/studio/tasks:", err);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStudioSession();
    if (!hasPermission(session.role, "tasks:manage")) {
      return NextResponse.json({ error: "Insufficient permissions to create tasks" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { projectId, assigneeId, title, description, status, priority, dueDate } = body as Record<string, unknown>;

    if (typeof projectId !== "string" || !projectId.trim()) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const task = await createTask({
      projectId,
      assigneeId: typeof assigneeId === "string" && assigneeId ? assigneeId : undefined,
      title: title.trim(),
      description: typeof description === "string" ? description : undefined,
      priority: (priority as TaskPriority) || "medium",
      dueDate: typeof dueDate === "string" && dueDate ? dueDate : undefined,
      createdBy: session.userId,
    });

    await recordEvent({
      projectId,
      actorId: session.userId,
      eventType: "task_created",
      payload: { taskId: task.id, title: task.title },
    }).catch(() => null);

    // Notify assignee if different from creator
    if (task.assigneeId && task.assigneeId !== session.userId) {
      await createNotification({
        userId: task.assigneeId,
        type: "assignment",
        title: "New task assigned",
        body: `You were assigned: "${task.title}"`,
        link: `/studio/tasks?projectId=${projectId}`,
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("POST /api/studio/tasks:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireStudioSession();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { id, title, description, status, priority, assigneeId, dueDate } = body as Record<string, unknown>;

    if (typeof id !== "string" || !id.trim()) {
      return NextResponse.json({ error: "Task id is required" }, { status: 400 });
    }

    const updates: Parameters<typeof updateTask>[1] = {};
    if (typeof title === "string") updates.title = title.trim();
    if (typeof description === "string") updates.description = description;
    if (typeof status === "string") {
      updates.status = status as TaskStatus;
      if (status === "completed") {
        updates.completedAt = new Date().toISOString();
      }
    }
    if (typeof priority === "string") updates.priority = priority as TaskPriority;
    if ("assigneeId" in (body as object)) {
      updates.assigneeId = typeof assigneeId === "string" && assigneeId ? assigneeId : null;
    }
    if ("dueDate" in (body as object)) {
      updates.dueDate = typeof dueDate === "string" && dueDate ? dueDate : null;
    }

    const updatedTask = await updateTask(id, updates);
    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (updates.status === "completed") {
      await recordEvent({
        projectId: updatedTask.projectId,
        actorId: session.userId,
        eventType: "task_completed",
        payload: { taskId: updatedTask.id, title: updatedTask.title },
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("PATCH /api/studio/tasks:", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
