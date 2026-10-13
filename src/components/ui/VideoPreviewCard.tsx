"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import type { SiteContent } from "@/lib/types";
import AmbientMediaFrame from "./AmbientMediaFrame";

type VideoPreviewCardProps = {
  item: SiteContent["videoSection"]["items"][0] | SiteContent["featuredWork"]["items"][0];
  onOpen: () => void;
  className?: string;
  isFeatured?: boolean;
};

export default function VideoPreviewCard({
  item,
  onOpen,
  className = "",
  isFeatured = false,
}: VideoPreviewCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative block w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#111]/90 text-left transition hover:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/30 cursor-pointer ${className}`}
      aria-label={`Open video ${item.title}`}
    >
      <div className={`relative ${isFeatured ? "aspect-[4/3]" : "aspect-[16/10]"} w-full overflow-hidden bg-black`}>
        <AmbientMediaFrame thumbnailUrl={item.thumbnailUrl} className="h-full w-full">
          <div className="absolute inset-0 bg-black/10 transition duration-500 group-hover:bg-black/20" />
          {item.thumbnailUrl ? (
            <Image
              src={item.thumbnailUrl}
              alt={item.title}
              fill
              sizes={isFeatured ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-[#111]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/20 pointer-events-none" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/65 text-white shadow-xl transition-transform duration-300 group-hover:scale-110">
              <Play size={22} />
            </span>
          </div>
          <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between text-xs text-white/80">
            <span className="rounded-full bg-black/70 px-3 py-1 uppercase tracking-[0.35em] text-white/90">
              {item.category}
            </span>
            <span className="hidden rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-white/80 md:block">
              Tap to play
            </span>
          </div>
        </AmbientMediaFrame>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className={`font-semibold text-white ${isFeatured ? "text-2xl md:text-3xl" : "text-xl"}`}>
              {item.title}
            </h3>
            {item.description ? (
              <p className="mt-2 text-sm leading-6 text-white/70 line-clamp-3">{item.description}</p>
            ) : null}
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600/95 text-white shadow-lg transition duration-300 group-hover:scale-105">
            <Play size={20} />
          </span>
        </div>
      </div>
    </button>
  );
}
