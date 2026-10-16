"use client";

import { useEffect } from "react";
import PageContainer from "@/components/PageContainer";
import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import Stats from "@/components/sections/Stats";
import FeaturedWork from "@/components/sections/FeaturedWork";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import Showcase from "@/components/sections/Showcase";
import Pricing from "@/components/sections/Pricing";
import CustomSections from "@/components/sections/CustomSections";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import SiteFooter from "@/components/SiteFooter";
import EditModeBar from "./edit/EditModeBar";
import EditorInspector from "./edit/EditorInspector";
import { SiteContentProvider, useSiteContent } from "@/context/SiteContentContext";
import SectionAnalytics, { AnalyticsScripts } from "@/components/Analytics";
import type { SiteContent } from "@/lib/types";

function EditorPreview({ children }: { children: React.ReactNode }) {
  const { canvasZoom } = useSiteContent();

  return (
    <div
      className="transition-transform duration-150 ease-out"
      style={{
        transform: `scale(${canvasZoom})`,
        transformOrigin: "top center",
        width: `${100 / canvasZoom}%`,
      }}
    >
      {children}
    </div>
  );
}

export default function HomePageClient({
  initialContent,
  startInEditMode = false,
}: {
  initialContent: SiteContent;
  startInEditMode?: boolean;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem("cxc-return-target");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as { path?: string; scrollY?: number };
      const current = window.location.pathname + window.location.search;
      if (parsed.path !== current) return;
      const scrollY = typeof parsed.scrollY === "number" ? parsed.scrollY : 0;
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: "auto" });
      });
      sessionStorage.removeItem("cxc-return-target");
    } catch {
      sessionStorage.removeItem("cxc-return-target");
    }
  }, []);

  return (
    <SiteContentProvider initialContent={initialContent} startInEditMode={startInEditMode}>
      <AnalyticsScripts />
      <SectionAnalytics />
      <PageContainer>
        <EditModeBar />
        <EditorInspector />
        <Navbar />
        <div className="site-3d-content text-white">
          <EditorPreview>
            <main className="relative overflow-hidden">
              <Hero />
              <Stats />
              <FeaturedWork />
              <WhyChooseUs />
              <Showcase />
              <Pricing />
              <CustomSections />
              <About />
              <Contact />
            </main>
          </EditorPreview>
        </div>
      </PageContainer>
      <SiteFooter
        brandName={initialContent.navbar.brandName}
        founderName={initialContent.founder.name}
        founderRole={initialContent.founder.role}
        founderPhotoUrl={initialContent.founder.photoUrl}
        contactChannels={initialContent.contact.channels}
      />
    </SiteContentProvider>
  );
}
