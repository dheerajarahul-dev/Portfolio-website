"use client";

import { motion } from "framer-motion";
import { getIcon } from "@/lib/icons";
import SmoothCard from "../ui/SmoothCard";
import EditableText from "../edit/EditableText";
import { useSiteContent } from "@/context/SiteContentContext";

export default function WhyChooseUs() {
  const { content } = useSiteContent();
  const section = content.whyChooseUs;

  return (
    <section id="why-us" className="px-3 py-10 sm:px-5 sm:py-20 lg:px-6">
      <div className="mx-auto max-w-[88rem]">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 max-w-3xl px-1 text-white/80 sm:mb-12 sm:px-2"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.24em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">
            <EditableText path="whyChooseUs.eyebrow" value={section.eyebrow} as="span" />
          </p>
          <h2 className="text-2xl font-semibold leading-tight text-white min-[390px]:text-3xl sm:text-5xl">
            <EditableText path="whyChooseUs.title" value={section.title} as="span" />
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-6 md:grid-cols-3">
          {section.items.map((item, index) => {
            const Icon = getIcon(item.icon);
            return (
              <SmoothCard
                key={item.title}
                className="glass-panel rounded-xl border border-white/10 bg-[#111111]/80 p-3 last:col-span-2 md:last:col-span-1 sm:rounded-[2rem] sm:p-8"
              >
                <motion.div
                  initial={false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Icon size={19} className="mb-2 text-purple-300 sm:mb-6 sm:h-6 sm:w-6" />
                  <h3 className="mb-1 text-sm font-semibold leading-5 text-white sm:mb-3 sm:text-2xl sm:leading-normal">
                    <EditableText
                      path={`whyChooseUs.items.${index}.title`}
                      value={item.title}
                      as="span"
                    />
                  </h3>
                  <p className="text-xs leading-5 text-white/70 sm:text-sm sm:leading-7">
                    <EditableText
                      path={`whyChooseUs.items.${index}.description`}
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
