"use client";

import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { youtubeThumbnail } from "@/lib/media";
import AmbientMediaFrame from "../ui/AmbientMediaFrame";
import EditableText from "../edit/EditableText";
import { useSiteContent } from "@/context/SiteContentContext";

export default function Showcase() {
  const { content } = useSiteContent();
  const section = content.showcase;
  const embedSrc = youtubeEmbedUrl(section.youtubeVideoId, { controls: true });
  const poster = youtubeThumbnail(section.youtubeVideoId, "max");

  return (
    <section id="showcase" className="px-3 py-14 sm:px-5 sm:py-20 lg:px-6">
      <div className="mx-auto grid max-w-[100rem] gap-6 sm:gap-10 lg:grid-cols-[1.4fr_0.9fr]">
        <AmbientMediaFrame
          thumbnailUrl={poster}
          className="overflow-hidden rounded-2xl border border-white/10 sm:rounded-[2rem]"
        >
          <div className="relative aspect-video w-full">
            <iframe
              src={embedSrc}
              title="Showcase"
              allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
            />
          </div>
        </AmbientMediaFrame>

        <motion.div
          initial={false}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex flex-col justify-center px-1 sm:px-2"
        >
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-purple-300/20 bg-purple-500/10 px-3 py-2 text-xs text-purple-200 sm:px-4 sm:text-sm">
            <PlayCircle className="h-4 w-4" />
            <EditableText path="showcase.badge" value={section.badge} as="span" />
          </span>
          <h2 className="text-2xl font-semibold leading-tight text-white min-[390px]:text-3xl sm:text-5xl">
            <EditableText path="showcase.title" value={section.title} as="span" />
          </h2>
          <p className="mt-4 text-sm leading-6 text-white/70 sm:mt-6 sm:text-base sm:leading-8">
            <EditableText path="showcase.description" value={section.description} as="span" multiline />
          </p>
          <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-[#111]/80 p-5 sm:mt-10 sm:space-y-5 sm:rounded-[2rem] sm:p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">
                <EditableText path="showcase.breakdownTitle" value={section.breakdownTitle} as="span" />
              </p>
              <p className="mt-2 text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
                <EditableText path="showcase.breakdownText" value={section.breakdownText} as="span" multiline />
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">
                <EditableText path="showcase.pacingTitle" value={section.pacingTitle} as="span" />
              </p>
              <p className="mt-2 text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
                <EditableText path="showcase.pacingText" value={section.pacingText} as="span" multiline />
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
