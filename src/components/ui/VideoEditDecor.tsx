"use client";

import { motion } from "framer-motion";
import { AudioWaveform, Film, Scissors } from "lucide-react";

export default function VideoEditDecor({
  variant = "section",
}: {
  variant?: "hero" | "player" | "section";
}) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${variant === "hero" ? "opacity-90" : "opacity-70"}`}>
      <motion.div
        initial={{ y: 0, opacity: 0.65 }}
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="decor-node top-16 left-10"
      >
        <Scissors className="h-5 w-5" />
      </motion.div>

      <motion.div
        initial={{ x: 0, opacity: 0.55 }}
        animate={{ x: [0, 12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="decor-node bottom-24 right-12"
      >
        <Film className="h-5 w-5" />
      </motion.div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0.4 }}
        animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="decor-wave top-24 right-24"
      />

      <motion.div
        initial={{ opacity: 0.6, x: -8 }}
        animate={{ opacity: [0.6, 0.9, 0.6], x: [-8, 8, -8] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="decor-line decor-large bottom-32 left-16"
      />

      <motion.div
        initial={{ opacity: 0.5, y: 0 }}
        animate={{ opacity: [0.5, 0.85, 0.5], y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="decor-line decor-small top-32 left-28"
      />

      <motion.div
        initial={{ opacity: 0.55, x: 0 }}
        animate={{ opacity: [0.55, 0.85, 0.55], x: [0, 10, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="decor-node top-12 right-24"
      >
        <AudioWaveform className="h-5 w-5" />
      </motion.div>
    </div>
  );
}
