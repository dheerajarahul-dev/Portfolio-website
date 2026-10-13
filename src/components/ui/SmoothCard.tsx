"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function SmoothCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.015 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className={`card-3d ${className}`}
    >
      {children}
    </motion.div>
  );
}
