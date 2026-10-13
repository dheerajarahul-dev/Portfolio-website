"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSiteContent } from "@/context/SiteContentContext";
import VideoPreviewCard from "@/components/ui/VideoPreviewCard";

export default function VideoGallery() {
  const router = useRouter();
  const { content } = useSiteContent();
  const section = content.videoSection;

  if (!section.items.length) {
    return null;
  }

  return (
    <section id="videos" className="section-3d-card px-3 py-14 sm:px-5 sm:py-20 lg:px-6">
      <div className="mx-auto max-w-[100rem]">
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-xs uppercase tracking-[0.24em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">
            {section.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-white sm:text-4xl">{section.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:mt-4 sm:text-base">{section.description}</p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {section.items.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -4 }}
              className="card-3d cursor-pointer"
            >
              <VideoPreviewCard
                item={item}
                onOpen={() =>
                  router.push(
                    `/player?videoUrl=${encodeURIComponent(item.videoUrl)}&title=${encodeURIComponent(item.title)}`
                  )
                }
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
