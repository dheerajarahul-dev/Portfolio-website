"use client";

import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

export default function HeroAudioToggle({
  muted,
  onToggle,
}: {
  muted: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      aria-label={muted ? "Unmute background video at 50% volume" : "Mute background video"}
      className="fixed right-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white shadow-lg backdrop-blur-md transition-colors hover:border-purple-400/40 hover:bg-purple-500/20 md:right-6"
    >
      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5 text-purple-300" />}
    </motion.button>
  );
}
