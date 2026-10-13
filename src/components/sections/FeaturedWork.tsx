"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { SiteContent } from "@/lib/types";
import EditableText from "../edit/EditableText";
import { useSiteContent } from "@/context/SiteContentContext";
import VideoPreviewCard from "@/components/ui/VideoPreviewCard";

function ProjectCard({
  item,
  wide,
  onOpen,
  editMode,
}: {
  item: SiteContent["featuredWork"]["items"][0];
  wide: boolean;
  onOpen: () => void;
  editMode: boolean;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay: 0.05 }}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl transition-colors hover:border-purple-400/35 sm:rounded-[1.75rem] ${wide ? "min-h-[250px] sm:min-h-[520px] lg:col-span-2 lg:row-span-2" : "min-h-[230px] sm:min-h-[320px]"}`}
    >
      <VideoPreviewCard
        item={item}
        onOpen={() => !editMode && onOpen()}
        className="h-full w-full"
        isFeatured={wide}
      />
    </motion.article>
  );
}

export default function FeaturedWork() {
  const router = useRouter();
  const { content, editMode } = useSiteContent();
  const section = content.featuredWork;

  return (
    <section id="work" className="section-3d-card bg-[#050505] px-3 pb-14 pt-6 sm:px-5 sm:pb-24 sm:pt-8 lg:px-6">
      <div className="mx-auto max-w-[100rem]">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 max-w-3xl px-1 text-white/80 sm:mb-14 sm:px-2"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.24em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">
            <EditableText path="featuredWork.eyebrow" value={section.eyebrow} as="span" />
          </p>
          <h2 className="text-2xl font-semibold leading-tight text-white min-[390px]:text-3xl sm:text-5xl">
            <EditableText path="featuredWork.title" value={section.title} as="span" />
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3 lg:grid-rows-2">
          {section.items.map((item, index) => (
            <ProjectCard
              key={item.id}
              item={item}
              wide={index === 0 && section.items.length > 1}
              onOpen={() =>
                router.push(
                  `/player?videoUrl=${encodeURIComponent(item.videoUrl)}&title=${encodeURIComponent(item.title)}`
                )
              }
              editMode={editMode}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
