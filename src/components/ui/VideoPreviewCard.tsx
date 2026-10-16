"use client";

import Image from "next/image";
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
      className={`glass-liquid group relative flex w-full flex-col items-stretch justify-start overflow-hidden rounded-[1.5rem] text-left transition duration-300 ease-out hover:border-white/35 focus:outline-none focus:ring-2 focus:ring-lime-300/50 cursor-pointer ${className}`}
      aria-label={`Open video ${item.title}`}
      style={{ transform: "translateZ(0)" }}
    >
      <div className={`relative w-full overflow-hidden bg-black ${isFeatured ? "aspect-square shrink-0 lg:aspect-auto lg:min-h-0 lg:flex-1" : "aspect-square shrink-0"}`}>
        <AmbientMediaFrame thumbnailUrl={thumbnailUrl} className="h-full w-full">
          <div className="absolute inset-0 bg-black/10 transition duration-500 group-hover:bg-black/20" />
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={item.title}
              fill
              sizes={isFeatured ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
              className="object-cover transition duration-500 group-hover:scale-105"
              style={imageStyle}
            />
          ) : (
            <div className="h-full w-full bg-[#111]" />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/20" />
          <div className={`pointer-events-none absolute flex items-center justify-between text-white/80 ${isFeatured ? "inset-x-4 top-4" : "inset-x-2 top-2"}`}>
            <span className={`max-w-full truncate rounded-full bg-black/70 uppercase text-white/90 ${isFeatured ? "px-2.5 py-1 text-[10px] tracking-[0.2em] sm:px-3 sm:text-xs" : "px-1.5 py-0.5 text-[8px] tracking-[0.12em] sm:px-2 sm:text-[9px]"}`}>
              {item.category}
            </span>
          </div>
        </AmbientMediaFrame>
      </div>

      <div className={`shrink-0 p-2.5 sm:p-3 ${isFeatured ? "" : "mt-auto"}`}>
        <div className="min-w-0">
          <h3 className={`line-clamp-2 font-semibold text-white ${isFeatured ? "text-lg leading-6 sm:text-xl" : "min-h-9 text-[13px] leading-[1.125rem] sm:text-sm"}`}>
            {item.title}
          </h3>
          {isFeatured && item.description && (
            <p className="mt-2 text-sm leading-6 text-white/70 line-clamp-3">{item.description}</p>
          )}
        </div>
      </div>
    </button>
  );
}
