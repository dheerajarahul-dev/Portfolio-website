"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { MediaLibraryItem } from "@/lib/types";
import EditableText from "../edit/EditableText";
import { useSiteContent } from "@/context/SiteContentContext";
import VideoPreviewCard from "@/components/ui/VideoPreviewCard";
import { saveScrollReturnTarget } from "@/lib/scroll-state";

function ProjectCard({
  item,
  onOpen,
  editMode,
  featured = false,
  className = "",
}: {
  item: MediaLibraryItem;
  onOpen: () => void;
  editMode: boolean;
  featured?: boolean;
  className?: string;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay: 0.05 }}
      className={`card-3d group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/80 shadow-2xl backdrop-blur-xl hover:border-white/25 sm:rounded-[1.5rem] ${className}`}
    >
      <VideoPreviewCard
        item={item}
        onOpen={() => !editMode && onOpen()}
        className="h-full w-full"
        isFeatured={featured}
      />
    </motion.article>
  );
}

export default function FeaturedWork() {
  const router = useRouter();
  const { content, editMode } = useSiteContent();
  const section = content.featuredWork;
  const publishedVideos = content.mediaLibrary.items.filter(
    (item) => item.published && item.type === "video" && item.mediaUrl.trim()
  );
    const displayItems = publishedVideos.filter(
      (item) => item.published && item.featured && item.type === "video" && item.mediaUrl.trim()
    ).slice(0, 9);
    const matrixLayout = displayItems.length >= 5;
    const gridLayout = matrixLayout
      ? "grid-cols-2 lg:grid-cols-4 lg:[grid-auto-rows:minmax(0,1fr)]"
      : displayItems.length === 1
        ? "mx-auto max-w-[42rem] grid-cols-1"
        : displayItems.length === 3
          ? "grid-cols-2 lg:grid-cols-3"
          : "grid-cols-2";

  if (displayItems.length === 0 && !editMode) return null;

  return (
    <section id="work" className="scroll-mt-28 bg-[#050505] px-3 py-10 sm:px-5 sm:py-20 lg:px-6">
      <div className="mx-auto max-w-[72rem]">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 max-w-3xl px-1 text-white/80 sm:mb-14 sm:px-2"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.24em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">
            <EditableText path="featuredWork.eyebrow" value={section.eyebrow} as="span" />
          </p>
          <h2 className="text-2xl font-semibold leading-tight text-white min-[390px]:text-3xl sm:text-5xl">
            <EditableText path="featuredWork.title" value={section.title} as="span" />
          </h2>
        </motion.div>

        {displayItems.length > 0 ? (
            <div className={`grid gap-2.5 sm:gap-4 ${gridLayout}`}>
            {displayItems.slice(0, 1).map((item) => (
              <ProjectCard
                key={item.id}
                item={item}
                  featured={matrixLayout}
                  className={matrixLayout ? "col-span-2 lg:row-span-2" : ""}
                onOpen={() => {
                  saveScrollReturnTarget(window.location.pathname + window.location.search, "work", window.scrollY);
                  router.push(
                    `/player?videoUrl=${encodeURIComponent(item.mediaUrl)}&title=${encodeURIComponent(item.title)}`
                  );
                }}
                editMode={editMode}
              />
            ))}
            {displayItems.slice(1, 9).map((item) => (
              <ProjectCard
                key={item.id}
                item={item}
                onOpen={() => {
                  saveScrollReturnTarget(window.location.pathname + window.location.search, "work", window.scrollY);
                  router.push(
                    `/player?videoUrl=${encodeURIComponent(item.mediaUrl)}&title=${encodeURIComponent(item.title)}`
                  );
                }}
                editMode={editMode}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-white/15 px-5 py-8 text-center text-sm text-white/55">
              Mark published videos as Home to show them here. The first selected video is main; up to eight more fill the small slots.
          </p>
        )}
      </div>
    </section>
  );
}
