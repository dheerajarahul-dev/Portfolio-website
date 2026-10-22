"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import type { MediaLibraryItem } from "@/lib/types";
import { getMediaThumbnailUrl } from "@/lib/media";
import AmbientMediaFrame from "./AmbientMediaFrame";

type VideoPreviewCardProps = {
  item: MediaLibraryItem;
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
  const thumbnailUrl = getMediaThumbnailUrl(item);
  const title = item.title.trim();
  const genericTitle = !title || /^untitled media$/i.test(title) || /^\d+$/.test(title);
  const thumbnailAlt = item.altText?.trim() || (
    genericTitle
      ? `${item.category || "Portfolio"} ${item.type === "photo" ? "image" : "video"} thumbnail`
      : `${title} ${item.type === "photo" ? "image" : "video"} thumbnail`
  );
  const crop = item.crop;
  const imageStyle = crop
    ? {
        objectPosition: `${crop.x}% ${crop.y}%`,
        transform: `scale(${crop.scale})`,
      }
    : undefined;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d12] text-left transition-all duration-300 hover:border-purple-500/40 hover:bg-[#12121a] hover:shadow-2xl hover:shadow-purple-950/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer ${className}`}
      aria-label={`Open video ${item.title}`}
    >
      {/* 16:9 Cinematic Thumbnail Container */}
      <div className={`relative w-full overflow-hidden bg-black ${isFeatured ? "aspect-video lg:aspect-auto lg:min-h-0 lg:flex-1" : "aspect-video"}`}>
        <AmbientMediaFrame thumbnailUrl={thumbnailUrl} className="h-full w-full">
          <div className="absolute inset-0 bg-black/20 transition-opacity duration-300 group-hover:opacity-40" />
          
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={thumbnailAlt}
              fill
              sizes={isFeatured ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              style={imageStyle}
            />
          ) : (
            <div className="h-full w-full bg-[#111]" />
          )}

          {/* Vignette Gradients */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

          {/* Top Category Badge */}
          <div className="pointer-events-none absolute left-3 top-3 z-10">
            <span className="inline-flex items-center rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase text-white/90 backdrop-blur-md shadow-sm">
              {item.category || "Video"}
            </span>
          </div>

          {/* Center Play Affordance on Hover */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-purple-600/90 text-white shadow-xl shadow-purple-950/60 backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
              <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
            </div>
          </div>
        </AmbientMediaFrame>
      </div>

      {/* Content & Metadata Area with Strict Visual Hierarchy */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          <h3 className={`font-semibold tracking-tight text-white transition-colors duration-200 group-hover:text-purple-300 ${
            isFeatured ? "text-lg sm:text-xl leading-snug line-clamp-2" : "text-sm sm:text-base leading-snug line-clamp-2"
          }`}>
            {item.title}
          </h3>

          {isFeatured && item.description && (
            <p className="mt-2 text-xs sm:text-sm text-white/60 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
