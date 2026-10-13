"use client";

import PageContainer from "@/components/PageContainer";
import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import Stats from "@/components/sections/Stats";
import FeaturedWork from "@/components/sections/FeaturedWork";
import VideoGallery from "@/components/sections/VideoGallery";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import Showcase from "@/components/sections/Showcase";
import Pricing from "@/components/sections/Pricing";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import EditModeBar from "@/components/edit/EditModeBar";
import { SiteContentProvider } from "@/context/SiteContentContext";
import SectionAnalytics, { AnalyticsScripts } from "@/components/Analytics";
import type { SiteContent } from "@/lib/types";

export default function HomePageClient({
  initialContent,
  startInEditMode = false,
}: {
  initialContent: SiteContent;
  startInEditMode?: boolean;
}) {
  return (
    <SiteContentProvider initialContent={initialContent} startInEditMode={startInEditMode}>
      <AnalyticsScripts />
      <SectionAnalytics />
      <PageContainer>
        <EditModeBar />
        <div className="site-3d-content text-white">
          <Navbar />
          <main className="relative overflow-hidden">
            <Hero />
            <Stats />
            <FeaturedWork />
            <VideoGallery />
            <WhyChooseUs />
            <Showcase />
            <Pricing />
            <About />
            <Contact />
          </main>
        </div>
      </PageContainer>
    </SiteContentProvider>
  );
}
