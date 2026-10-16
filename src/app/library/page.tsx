import type { Metadata } from "next";
import { readContent } from "@/lib/storage";
import { getSiteUrl } from "@/lib/site-url";
import MediaLibraryPageClient from "@/components/MediaLibraryPageClient";

export const dynamic = "force-dynamic";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Video & Photo Library | CreativeXCreations",
  description: "Browse selected video edits and visual work from CreativeXCreations.",
  alternates: siteUrl ? { canonical: `${siteUrl}/library` } : undefined,
};

export default async function LibraryPage() {
  const content = await readContent();
  return <MediaLibraryPageClient content={content} />;
}
