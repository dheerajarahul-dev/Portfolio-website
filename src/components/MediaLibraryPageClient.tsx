"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Search, X, ImageIcon, ArrowLeft } from "lucide-react";
import type { MediaLibraryItem, SiteContent } from "@/lib/types";
import { saveScrollReturnTarget, restoreSavedScrollTarget } from "@/lib/scroll-state";
import { getMediaThumbnailUrl } from "@/lib/media";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { SiteContentProvider } from "@/context/SiteContentContext";

function getItemAction(item: MediaLibraryItem) {
  if (item.type === "photo") return "View photo";
  return "Watch";
}

function getImageStyle(item: MediaLibraryItem) {
  const crop = item.crop ?? { x: 50, y: 50, scale: 1 };
  return {
    objectPosition: `${crop.x}% ${crop.y}%`,
    transform: `scale(${crop.scale})`,
  };
}

function getImageSizes(item: MediaLibraryItem) {
  const cropScale = Math.max(1, item.crop?.scale || 1);
  const scaled = (value: number) => (value * cropScale).toFixed(2);

  return [
    `(min-width: 1328px) ${Math.ceil(413.34 * cropScale)}px`,
    `(min-width: 1280px) calc(${scaled(100 / 3)}vw - ${scaled(88 / 3)}px)`,
    `(min-width: 768px) calc(${scaled(50)}vw - ${scaled(30)}px)`,
    `calc(${scaled(100)}vw - ${scaled(24)}px)`,
  ].join(", ");
}

function MediaLibraryContent({ content }: { content: SiteContent }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "video" | "photo">("all");
  const [selectedPhoto, setSelectedPhoto] = useState<MediaLibraryItem | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, true>>({});
  const photoViewerRef = useRef<HTMLDivElement>(null);
  const photoCloseButtonRef = useRef<HTMLButtonElement>(null);
  const photoTriggerRef = useRef<HTMLButtonElement | null>(null);
  const items = useMemo(
    () =>
      (content.mediaLibrary?.items ?? []).filter((item) => {
        const hasTitle = Boolean(item.title && item.title.trim());
        const hasContent = Boolean(item.mediaUrl?.trim() || item.thumbnailUrl?.trim());
        return item.published && hasTitle && hasContent;
      }),
    [content.mediaLibrary?.items]
  );

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))],
    [items]
  );

  const [activeCategory, setActiveCategory] = useState("all");

  const filteredItems = useMemo(() => {
    const safeQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter = filter === "all" || item.type === filter;
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      const matchesQuery =
        !safeQuery ||
        [item.title, item.category, item.description, item.sourceType]
          .join(" ")
          .toLowerCase()
          .includes(safeQuery);
      return matchesFilter && matchesCategory && matchesQuery;
    });
  }, [activeCategory, filter, items, query]);

  const openItem = (item: MediaLibraryItem, trigger: HTMLButtonElement) => {
    const returnPath = window.location.pathname + window.location.search;
    saveScrollReturnTarget(returnPath, "media-library", window.scrollY);
    if (item.type === "photo") {
      photoTriggerRef.current = trigger;
      setSelectedPhoto(item);
      return;
    }
    router.push(`/player?videoUrl=${encodeURIComponent(item.mediaUrl)}&title=${encodeURIComponent(item.title)}`);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    restoreSavedScrollTarget(window.location.pathname + window.location.search);
  }, []);

  useEffect(() => {
    if (!selectedPhoto) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    photoCloseButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedPhoto(null);
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = photoViewerRef.current;
      if (!dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )];
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      photoTriggerRef.current?.focus();
    };
  }, [selectedPhoto]);

  return (
    <main className="min-h-screen bg-[#050505] px-3 pb-20 pt-24 text-white sm:px-5 sm:pt-28 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-5 sm:mb-8 sm:pb-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">
              {content.mediaLibrary?.title || "Selected work"}
            </h1>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
          <p className="max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
            {content.mediaLibrary?.description ||
              "Published videos and photos from the CreativeXCreations portfolio."}
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-[#0d0d10]/80 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <span className="sr-only">Search media</span>
              <input
                aria-label="Search media"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search media, category, or source"
                className="w-full rounded-full border border-white/10 bg-[#050505] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-purple-400/70"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {(["all", "video", "photo"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  aria-pressed={filter === item}
                  className={`rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] ${filter === item ? "bg-purple-600 text-white" : "bg-white/5 text-white/70"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(["all", ...categories]).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                  className={`rounded-full border px-3 py-1.5 text-xs ${activeCategory === category ? "border-purple-400/60 bg-purple-600/20 text-purple-200" : "border-white/10 bg-white/5 text-white/70"}`}
                >
                  {category === "all" ? "All categories" : category}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-white/10 bg-[#111]/60 p-10 text-center text-white/60">
            No published media matches the current filters.
          </div>
        ) : (
          <div className="grid grid-cols-2 items-stretch gap-2.5 sm:gap-4 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <article key={item.id} className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111111]/85 transition hover:border-purple-400/40 sm:rounded-[1.25rem]">
                <button
                  type="button"
                  onClick={(event) => openItem(item, event.currentTarget)}
                  className="flex h-full w-full min-w-0 flex-col text-left"
                  aria-label={`${getItemAction(item)}: ${item.title}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-black sm:aspect-[16/10]">
                    {item.type === "photo" ? (
                      brokenImages[item.id] ? (
                        <div className="flex h-full w-full items-center justify-center text-sm text-white/50">
                          Thumbnail unavailable
                        </div>
                      ) : (
                        <Image
                          src={getMediaThumbnailUrl(item) || "/logo.png"}
                          alt={item.altText || item.title}
                          fill
                          loading={item.id === filteredItems[0]?.id ? "eager" : "lazy"}
                          className="object-cover transition duration-500 group-hover:scale-105"
                          style={getImageStyle(item)}
                          sizes={getImageSizes(item)}
                          onError={() => setBrokenImages((prev) => ({ ...prev, [item.id]: true }))}
                        />
                      )
                    ) : (
                      brokenImages[item.id] ? (
                        <div className="flex h-full w-full items-center justify-center text-sm text-white/50">
                          Thumbnail unavailable
                        </div>
                      ) : (
                        <Image
                          src={getMediaThumbnailUrl(item) || "/logo.png"}
                          alt={item.title}
                          fill
                          loading={item.id === filteredItems[0]?.id ? "eager" : "lazy"}
                          className="object-cover transition duration-500 group-hover:scale-105"
                          style={getImageStyle(item)}
                          sizes={getImageSizes(item)}
                          onError={() => setBrokenImages((prev) => ({ ...prev, [item.id]: true }))}
                        />
                      )
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-black/15" />
                    <div className="absolute inset-x-4 top-4 flex items-center justify-between">
                      <span className="rounded-full bg-black/50 px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] text-white/80">
                        {item.category}
                      </span>
                      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white shadow-lg">
                        {item.type === "photo" ? <ImageIcon className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col space-y-1.5 p-2.5 sm:space-y-3 sm:p-5">
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 min-h-9 text-sm font-semibold leading-5 text-white sm:min-h-14 sm:text-xl sm:leading-7">{item.title}</h2>
                    </div>
                    <p className="line-clamp-2 min-h-8 text-xs leading-4 text-white/70 sm:line-clamp-3 sm:min-h-18 sm:text-sm sm:leading-6" aria-label={item.description ? undefined : "No description"}>
                      {item.description || " "}
                    </p>
                  </div>
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedPhoto(null);
        }}>
          <div
            ref={photoViewerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-viewer-title"
            tabIndex={-1}
            className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#111]"
          >
            <button
              ref={photoCloseButtonRef}
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="Close media viewer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative aspect-[4/3]">
              <Image src={getMediaThumbnailUrl(selectedPhoto) || selectedPhoto.mediaUrl} alt={selectedPhoto.altText || selectedPhoto.title} fill className="object-contain" sizes="100vw" />
            </div>
            <div className="space-y-2 p-5">
              <h2 id="photo-viewer-title" className="text-xl font-semibold text-white">{selectedPhoto.title}</h2>
              {selectedPhoto.description ? <p className="text-sm leading-6 text-white/70">{selectedPhoto.description}</p> : null}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function MediaLibraryPageClient({ content }: { content: SiteContent }) {
  return (
    <SiteContentProvider initialContent={content}>
      <Navbar />
      <MediaLibraryContent content={content} />
      <SiteFooter
        brandName={content.navbar.brandName}
        founderName={content.founder.name}
        founderRole={content.founder.role}
        founderPhotoUrl={content.founder.photoUrl}
        contactChannels={content.contact.channels}
      />
    </SiteContentProvider>
  );
}
