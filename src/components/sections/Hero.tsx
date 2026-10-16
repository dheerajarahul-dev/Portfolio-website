"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play, ChevronDown, ArrowUpRight, Mail, Scissors } from "lucide-react";
import Link from "next/link";
import EditableText from "../edit/EditableText";
import { useSiteContent } from "@/context/SiteContentContext";
import { scrollToSection } from "@/lib/scroll-to-section";

const ease = [0.22, 1, 0.36, 1] as const;

function formatElapsedTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function ElapsedTime() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((current) => (current >= 600 ? 0 : current + 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <span className="editor-pill">{formatElapsedTime(seconds)}</span>;
}

export default function Hero() {
  const { content, editMode } = useSiteContent();
  const hero = content.hero;
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-[#050505] py-20 sm:h-screen sm:min-h-[620px] sm:py-0">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(84,74,112,0.22),transparent_50%),linear-gradient(135deg,#050505_0%,#0a0a0c_52%,#09090f_100%)]" />
        <div className="hero-editor-scene pointer-events-none absolute inset-0">
          <motion.div
            className="editor-panel panel-main"
            animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -12, 0], rotate: [0, 1, 0] }}
            transition={{ duration: 10, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
          >
            <div className="editor-header">
              <span className="editor-pill">Sequence</span>
              <ElapsedTime />
            </div>
            <div className="editor-sequence-scene" aria-hidden="true">
              <span className="editor-scene-frame frame-one" />
              <span className="editor-scene-frame frame-two" />
              <span className="editor-scene-frame frame-three" />
              <span className="editor-scene-playhead" />
            </div>
            <div className="editor-wave" />
            <div className="editor-tracks">
              <span className="editor-track short" />
              <span className="editor-track medium" />
              <span className="editor-track long" />
            </div>
          </motion.div>

          <motion.div
            className="editor-panel panel-left"
            animate={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 1, x: [0, -10, 0], y: [0, -8, 0] }}
            transition={{ duration: 9, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
          >
            <div className="editor-pill editor-cut-label"><Scissors className="h-3 w-3" /> Cuts</div>
            <div className="editor-clip clip-a"><span className="editor-cut-marker" /></div>
            <div className="editor-clip clip-b"><span className="editor-cut-marker" /></div>
          </motion.div>

          <motion.div
            className="editor-panel panel-right"
            animate={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 1, x: [0, 12, 0], y: [0, 10, 0] }}
            transition={{ duration: 11, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
          >
            <div className="editor-pill">Preview</div>
            <div className="editor-preview" />
            <div className="editor-playhead" />
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
        className="pointer-events-auto relative z-10 mx-auto flex w-full max-w-[48rem] flex-col items-center px-3 text-center sm:px-6 md:px-10 lg:px-12"
      >
        <div className="flex flex-col items-center">
          <h1
            className="font-space mb-3 max-w-[58rem] text-[2.15rem] font-bold leading-[0.95] tracking-normal text-white min-[390px]:text-[2.55rem] sm:mb-4 sm:text-4xl md:text-5xl lg:text-6xl"
          >
            <EditableText path="hero.line1" value={hero.line1} as="span" />
            <span className="block text-white/50">
              <EditableText path="hero.line2" value={hero.line2} as="span" />
            </span>
          </h1>

          <h2
            className="glow-text font-space mb-5 text-[2.35rem] font-black uppercase leading-[0.9] tracking-normal text-brand-accent min-[390px]:text-[2.85rem] sm:mb-6 sm:text-5xl md:text-6xl lg:text-7xl"
          >
            <EditableText path="hero.punchline" value={hero.punchline} as="span" />
          </h2>

          <p
            className="font-inter mb-7 max-w-[34rem] text-sm font-light leading-6 text-brand-text-sec sm:mb-8 sm:text-base sm:leading-relaxed md:mb-8 md:max-w-2xl md:text-lg"
          >
            <EditableText path="hero.subheading" value={hero.subheading} as="span" multiline />
          </p>

          <div
            className="grid w-full max-w-[58rem] grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:items-center lg:justify-center lg:gap-4"
          >
            <Link
              href="#work"
              onClick={(event) => {
                event.preventDefault();
                if (!editMode) scrollToSection("work");
              }}
              className="glass-cta glass-cta-primary inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-sm font-semibold text-black lg:min-w-56 lg:flex-1 lg:px-6 lg:py-4 lg:text-base"
            >
              <EditableText path="hero.ctaWork" value={hero.ctaWork} as="span" showEditButton={!editMode} />
              <ArrowUpRight className="h-4 w-4 shrink-0" />
            </Link>
            <Link
              href={`/player?videoUrl=${encodeURIComponent(`https://www.youtube.com/watch?v=${hero.youtubeVideoId}`)}&title=${encodeURIComponent("2026 Demo Reel")}`}
              className="glass-cta inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-sm font-semibold text-white lg:min-w-56 lg:flex-1 lg:px-6 lg:py-4 lg:text-base"
            >
              <Play className="h-4 w-4 fill-current" />
              <EditableText path="hero.ctaReel" value={hero.ctaReel} as="span" showEditButton={!editMode} />
            </Link>
            <Link
              href="#contact"
              onClick={(event) => {
                event.preventDefault();
                if (!editMode) scrollToSection("contact");
              }}
              className="glass-cta inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-sm font-semibold text-white lg:min-w-56 lg:flex-1 lg:px-6 lg:py-4 lg:text-base"
            >
              <EditableText path="hero.ctaContact" value={hero.ctaContact} as="span" showEditButton={!editMode} />
              <Mail className="h-4 w-4 shrink-0" />
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="hero-scroll-cue pointer-events-none absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5 sm:bottom-10"
        animate={reduceMotion ? { y: 0 } : { y: [0, 8, 0] }}
        transition={{ repeat: reduceMotion ? 0 : Infinity, duration: 2, ease: "easeInOut" }}
      >
        <span className="font-inter text-xs uppercase tracking-[0.35em] text-brand-text-sec opacity-70">
          Scroll to explore
        </span>
        <ChevronDown className="h-5 w-5 text-brand-accent" />
      </motion.div>
    </section>
  );
}
