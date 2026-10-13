"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useSiteContent } from "@/context/SiteContentContext";

const LOGO_SRC = "/logo.png";

export default function Navbar() {
  const { content } = useSiteContent();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { navbar } = content;
  const brandParts = navbar.brandName.split("X");
  const logoSrc = navbar.logoUrl || LOGO_SRC;

  useEffect(() => {
    let frame = 0;
    const updateScrolled = () => {
      frame = 0;
      setIsScrolled(window.scrollY > 50);
    };
    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScrolled);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrolled();
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ${
          isScrolled
            ? "glass-panel py-3 shadow-2xl border-b border-white/5"
            : "bg-transparent py-4 md:py-5"
        }`}
      >
        <div className="flex w-full items-center justify-between gap-3 pl-3 pr-3 sm:pl-5 sm:pr-5 lg:pl-6 lg:pr-6">
          <motion.button
            type="button"
            onClick={scrollToTop}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex min-w-0 shrink items-center gap-2 sm:gap-3"
            aria-label="Scroll to top"
          >
            <motion.div
              className="relative h-9 w-9 shrink-0 sm:h-12 sm:w-12"
              whileHover={{ rotate: [0, -3, 3, 0], scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <Image
                src={logoSrc}
                alt="CreativeXCreations"
                fill
                className="object-contain drop-shadow-[0_0_12px_rgba(124,58,237,0.35)]"
                priority
                sizes="48px"
              />
            </motion.div>
            <span className="max-w-[11rem] truncate font-space text-sm font-bold tracking-wider text-white min-[380px]:inline sm:max-w-none sm:text-base lg:text-lg">
              {brandParts[0] || "CREATIVE"}
              <span className="text-brand-accent">X</span>
              {brandParts[1] || "CREATIONS"}
            </span>
          </motion.button>

          <div className="hidden md:flex flex-1 items-center justify-center gap-8 lg:gap-10">
            {navbar.links.map((link) => (
              <Link key={link.name} href={link.href} className="nav-link">
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="#contact"
              className="hidden md:inline-flex items-center gap-2 rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]"
            >
              Let&apos;s Edit <ArrowUpRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-1 bg-black/92 px-6 backdrop-blur-lg md:hidden"
          >
            {navbar.links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full rounded-2xl py-3 text-center font-space text-xl font-semibold text-white/75 hover:bg-white/5"
              >
                {link.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
