import type { ContactMessage } from "./types";

export type AiTone =
  | "balanced"
  | "confident"
  | "casual"
  | "agency"
  | "express"
  | "negotiate";

export type ProductionDomain =
  | "youtube_longform"
  | "youtube_gaming"
  | "youtube_doc_essay"
  | "youtube_lifestyle_vlog"
  | "youtube_finance_tech"
  | "shorts_reels_tiktok"
  | "podcast_repurpose"
  | "commercial_brand"
  | "product_ecommerce"
  | "real_estate"
  | "corporate_saas"
  | "music_video"
  | "wedding_event"
  | "trailer_cinematic"
  | "color_grade_specialist"
  | "sound_design_specialist"
  | "motion_graphics_vfx"
  | "multicam_podcast"
  | "monthly_retainer"
  | "general_cinematic";

export interface DomainProfile {
  id: ProductionDomain;
  label: string;
  category: "YouTube" | "Short-Form" | "Commercial" | "Specialist" | "Cinematic";
  headlinePrefix: string;
  headlineAccent: string;
  keywords: RegExp[];
  typicalTimeline: string;
  typicalInvestment: string;
  deliverables: string[];
  suggestedSteps: string[];
  ctaLabel: string;
  corePitch: (clientName: string, subject: string, extracted: ExtractedEntities) => string;
}

export interface ExtractedEntities {
  detectedBudget?: string;
  detectedDeadline?: string;
  detectedVolume?: string;
  detectedLinks: string[];
  needsSound: boolean;
  needsColor: boolean;
  needsMotion: boolean;
  isUrgent: boolean;
  asksPricing: boolean;
  asksRetainer: boolean;
  hasFootageReady: boolean;
}

export interface AiGeneratedProposal {
  domain: ProductionDomain;
  domainLabel: string;
  confidenceScore: number;
  extracted: ExtractedEntities;
  analysisTags: string[];
  headline: string;
  headlineAccent: string;
  reply: string;
  timeline: string;
  investment: string;
  deliverables: string;
  steps: string[];
  primaryLabel: string;
  primaryUrl: string;
}

/**
 * Encyclopedic knowledge base of video production domains, technical specifications,
 * editing methodologies, industry metrics, and client response templates.
 */
export const DOMAIN_PROFILES: Record<ProductionDomain, DomainProfile> = {
  youtube_longform: {
    id: "youtube_longform",
    label: "YouTube Long-form",
    category: "YouTube",
    headlinePrefix: "High-Retention Visual Architecture for",
    headlineAccent: "Your YouTube Channel.",
    keywords: [/youtube/, /long[- ]?form/, /channel/, /subscriber/, /watch[- ]?time/, /ctr/, /retention/],
    typicalTimeline: "3–4 Business Days per Episode",
    typicalInvestment: "$180 – $380 per video (Retainer rates available)",
    deliverables: [
      "Full 4K High-Bitrate Master",
      "Dynamic 30-Second Hook Cut",
      "High-CTR Thumbnail Concept Stills",
      "Interactive YouTube Chapters & Timestamps",
      "Clean Split Audio (Dialogue, SFX, Music)",
    ],
    suggestedSteps: [
      "Share raw footage link (Google Drive / Dropbox / Frame.io) + reference video",
      "First rough cut review for story pacing, narrative flow & retention beats",
      "Layered sound design, color grade, motion graphics & final 4K delivery",
    ],
    ctaLabel: "Share YouTube Footage Link",
    corePitch: (name, subject, ext) =>
      `On YouTube, viewer retention in the first 30 seconds dictates whether the algorithm promotes your video or buries it. My editing workflow is engineered around retention psychology: kinetic pacing, curiosity loops, dynamic punch-ins, and pattern interrupts that consistently push average percentage viewed (APV) past 60–75%.${
        ext.needsSound ? "\n\nI layer bespoke audio cues (whooshes, risers, atmospheric bed, vocal leveling) to give every visual edit physical impact." : ""
      }`,
  },

  youtube_gaming: {
    id: "youtube_gaming",
    label: "YouTube Gaming & Stream",
    category: "YouTube",
    headlinePrefix: "High-Energy Kinetic Editing for Your",
    headlineAccent: "Gaming Channel.",
    keywords: [/gaming/, /gameplay/, /stream/, /twitch/, /let'?s play/, /valorant/, /minecraft/, /gta/, /fortnite/, /funny moments/, /clutch/],
    typicalTimeline: "2–3 Business Days",
    typicalInvestment: "$150 – $280 per video",
    deliverables: [
      "Kinetic 1080p/4K Gaming Master",
      "Meme Zoom Punch-Ins & SFX Sync",
      "Animated Discord/Twitch Chat Popups",
      "Subtitles with Custom Tracking",
      "Shorts / TikTok Highlight Cutdown",
    ],
    suggestedSteps: [
      "Send VOD / Stream recording link + highlight timestamps",
      "Rough cut assembly focusing on pacing, peak reactions & humor",
      "Sound design layering, meme cutaways, captions & final render",
    ],
    ctaLabel: "Send Stream / VOD Link",
    corePitch: (name, subject) =>
      `Gaming audiences have zero tolerance for dead air or boring transitions. I cut long stream recordings into fast-paced, high-voltage videos with perfectly timed comedic zooms, audio soundbites, tracked kinetic text, and intense clutch pacing that keep viewers engaged from intro to outro.`,
  },

  youtube_doc_essay: {
    id: "youtube_doc_essay",
    label: "Video Essay & Documentary",
    category: "YouTube",
    headlinePrefix: "Cinematic Research & Storytelling for",
    headlineAccent: "Your Documentary.",
    keywords: [/video essay/, /documentary/, /docuseries/, /investigative/, /deep dive/, /storytelling/, /historical/, /analysis/, /case study/],
    typicalTimeline: "5–8 Business Days",
    typicalInvestment: "$350 – $750 per episode",
    deliverables: [
      "Cinematic 4K Master Render",
      "Motion Paper / Archival Document Popouts",
      "Parallax 2.5D Photo Animation (Ken Burns)",
      "Bespoke Atmospheric Soundscape & Foley",
      "Broadcast Standard Audio Leveling (-14 LUFS)",
    ],
    suggestedSteps: [
      "Review script, voiceover audio track & initial archival sources",
      "Assembly cut with A/B roll alignment and emotional narrative pacing",
      "2.5D photo animation, paper textures, sound design & final color grade",
    ],
    ctaLabel: "Share Script & Voiceover",
    corePitch: (name, subject) =>
      `Documentary and video essay editing requires deep narrative pacing, visual evidence staging, and cinematic immersion. I build custom 2.5D photo parallax animations, motion paper/newspaper document pop-outs, vintage film overlays, and moody atmospheric soundscapes that turn complex research into a visual masterpiece.`,
  },

  youtube_lifestyle_vlog: {
    id: "youtube_lifestyle_vlog",
    label: "Cinematic Lifestyle & Vlog",
    category: "YouTube",
    headlinePrefix: "Filmic Pacing & Color Treatment for Your",
    headlineAccent: "Lifestyle Story.",
    keywords: [/vlog/, /lifestyle/, /travel/, /daily/, /aesthetic/, /cinematic travel/, /tokyo/, /paris/, /montage/, /b-roll/],
    typicalTimeline: "3–4 Business Days",
    typicalInvestment: "$180 – $320 per vlog",
    deliverables: [
      "Filmic 4K Master with 2.39:1 / 16:9 Framing",
      "Music Beat-Matched Montage Sequences",
      "Warm Organic Film Emulation (Kodak/Fuji look)",
      "Ambient Environmental Audio Enhancement",
      "Reels / Shorts Highlight Promo",
    ],
    suggestedSteps: [
      "Upload raw vlog footage + music track preferences",
      "Narrative pacing pass: trimming rambling, enhancing golden moments",
      "Beat-synced montages, filmic LUT color grade & audio mastering",
    ],
    ctaLabel: "Upload Vlog Footage",
    corePitch: (name) =>
      `Vlogs should feel effortless, personal, and cinematic. I take hours of unstructured handheld footage and sculpt an authentic story with rhythmic music synchronization, organic film color grading, subtle sound design, and pacing that highlights your personality without dragging.`,
  },

  youtube_finance_tech: {
    id: "youtube_finance_tech",
    label: "Finance, Tech & Educational",
    category: "YouTube",
    headlinePrefix: "Data Visuals & Authority Editing for",
    headlineAccent: "Your Business Channel.",
    keywords: [/finance/, /crypto/, /stocks/, /trading/, /tech review/, /unboxing/, /software/, /saas/, /educational/, /tutorial/, /business/],
    typicalTimeline: "3–5 Business Days",
    typicalInvestment: "$220 – $450 per video",
    deliverables: [
      "4K Crisp Master with Custom Brand Lower Thirds",
      "Animated Stock Charts & Financial Graphics",
      "Clean Screen Recording Zooms & Smooth Panning",
      "Clear Studio Vocal EQ & De-Reverb",
      "High-CTR Thumbnail Frames",
    ],
    suggestedSteps: [
      "Receive A-roll talking head + screen captures and script notes",
      "First pass: tighten pauses, add smooth screen zooms and graphic popups",
      "Color conform, clean lower thirds, sound risers & final 4K export",
    ],
    ctaLabel: "Send Footage & Script Notes",
    corePitch: (name) =>
      `In business and tech content, authority and visual clarity are everything. I replace boring slides with dynamic motion infographics, smooth screen capture camera moves, clean typography callouts, and pristine vocal clarity that keep high-value viewers watching.`,
  },

  shorts_reels_tiktok: {
    id: "shorts_reels_tiktok",
    label: "Shorts, TikTok & Reels",
    category: "Short-Form",
    headlinePrefix: "Scroll-Stopping Hook Architecture for",
    headlineAccent: "Short-Form Video.",
    keywords: [/shorts/, /tiktok/, /reels?/, /vertical/, /9:16/, /short[- ]form/, /micro content/, /hormozi/, /caption/, /subtitles?/],
    typicalTimeline: "24–48 Hours (Batch options available)",
    typicalInvestment: "$40 – $90 per Short / $350 for 10-Pack",
    deliverables: [
      "Vertical 9:16 High-Bitrate Master",
      "Custom Colored Kinetic Subtitles (Hormozi style)",
      "High-Velocity B-Roll Cutaways & Emojis",
      "Sound Design Drops & Riser Accents",
      "Loop Transition for High Re-watch Percentage",
    ],
    suggestedSteps: [
      "Send raw video clips or timestamps from long-form content",
      "Draft cuts with 1.5-second visual hook, animated text & pacing",
      "Revisions and batch delivery ready for direct upload",
    ],
    ctaLabel: "Start Short-Form Batch",
    corePitch: (name) =>
      `Vertical short-form video is decided in the first 1.5 seconds. I design scroll-stopping visual hooks, custom colored word-by-word kinetic captions, contextual emojis, motion sound effects, and seamless loop transitions that maximize retention and loop counts across TikTok, Instagram Reels, and YouTube Shorts.`,
  },

  podcast_repurpose: {
    id: "podcast_repurpose",
    label: "Podcast Repurposing Suite",
    category: "Short-Form",
    headlinePrefix: "Turn Long Podcasts into Viral Highlights for",
    headlineAccent: "Your Show.",
    keywords: [/podcast/, /interview/, /repurpose/, /conversation/, /episodes?/, /guest/, /show/, /audio to video/],
    typicalTimeline: "2–4 Business Days",
    typicalInvestment: "Per-Episode Package: Master + 5–10 Shorts ($250 – $550)",
    deliverables: [
      "Full Multi-Cam Master Episode Edit",
      "5 to 10 Viral Vertical Shorts (9:16)",
      "Speaker-Tracking Dynamic Framing",
      "Studio Vocal Mastering (de-bleed, de-reverb, LUFS conform)",
      "Custom Show Intro / Outro & Lower Thirds",
    ],
    suggestedSteps: [
      "Upload full podcast audio & multi-cam footage",
      "Select viral highlight moments or let AI identify peak insights",
      "Produce full master + vertical short bundle with captions & sound",
    ],
    ctaLabel: "Submit Podcast Audio & Footage",
    corePitch: () =>
      `A 1-hour podcast contains dozens of viral moments waiting to be discovered. I edit your full multi-camera master show with dynamic speaker switching and audio mastering, while cutting 5 to 10 high-impact vertical shorts with kinetic captions ready to distribute across TikTok, Reels, and YouTube Shorts.`,
  },

  commercial_brand: {
    id: "commercial_brand",
    label: "Commercial & Brand Film",
    category: "Commercial",
    headlinePrefix: "High-Production Commercial Post-Production for",
    headlineAccent: "Your Brand Campaign.",
    keywords: [/commercial/, /ad\b/, /advertisement/, /brand/, /campaign/, /agency/, /marketing/, /promo video/, /tv spot/, /broadcast/],
    typicalTimeline: "4–6 Business Days",
    typicalInvestment: "$450 – $1,200 (Custom Agency / Brand Package)",
    deliverables: [
      "16:9 Broadcast Quality Master (ProRes 422 HQ / 4K MP4)",
      "Social Ad Cutdowns (9:16 Vertical, 1:1 Square, 4:5 Feed)",
      "Full Film LUT Color Grade & Color Match",
      "Commercial Sound Design & Stem Mix (Music, SFX, Voice)",
      "Subtitle Burn-ins & Clean Master Deliverables",
    ],
    suggestedSteps: [
      "Creative brief & brand guideline alignment (fonts, logos, color codes)",
      "Rough cut assembly with music placement and rhythm locking",
      "Color grading, motion graphics, audio mix & multi-aspect exports",
    ],
    ctaLabel: "Share Commercial Brief",
    corePitch: (name) =>
      `Commercial advertising demands precision pacing, color accuracy, and sound design that commands authority. I provide agency-grade editorial with clean split audio stems (Dialogue, Foley, Music), color conform matching your brand identity, and multi-ratio deliverables optimized for paid ad performance.`,
  },

  product_ecommerce: {
    id: "product_ecommerce",
    label: "E-Commerce & DTC Product Video",
    category: "Commercial",
    headlinePrefix: "Conversion-Focused Product Video for",
    headlineAccent: "High-Performing Ads.",
    keywords: [/product/, /ecommerce/, /shopify/, /dtc/, /amazon/, /unboxing/, /dropshipping/, /product video/, /gadget/, /apparel/],
    typicalTimeline: "3–4 Business Days",
    typicalInvestment: "$250 – $600 per product campaign",
    deliverables: [
      "High-Converting 15s & 30s Ad Variants",
      "Dynamic Speed Ramps & Macro Visual Enhancements",
      "Benefit Callouts & Spec Graphic Badges",
      "Punchy CTA Animation & Discount Banners",
      "A/B Hook Variations for Paid Media Testing",
    ],
    suggestedSteps: [
      "Share product footage, features list & target audience demographics",
      "Edit primary conversion hook, problem/solution structure & CTA",
      "Add feature badges, sound risers, speed ramps & ad aspect ratios",
    ],
    ctaLabel: "Send Product Footage & Specs",
    corePitch: () =>
      `E-commerce ads live or die by customer acquisition cost. I edit high-converting DTC product films that hook impulse buyers in 3 seconds, showcase key features through rhythmic speed ramps and macro closeups, and drive immediate click-throughs to checkout.`,
  },

  real_estate: {
    id: "real_estate",
    label: "Real Estate & Architecture",
    category: "Commercial",
    headlinePrefix: "Luxury Property Video & Walkthrough for",
    headlineAccent: "Your Listing.",
    keywords: [/real estate/, /property/, /realtor/, /listing/, /walkthrough/, /architecture/, /drone/, /interior design/, /mansion/, /luxury/],
    typicalTimeline: "2–3 Business Days",
    typicalInvestment: "$180 – $380 per property",
    deliverables: [
      "4K Luxury Walkthrough Master",
      "Drone Footage Speed-Ramping & Sky Replacement",
      "Smooth Gimbal Micro-Stabilization",
      "Property Spec Callouts (Sq ft, Beds/Baths, Price, Agent Info)",
      "Instagram Reel / TikTok Teaser (9:16)",
    ],
    suggestedSteps: [
      "Upload interior/exterior camera footage + drone video clips",
      "Stabilization pass, fluid architectural speed ramps & room flow",
      "Color treatment, sky enhancement, agent branding & delivery",
    ],
    ctaLabel: "Upload Listing Footage",
    corePitch: () =>
      `Luxury property marketing requires seamless flow, natural light enhancement, and elegant pacing. I smooth out camera motion, add architectural speed ramps, balance indoor/outdoor exposures, and deliver cinematic walkthroughs that attract high-net-worth buyers.`,
  },

  corporate_saas: {
    id: "corporate_saas",
    label: "Corporate & SaaS Explainer",
    category: "Commercial",
    headlinePrefix: "Sleek SaaS & Enterprise Video for",
    headlineAccent: "Your Software Launch.",
    keywords: [/saas/, /software/, /corporate/, /app demo/, /explainer/, /platform/, /b2b/, /enterprise/, /dashboard/, /onboarding/],
    typicalTimeline: "4–6 Business Days",
    typicalInvestment: "$350 – $800",
    deliverables: [
      "4K Crisp Software Demo Master",
      "Smooth Synthetic Mouse Movement & 3D UI Zooms",
      "Clean Motion Design Lower Thirds & Feature Badges",
      "Voiceover De-Noise & Clean Audio Master",
      "Website Hero Background Loop (Clean, textless)",
    ],
    suggestedSteps: [
      "Share screen recordings, brand vector assets (SVG) & voiceover",
      "Add kinetic UI cursor movements, zoom focus & feature cards",
      "Final sound effects, music bed sync & export",
    ],
    ctaLabel: "Send SaaS Recordings & Brief",
    corePitch: () =>
      `Software demos should never feel flat. I transform screen captures into sleek, animated product presentations with smooth cursor tracking, 3D UI perspective tilts, feature callouts, and modern sound design that makes your software look like a billion-dollar platform.`,
  },

  music_video: {
    id: "music_video",
    label: "Music Video Post-Production",
    category: "Cinematic",
    headlinePrefix: "Rhythmic Flow & Stylized VFX for",
    headlineAccent: "Your Music Video.",
    keywords: [/music video/, /song/, /rapper/, /artist/, /track/, /beat match/, /trippy/, /datamosh/, /music clip/, /vfx/],
    typicalTimeline: "4–7 Business Days",
    typicalInvestment: "$300 – $750",
    deliverables: [
      "Frame-Accurate Beat-Matched Master (4K)",
      "Stylized Visual Effects (Datamosh, Film Burns, Speed Ramps)",
      "High-Contrast Stylized Film Color Grade",
      "Lip-Sync Micro-Alignment across Multiple Performance Takes",
      "Vertical Teaser Trailers for Instagram & TikTok",
    ],
    suggestedSteps: [
      "Upload master audio track + performance and narrative video takes",
      "Lip-sync timeline conform & high-energy assembly cut",
      "VFX transitions, film texture grading & final export",
    ],
    ctaLabel: "Send Song & Footage",
    corePitch: () =>
      `Music videos require intuition for musical rhythm, visual tempo, and stylized effects. I sync multiple performance takes to the millisecond, execute beat-matched speed ramps, datamosh transitions, and film emulation that give your music video undeniable swagger.`,
  },

  wedding_event: {
    id: "wedding_event",
    label: "Wedding & Event Cinema",
    category: "Cinematic",
    headlinePrefix: "Emotional Highlights & Cinematic Cinema for",
    headlineAccent: "Your Wedding Film.",
    keywords: [/wedding/, /bride/, /groom/, /ceremony/, /vows/, /event/, /gala/, /anniversary/, /party/],
    typicalTimeline: "5–10 Business Days",
    typicalInvestment: "$400 – $950",
    deliverables: [
      "Cinematic Wedding Highlight Film (3–7 mins)",
      "60-Second Social Teaser for Instagram (9:16)",
      "Full Ceremony & Speech Audio Clean & Sync",
      "Emotional Organic Color Grade",
      "Delivered in 4K ProRes & Master MP4",
    ],
    suggestedSteps: [
      "Upload multicam footage from prep, ceremony, and reception",
      "Vow and speech audio extraction for narrative backbone",
      "Color grading, emotional music sync & final cinematic master",
    ],
    ctaLabel: "Upload Wedding Clips",
    corePitch: () =>
      `Wedding films are timeless family heirlooms. I weave emotional vows, natural ambient recordings, and cinematic visuals into a tear-jerking highlight film with organic skin tones, lush color, and pacing that captures the real emotion of the day.`,
  },

  trailer_cinematic: {
    id: "trailer_cinematic",
    label: "Cinematic Trailer & Teaser",
    category: "Cinematic",
    headlinePrefix: "High-Tension Cinematic Teaser for",
    headlineAccent: "Your Project.",
    keywords: [/trailer/, /teaser/, /coming soon/, /hype/, /drop/, /premiere/, /film teaser/, /cinema/],
    typicalTimeline: "3–5 Business Days",
    typicalInvestment: "$300 – $650",
    deliverables: [
      "High-Tension 4K Trailer Master",
      "Sound Design Riser Builds, Hits & Sub-Bass Drops",
      "3D Title Card Animation & Taglines",
      "Custom 15s & 30s Social Cutdowns",
    ],
    suggestedSteps: [
      "Review source footage and key narrative reveal moments",
      "Build audio spine with trailer risers, drum impacts & cliffhanger stop",
      "Color treatment, animated titles & final delivery",
    ],
    ctaLabel: "Send Footage for Trailer",
    corePitch: () =>
      `A great trailer doesn't just show clips; it builds overwhelming anticipation. I design trailer pacing around thunderous sound design risers, sub-bass impacts, rhythmic black pauses, and cinematic title cards that give audiences chills and leave them wanting more.`,
  },

  color_grade_specialist: {
    id: "color_grade_specialist",
    label: "Color Grading & Look Dev",
    category: "Specialist",
    headlinePrefix: "DaVinci Resolve Color Grade & Film Look for",
    headlineAccent: "Your Production.",
    keywords: [/color grade/, /colorist/, /davinci/, /lut/, /log/, /raw/, /skin tone/, /rec\.?709/, /film look/, /kodak/],
    typicalTimeline: "2–4 Business Days",
    typicalInvestment: "$150 – $400 per project",
    deliverables: [
      "Conformed DaVinci Resolve Project / XML Roundtrip",
      "Shot-to-Shot Color & Exposure Matching",
      "Natural Healthy Skin Tone Separation",
      "Film Emulation Print Halation, Grain & Look Dev",
      "Clean 4K Master Deliverable (ProRes 4444 / 422 HQ)",
    ],
    suggestedSteps: [
      "Export XML/EDL from your NLE (Premiere/FCP/DaVinci) + raw camera media",
      "Color balance, exposure conform & custom look development",
      "Shot matching, skin tone isolation & final render roundtrip",
    ],
    ctaLabel: "Send XML & Media",
    corePitch: () =>
      `Color grading is what transforms digital sensor data into cinema. Using DaVinci Resolve Studio with a calibrated color workflow, I balance cameras, sculpt natural skin tones, and build custom film print emulation (halation, subtle gate weave, subtractive saturation) that gives your footage unmistakable depth.`,
  },

  sound_design_specialist: {
    id: "sound_design_specialist",
    label: "Sound Design & Audio Mix",
    category: "Specialist",
    headlinePrefix: "Bespoke Foley, Audio Mix & Mastering for",
    headlineAccent: "Your Locked Cut.",
    keywords: [/sound design/, /audio/, /foley/, /sound edit/, /audio mix/, /izotope/, /noise reduction/, /de-reverb/, /master audio/],
    typicalTimeline: "2–3 Business Days",
    typicalInvestment: "$150 – $350",
    deliverables: [
      "Layered Sound Design Track with Custom Foley & Whooshes",
      "iZotope RX Vocal Restoration (De-noise, De-reverb, De-clip)",
      "Master Audio Stems (DX Dialogue, FX Foley, MX Music)",
      "Standardized Loudness Conform (-14 LUFS for Web, -24 LUFS Broadcast)",
      "Stereo & 5.1 Surround Available",
    ],
    suggestedSteps: [
      "Send picture-locked video file + OMF/AAF audio export",
      "Clean dialogues and build multi-layered Foley soundscape",
      "Master loudness, mix stems and export final audio files",
    ],
    ctaLabel: "Send OMF / Video for Audio Polish",
    corePitch: () =>
      `Audio represents 50% of the viewer's perceived production quality. I take your picture-locked timeline and build multi-layered atmospheric sound design, dynamic risers, tape stops, and crisp vocal mastering with iZotope RX so every beat hits with visceral clarity.`,
  },

  motion_graphics_vfx: {
    id: "motion_graphics_vfx",
    label: "Motion Graphics & 2D/3D VFX",
    category: "Specialist",
    headlinePrefix: "Kinetic Motion Graphics & VFX for",
    headlineAccent: "Your Visuals.",
    keywords: [/motion graphics/, /animation/, /after effects/, /vfx/, /3d/, /titles/, /intro/, /lower third/, /kinetic typography/, /logo reveal/],
    typicalTimeline: "3–5 Business Days",
    typicalInvestment: "$200 – $550",
    deliverables: [
      "Bespoke After Effects Kinetic Title Package",
      "Transparent Alpha (ProRes 4444) Overlays for Easy NLE Drag-and-Drop",
      "Custom Lower Thirds, Intro & Outro Stems",
      "Screen Replacements & Cleanup / Object Removal",
    ],
    suggestedSteps: [
      "Share brand assets (vector AI/SVG, logos, brand fonts) & visual refs",
      "Design styleframes & motion storyboard preview",
      "Render transparent animation files ready to integrate",
    ],
    ctaLabel: "Share Vector Assets & Brief",
    corePitch: () =>
      `Professional motion graphics elevate videos into polished brand experiences. I create custom kinetic typography, vector animations, clean logo stings, and visual effects in After Effects, delivered with transparent alpha channels for seamless timeline integration.`,
  },

  multicam_podcast: {
    id: "multicam_podcast",
    label: "Multi-Cam Sync & Editing",
    category: "Specialist",
    headlinePrefix: "Seamless Multi-Camera Sync & Switching for",
    headlineAccent: "Your Production.",
    keywords: [/multi[- ]?cam/, /sync/, /multiple cameras/, /angles/, /switching/, /3 cameras/, /live show/],
    typicalTimeline: "2–4 Business Days",
    typicalInvestment: "$180 – $400 per session",
    deliverables: [
      "Timecode-Accurate Multi-Cam Synchronized Master",
      "Intelligent Speaker-Detection Camera Switching",
      "Split Audio Alignment & Mic Bleed Elimination",
      "Color Matching Across Different Camera Models",
    ],
    suggestedSteps: [
      "Upload multi-angle footage files + separate audio tracks",
      "Synchronize timecode / waveforms and balance color profiles",
      "Execute multi-cam cuts with smooth transitions & export",
    ],
    ctaLabel: "Upload Multi-Camera Files",
    corePitch: () =>
      `Managing multi-camera shoots requires precise waveform synchronization, camera color matching, and natural dialogue switching. I sync multiple camera angles, eliminate mic bleed, and execute seamless speaker switches that keep the conversation engaging.`,
  },

  monthly_retainer: {
    id: "monthly_retainer",
    label: "Monthly Retainer & Creator Partnership",
    category: "Specialist",
    headlinePrefix: "Dedicated Ongoing Video Production Retainer for",
    headlineAccent: "Consistent Growth.",
    keywords: [/retainer/, /monthly/, /weekly/, /ongoing/, /contract/, /partnership/, /batch/, /multiple videos/, /per month/, /regular editor/],
    typicalTimeline: "Guaranteed Turnaround per video (2–3 Days)",
    typicalInvestment: "$800 – $2,500 / month (Discounted volume tier)",
    deliverables: [
      "Guaranteed Dedicated Production Slot (4–8 Long-form + 16–30 Shorts)",
      "Priority Same-Day Communication & Dedicated Slack/Discord Channel",
      "Strict 48-Hour Turnaround on First Cuts",
      "Thumbnails, Titles, and Social Asset Bundle Included",
      "Continuous Retention Iteration & Analytics Optimization",
    ],
    suggestedSteps: [
      "Discovery call to define monthly volume and publishing schedule",
      "Shared Frame.io & Google Drive folder setup for smooth workflows",
      "Weekly asset handoff and rapid delivery cycle",
    ],
    ctaLabel: "Schedule Retainer Onboarding Call",
    corePitch: (name) =>
      `Consistency is the secret to scaling on digital platforms. With a dedicated monthly editing partnership, you lock in priority turnaround times, guaranteed delivery dates, and an editor who intimately learns your brand, pacing, and visual style without needing to re-brief on every video.`,
  },

  general_cinematic: {
    id: "general_cinematic",
    label: "Cinematic Video Editing",
    category: "Cinematic",
    headlinePrefix: "Tailored Cinematic Post-Production for",
    headlineAccent: "Your Project.",
    keywords: [/video/, /edit/, /cinematic/, /production/, /creative/],
    typicalTimeline: "3–5 Business Days",
    typicalInvestment: "Tailored to scope & runtime",
    deliverables: [
      "Full 4K High-Bitrate Master Video",
      "Custom Color Grading & Look Development",
      "Layered Foley Sound Effects & Music Mix",
      "2 Structured Revision Rounds",
    ],
    suggestedSteps: [
      "Share footage link and creative reference examples",
      "First cut assembly with pacing and story alignment",
      "Sound design, color treatment, and final master delivery",
    ],
    ctaLabel: "Share Project Assets",
    corePitch: (name, subject) =>
      `I specialize in high-retention cinematic video editing. Every cut includes custom narrative pacing, organic color grading, and layered Foley sound effects designed to captivate your audience and elevate your brand image.`,
  },
};

/**
 * Deep Entity Extractor:
 * Parses numbers, currencies, URLs, deadlines, volume, and technical keywords.
 */
export function extractInquiryEntities(message: ContactMessage): ExtractedEntities {
  const text = `${message.subject || ""} ${message.projectType || ""} ${message.message || ""}`;

  // Extract budget
  const budgetMatch = text.match(/\$[\d,]+(\.\d{2})?|\b\d{2,5}\s*(usd|dollars|inr|eur|gbp|bucks)\b/i);
  const detectedBudget = budgetMatch ? budgetMatch[0] : undefined;

  // Extract deadlines
  const deadlineMatch = text.match(
    /\b(asap|today|tomorrow|by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)|this\s+week|next\s+week|urgent|within\s+\d+\s*(days|hours)|deadline\s*(is|:)?\s*[\w\d\s]+)\b/i
  );
  const detectedDeadline = deadlineMatch ? deadlineMatch[0] : undefined;

  // Extract volume
  const volumeMatch = text.match(/\b(\d+)\s*(videos?|episodes?|shorts?|reels?|clips?|tiktoks?)\b/i);
  const detectedVolume = volumeMatch ? volumeMatch[0] : undefined;

  // Extract links
  const urlMatches = text.match(/https?:\/\/[^\s]+/gi) || [];
  const detectedLinks = Array.from(new Set(urlMatches));

  const lower = text.toLowerCase();

  return {
    detectedBudget,
    detectedDeadline,
    detectedVolume,
    detectedLinks,
    needsSound: /sound|audio|sfx|foley|music|voice|bass|mic/.test(lower),
    needsColor: /color|grade|lut|davinci|log|raw|exposure/.test(lower),
    needsMotion: /motion|graphic|animation|subtitle|caption|typography|3d|vfx|hormozi/.test(lower),
    isUrgent: /urgent|asap|rush|fast|quick|deadline|emergency|tomorrow/.test(lower),
    asksPricing: /price|pricing|quote|cost|rate|budget|how much|\$|charge/.test(lower),
    asksRetainer: /retainer|monthly|weekly|ongoing|partnership|regularly|contract/.test(lower),
    hasFootageReady: /drive|dropbox|wetransfer|footage|raw|shot|ready|assets|uploaded/.test(lower),
  };
}

/**
 * Advanced Classifier:
 * Scores each production profile against the client's message to pick the exact
 * matching domain, with confidence rating.
 */
export function classifyInquiryDomain(message: ContactMessage): {
  bestDomain: ProductionDomain;
  confidence: number;
  extracted: ExtractedEntities;
} {
  const extracted = extractInquiryEntities(message);
  const text = `${message.subject || ""} ${message.projectType || ""} ${message.message || ""}`.toLowerCase();

  let topDomain: ProductionDomain = "general_cinematic";
  let maxScore = 0;

  for (const [key, profile] of Object.entries(DOMAIN_PROFILES)) {
    let score = 0;
    for (const kw of profile.keywords) {
      if (kw.test(text)) {
        score += 2;
      }
    }
    // Boost matching projectType
    if (message.projectType && profile.label.toLowerCase().includes(message.projectType.toLowerCase())) {
      score += 4;
    }

    if (score > maxScore) {
      maxScore = score;
      topDomain = key as ProductionDomain;
    }
  }

  // Fallbacks based on key terms
  if (maxScore < 2) {
    if (extracted.asksRetainer) topDomain = "monthly_retainer";
    else if (message.projectType?.toLowerCase().includes("youtube")) topDomain = "youtube_longform";
    else if (message.projectType?.toLowerCase().includes("short")) topDomain = "shorts_reels_tiktok";
    else if (message.projectType?.toLowerCase().includes("commercial")) topDomain = "commercial_brand";
    else topDomain = "general_cinematic";
  }

  const confidence = Math.min(100, Math.max(30, maxScore * 15));
  return { bestDomain: topDomain, confidence, extracted };
}

/**
 * Master AI Proposal Generator:
 * Creates hyper-personalized, context-aware proposals that weave in detected budget,
 * deadlines, specific client questions, custom user directives, and tone modulation.
 */
export function generateAdvancedAiProposal(
  message: ContactMessage,
  options: {
    domainOverride?: ProductionDomain;
    tone?: AiTone;
    customPrompt?: string;
    senderName?: string;
    senderRole?: string;
    senderEmail?: string;
  } = {}
): AiGeneratedProposal {
  const { domainOverride, tone = "balanced", customPrompt = "", senderName = "Dheeraj A", senderRole = "Lead Video Editor", senderEmail = "dheeraj@gmail.com" } = options;

  const classification = classifyInquiryDomain(message);
  const activeDomain = domainOverride || classification.bestDomain;
  const profile = DOMAIN_PROFILES[activeDomain];
  const ext = classification.extracted;

  const analysisTags: string[] = [profile.label];
  if (ext.detectedBudget) analysisTags.push(`Budget: ${ext.detectedBudget}`);
  if (ext.detectedDeadline) analysisTags.push(`Deadline: ${ext.detectedDeadline}`);
  if (ext.detectedVolume) analysisTags.push(`Volume: ${ext.detectedVolume}`);
  if (ext.needsSound) analysisTags.push("Sound Heavy");
  if (ext.needsMotion) analysisTags.push("Kinetic Motion");
  if (ext.isUrgent) analysisTags.push("⚡ Urgent Priority");
  if (ext.asksRetainer) analysisTags.push("Retainer Client");

  let timeline = profile.typicalTimeline;
  if (ext.detectedDeadline) {
    timeline = `Targeted Delivery: ${ext.detectedDeadline} (Express Sync)`;
  } else if (ext.isUrgent) {
    timeline = "24–48 Hours (Express Priority Queue)";
  }

  let investment = profile.typicalInvestment;
  if (ext.detectedBudget) {
    investment = `Client Budget Targeted: ${ext.detectedBudget} (Custom Tier)`;
  }

  let deliverables = profile.deliverables.join(", ");
  let steps = [...profile.suggestedSteps];
  let primaryLabel = profile.ctaLabel;

  // Build body copy
  let pitchBody = profile.corePitch(message.name, message.subject || message.projectType, ext);

  let replyText = `Hi ${message.name},\n\nThank you for reaching out regarding "${message.subject || message.projectType || "your project"}". I've thoroughly reviewed your brief and requirements.\n\n${pitchBody}`;

  // Direct reference to client message details
  if (message.message.length > 20) {
    const preview = message.message.length > 140 ? `${message.message.slice(0, 140).trim()}...` : message.message.trim();
    replyText += `\n\nI noted your notes on: "${preview}". I have tailored our workflow specifically around these points.`;
  }

  // Address budget or pricing explicitly
  if (ext.detectedBudget) {
    replyText += `\n\nRegarding your budget (${ext.detectedBudget}): I can comfortably structure a custom scope package that delivers maximum production value within this range.`;
  }

  // Address urgency explicitly
  if (ext.isUrgent || ext.detectedDeadline) {
    replyText += `\n\n⚡ Priority Notice: I have marked your project for express turnaround to ensure we hit your ${ext.detectedDeadline || "upcoming deadline"} with zero compromise on visual polish.`;
  }

  // Address assets & links
  if (ext.detectedLinks.length > 0) {
    replyText += `\n\nI also took a look at the link you provided (${ext.detectedLinks[0]})—this gives us a fantastic starting foundation.`;
  } else {
    replyText += `\n\nWhenever you're ready, reply with your footage link (Google Drive / Dropbox / WeTransfer) and any creative references you love so we can lock in the timeline!`;
  }

  // Weave in Custom User Directives
  if (customPrompt.trim()) {
    replyText += `\n\n${customPrompt.trim()}`;
  }

  // Modulate by Tone
  if (tone === "casual") {
    replyText = replyText
      .replace(/Thank you for reaching out/g, "Hey! Great to hear from you")
      .replace(/Thanks for reaching out/g, "Hey! Super excited about this")
      .replace(/I've thoroughly reviewed/g, "Just checked out")
      .replace(/Warm regards,/g, "Best,");
  } else if (tone === "confident") {
    replyText = replyText
      .replace(/would love to work together/g, "I'm 100% confident we can deliver a category-leading visual that blows past your benchmarks")
      .replace(/Whenever you're ready,/g, "Let's make this happen:")
      .replace(/hope this sounds good/g, "This is going to look phenomenal on release");
  } else if (tone === "agency") {
    replyText = replyText
      .replace(/Thanks for reaching out!/g, "Thank you for contacting CreativeXCreations.")
      .replace(/Whenever you're ready,/g, "Please review the proposed deliverables below:");
  } else if (tone === "negotiate") {
    replyText += `\n\n💡 Flexible Package: If you are looking for long-term consistency, we also offer bundled monthly rates with 15–20% cost savings compared to per-video billing.`;
  }

  return {
    domain: activeDomain,
    domainLabel: profile.label,
    confidenceScore: classification.confidence,
    extracted: ext,
    analysisTags,
    headline: profile.headlinePrefix,
    headlineAccent: profile.headlineAccent,
    reply: replyText,
    timeline,
    investment,
    deliverables,
    steps,
    primaryLabel,
    primaryUrl: `mailto:${message.email}`,
  };
}
