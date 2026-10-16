"use client";

import { motion } from "framer-motion";
import { getIcon } from "@/lib/icons";
import SmoothCard from "../ui/SmoothCard";
import EditableText from "../edit/EditableText";
import { useSiteContent } from "@/context/SiteContentContext";

export default function Stats() {
  const { content } = useSiteContent();
  const section = content.stats;

  return (
    <section className="relative overflow-hidden px-3 py-10 sm:px-5 sm:py-20 lg:px-6" id="trust">
      <div className="mx-auto max-w-[88rem]">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 max-w-3xl px-1 text-white/80 sm:mb-12 sm:px-2"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.24em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">
            <EditableText path="stats.eyebrow" value={section.eyebrow} as="span" />
          </p>
          <h2 className="text-2xl font-semibold leading-tight text-white min-[390px]:text-3xl sm:text-5xl">
            <EditableText path="stats.title" value={section.title} as="span" />
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-5 xl:grid-cols-4">
          {section.items.map((item, index) => {
            const Icon = getIcon(item.icon);
            return (
              <SmoothCard
                key={item.label}
                className="glass-panel-glow rounded-xl border border-white/10 bg-[#111111]/80 p-3 sm:rounded-3xl sm:p-8"
              >
                <motion.div
                  initial={false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Icon size={18} className="mb-2 text-purple-300 sm:mb-5 sm:h-[22px] sm:w-[22px]" />
                  <h3 className="mb-1 text-sm font-semibold leading-5 text-white sm:mb-3 sm:text-xl sm:leading-normal">
                    <EditableText
                      path={`stats.items.${index}.label`}
                      value={item.label}
                      as="span"
                    />
                  </h3>
                  <p className="text-xs leading-5 text-white/70 sm:text-sm sm:leading-7">
                    <EditableText
                      path={`stats.items.${index}.description`}
                      value={item.description}
                      as="span"
                      multiline
                    />
                  </p>
                </motion.div>
              </SmoothCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
