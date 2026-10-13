import type { SiteContent } from "./types";
import { youtubeThumbnail } from "./media";

const heroId = "M7aVS1DNa-Q";

export const defaultContent: SiteContent = {
  metadata: {
    title: "CreativeXCreations | Premium Cinematic Video Editing Agency",
    description:
      "High-retention cinematic video edits designed to keep viewers watching. Professional editing services optimized for social media performance, docu-series, and commercials.",
  },
  navbar: {
    brandName: "CREATIVEXCREATIONS",
    logoUrl: "/logo.png",
    links: [
      { name: "Work", href: "#work" },
      { name: "Why Us", href: "#why-us" },
      { name: "Pricing", href: "#pricing" },
      { name: "About", href: "#about" },
    ],
  },
  hero: {
    line1: "Views not reaching",
    line2: "what you expected?",
    punchline: "We got you.",
    subheading:
      "High-retention cinematic edits designed to keep viewers watching, boost viewer retention, and convert traffic into core brand advocates.",
    youtubeVideoId: heroId,
  },
  stats: {
    eyebrow: "Trusted by fast-growing creators",
    title: "The performance credentials behind every edit.",
    items: [
      {
        label: "Unlimited Revisions",
        description:
          "Get it perfect. We refine until you're 100% satisfied with the final cut.",
        icon: "CheckCircle",
      },
      {
        label: "Fast Delivery",
        description: "Turnaround built for launch speed and quality timing.",
        icon: "FastForward",
      },
      {
        label: "Retention-Driven Editing",
        description: "Every cut is designed for watch-through and engagement.",
        icon: "Sparkles",
      },
      {
        label: "Cinematic Quality",
        description:
          "Premium color, motion, and storytelling on every deliverable.",
        icon: "Film",
      },
    ],
  },
  featuredWork: {
    eyebrow: "Featured work",
    title: "Cinematic edits that move audiences and drive retention.",
    items: [
      {
        id: "1",
        title: "Gaming Montage",
        category: "Valorant Cinematic",
        thumbnailUrl: youtubeThumbnail(heroId, "hq"),
        videoUrl: `https://www.youtube.com/watch?v=${heroId}`,
      },
      {
        id: "2",
        title: "Podcast Opener",
        category: "Brand Intro",
        thumbnailUrl: youtubeThumbnail(heroId, "hq"),
        videoUrl: `https://www.youtube.com/watch?v=${heroId}`,
      },
      {
        id: "3",
        title: "Studio Interview",
        category: "Documentary Reel",
        thumbnailUrl: youtubeThumbnail(heroId, "hq"),
        videoUrl: `https://www.youtube.com/watch?v=${heroId}`,
      },
    ],
  },
  whyChooseUs: {
    eyebrow: "Why creators choose us",
    title: "Why creators work with CreativeXCreations.",
    items: [
      {
        title: "Retention-focused Editing",
        description:
          "Every cut, transition, and pacing choice is tuned for hold time and replays.",
        icon: "Sparkles",
      },
      {
        title: "Cinematic Storytelling",
        description:
          "We shape your footage into emotional arcs, reveal beats, and branded impact.",
        icon: "Film",
      },
      {
        title: "Platform Optimized Delivery",
        description:
          "From YouTube to reels, we export formats, pacing, and audio for the right platform.",
        icon: "Globe",
      },
    ],
  },
  showcase: {
    youtubeVideoId: heroId,
    badge: "Showcase: Valorant Cinematic Montage",
    title: "Theater-style cinematic pacing with premium impact.",
    description:
      "A showcase that balances intense action, clear story beats, and polished visual transitions, all tuned for retention and shareability.",
    breakdownTitle: "Editing Breakdown",
    breakdownText:
      "We use layered motion design, selective slow-mo, and branded color grading to create cinematic scope while keeping each beat quick and memorable.",
    pacingTitle: "Pacing Strategy",
    pacingText:
      "Fast opening hooks, clear mid-sequence payoffs, and a powerful ending that anchors the brand identity in the viewer's mind.",
  },
  player: {
    title: "Dedicated player experience",
    description:
      "A focused playback space with branded visuals, controls, and a clean layout optimized for every edit.",
    backgroundUrl: "",
    accentColor: "#7C3AED",
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Packages for creators who want premium velocity and polish.",
    footnote:
      "Prices vary by region. India pricing in INR, International in USD.",
    plans: [
      {
        title: "Reel",
        price: "₹70",
        priceUSD: 20,
        description:
          "Reels, shorts, and vertical teasers with motion graphics, infographic overlays, and professional sound design.",
        features: [
          "Up to 60 seconds",
          "Motion graphics & infographics",
          "Sound design & audio polish",
          "Platform-ready export",
        ],
        highlight: false,
      },
      {
        title: "5-10 Min YouTube Video",
        price: "₹2000",
        priceUSD: 60,
        description:
          "YouTube and long-form content with narrative flow, motion graphics, infographics, and cinematic sound designing.",
        features: [
          "5-10 minutes runtime",
          "Motion graphics & infographics",
          "Professional sound designing",
          "Retention-first structure",
        ],
        highlight: true,
      },
      {
        title: "Thumbnail Design",
        price: "₹300",
        priceUSD: 7,
        description:
          "Eye-catching custom thumbnails designed to maximize click-through rates and viewer engagement.",
        features: [
          "Custom design",
          "Brand-aligned visuals",
          "Multiple variations",
          "High-resolution export",
        ],
        highlight: false,
      },
    ],
  },
  customSections: [],
  videoSection: {
    eyebrow: "Video Library",
    title: "Watch our latest edits and case studies.",
    description:
      "Short previews, case details, and high-retention examples you can share with clients or collaborators.",
    items: [
      {
        id: "video-1",
        title: "Brand Promo Reel",
        category: "Social Video",
        description:
          "A fast-paced promo designed for high engagement across shorts and reels.",
        thumbnailUrl: youtubeThumbnail(heroId, "hq"),
        videoUrl: `https://www.youtube.com/watch?v=${heroId}`,
      },
      {
        id: "video-2",
        title: "Interview Highlight",
        category: "Documentary Cut",
        description:
          "A polished interview highlight with cinematic pacing and sound design.",
        thumbnailUrl: youtubeThumbnail(heroId, "hq"),
        videoUrl: `https://www.youtube.com/watch?v=${heroId}`,
      },
    ],
  },
  about: {
    eyebrow: "About CreativeXCreations",
    title: "Premium editing with brand-first storytelling.",
    paragraph1:
      "CreativeXCreations specializes in cinematic edits for creators who want a premium, results-driven look. We pair strategic pacing, motion design, and platform insight with studio-level polish.",
    paragraph2:
      "Whether you need short-form reels, documentary-style content, or cinematic brand films, we build each project for watch-through, replay value, and emotional impact.",
    tools: ["Premiere Pro", "After Effects", "DaVinci Resolve"],
    summaryTitle: "Designed to feel premium and performance-ready.",
    summaryText:
      "We help creators convert attention into action, using cinematic motion, meaningful captions, and fast technical delivery.",
    workflowText:
      "Adobe Premiere, After Effects, DaVinci Resolve, CapCut options with consistent creative direction.",
    deliveryText:
      "Fast previews, clear revision rounds, and final export packages optimized for platforms and timelines.",
  },
  contact: {
    badge: "Book a creative review",
    title: "Start your next cinematic project.",
    description:
      "Send the brief, share your creative direction, and we'll respond with the perfect edit strategy for your project.",
    channels: [
      {
        label: "Email",
        value: "creativexcreations1@gmail.com",
        href: "mailto:creativexcreations1@gmail.com",
      },
      {
        label: "Instagram",
        value: "@dheeraaj.exe",
        href: "https://www.instagram.com/dheeraaj.exe",
      },
      {
        label: "YouTube",
        value: "creativexcreations",
        href: "https://www.youtube.com/@creativexcreations",
      },
    ],
  },
};
