import type { Metadata } from "next";
import { readContent } from "@/lib/storage";
import { getSiteUrl } from "@/lib/site-url";
import PlayerPageClient from "@/components/player/PlayerPageClient";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Video Player | CreativeXCreations",
  description: "Watch a selected CreativeXCreations video project.",
  alternates: siteUrl ? { canonical: `${siteUrl}/player` } : undefined,
  robots: { index: false, follow: true },
};

export default async function PlayerPage({
  searchParams,
}: {
  searchParams: Promise<{ videoUrl?: string | string[]; title?: string | string[] }>;
}) {
  const params = await searchParams;
  const content = await readContent();
  const videoUrl = Array.isArray(params.videoUrl)
    ? params.videoUrl[0]
    : params.videoUrl;
  const title = Array.isArray(params.title)
    ? params.title[0]
    : params.title;

  return (
    <PlayerPageClient
      content={content}
      videoUrl={videoUrl}
      title={title || content.player.title}
    />
  );
}
