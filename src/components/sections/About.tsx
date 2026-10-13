"use client";

import { motion } from "framer-motion";
import { Film } from "lucide-react";
import EditableText from "../edit/EditableText";
import { useSiteContent } from "@/context/SiteContentContext";

export default function About() {
  const { content } = useSiteContent();
  const section = content.about;

  return (
    <section id="about" className="px-3 py-14 sm:px-5 sm:py-20 lg:px-6">
      <div className="mx-auto grid max-w-[100rem] gap-5 sm:gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="section-3d-card rounded-2xl border border-white/10 bg-[#111111]/85 p-5 sm:rounded-[2rem] sm:p-8 md:p-10"
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
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {section.tools.map((label, i) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-sm text-white/80 sm:rounded-3xl sm:p-4"
              >
                <EditableText path={`about.tools.${i}`} value={label} as="span" />
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={false}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="section-3d-card rounded-2xl border border-white/10 bg-[#111111]/85 p-5 sm:rounded-[2rem] sm:p-8 md:p-10"
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-white/80 sm:rounded-3xl sm:p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">Workflow</p>
              <p className="mt-3 text-sm leading-6 sm:text-base sm:leading-7">
                <EditableText path="about.workflowText" value={section.workflowText} as="span" multiline />
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-white/80 sm:rounded-3xl sm:p-6">
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
