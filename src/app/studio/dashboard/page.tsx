// Studio Dashboard — role-adaptive overview page

import type { Metadata } from "next";
import { getStudioSession } from "@/lib/studio-auth";
import { getDashboardMetrics, listProjects, listTasks } from "@/lib/studio-db";
import { redirect } from "next/navigation";
import StudioDashboardClient from "@/components/studio/StudioDashboardClient";

export const metadata: Metadata = { title: "Overview" };

export default async function StudioDashboardPage() {
  const session = await getStudioSession();
  if (!session) redirect("/studio/login");

  // Load metrics and recent data in parallel
  const [metrics, recentProjectsResult, overdueTasks] = await Promise.all([
    getDashboardMetrics(session.userId, session.role).catch(() => ({
      totalProjects: 0,
      activeProjects: 0,
      overdueTaskCount: 0,
      pendingReviews: 0,
      byStatus: {} as Record<string, number>,
    })),
    listProjects({
      userId: session.role === "super_admin" || session.role === "manager" ? undefined : session.userId,
      limit: 6,
    }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 6, hasMore: false })),
    listTasks({
      assigneeId: session.userId,
      status: "in_progress",
    }).catch(() => []),
  ]);

  return (
    <StudioDashboardClient
      session={session}
      metrics={metrics}
      recentProjects={recentProjectsResult.items}
      overdueTasks={overdueTasks}
    />
  );
}
