import HomePageClient from "@/components/HomePageClient";
import { readContent } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const content = await readContent();
  const params = await searchParams;
  const startInEditMode = params.edit === "1";

  return <HomePageClient initialContent={content} startInEditMode={startInEditMode} />;
}
