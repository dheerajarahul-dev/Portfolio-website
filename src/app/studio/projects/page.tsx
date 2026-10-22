// Projects List Page

import type { Metadata } from "next";
import { getStudioSession } from "@/lib/studio-auth";
import { listProjects } from "@/lib/studio-db";
import { redirect } from "next/navigation";
import ProjectsListClient from "@/components/studio/ProjectsListClient";

export const metadata: Metadata = { title: "My Projects" };

export default async function ProjectsPage() {
  const session = await getStudioSession();
  if (!session) redirect("/studio/login");

  const isStaff = session.role === "super_admin" || session.role === "manager";

  const result = await listProjects({
    userId: isStaff ? undefined : session.userId,
    limit: 25,
  }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 25, hasMore: false }));

  return (
    <ProjectsListClient
      session={session}
      initialProjects={result.items}
      total={result.total}
      isStaff={isStaff}
    />
  );
}
