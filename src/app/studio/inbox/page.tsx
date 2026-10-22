// Studio Inbox Page
import type { Metadata } from "next";
import { getStudioSession } from "@/lib/studio-auth";
import { listNotifications } from "@/lib/studio-db";
import { redirect } from "next/navigation";
import InboxClient from "@/components/studio/InboxClient";

export const metadata: Metadata = { title: "Inbox & Notifications" };

export default async function StudioInboxPage() {
  const session = await getStudioSession();
  if (!session) redirect("/studio/login");

  const notifications = await listNotifications(session.userId).catch(() => []);

  return <InboxClient session={session} initialNotifications={notifications} />;
}
