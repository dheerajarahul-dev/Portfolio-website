"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { SiteContent } from "@/lib/types";
import { getMediaKind, getYoutubeIdFromUrl } from "@/lib/media";
import { youtubeEmbedUrl } from "@/lib/youtube";
import AmbientMediaFrame from "./AmbientMediaFrame";

export default function VideoLightbox({
  item,
  onClose,
}: {
  item: SiteContent["featuredWork"]["items"][0] | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [item, onClose]);

  const kind = item ? getMediaKind(item.videoUrl) : "unknown";
  const youtubeId =
    item && kind === "youtube" ? getYoutubeIdFromUrl(item.videoUrl) : "";

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-purple-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <AmbientMediaFrame
              thumbnailUrl={item.thumbnailUrl}
              className="aspect-video w-full"
            >
              <div className="relative h-full w-full min-h-[50vh] md:min-h-0 md:aspect-video">
                {kind === "youtube" && youtubeId ? (
                  <iframe
                    src={youtubeEmbedUrl(youtubeId, {
                      autoplay: true,
                      mute: false,
                      controls: true,
                    })}
                    title={item.title}
                    allow="autoplay; encrypted-media; fullscreen"
                    className="absolute inset-0 h-full w-full border-0"
                  />
                ) : item.videoUrl ? (
                  <video
                    src={item.videoUrl}
                    className="absolute inset-0 h-full w-full object-contain"
                    controls
                    autoPlay
                    playsInline
                  />
                ) : null}
              </div>
            </AmbientMediaFrame>

            <div className="border-t border-white/10 bg-[#111] px-6 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-purple-300/80">
                {item.category}
              </p>
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              {item.description ? (
                <p className="mt-2 text-sm leading-6 text-white/70">{item.description}</p>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
