import HomePageClient from "@/components/HomePageClient";
import { readContent } from "@/lib/storage";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    referenceTitle?: string | string[];
    referenceUrl?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const content = await readContent();
  const startInEditMode = params.edit === "1";
  const referenceTitle = Array.isArray(params.referenceTitle) ? params.referenceTitle[0] : params.referenceTitle;
  const referenceUrlValue = Array.isArray(params.referenceUrl) ? params.referenceUrl[0] : params.referenceUrl;
  const referenceUrl = referenceUrlValue?.trim() || "";
  const isSafeReferenceUrl = referenceUrl.startsWith("/")
    ? !referenceUrl.startsWith("//")
    : /^https:\/\//i.test(referenceUrl);
  const videoReference = isSafeReferenceUrl && referenceTitle
    ? { title: referenceTitle.slice(0, 200), url: referenceUrl.slice(0, 2000) }
    : null;

  return <HomePageClient initialContent={content} startInEditMode={startInEditMode} videoReference={videoReference} />;
}
