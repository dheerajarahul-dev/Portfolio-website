// Video Review Studio Page
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getStudioSession } from "@/lib/studio-auth";
import {
  getProjectById,
  listAssets,
  listVersions,
  createSignedDownloadUrl,
  listComments,
} from "@/lib/studio-db";
import VideoReviewClient from "@/components/studio/VideoReviewClient";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id).catch(() => null);
  return {
    title: project ? `${project.title} — Review Studio` : "Review Studio",
  };
}

export default async function ReviewDetailPage({ params }: Params) {
  const session = await getStudioSession();
  if (!session) redirect("/studio/login");

  const { id } = await params;
  const project = await getProjectById(id).catch(() => null);

  if (!project) {
    notFound();
  }

  // Load video assets uploaded for this project
  const assets = await listAssets({ projectId: id }).catch(() => []);
  const videoAssets = assets.filter(
    (a) => a.mimeType.startsWith("video/") || a.category === "wip_export" || a.category === "final_video"
  );

  // If assets exist, create signed URLs for preview playback
  const videoAssetsWithUrls = await Promise.all(
    videoAssets.map(async (v) => {
      try {
        const downloadUrl = await createSignedDownloadUrl(v.storagePath, 7200);
        return { ...v, downloadUrl };
      } catch {
        return v;
      }
    })
  );

  return (
    <VideoReviewClient
      session={session}
      project={project}
      videoAssets={videoAssetsWithUrls}
    />
  );
}
