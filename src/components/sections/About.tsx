"use client";

import { motion } from "framer-motion";
import { Film } from "lucide-react";
import EditableText from "../edit/EditableText";
import EditableImage from "../edit/EditableImage";
import { useSiteContent } from "@/context/SiteContentContext";

function ToolBadge({ label, index, logo }: { label: string; index: number; logo?: { src: string; alt: string; label: string } }) {
  const lower = label.toLowerCase();
  const fallbackTool = lower.includes("premiere")
    ? { src: "/assets/logos/premiere-pro.svg", alt: "Adobe Premiere Pro logo", label: "Adobe Premiere Pro" }
    : lower.includes("after")
      ? { src: "/assets/logos/after-effects.svg", alt: "Adobe After Effects logo", label: "Adobe After Effects" }
      : { src: "/assets/logos/capcut.svg", alt: "CapCut logo", label: "CapCut" };
  const tool = logo?.src ? logo : fallbackTool;

  return (
    <div className="flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-2 sm:min-h-[132px] sm:gap-2 sm:rounded-2xl sm:p-3">
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#0d1021] p-1.5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] sm:h-20 sm:w-20 sm:rounded-2xl sm:p-2">
        {tool.src ? (
          <EditableImage path={`about.toolLogos.${index}.src`} value={tool.src} alt={tool.alt} className="h-full w-full object-contain" />
        ) : (
          <span className="text-center text-[10px] font-semibold text-white/80">{tool.label || label}</span>
        )}
      </div>
      <EditableText path={`about.tools.${index}`} value={label} as="span" className="text-center text-[10px] font-medium leading-4 text-white/70 sm:text-xs" />
    </div>
  );
}

export default function About() {
  const { content } = useSiteContent();
  const section = content.about;

  return (
    <section id="about" className="px-3 py-10 sm:px-5 sm:py-20 lg:px-6">
      <div className="mx-auto grid max-w-[100rem] gap-3 sm:gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="section-3d-card rounded-xl border border-white/10 bg-[#111111]/85 p-4 sm:rounded-[2rem] sm:p-8 md:p-10"
        >
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-white/5 p-4 sm:mb-6 sm:gap-4 sm:rounded-3xl">
            <Film className="h-6 w-6 text-purple-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-purple-300/80 sm:tracking-[0.35em]">
                <EditableText path="about.eyebrow" value={section.eyebrow} as="span" />
              </p>
              <h2 className="text-xl font-semibold leading-tight text-white sm:text-3xl">
                <EditableText path="about.title" value={section.title} as="span" />
              </h2>
            </div>
          </div>
          <p className="mb-5 text-sm leading-6 text-white/75 sm:mb-6 sm:text-base sm:leading-8">
            <EditableText path="about.paragraph1" value={section.paragraph1} as="span" multiline />
          </p>
          <p className="mb-6 text-sm leading-6 text-white/70 sm:mb-8 sm:text-base sm:leading-8">
            <EditableText path="about.paragraph2" value={section.paragraph2} as="span" multiline />
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {section.tools.map((label, i) => (
              <ToolBadge key={label} label={label} index={i} logo={section.toolLogos?.[i]} />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={false}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="section-3d-card rounded-xl border border-white/10 bg-[#111111]/85 p-4 sm:rounded-[2rem] sm:p-8 md:p-10"
        >
          <div className="mb-5 rounded-2xl bg-white/5 p-5 sm:mb-8 sm:rounded-[1.75rem] sm:p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">Brand summary</p>
            <h3 className="mt-3 text-2xl font-semibold leading-tight text-white sm:mt-4 sm:text-3xl">
              <EditableText path="about.summaryTitle" value={section.summaryTitle} as="span" />
            </h3>
            <p className="mt-4 text-sm leading-6 text-white/70 sm:mt-5 sm:text-base sm:leading-8">
              <EditableText path="about.summaryText" value={section.summaryText} as="span" multiline />
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
            <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-white/80 sm:rounded-3xl sm:p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">Workflow</p>
              <p className="mt-3 text-sm leading-6 sm:text-base sm:leading-7">
                <EditableText path="about.workflowText" value={section.workflowText} as="span" multiline />
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-white/80 sm:rounded-3xl sm:p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">Delivery</p>
              <p className="mt-3 text-sm leading-6 sm:text-base sm:leading-7">
                <EditableText path="about.deliveryText" value={section.deliveryText} as="span" multiline />
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
