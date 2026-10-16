"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import EditableText from "../edit/EditableText";
import { useSiteContent } from "@/context/SiteContentContext";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { scrollToSection } from "@/lib/scroll-to-section";
import { Plus, X } from "lucide-react";

function AddFeatureButton({ planIndex }: { planIndex: number }) {
  const { editMode, insertAtPath } = useSiteContent();
  if (!editMode) return null;
  return (
    <button
      type="button"
      onClick={() => insertAtPath(`pricing.plans.${planIndex}.features`, "New feature")}
      className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1 text-sm text-white/80"
    >
      <Plus className="w-3 h-3" /> Add feature
    </button>
  );
}

function EditFeatureRemove({ planIndex, index }: { planIndex: number; index: number }) {
  const { editMode, removeAtPath } = useSiteContent();
  if (!editMode) return null;
  return (
    <button
      type="button"
      onClick={() => removeAtPath(`pricing.plans.${planIndex}.features.${index}`)}
      className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-600/80 text-white"
      aria-label="Remove feature"
    >
      <X className="w-3 h-3" />
    </button>
  );
}

export default function Pricing() {
  const { content } = useSiteContent();
  const section = content.pricing;
  const { geoLocation } = useGeoLocation();

  return (
    <section id="pricing" className="px-3 py-10 sm:px-5 sm:py-20 lg:px-6">
      <div className="mx-auto max-w-[88rem]">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 max-w-3xl px-1 text-white/80 sm:mb-12 sm:px-2"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.24em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">
            <EditableText path="pricing.eyebrow" value={section.eyebrow} as="span" />
          </p>
          <h2 className="text-2xl font-semibold leading-tight text-white min-[390px]:text-3xl sm:text-5xl">
            <EditableText path="pricing.title" value={section.title} as="span" />
          </h2>
        </motion.div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {section.plans.map((plan, index) => (
            <div
              key={plan.title + index}
              className={`pricing-card rounded-2xl border p-5 sm:rounded-[2rem] sm:p-8 ${
                plan.highlight
                  ? "border-purple-400/30 bg-[#1f0a3b]/80"
                  : "border-white/10 bg-[#111111]/85"
              }`}
            >
              <div className="h-full rounded-2xl sm:rounded-[1.75rem]">
                <motion.div
                  initial={false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="flex h-full flex-col"
                >
                  {plan.highlight && (
                    <div className="mb-4 inline-flex w-fit rounded-full border border-purple-400/30 bg-purple-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] text-purple-200">
                      Most requested
                    </div>
                  )}

                  <h3 className="text-xl font-semibold text-white sm:text-2xl">
                    <EditableText path={`pricing.plans.${index}.title`} value={plan.title} as="span" />
                  </h3>
                  <p className="my-4 text-lg font-semibold text-white sm:my-6 sm:text-xl">
                    {geoLocation?.countryCode === "OTHER" && plan.priceUSD ? (
                      <span>${plan.priceUSD}</span>
                    ) : (
                      <EditableText path={`pricing.plans.${index}.price`} value={plan.price} as="span" />
                    )}
                  </p>
                  <p className="mb-4 flex-1 text-sm leading-6 text-white/70 sm:leading-7">
                    <EditableText
                      path={`pricing.plans.${index}.description`}
                      value={plan.description}
                      as="span"
                      multiline
                    />
                  </p>

                  <div className="mb-5 sm:mb-6">
                    <p className="mb-2 text-sm text-white/60">Features</p>
                    <ul className="mb-2 list-inside list-disc space-y-1 text-sm leading-6 text-white/70">
                      {(plan.features || []).map((f: string, fi: number) => (
                        <li key={fi} className="flex items-start justify-between gap-4">
                          <span className="flex-1">
                            <EditableText
                              path={`pricing.plans.${index}.features.${fi}`}
                              value={f}
                              as="span"
                              multiline
                            />
                          </span>
                          <EditFeatureRemove index={fi} planIndex={index} />
                        </li>
                      ))}
                    </ul>

                    <AddFeatureButton planIndex={index} />
                  </div>

                  <Link
                    href="#contact"
                    onClick={(event) => {
                      event.preventDefault();
                      const title = plan.title.toLowerCase();
                      const projectType = title.includes("thumbnail")
                        ? "Thumbnail Design"
                        : title.includes("5-10") || title.includes("long")
                          ? "Long Form Edit"
                          : "Short Form Edit";
                      window.dispatchEvent(new CustomEvent("creativex:project-type", { detail: { projectType } }));
                      scrollToSection("contact");
                    }}
                    className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-full bg-purple-500 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-400"
                  >
                    Start a Project
                  </Link>
                </motion.div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-2xl px-1 text-sm leading-6 text-white/60 sm:mt-10 sm:px-2">
          <EditableText path="pricing.footnote" value={section.footnote} as="span" multiline />
        </p>
      </div>
    </section>
  );
}
