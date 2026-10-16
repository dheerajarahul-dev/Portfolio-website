"use client";

import { motion } from "framer-motion";
import { Plus, Trash2, CornerUpLeft } from "lucide-react";
import EditableBlock from "../edit/EditableBlock";
import EditableText from "../edit/EditableText";
import EditableImage from "../edit/EditableImage";
import { useSiteContent } from "@/context/SiteContentContext";

function defaultSection() {
  return {
    id: `${Date.now()}`,
    eyebrow: "New section",
    title: "Add a headline here",
    textBlocks: ["Write your first text box here."],
    imageUrl: "",
    imageRounded: true,
    layout: { x: 0, y: 0, scale: 1 },
  };
}

export default function CustomSections() {
  const { content, editMode, insertAtPath, removeAtPath, updatePath } = useSiteContent();
  const sections = content.customSections || [];

  const hasSections = sections.length > 0;

  // Nothing to show for visitors until a section is added in edit mode.
  if (!hasSections && !editMode) return null;

  return (
    <section className="px-3 py-10 sm:px-5 sm:py-20 lg:px-6">
      <div className="mx-auto max-w-[100rem]">
        {hasSections ? (
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">Custom sections</p>
              <h2 className="text-2xl font-semibold leading-tight text-white sm:text-4xl">
                Build page sections in edit mode
              </h2>
            </div>
            {editMode ? (
              <button
                type="button"
                onClick={() => insertAtPath("customSections", defaultSection())}
                className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-500"
              >
                <Plus className="w-4 h-4" /> Add section
              </button>
            ) : null}
          </div>
        ) : editMode ? (
          <div className="mb-10 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#111111]/80 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">
              Custom sections
            </p>
            <p className="text-lg font-semibold text-white">
              Add a custom section to make it appear here.
            </p>
            <button
              type="button"
              onClick={() => insertAtPath("customSections", defaultSection())}
              className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-500"
            >
              <Plus className="w-4 h-4" /> Add section
            </button>
          </div>
        ) : null}

        <div className="space-y-6 sm:space-y-10">
          {sections.map((section, sectionIndex) => (
            <EditableBlock
              key={section.id}
              path={`customSections.${sectionIndex}.layout`}
              defaultLayout={{ x: 0, y: 0, scale: 1 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="grid gap-5 rounded-2xl border border-white/10 bg-[#111111]/80 p-5 sm:gap-8 sm:rounded-[2rem] sm:p-8 lg:grid-cols-[1.2fr_0.8fr]"
              >
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.22em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">
                        <EditableText
                          path={`customSections.${sectionIndex}.eyebrow`}
                          value={section.eyebrow}
                          as="span"
                        />
                      </p>
                      <h3 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">
                        <EditableText
                          path={`customSections.${sectionIndex}.title`}
                          value={section.title}
                          as="span"
                        />
                      </h3>
                    </div>
                    {editMode ? (
                      <button
                        type="button"
                        onClick={() => removeAtPath(`customSections.${sectionIndex}`)}
                        className="inline-flex h-10 w-fit items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 text-sm font-medium text-red-100 hover:bg-red-500/15"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Section
                      </button>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    {(section.textBlocks || []).map((text, textIndex) => (
                      <div key={textIndex} className="rounded-2xl border border-white/10 bg-[#090909]/80 p-4 sm:rounded-3xl sm:p-5">
                        <EditableText
                          path={`customSections.${sectionIndex}.textBlocks.${textIndex}`}
                          value={text}
                          as="p"
                          multiline
                          className="text-white/80"
                        />
                        {editMode ? (
                          <button
                            type="button"
                            onClick={() => removeAtPath(`customSections.${sectionIndex}.textBlocks.${textIndex}`)}
                            className="mt-4 inline-flex items-center gap-2 text-sm text-red-300 hover:text-red-100"
                          >
                            <Trash2 className="w-4 h-4" /> Remove text box
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {editMode ? (
                    <button
                      type="button"
                      onClick={() => insertAtPath(`customSections.${sectionIndex}.textBlocks`, "Add another text box")}
                      className="inline-flex items-center gap-2 rounded-full bg-white/6 px-4 py-3 text-sm font-semibold text-white/90"
                    >
                      <Plus className="w-4 h-4" /> Add text box
                    </button>
                  ) : null}

                  {editMode ? (
                    <button
                      type="button"
                      onClick={() => updatePath(`customSections.${sectionIndex}.imageRounded`, !section.imageRounded)}
                      className="inline-flex items-center gap-2 rounded-full bg-violet-600/90 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500"
                    >
                      <CornerUpLeft className="w-4 h-4" /> {section.imageRounded ? "Square image" : "Round image"}
                    </button>
                  ) : null}
                </div>

                <div className="flex items-center justify-center">
                  <div className="w-full overflow-hidden rounded-[2rem] bg-white/5">
                    <EditableImage
                      path={`customSections.${sectionIndex}.imageUrl`}
                      value={section.imageUrl || ""}
                      className={section.imageRounded ? "rounded-[2rem]" : "rounded-none"}
                    />
                  </div>
                </div>
              </motion.div>
            </EditableBlock>
          ))}
        </div>
      </div>
    </section>
  );
}
