"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, ChevronDown } from "lucide-react";
import Link from "next/link";
import YouTubeBackground, { type YouTubePlayerHandle } from "../ui/YouTubeBackground";
import HeroVideoLoader from "../ui/HeroVideoLoader";
import EditableText from "../edit/EditableText";
import { useSiteContent } from "@/context/SiteContentContext";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const { content } = useSiteContent();
  const hero = content.hero;
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const [videoLoading, setVideoLoading] = useState(() => Boolean(hero.youtubeVideoId));
  const [showLoader, setShowLoader] = useState(() => Boolean(hero.youtubeVideoId));
  const onVideoReady = useCallback(() => setVideoLoading(false), []);

  useEffect(() => {
    if (!hero.youtubeVideoId) return;

    if (!videoLoading && showLoader) {
      const timer = window.setTimeout(() => setShowLoader(false), 420);
      return () => window.clearTimeout(timer);
    }
  }, [hero.youtubeVideoId, showLoader, videoLoading]);

  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-[#050505] py-20 sm:h-screen sm:min-h-[620px] sm:py-0">
      <div className="absolute inset-0 w-full h-full overflow-hidden select-none">
        {hero.youtubeVideoId ? (
          <div className="absolute inset-0 hero-depth-layer back">
            <div className="absolute inset-0 scale-[1.05] overflow-hidden blur-[1.75rem]">
              <YouTubeBackground
                ref={playerRef}
                videoId={hero.youtubeVideoId}
                muted={true}
                onReady={onVideoReady}
              />
            </div>
          </div>
        ) : null}

        <div className="absolute inset-0 hero-depth-layer mid">
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.16),_transparent_42%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_28%)]" />
        </div>

        <div className="absolute inset-0 hero-depth-layer front">
          <div className="hero-3d-frame" />
        </div>

        <HeroVideoLoader visible={showLoader} fadingOut={!videoLoading} />
      </div>

      <motion.div
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="hero-3d-card pointer-events-auto relative z-10 mx-auto flex max-w-5xl flex-col items-center px-3 text-center sm:px-6 md:px-10 lg:px-12"
      >
        <motion.div
          initial={false}
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          className="flex flex-col items-center"
        >
          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 36 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease } },
            }}
            className="font-space mb-3 text-[2.15rem] font-bold leading-[0.95] tracking-tight text-white min-[390px]:text-[2.55rem] sm:mb-4 sm:text-4xl md:text-6xl lg:text-7xl"
          >
            <EditableText path="hero.line1" value={hero.line1} as="span" />
            <span className="block text-white/50">
              <EditableText path="hero.line2" value={hero.line2} as="span" />
            </span>
          </motion.h1>

          <motion.h2
            variants={{
              hidden: { opacity: 0, y: 36 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease } },
            }}
            className="glow-text font-space mb-5 text-[2.35rem] font-black uppercase leading-[0.9] tracking-normal text-brand-accent min-[390px]:text-[2.85rem] sm:mb-6 sm:text-5xl sm:tracking-tight md:text-7xl lg:text-8xl"
          >
            <EditableText path="hero.punchline" value={hero.punchline} as="span" />
          </motion.h2>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 28 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
            }}
            className="font-inter mb-7 max-w-[34rem] text-sm font-light leading-6 text-brand-text-sec sm:mb-10 sm:text-base sm:leading-relaxed md:mb-12 md:max-w-2xl md:text-lg"
          >
            <EditableText path="hero.subheading" value={hero.subheading} as="span" multiline />
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 28 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
            }}
            className="flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-4"
          >
            <Link
              href="#work"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-white px-5 py-3.5 text-sm font-semibold text-black shadow-xl sm:w-auto sm:px-8 sm:py-4 sm:text-base"
            >
              <Play className="w-4 h-4 fill-current" />
              View Work
            </Link>
            {hero.youtubeVideoId ? (
              <Link
                href={`/player?videoUrl=${encodeURIComponent(
                  `https://www.youtube.com/watch?v=${hero.youtubeVideoId}`
                )}&title=${encodeURIComponent(hero.punchline || "Showcase")}`}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-purple-600 px-5 py-3.5 text-sm font-semibold text-white hover:bg-purple-500 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
              >
                Play Full Video
              </Link>
            ) : null}
            <Link
              href="#contact"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-white/10 bg-brand-sec-bg px-5 py-3.5 text-sm font-semibold text-white sm:w-auto sm:px-8 sm:py-4 sm:text-base"
            >
              Contact Us
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>


      <motion.div
        className="pointer-events-none absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5 sm:bottom-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <span className="font-inter text-xs text-brand-text-sec tracking-widest uppercase opacity-70">
          Scroll to explore
        </span>
        <ChevronDown className="w-5 h-5 text-brand-accent" />
      </motion.div>
    </section>
  );
}
