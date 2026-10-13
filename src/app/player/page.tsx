import { readContent } from "@/lib/storage";
import PlayerPageClient from "@/components/player/PlayerPageClient";

export default async function PlayerPage({
  searchParams,
}: {
  searchParams: Promise<{ videoUrl?: string | string[]; title?: string | string[] }>;
}) {
  const content = await readContent();
  const params = await searchParams;
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
