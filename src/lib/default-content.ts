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
    contactLabel: "Contact Us",
    links: [
      { name: "Library", href: "/library" },
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
    ctaWork: "Explore Work",
    ctaReel: "Play 2026 Demo Reel",
    ctaContact: "Contact Us",
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
    showCategories: true,
    showMetrics: true,
    categories: ["All", "YouTube Long-form", "Shorts & Reels", "Commercial", "Talking Head", "Documentary"],
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
    title: "Video player",
    description:
      "A focused playback space with branded visuals, controls, and a clean layout optimized for every edit.",
    backgroundUrl: "",
    accentColor: "#7C3AED",
    showComments: true,
    showSuggestions: true,
    showPlaybackSettings: true,
    showReferenceButton: true,
    backButtonLabel: "Back to library",
    speedLabel: "Speed",
    qualityLabel: "Quality",
    referenceButtonLabel: "Add as reference",
    commentsTitle: "Comments",
    commentsSortLabel: "Sort by",
    commentsNewestLabel: "Newest first",
    commentsOldestLabel: "Oldest first",
    commentNameLabel: "Your name",
    commentNamePlaceholder: "Your name",
    commentBodyLabel: "Comment",
    commentPlaceholder: "Add a comment...",
    commentSubmitLabel: "Comment",
    commentsPrivacyNote: "Comments are public and tied to this video.",
    commentsEmptyMessage: "No comments yet. Start the conversation.",
    suggestionsTitle: "More to watch",
    suggestionsEmptyMessage: "More published videos will appear here.",
    youtubeQualityMessage: "Use YouTube’s timeline and settings menu to seek and choose an available quality. Playback adapts to your connection.",
    sourceQualityMessage: "Use the video timeline to seek. Playback speed is adjustable; quality depends on the source file.",
    noVideoMessage: "No video selected. Open a project from the site to play it here.",
    commentsLoadingMessage: "Loading comments...",
    commentsUnavailableMessage: "Comments are temporarily unavailable.",
    playButtonLabel: "Play video",
    pauseButtonLabel: "Pause video",
    muteButtonLabel: "Mute video",
    unmuteButtonLabel: "Unmute video",
    fullscreenButtonLabel: "Toggle fullscreen",
    timelineLabel: "Video timeline",
    volumeLabel: "Video volume",
    referenceAddedLabel: "Added to message",
    qualityAutoValue: "Auto · use player menu",
    qualitySourceValue: "Original source",
    currentVideoLabel: "Now playing",
    showChapters: true,
    chaptersTitle: "Editing Breakdown & Chapters",
    chaptersBadgeLabel: "Beats",
    showActiveTechnique: true,
    activeTechniquePrefix: "Active Technique:",
    showSoundShowcase: true,
    soundShowcaseTitle: "Sound Design Showcase",
    soundShowcaseSubtitle: "Toggle audio layers to inspect editing sound design",
    soundShowcaseFullMixLabel: "Full Mix",
    soundShowcaseSfxLabel: "Solo SFX & Voice",
    soundShowcaseBassLabel: "Cinema Bass",
  },
  founder: {
    name: "Dheeraj A",
    role: "Founder & Creative Lead",
    photoUrl: "",
    biography: "Dheeraj A is the founder of CreativeXCreations. He built the site as a home for his video-editing portfolio and services, spanning creator-focused social videos, documentary pieces, motion graphics, and cinematic showcases. The work presented here emphasizes clear storytelling, deliberate pacing, polished visuals, and platform-ready delivery. His stated focus is helping creators present ideas with stronger visual structure and audience retention.",
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
  mediaLibrary: {
    title: "Media Library",
    description:
      "A curated library of published work, visuals, and client-ready edits from the CreativeXCreations portfolio.",
    items: [
      {
        id: "library-video-1",
        title: "Brand Promo Reel",
        description: "A fast-paced promo designed for high relevance across reels and short-form publishing.",
        category: "Social Video",
        type: "video",
        sourceType: "youtube",
        mediaUrl: `https://www.youtube.com/watch?v=${heroId}`,
        thumbnailUrl: youtubeThumbnail(heroId, "hq"),
        published: true,
        featured: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "library-video-2",
        title: "Interview Highlight",
        description: "A polished interview cut with cinematic pacing and clear narrative payoff.",
        category: "Documentary",
        type: "video",
        sourceType: "youtube",
        mediaUrl: `https://www.youtube.com/watch?v=${heroId}`,
        thumbnailUrl: youtubeThumbnail(heroId, "hq"),
        published: true,
        featured: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: "library-photo-1",
        title: "Studio Still",
        description: "A cinematic still from a recent studio-backed creative shoot.",
        category: "Photo",
        type: "photo",
        sourceType: "upload",
        mediaUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80",
        published: true,
        featured: false,
        altText: "Cinematic studio still",
        createdAt: new Date().toISOString(),
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
    tools: ["Premiere Pro", "After Effects", "CapCut"],
    toolLogos: [
      {
        label: "Adobe Premiere Pro",
        src: "/assets/logos/premiere-pro.svg",
        alt: "Adobe Premiere Pro logo",
      },
      {
        label: "Adobe After Effects",
        src: "/assets/logos/after-effects.svg",
        alt: "Adobe After Effects logo",
      },
      {
        label: "CapCut",
        src: "/assets/logos/capcut.svg",
        alt: "CapCut logo",
      },
    ],
    summaryTitle: "Designed to feel premium and performance-ready.",
    summaryText:
      "We help creators convert attention into action, using cinematic motion, meaningful captions, and fast technical delivery.",
    workflowText:
      "Adobe Premiere Pro, After Effects, and CapCut, with consistent creative direction.",
    deliveryText:
      "Fast previews, clear revision rounds, and final export packages optimized for platforms and timelines.",
  },
  contact: {
    badge: "Book a creative review",
    title: "Start your next cinematic project.",
    description:
      "Send the brief, share your creative direction, and we'll respond with the perfect edit strategy for your project.",
    directTitle: "Direct contact",
    directHeading: "Reach CreativeXCreations",
    directDescription: "Prefer to connect directly? Use one of the channels below.",
    channelAction: "Open",
    form: {
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      emailPlaceholder: "you@example.com",
      projectTypeLabel: "Project Type",
      projectTypes: ["Short Form Edit", "Long Form Edit", "Thumbnail Design", "Motion Graphic & Infographic Edit", "Consultation", "Other"],
      subjectLabel: "Subject",
      subjectPlaceholder: "Example: Launch teaser for my brand",
      messageLabel: "Message",
      messagePlaceholder: "Tell us about your project",
      submitLabel: "Send Inquiry",
      successMessage: "Message sent! We’ll get back to you soon.",
    },
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
  editor: {
    elements: {},
  },
};
