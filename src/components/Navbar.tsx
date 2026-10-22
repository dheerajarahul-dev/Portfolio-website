"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useSiteContent } from "@/context/SiteContentContext";
import EditableText from "./edit/EditableText";
import EditableImage from "./edit/EditableImage";
import { scrollToSection } from "@/lib/scroll-to-section";

const LOGO_SRC = "/logo.png";

export default function Navbar() {
  const { content, editMode, selectPath } = useSiteContent();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  const brandText = (content.navbar.brandName || "CREATIVEXCREATIONS").replace(/\s*x\s*/gi, " X ");
  const logoSrc = content.navbar.logoUrl || LOGO_SRC;
  const navItems = content.navbar.links;
  const displayedActiveSection = pathname === "/" ? activeSection : "";
  const brandContent = (
    <>
      <div className="relative h-8 w-8 shrink-0 sm:h-10 sm:w-10">
        <EditableImage path="navbar.logoUrl" value={logoSrc} className="h-full w-full object-contain" />
      </div>
      <EditableText
        path="navbar.brandName"
        value={brandText}
        as="span"
        highlightX
        className="inline-flex shrink-0 items-center font-space text-[0.68rem] font-bold tracking-[0.16em] text-white sm:text-[0.8rem]"
      />
    </>
  );

  useEffect(() => {
    let frame = 0;
    const updateScrollState = () => {
      setIsScrolled(window.scrollY > 18);
      if (pathname !== "/") {
        setActiveSection("");
        return;
      }

      const center = window.innerHeight / 2;
      const active = navItems.find((item) => {
        if (!item.href.startsWith("#")) return false;
        const section = document.getElementById(item.href.slice(1));
        if (!section) return false;
        const rect = section.getBoundingClientRect();
        return rect.top <= center && rect.bottom >= center;
      });
      setActiveSection(active?.href.slice(1) || "");
    };
    const handleScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(() => {
          frame = 0;
          updateScrollState();
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      updateScrollState();
    });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [navItems, pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsMobileMenuOpen(false);
      mobileMenuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMobileMenuOpen]);

  const handleNavigation = (href: string) => {
    if (editMode) return;
    setIsMobileMenuOpen(false);
    if (!href.startsWith("#")) return;

    if (pathname !== "/") {
      router.push(`/${href}`);
      return;
    }

    scrollToSection(href.slice(1));
  };

  const handleHomeOrTop = () => {
    if (editMode) {
      selectPath("navbar.logoUrl");
      return;
    }
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push("/");
  };

  return (
    <>
      <motion.header
        initial={false}
        animate={{ opacity: 1 }}
        className="fixed inset-x-0 top-0 z-50 pt-3 sm:pt-4"
      >
        <div className="mx-auto max-w-[88rem] px-3 sm:px-5 lg:px-6">
          <div
            className={`header-shell flex items-center justify-between gap-2 rounded-full px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-[background-color,border-color,box-shadow] duration-300 sm:px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-3 md:py-2.5 ${
              isScrolled ? "bg-[#0d0d11]/82" : "bg-[#0d0d11]/32"
            }`}
          >
            <div className="flex shrink-0 items-center justify-start">
              {editMode ? (
                <div className="flex items-center gap-2 px-1 py-1 text-left sm:gap-3">{brandContent}</div>
              ) : (
                <button
                  type="button"
                  onClick={handleHomeOrTop}
                  className="flex items-center gap-2 rounded-full px-1 py-1 text-left outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-purple-400/80 sm:gap-3 cursor-pointer"
                  aria-label="Go to the homepage"
                >
                  {brandContent}
                </button>
              )}
            </div>

            <nav className="hidden items-center justify-center gap-6 md:flex lg:gap-8" aria-label="Primary navigation">
              {navItems.map((link) => {
                const isHashLink = link.href.startsWith("#");

                if (isHashLink) {
                  return (
                    <button
                      key={link.name}
                      type="button"
                      onClick={() => handleNavigation(link.href)}
                      className={`nav-link ${displayedActiveSection === link.href.slice(1) ? "nav-link-active" : ""}`}
                    >
                      <EditableText path={`navbar.links.${content.navbar.links.indexOf(link)}.name`} value={link.name} as="span" showEditButton={!editMode} />
                    </button>
                  );
                }

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="nav-link"
                    onClick={(event) => {
                      if (!editMode) return;
                      event.preventDefault();
                      selectPath(`navbar.links.${content.navbar.links.indexOf(link)}.name`);
                    }}
                  >
                    <EditableText path={`navbar.links.${content.navbar.links.indexOf(link)}.name`} value={link.name} as="span" showEditButton={!editMode} />
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center justify-end gap-2">
              <Link
                href="/studio/login"
                className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[0.68rem] font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:text-xs md:inline-flex"
              >
                Studio
              </Link>

              <button
                type="button"
                onClick={() => handleNavigation("#contact")}
                className="hidden items-center gap-1.5 rounded-full bg-[#7C3AED] px-3.5 py-2 text-[0.68rem] font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.32)] transition hover:-translate-y-0.5 hover:bg-[#8b5cf6] focus-visible:ring-2 focus-visible:ring-purple-300 sm:text-xs md:inline-flex"
              >
                <EditableText path="navbar.contactLabel" value={content.navbar.contactLabel} as="span" showEditButton={!editMode} />
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                ref={mobileMenuButtonRef}
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white md:hidden"
                aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[4rem] z-40 mx-3 rounded-2xl border border-white/10 bg-[#0d0d11]/90 p-2.5 shadow-2xl backdrop-blur-xl md:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {navItems.map((link) => {
                const isHashLink = link.href.startsWith("#");

                if (isHashLink) {
                  return (
                    <button
                      key={link.name}
                      type="button"
                      onClick={() => handleNavigation(link.href)}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition hover:border-white/10 hover:bg-white/5 ${displayedActiveSection === link.href.slice(1) ? "border-purple-300/30 bg-purple-500/10 text-white" : "border-transparent text-white/80"}`}
                    >
                      <EditableText path={`navbar.links.${content.navbar.links.indexOf(link)}.name`} value={link.name} as="span" showEditButton={!editMode} />
                    </button>
                  );
                }

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={(event) => {
                      if (editMode) {
                        event.preventDefault();
                        selectPath(`navbar.links.${content.navbar.links.indexOf(link)}.name`);
                        return;
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition hover:border-white/10 hover:bg-white/5 ${displayedActiveSection === link.href.slice(1) ? "border-purple-300/30 bg-purple-500/10 text-white" : "border-transparent text-white/80"}`}
                    onMouseDown={(event) => {
                      if (!editMode) return;
                      event.preventDefault();
                      selectPath(`navbar.links.${content.navbar.links.indexOf(link)}.name`);
                    }}
                  >
                    <EditableText path={`navbar.links.${content.navbar.links.indexOf(link)}.name`} value={link.name} as="span" showEditButton={!editMode} />
                  </Link>
                );
              })}
              <Link
                href="/studio/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-left text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Studio Login
              </Link>
              <button
                type="button"
                onClick={() => handleNavigation("#contact")}
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#7C3AED] px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.32)] transition hover:bg-[#8b5cf6]"
              >
                <span>{content.navbar.contactLabel || "Get in Touch"}</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
