import type { ContactMessage } from "./types";

export type AiTone = "pro" | "creative" | "growth" | "hinglish" | "concise";

export type DetectedLanguage = "english" | "hinglish";

export type VideoIntent =
  | "youtube"
  | "short_form"
  | "commercial"
  | "podcast"
  | "gaming"
  | "documentary"
  | "vlog"
  | "general";

export interface MessageAnalysis {
  language: DetectedLanguage;
  intent: VideoIntent;
  categoryLabel: string;
  urgency: "urgent" | "standard" | "flexible";
  urgencyLabel: string;
  wantsPricing: boolean;
  hasAssets: boolean;
  budgetConstraint: boolean;
  wantsSampleOrTest: boolean;
  specifics: string[];
  detectedQuestions: string[];
  suggestedTimeline: string;
  suggestedInvestment: string;
  suggestedDeliverables: string;
  suggestedSteps: string[];
  confidence: number;
}

export interface GeneratedSmartReply {
  subject: string;
  headline: string;
  headlineAccent: string;
  reply: string;
  timeline: string;
  investment: string;
  deliverables: string;
  steps: string[];
  primaryLabel: string;
  analysis: MessageAnalysis;
}

/**
 * Hinglish semantic patterns (Romanized Hindi) commonly used by Indian creators & clients.
 */
const HINGLISH_PATTERNS = {
  greetings: /\b(bhai|bhaiya|bhaii|namaste|pranam|kya haal|kese ho|kaise ho|aap kaise ho|dheeraj bhai)\b/i,
  inquiry: /\b(karni hai|karwana hai|karwana chahta|karvana|chahiye|banana hai|banwana hai|edit kar doge|edit ho jayega|kaam hai|madad chahiye)\b/i,
  youtube: /\b(lambhi video|long video|roast|case study)\b/i,
  reels: /\b(reels banwani|shorts chahiye|insta reel|short video)\b/i,
  gaming: /\b(gameplay cut|stream highlights)\b/i,
  urgency: /\b(jaldi|aaj hi|kal tak|turant|time kam hai|deadline paas hai|bohot fast|jaldi me)\b/i,
  pricing: /\b(kitna|kitne|paisa|paise|kitna loge|kya loge|kharcha|daam|kitne me)\b/i,
  lowBudget: /\b(budget kam hai|thoda kam karo|discount milega|student hu|starting channel|sasta|kam me ho jayega)\b/i,
  assets: /\b(footage ready hai|bhej diya|record kar liya|clips hai|files hai|raw footage ready|audio ready hai)\b/i,
  sample: /\b(pehle ek|kaam dekhna hai|kaisa edit karte ho|sample edit kar doge)\b/i,
  specifics: {
    sound: /\b(awaaz|bgm|gaana|sound lagana)\b/i,
    captions: /\b(likha hua|text daalna)\b/i,
    color: /\b(color accha|mast look)\b/i,
    pacing: /\b(boring na ho|fast cut)\b/i,
    motion: /\b(animation daalna)\b/i,
  },
};

/**
 * English semantic patterns.
 */
const ENGLISH_PATTERNS = {
  youtube: /\b(youtube|yt|vlog|long-form|longform|channel|subscriber|subscribers|audience retention|hook|thumbnail|video essay)\b/i,
  reels: /\b(short|shorts|reels?|tiktok|tik tok|vertical|9:16|micro-content|social media clip)\b/i,
  commercial: /\b(commercial|ad\b|advertisement|promo|promotional|brand film|product video|sponsor|corporate|b2b)\b/i,
  podcast: /\b(podcast|talking head|interview|webinar|course|educational|masterclass|stream)\b/i,
  gaming: /\b(gaming|gameplay|streamer|twitch|stream highlights|montage|esports)\b/i,
  documentary: /\b(documentary|docu|narrative|cinematic story|storytelling|film|mini-doc)\b/i,
  urgency: /\b(asap|urgent|rush|today|tomorrow|48h|24h|deadline is (soon|this|tomorrow)|need (it|this) quick|turnaround)\b/i,
  pricing: /\b(rate|rates|price|pricing|cost|how much|quote|budget|estimate|package|fee|retainer|billing)\b/i,
  lowBudget: /\b(tight budget|low budget|discount|small channel|bootstrap|student discount|cheaper)\b/i,
  assets: /\b(drive|dropbox|wetransfer|raw footage|files ready|recorded|assets ready|links?|footage ready)\b/i,
  sample: /\b(sample|demo|test edit|trial|portfolio review|past work|examples)\b/i,
};

/**
 * Detects whether the inquiry is written in Hinglish or English.
 */
export function detectLanguage(text: string): DetectedLanguage {
  const hinglishMatches = [
    HINGLISH_PATTERNS.greetings.test(text),
    HINGLISH_PATTERNS.inquiry.test(text),
    HINGLISH_PATTERNS.urgency.test(text),
    HINGLISH_PATTERNS.pricing.test(text),
    HINGLISH_PATTERNS.assets.test(text),
    HINGLISH_PATTERNS.lowBudget.test(text),
  ].filter(Boolean).length;

  return hinglishMatches >= 1 ? "hinglish" : "english";
}

/**
 * Intelligent local NLP analysis of client inquiry text.
 * Runs completely client/server side with zero external API dependencies.
 */
export function analyzeMessage(message: ContactMessage): MessageAnalysis {
  const fullText = `${message.subject || ""} ${message.projectType || ""} ${message.message || ""}`.toLowerCase();
  const language = detectLanguage(fullText);

  // 1. Detect Intent / Category
  let intent: VideoIntent = "general";
  let categoryLabel = "Video Production";
  let confidence = 0.6;

  if (HINGLISH_PATTERNS.reels.test(fullText) || ENGLISH_PATTERNS.reels.test(fullText)) {
    intent = "short_form";
    categoryLabel = language === "hinglish" ? "Reels & Shorts" : "Short-form & Reels";
    confidence = 0.95;
  } else if (HINGLISH_PATTERNS.gaming.test(fullText) || ENGLISH_PATTERNS.gaming.test(fullText)) {
    intent = "gaming";
    categoryLabel = language === "hinglish" ? "Gaming & Stream Edit" : "Gaming & Stream Highlights";
    confidence = 0.9;
  } else if (HINGLISH_PATTERNS.youtube.test(fullText) || ENGLISH_PATTERNS.youtube.test(fullText)) {
    intent = "youtube";
    categoryLabel = "YouTube Long-form";
    confidence = 0.92;
  } else if (ENGLISH_PATTERNS.commercial.test(fullText)) {
    intent = "commercial";
    categoryLabel = "Commercial & Ads";
    confidence = 0.88;
  } else if (ENGLISH_PATTERNS.podcast.test(fullText)) {
    intent = "podcast";
    categoryLabel = "Podcast & Talking Head";
    confidence = 0.85;
  } else if (ENGLISH_PATTERNS.documentary.test(fullText)) {
    intent = "documentary";
    categoryLabel = "Documentary & Story";
    confidence = 0.85;
  }

  // 2. Detect Urgency / Timeline
  let urgency: MessageAnalysis["urgency"] = "standard";
  let urgencyLabel = "Standard (3–5 Days)";
  if (HINGLISH_PATTERNS.urgency.test(fullText) || ENGLISH_PATTERNS.urgency.test(fullText)) {
    urgency = "urgent";
    urgencyLabel = language === "hinglish" ? "Urgent (24–48 Ghante)" : "Priority Rush (24–48h)";
  } else if (/(ongoing|monthly|long-term|retainer|whenever|no rush|aaram se|har hafte)/i.test(fullText)) {
    urgency = "flexible";
    urgencyLabel = language === "hinglish" ? "Monthly Retainer" : "Flexible / Ongoing Retainer";
  }

  // 3. Detect Pricing Questions & Budget Constraints
  const wantsPricing = HINGLISH_PATTERNS.pricing.test(fullText) || ENGLISH_PATTERNS.pricing.test(fullText);
  const budgetConstraint = HINGLISH_PATTERNS.lowBudget.test(fullText) || ENGLISH_PATTERNS.lowBudget.test(fullText);

  // 4. Detect Existing Assets Mentioned
  const hasAssets = HINGLISH_PATTERNS.assets.test(fullText) || ENGLISH_PATTERNS.assets.test(fullText);

  // 5. Detect Sample or Test edit request
  const wantsSampleOrTest = HINGLISH_PATTERNS.sample.test(fullText) || ENGLISH_PATTERNS.sample.test(fullText);

  // 6. Extract specific editing techniques mentioned
  const specifics: string[] = [];
  if (HINGLISH_PATTERNS.specifics.sound.test(fullText) || /(sound|sfx|foley|audio|music|whoosh|audio mix)/i.test(fullText)) {
    specifics.push("Layered Sound Design & BGM");
  }
  if (HINGLISH_PATTERNS.specifics.captions.test(fullText) || /(caption|subtitle|kinetic|subtitles)/i.test(fullText)) {
    specifics.push("Kinetic Subtitles");
  }
  if (HINGLISH_PATTERNS.specifics.color.test(fullText) || /(color|grade|grading|lut|cinematic look)/i.test(fullText)) {
    specifics.push("Cinematic Color Grading");
  }
  if (HINGLISH_PATTERNS.specifics.motion.test(fullText) || /(motion|graphics|vfx|3d|animation|intro)/i.test(fullText)) {
    specifics.push("Dynamic Motion Graphics");
  }
  if (HINGLISH_PATTERNS.specifics.pacing.test(fullText) || /(pacing|fast paced|speed ramp|cutdowns|retention)/i.test(fullText)) {
    specifics.push("High-Retention Pacing");
  }

  // 7. Detect Questions
  const detectedQuestions: string[] = [];
  const questionMatches = fullText.match(/[^.!?\n]+(?:\?)/g);
  if (questionMatches) {
    for (const q of questionMatches.slice(0, 3)) {
      detectedQuestions.push(q.trim());
    }
  }

  // Determine smart defaults based on intent and urgency
  let suggestedTimeline = "3–5 business days";
  if (urgency === "urgent") {
    suggestedTimeline = language === "hinglish" ? "24–48 ghante (Priority Delivery)" : "24–48 hours (Priority Rush)";
  } else if (intent === "short_form") {
    suggestedTimeline = "24–72 hours";
  } else if (intent === "commercial") {
    suggestedTimeline = "5–7 business days";
  }

  let suggestedInvestment = "Confirmed upon footage review";
  if (wantsPricing) {
    if (budgetConstraint) {
      suggestedInvestment = language === "hinglish"
        ? "Budget-friendly Starter Package (milestone payment available)"
        : "Flexible Starter Package tailored to your budget";
    } else if (intent === "short_form") {
      suggestedInvestment = "Per Reel/Short package (or 10-Reel monthly batch discount)";
    } else if (intent === "youtube") {
      suggestedInvestment = "Per-video package based on runtime & asset complexity";
    } else {
      suggestedInvestment = "Custom Milestone Quote tailored to your exact scope";
    }
  }

  let suggestedDeliverables = "Cinematic 4K Master, dynamic audio polish, 2 rounds of revisions";
  if (intent === "short_form") {
    suggestedDeliverables = "Vertical 9:16 Master, kinetic captions, sound design hook, source cutdown";
  } else if (intent === "youtube") {
    suggestedDeliverables = "Full Retention Edit, audio sweetening, kinetic graphic callouts, chapter markers";
  } else if (intent === "gaming") {
    suggestedDeliverables = "Action-packed gameplay montage, meme zooms, sound effects & subtitles";
  } else if (intent === "commercial") {
    suggestedDeliverables = "Master Commercial, 15s/30s cutdowns, color grade, licensed music & sound FX";
  }

  const suggestedSteps = hasAssets
    ? [
        language === "hinglish" ? "Apna raw footage Drive link share karein" : "Review your footage & lock in target pacing and references",
        language === "hinglish" ? "First draft review karein aur changes batayein" : "Deliver initial assembly cut for pacing & hook feedback",
        language === "hinglish" ? "Final 4K export aur audio master delivery" : "Final sound design, color grade, and export in full 4K",
      ]
    : [
        language === "hinglish" ? "Drive ya Dropbox par footage aur references share karein" : "Share your footage, script, or reference videos via Google Drive/Dropbox",
        language === "hinglish" ? "Rough cut review karke refine karenge" : "Review the first cut together and refine key moments",
        language === "hinglish" ? "Ready-to-upload high quality video receive karein" : "Receive polished masters ready for distribution",
      ];

  return {
    language,
    intent,
    categoryLabel,
    urgency,
    urgencyLabel,
    wantsPricing,
    hasAssets,
    budgetConstraint,
    wantsSampleOrTest,
    specifics,
    detectedQuestions,
    suggestedTimeline,
    suggestedInvestment,
    suggestedDeliverables,
    suggestedSteps,
    confidence,
  };
}

/**
 * Synthesizes a context-aware smart response based on the message analysis and desired tone.
 * Deeply supports both English and natural Hinglish.
 */
export function generateSmartReply(
  message: ContactMessage,
  tone: AiTone = "pro",
  senderName: string = "Dheeraj A",
  senderRole: string = "Lead Video Editor"
): GeneratedSmartReply {
  const analysis = analyzeMessage(message);
  const clientName = message.name?.trim() ? message.name.split(" ")[0] : "there";
  const sName = senderName || "Dheeraj A";

  // If user requested hinglish tone or language is hinglish and tone is default pro
  const useHinglish = tone === "hinglish" || (analysis.language === "hinglish" && tone === "pro");

  if (useHinglish) {
    return generateHinglishReply(message, analysis, clientName, sName);
  }

  return generateEnglishReply(message, analysis, tone, clientName, sName);
}

function generateHinglishReply(
  message: ContactMessage,
  analysis: MessageAnalysis,
  clientName: string,
  senderName: string
): GeneratedSmartReply {
  const subject = `Re: ${message.subject || message.projectType || "Aapke Video Project ke baare mein"} | CreativeXCreations`;
  const headline = "Aapke video ke liye ek perfect";
  const headlineAccent = `${analysis.categoryLabel} edit plan.`;

  const specificsMention = analysis.specifics.length > 0
    ? `Maine note kiya hai ki aapko ${analysis.specifics.join(" aur ")} chahiye—ye hamara core specialty hai.`
    : "Main high-retention video editing par focus karta hu taaki viewers shuru se end tak hook rahein.";

  const pricingClause = analysis.wantsPricing
    ? analysis.budgetConstraint
      ? "Pricing ki chinta mat kijiye, hum ek budget-friendly package arrange kar sakte hain jisme quality bilkul compromise nahi hogi."
      : "Pricing ke liye humare paas per-video package aur monthly retainer dono options hain jo aapke schedule ke according set ho jayenge."
    : "";

  const urgencyClause = analysis.urgency === "urgent"
    ? "Aapko jaldi chahiye toh mere paas priority turnaround bandwidth available hai, hum 24–48 ghante me first draft ready kar sakte hain."
    : "";

  const sampleClause = analysis.wantsSampleOrTest
    ? "Agar aap chaho toh hum pehle ek short test sample edit kar sakte hain taaki aapko quality aur pacing ka pura idea mil jaye."
    : "";

  const assetClause = analysis.hasAssets
    ? "Aap apna Google Drive ya Dropbox link bhej dijiye, main turant footage review karke kaam shuru karta hu."
    : "Aapke paas jo bhi raw clips ya inspiration video references ho, uska link share kar dijiye.";

  const reply = `Hi ${clientName},\n\nAapka message mil gaya! ${analysis.categoryLabel} project ke baare me padh kar accha laga.\n\n${specificsMention}\n\n${pricingClause ? `${pricingClause}\n\n` : ""}${urgencyClause ? `${urgencyClause}\n\n` : ""}${sampleClause ? `${sampleClause}\n\n` : ""}${assetClause}\n\nAap brief aur links share karein, hum turant shuru karte hain!`;

  return {
    subject,
    headline,
    headlineAccent,
    reply,
    timeline: analysis.suggestedTimeline,
    investment: analysis.suggestedInvestment,
    deliverables: analysis.suggestedDeliverables,
    steps: analysis.suggestedSteps,
    primaryLabel: analysis.hasAssets ? "Share Drive Link" : "Reply Karein",
    analysis,
  };
}

function generateEnglishReply(
  message: ContactMessage,
  analysis: MessageAnalysis,
  tone: AiTone,
  clientName: string,
  senderName: string
): GeneratedSmartReply {
  const subject = `Re: ${message.subject || message.projectType || "Your Video Project"} | CreativeXCreations`;
  let headline = "A tailored plan for your";
  let headlineAccent = `${analysis.categoryLabel}.`;

  const specificsMention = analysis.specifics.length > 0
    ? `I noticed you're specifically looking for ${analysis.specifics.join(" and ")}, which is right in our wheelhouse.`
    : "I specialize in retention-driven editing that keeps viewers engaged through dynamic pacing and sound design.";

  const pricingClause = analysis.wantsPricing
    ? analysis.budgetConstraint
      ? "Regarding pricing: we offer accessible packages and flexible milestone setups so you get elite production value within your target budget."
      : "Regarding rates: we offer both per-video packages and recurring monthly retainers depending on your release cadence."
    : "";

  const urgencyClause = analysis.urgency === "urgent"
    ? "I have priority turnaround bandwidth available to deliver your first cut within 24–48 hours without compromising on polish."
    : "";

  const sampleClause = analysis.wantsSampleOrTest
    ? "I'd also be happy to cut a short initial trial beat so you can experience our pacing and sound design firsthand."
    : "";

  const assetClause = analysis.hasAssets
    ? "Whenever you're ready, please share your Google Drive or Dropbox link so I can inspect the raw footage immediately."
    : "Feel free to share any raw footage or inspiration links you have in mind so we can align on the exact aesthetic.";

  let reply = "";

  switch (tone) {
    case "creative":
      headline = "Let's turn your footage into high-retention";
      headlineAccent = "magic.";
      reply = `Hi ${clientName},\n\nThanks for reaching out! Your ${analysis.categoryLabel.toLowerCase()} concept sounds fantastic. ${specificsMention}\n\n${pricingClause ? `${pricingClause}\n\n` : ""}${urgencyClause ? `${urgencyClause}\n\n` : ""}${sampleClause ? `${sampleClause}\n\n` : ""}${assetClause}\n\nLooking forward to creating something exceptional together!`;
      break;

    case "growth":
      headline = "Scaling your channel with high-impact";
      headlineAccent = "retention visuals.";
      reply = `Hi ${clientName},\n\nGreat to connect with you. When scaling ${analysis.categoryLabel.toLowerCase()}, audience retention comes down to the first 5-second hook, audio layering, and relentless pacing.\n\n${specificsMention}\n\n${pricingClause ? `${pricingClause}\n\n` : ""}${urgencyClause ? `${urgencyClause}\n\n` : ""}${sampleClause ? `${sampleClause}\n\n` : ""}${assetClause}\n\nLet's get this in motion!`;
      break;

    case "concise":
      headline = "Quick update regarding your";
      headlineAccent = "inquiry.";
      reply = `Hi ${clientName},\n\nThanks for reaching out! I've reviewed your brief for the ${analysis.categoryLabel.toLowerCase()} project.\n\n${urgencyClause ? `${urgencyClause}\n\n` : ""}${pricingClause ? `${pricingClause}\n\n` : ""}${assetClause} Looking forward to collaborating!`;
      break;

    case "pro":
    default:
      headline = "Thanks for reaching out regarding your";
      headlineAccent = `${analysis.categoryLabel}.`;
      reply = `Hi ${clientName},\n\nThank you for reaching out to CreativeXCreations. I've reviewed your inquiry for your ${analysis.categoryLabel.toLowerCase()} project and would love to collaborate with you.\n\n${specificsMention}\n\n${pricingClause ? `${pricingClause}\n\n` : ""}${urgencyClause ? `${urgencyClause}\n\n` : ""}${sampleClause ? `${sampleClause}\n\n` : ""}${assetClause}\n\nLet me know if this scope aligns with your goals, and we can lock in the schedule immediately.`;
      break;
  }

  return {
    subject,
    headline,
    headlineAccent,
    reply,
    timeline: analysis.suggestedTimeline,
    investment: analysis.suggestedInvestment,
    deliverables: analysis.suggestedDeliverables,
    steps: analysis.suggestedSteps,
    primaryLabel: analysis.hasAssets ? "Share Footage Link" : "Reply to Discuss",
    analysis,
  };
}
