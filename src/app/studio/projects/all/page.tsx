// All Projects Page (Staff View)
import type { Metadata } from "next";
import { getStudioSession } from "@/lib/studio-auth";
import { listProjects } from "@/lib/studio-db";
import { redirect } from "next/navigation";
import ProjectsListClient from "@/components/studio/ProjectsListClient";

export const metadata: Metadata = { title: "All Projects" };

export default async function AllProjectsPage() {
  const session = await getStudioSession();
  if (!session) redirect("/studio/login");

  // Only super_admin and manager can access
  if (session.role !== "super_admin" && session.role !== "manager") {
    redirect("/studio/projects");
  }

  const result = await listProjects({
    limit: 50,
  }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 50, hasMore: false }));

  return (
    <ProjectsListClient
      session={session}
      initialProjects={result.items}
      total={result.total}
      isStaff={true}
    />
  );
}
