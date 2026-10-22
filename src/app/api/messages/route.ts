import { NextRequest, NextResponse } from "next/server";
import { hasAdminPermission } from "@/lib/auth";
import { deleteMessages, readMessages, updateMessage, updateMessages } from "@/lib/storage";

export async function GET() {
  if (!(await hasAdminPermission("messages:view"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const messages = await readMessages();
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Failed to read messages:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not load messages." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await hasAdminPermission("messages:view"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { id, ids, read, deleted, repliedAt } = body as Record<string, unknown>;
    if (ids !== undefined) {
      if (
        !Array.isArray(ids) ||
        ids.length === 0 ||
        ids.length > 200 ||
        ids.some((value) => typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) ||
        typeof deleted !== "boolean"
      ) {
        return NextResponse.json({ error: "Select up to 200 valid messages to update." }, { status: 400 });
      }
      if (!(await hasAdminPermission("messages:delete"))) {
        return NextResponse.json({ error: "You do not have permission to manage the recycle bin." }, { status: 403 });
      }

      const updated = await updateMessages(ids as string[], deleted ? new Date().toISOString() : null);
      if (updated === 0) return NextResponse.json({ error: "No selected messages were found." }, { status: 404 });
      return NextResponse.json({ success: true, updated });
    }

    if (
      typeof id !== "string" ||
      !id.trim() ||
      (typeof read !== "boolean" && typeof deleted !== "boolean" && typeof repliedAt !== "string" && repliedAt !== null)
    ) {
      return NextResponse.json({ error: "A valid id and message update are required." }, { status: 400 });
    }
    if (typeof deleted === "boolean" && !(await hasAdminPermission("messages:delete"))) {
      return NextResponse.json({ error: "You do not have permission to manage the recycle bin." }, { status: 403 });
    }

    const updated = await updateMessage(id, {
      ...(typeof read === "boolean" ? { read } : {}),
      ...(typeof deleted === "boolean" ? { deletedAt: deleted ? new Date().toISOString() : null } : {}),
      ...(typeof repliedAt === "string" || repliedAt === null ? { repliedAt } : {}),
    });
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update message:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not update message." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const [canViewMessages, canManageRecycleBin] = await Promise.all([
    hasAdminPermission("messages:view"),
    hasAdminPermission("messages:delete"),
  ]);
  if (!canViewMessages || !canManageRecycleBin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("permanent") === "true") {
    const rawIds = searchParams.get("ids");
    const singleId = searchParams.get("id");
    const ids = rawIds ? rawIds.split(",") : singleId ? [singleId] : [];
    if (
      ids.length === 0 ||
      ids.length > 200 ||
      ids.some((value) => !/^[a-zA-Z0-9_-]{1,128}$/.test(value))
    ) {
      return NextResponse.json({ error: "Select up to 200 valid trashed messages to permanently delete." }, { status: 400 });
    }

    try {
      const deleted = await deleteMessages(ids);
      if (deleted === 0) {
        return NextResponse.json({ error: "No selected trashed messages were found." }, { status: 404 });
      }
      return NextResponse.json({ success: true, deleted });
    } catch (error) {
      console.error("Failed to permanently delete messages:", error instanceof Error ? error.message : error);
      return NextResponse.json({ error: "Could not permanently delete selected messages." }, { status: 500 });
    }
  }

  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const movedToTrash = await updateMessage(id, { deletedAt: new Date().toISOString() });
    if (!movedToTrash) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, deletedAt: movedToTrash.deletedAt });
  } catch (error) {
    console.error("Failed to delete message:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not delete message." }, { status: 500 });
  }
}
