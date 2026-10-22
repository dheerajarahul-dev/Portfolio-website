// Studio Notifications API
// GET   /api/studio/notifications         → list user's notifications
// PATCH /api/studio/notifications         → mark as read

import { NextRequest, NextResponse } from "next/server";
import { requireStudioSession, StudioAuthError } from "@/lib/studio-auth";
import { listNotifications, markNotificationsRead } from "@/lib/studio-db";

export async function GET(request: NextRequest) {
  try {
    const session = await requireStudioSession();
    const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";

    const notifications = await listNotifications(session.userId, unreadOnly);
    const unreadCount = unreadOnly
      ? notifications.length
      : notifications.filter((n) => !n.read).length;

    return NextResponse.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
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

    const { ids, all } = body as Record<string, unknown>;

    if (all === true) {
      await markNotificationsRead(session.userId);
    } else if (Array.isArray(ids) && ids.length > 0) {
      await markNotificationsRead(session.userId, ids as string[]);
    } else {
      return NextResponse.json(
        { error: 'Provide "ids" array or "all": true' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 });
    }
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
