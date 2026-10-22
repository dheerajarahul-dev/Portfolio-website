// Media Library Page
import type { Metadata } from "next";
import { getStudioSession } from "@/lib/studio-auth";
import { listAssets, listProjects } from "@/lib/studio-db";
import { redirect } from "next/navigation";
import MediaLibraryClient from "@/components/studio/MediaLibraryClient";

export const metadata: Metadata = { title: "Media & Assets" };

export default async function StudioMediaPage() {
  const session = await getStudioSession();
  if (!session) redirect("/studio/login");

  const isStaff = session.role === "super_admin" || session.role === "manager";

  const [assets, projectsResult] = await Promise.all([
    listAssets({}).catch(() => []),
    listProjects({
      userId: isStaff ? undefined : session.userId,
      limit: 100,
    }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 100, hasMore: false })),
  ]);

  return (
    <MediaLibraryClient
      session={session}
      initialAssets={assets}
      projects={projectsResult.items}
      isStaff={isStaff}
    />
  );
}
