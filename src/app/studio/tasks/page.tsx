// Tasks Management Page
import type { Metadata } from "next";
import { getStudioSession } from "@/lib/studio-auth";
import { listTasks, listProjects } from "@/lib/studio-db";
import { redirect } from "next/navigation";
import TasksClient from "@/components/studio/TasksClient";

export const metadata: Metadata = { title: "Tasks" };

export default async function StudioTasksPage() {
  const session = await getStudioSession();
  if (!session) redirect("/studio/login");

  const isStaff = session.role === "super_admin" || session.role === "manager";

  const [tasks, projectsResult] = await Promise.all([
    listTasks({
      assigneeId: isStaff ? undefined : session.userId,
    }).catch(() => []),
    listProjects({
      userId: isStaff ? undefined : session.userId,
      limit: 100,
    }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 100, hasMore: false })),
  ]);

  return (
    <TasksClient
      session={session}
      initialTasks={tasks}
      projects={projectsResult.items}
      isStaff={isStaff}
    />
  );
}
