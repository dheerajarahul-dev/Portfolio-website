"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ willChange: "transform" }}
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


  const displayItems = useMemo(() => {
    const featured = publishedVideos.filter((item) => item.featured);
    return (featured.length > 0 ? featured : publishedVideos).slice(0, 9);
  }, [publishedVideos]);

  const matrixLayout = displayItems.length >= 5;
  const gridLayout = matrixLayout
    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:[grid-auto-rows:minmax(0,1fr)]"
    : displayItems.length === 1
      ? "mx-auto max-w-2xl grid-cols-1"
      : displayItems.length <= 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  if (publishedVideos.length === 0 && !editMode) return null;

  return (
    <section id="work" className="scroll-mt-28 bg-[#050505] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-2xl sm:mb-12">
          <span className="mb-3 inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-purple-300">
            <EditableText path="featuredWork.eyebrow" value={section.eyebrow} as="span" />
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white min-[390px]:text-4xl sm:text-5xl leading-[1.15]">
            <EditableText path="featuredWork.title" value={section.title} as="span" />
          </h2>
        </div>

        {displayItems.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`grid gap-2.5 sm:gap-4 ${gridLayout}`}
            >
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
            </motion.div>
          </AnimatePresence>
        ) : (
          <p className="rounded-xl border border-dashed border-white/15 px-5 py-8 text-center text-sm text-white/55">
            Mark published videos as Home to show them here. The first selected video is main; up to eight more fill the small slots.
          </p>
        )}
      </div>
    </section>
  );
}
