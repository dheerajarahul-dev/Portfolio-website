import HomePageClient from "@/components/HomePageClient";
import { readContent } from "@/lib/storage";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const content = await readContent();
  const startInEditMode = params.edit === "1";

  return <HomePageClient initialContent={content} startInEditMode={startInEditMode} />;
}
