"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Mail,
  Eye,
  Sparkles,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  Bot,
  Edit3,
  RotateCcw,
  FileText,
  Zap,
  Video,
  Smartphone,
  Briefcase,
  Calendar,
  AlertCircle,
} from "lucide-react";
import type { ContactMessage } from "@/lib/types";
import {
  analyzeMessage,
  generateSmartReply,
  type AiTone,
  type MessageAnalysis,
} from "@/lib/message-ai";

export type ReplyDraft = {
  subject: string;
  headline: string;
  headlineAccent: string;
  reply: string;
  timeline: string;
  investment: string;
  deliverables: string;
  steps: string[];
  primaryLabel: string;
  primaryUrl: string;
  senderName: string;
  senderRole: string;
  senderEmail: string;
};

export type PresetKey =
  | "ai"
  | "quick"
  | "youtube"
  | "reels"
  | "retainer"
  | "quote"
  | "call"
  | "decline";

type ViewMode = "compose" | "editText" | "previewCard";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

function safeLink(value: string) {
  try {
    const url = new URL(value.trim());
    return ["https:", "http:", "mailto:"].includes(url.protocol) ? url.toString() : "#";
  } catch {
    return "#";
  }
}

function buildEmailHtml(message: ContactMessage, draft: ReplyDraft) {
  const paragraphs = draft.reply
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px;white-space:pre-wrap;line-height:1.7;">${escapeHtml(p)}</p>`)
    .join("");

  const details = [
    ["TIMELINE", draft.timeline],
    ["INVESTMENT", draft.investment],
    ["DELIVERABLES", draft.deliverables],
  ].filter(([, v]) => v && v.trim());

  const detailCards = details.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-collapse:separate;border-spacing:8px 0;"><tr>${details
        .map(
          ([label, value]) =>
            `<td valign="top" style="background:#16161e;border:1px solid #272733;border-radius:10px;padding:12px;"><div style="font:700 9px Arial,sans-serif;letter-spacing:2px;color:#a855f7;">${label}</div><div style="margin-top:6px;font:700 13px Arial,sans-serif;line-height:1.4;color:#ffffff;">${escapeHtml(
              value
            )}</div></td>`
        )
        .join("")}</tr></table>`
    : "";

  const steps = draft.steps.filter((s) => s && s.trim());
  const nextSteps = steps.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td style="background:#0c0c11;border:1px solid #22222d;border-radius:12px;padding:14px 18px;"><div style="font:700 9px Arial,sans-serif;letter-spacing:2px;color:#a855f7;margin-bottom:8px;">NEXT STEPS</div>${steps
        .map(
          (step, index) =>
            `<div style="padding:4px 0;font:13px/1.5 Arial,sans-serif;color:#d4d4df;"><span style="display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;border-radius:10px;background:#3b2160;color:#e9d5ff;font-weight:bold;margin-right:8px;font-size:11px;">${
              index + 1
            }</span>${escapeHtml(step)}</div>`
        )
        .join("")}</td></tr></table>`
    : "";

  const buttonHtml = draft.primaryLabel.trim() && draft.primaryUrl.trim()
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:22px;"><tr><td><a href="${escapeHtml(
        safeLink(draft.primaryUrl)
      )}" style="display:inline-block;padding:11px 22px;border-radius:999px;background:#7c3aed;border:1px solid #7c3aed;font:700 13px Arial,sans-serif;color:#ffffff;text-decoration:none;">${escapeHtml(
        draft.primaryLabel
      )} &#8599;</a></td></tr></table>`
    : "";

  return `<!doctype html>
<html>
<body style="margin:0;background:#050508;padding:20px 8px;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;color:#ffffff;">
    <tr>
      <td style="background:#0f0f15;border:1px solid #23232d;border-radius:999px;padding:10px 20px;font-size:13px;font-weight:bold;letter-spacing:2px;">
        CREATIVE<span style="color:#a855f7">X</span>CREATIONS 
        <span style="float:right;font-size:9px;letter-spacing:2px;color:#888896;font-weight:normal;padding-top:2px;">PROJECT RESPONSE</span>
      </td>
    </tr>
    <tr><td height="12"></td></tr>
    <tr>
      <td style="background:#111117;border:1px solid #242430;border-radius:18px;padding:26px 24px;">
        <div style="display:inline-block;background:#26183c;border:1px solid #43246f;border-radius:999px;padding:5px 12px;font-size:9px;font-weight:bold;letter-spacing:2px;color:#d8b4fe;">
          RE: ${escapeHtml((draft.subject || message.subject || message.projectType || "PROJECT").toUpperCase())}
        </div>
        <p style="margin:16px 0 0;font-size:14px;color:#9b9ba8;">Hi ${escapeHtml(message.name)},</p>
        <h1 style="margin:6px 0 0;font-size:24px;line-height:1.25;color:#ffffff;font-weight:bold;">
          ${escapeHtml(draft.headline)} <span style="color:#a855f7;">${escapeHtml(draft.headlineAccent)}</span>
        </h1>
        <div style="margin-top:18px;font-size:14px;line-height:1.75;color:#e3e3ed;">
          ${paragraphs}
        </div>
        ${detailCards}
        ${nextSteps}
        ${buttonHtml}
        <div style="margin-top:24px;border-top:1px solid #20202a;padding-top:16px;font-size:12px;line-height:1.6;color:#8a8a99;">
          Warm regards,<br>
          <strong style="font-size:15px;color:#ffffff;">${escapeHtml(draft.senderName)}</strong><br>
          <span style="color:#c084fc;">${escapeHtml(draft.senderRole)} · CreativeXCreations</span>
          ${draft.senderEmail.trim() ? `<br><a href="mailto:${escapeHtml(draft.senderEmail)}" style="color:#c084fc;text-decoration:none;">${escapeHtml(draft.senderEmail)}</a>` : ""}
        </div>
      </td>
    </tr>
    <tr><td height="12"></td></tr>
    <tr>
      <td style="background:#0c0c10;border:1px solid #1c1c24;border-radius:14px;padding:14px 18px;font-size:11px;line-height:1.55;color:#888899;">
        <strong style="color:#c084fc;">Original Inquiry:</strong> &ldquo;${escapeHtml(message.message)}&rdquo;
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildDefaultBodyText(message: ContactMessage, draft: ReplyDraft) {
  const parts = [
    `Hi ${message.name},`,
    "",
    `${draft.headline} ${draft.headlineAccent}`.trim(),
    "",
    draft.reply.trim(),
  ];

  const meta: string[] = [];
  if (draft.timeline?.trim()) meta.push(`• Timeline: ${draft.timeline.trim()}`);
  if (draft.investment?.trim()) meta.push(`• Investment: ${draft.investment.trim()}`);
  if (draft.deliverables?.trim()) meta.push(`• Deliverables: ${draft.deliverables.trim()}`);

  if (meta.length > 0) {
    parts.push("", "PROJECT SCOPE & TIMELINE:", ...meta);
  }

  const steps = draft.steps.filter((s) => s && s.trim());
  if (steps.length > 0) {
    parts.push("", "RECOMMENDED NEXT STEPS:", ...steps.map((s, i) => `${i + 1}. ${s.trim()}`));
  }

  parts.push(
    "",
    "Warm regards,",
    `${draft.senderName}`,
    `${draft.senderRole} · CreativeXCreations`,
    draft.senderEmail ? `${draft.senderEmail}` : "",
    "",
    "──────────────────────────────────────────────",
    `Original Inquiry from ${message.name}:`,
    `"${message.message}"`
  );

  return parts.join("\n");
}

export default function MessageReplyComposer({
  message,
  senderName,
  senderRole,
  senderEmail,
  onClose,
  onReplied,
}: {
  message: ContactMessage;
  senderName: string;
  senderRole: string;
  senderEmail: string;
  onClose?: () => void;
  onReplied?: (updated: Partial<ContactMessage>) => void;
}) {
  const [aiTone, setAiTone] = useState<AiTone>("pro");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [detectedAnalysis, setDetectedAnalysis] = useState<MessageAnalysis | null>(null);

  // Helper to construct preset objects
  const getPreset = (key: PresetKey, tone: AiTone = "pro"): ReplyDraft => {
    const sName = senderName || "Dheeraj A";
    const sRole = senderRole || "Lead Video Editor";
    const sEmail = senderEmail || "dheeraj@gmail.com";
    const proj = message.projectType ? message.projectType.toLowerCase() : "video";

    switch (key) {
      case "ai": {
        const smart = generateSmartReply(message, tone, sName, sRole);
        return {
          subject: smart.subject,
          headline: smart.headline,
          headlineAccent: smart.headlineAccent,
          reply: smart.reply,
          timeline: smart.timeline,
          investment: smart.investment,
          deliverables: smart.deliverables,
          steps: smart.steps,
          primaryLabel: smart.primaryLabel,
          primaryUrl: `mailto:${message.email}`,
          senderName: sName,
          senderRole: sRole,
          senderEmail: sEmail,
        };
      }

      case "youtube":
        return {
          subject: `Re: YouTube Editing Collaboration | CreativeXCreations`,
          headline: "Scaling your channel retention with",
          headlineAccent: "high-impact editing.",
          reply: `Hi ${message.name},\n\nThanks for reaching out! I've reviewed your brief and would love to help scale your YouTube content. Our focus is specifically on audience retention—crafting dynamic hooks in the first 10 seconds, seamless narrative pacing, and layered sound design that keeps viewers watching through to the end screen.\n\nPlease share your raw footage and any style references via Google Drive or Dropbox so we can assemble your first cut!`,
          timeline: "3–4 business days per episode",
          investment: "Per-video package / Monthly channel retainer",
          deliverables: "High-retention 4K master, kinetic subtitles, chapter markers & audio polish",
          steps: [
            "Send over footage & reference links via Google Drive / Dropbox",
            "Review first cut for pacing & hook clarity",
            "Final audio sweetening, color pass, and 4K export",
          ],
          primaryLabel: "Send Footage Link",
          primaryUrl: `mailto:${message.email}`,
          senderName: sName,
          senderRole: sRole,
          senderEmail: sEmail,
        };

      case "reels":
        return {
          subject: `Re: Shorts & Reels Editing | CreativeXCreations`,
          headline: "Fast-turnaround vertical edits that",
          headlineAccent: "capture attention.",
          reply: `Hi ${message.name},\n\nThanks for getting in touch! Vertical short-form is all about ruthless pacing and immediate sensory hooks. We specialize in dynamic 9:16 cutdowns with kinetic word-by-word typography, sound risers, and color contrast that maximize watch time on TikTok, Instagram Reels, and YouTube Shorts.\n\nSend through your long-form recordings or clips, and we can turn around a sample reel quickly.`,
          timeline: "24–48 hours (Fast turnaround)",
          investment: "Per reel or 10-Reel monthly batch discount",
          deliverables: "Vertical 9:16 Masters, animated kinetic captions, sound design & B-roll overlays",
          steps: [
            "Share clips or timestamped long-form footage",
            "Batch review of rough cuts",
            "Final delivery formatted for Reels, Shorts & TikTok",
          ],
          primaryLabel: "Share Clips",
          primaryUrl: `mailto:${message.email}`,
          senderName: sName,
          senderRole: sRole,
          senderEmail: sEmail,
        };

      case "retainer":
        return {
          subject: `Re: Dedicated Monthly Video Editing Retainer | CreativeXCreations`,
          headline: "A dedicated monthly partnership for",
          headlineAccent: "consistent uploads.",
          reply: `Hi ${message.name},\n\nThanks for reaching out! For creators and brands aiming for consistent, weekly output, a dedicated monthly retainer gives you guaranteed turnaround, priority revisions, and a direct Slack/Discord communication line.\n\nThis removes all the back-and-forth friction so you can focus 100% on scripting and recording while we handle the entire post-production pipeline.`,
          timeline: "Guaranteed 48–72h turnaround on all uploads",
          investment: "Monthly Retainer (4–8 videos/month)",
          deliverables: "Dedicated editor bandwidth, master renders, short cutdowns, thumbnail assets",
          steps: [
            "Agree on monthly upload volume and delivery schedule",
            "Set up shared Google Drive / Frame.io review pipeline",
            "Continuous weekly editing with real-time feedback",
          ],
          primaryLabel: "Discuss Retainer Scope",
          primaryUrl: `mailto:${message.email}`,
          senderName: sName,
          senderRole: sRole,
          senderEmail: sEmail,
        };

      case "quote":
        return {
          subject: `Re: Scope & Pricing Estimate for ${message.projectType || "Your Video Project"}`,
          headline: "Scope and pricing breakdown for your",
          headlineAccent: "production.",
          reply: `Hi ${message.name},\n\nBased on the details you provided for your ${proj} project, here is our preliminary scope and turnaround estimate. Every edit we deliver includes bespoke pacing, multi-track sound design, and color grading tailored to your brand identity.`,
          timeline: "4–6 business days",
          investment: "Custom Production Package (Milestone billing)",
          deliverables: "Master 4K Edit, Clean audio stems, 2 revision passes, social cutdowns",
          steps: [
            "Confirm scope, timeline & references",
            "First cut review & refinement",
            "Sound sweetening, color grading, and final archive master",
          ],
          primaryLabel: "Confirm Scope",
          primaryUrl: `mailto:${message.email}`,
          senderName: sName,
          senderRole: sRole,
          senderEmail: sEmail,
        };

      case "call":
        return {
          subject: `Re: Let's Connect on a Quick 10-Min Strategy Call`,
          headline: "Let's align on your vision over a",
          headlineAccent: "quick call.",
          reply: `Hi ${message.name},\n\nThanks for reaching out regarding your ${proj} project! To make sure we capture your exact vision, pacing, and tone, I'd love to hop on a quick 10–15 minute video or phone call.\n\nFeel free to reply with a couple of times that suit your schedule this week, or reply directly with your project links!`,
          timeline: "Call scheduled this week; project begins immediately after",
          investment: "Tailored to call alignment",
          deliverables: "Full project roadmap + custom test edit if requested",
          steps: [
            "Pick a 15-minute slot that works for you",
            "Quick alignment on goals, style references & schedule",
            "Footage transfer and production kickoff",
          ],
          primaryLabel: "Schedule a Call",
          primaryUrl: `mailto:${message.email}`,
          senderName: sName,
          senderRole: sRole,
          senderEmail: sEmail,
        };

      case "decline":
        return {
          subject: `Re: Video Editing Inquiry | CreativeXCreations Availability`,
          headline: "Thank you for considering",
          headlineAccent: "CreativeXCreations.",
          reply: `Hi ${message.name},\n\nThank you so much for reaching out about your ${proj} project! Your concept sounds exciting.\n\nCurrently, our production roster is at full capacity for the immediate upcoming weeks to ensure every active project receives our full attention. Our next open slot for new client kickoffs begins next month.\n\nIf your timeline is flexible and you'd like to reserve a spot, please let me know and I'll keep your slot locked in!`,
          timeline: "Next opening available next month",
          investment: "Standard package rates apply upon kickoff",
          deliverables: "Full production slot reservation",
          steps: [
            "Let me know if your timeline allows for next month's queue",
            "Reserve your slot in advance",
            "Kick off production as soon as the roster opens",
          ],
          primaryLabel: "Reserve Next Month's Slot",
          primaryUrl: `mailto:${message.email}`,
          senderName: sName,
          senderRole: sRole,
          senderEmail: sEmail,
        };

      case "quick":
      default:
        return {
          subject: `Re: ${message.subject || message.projectType || "Your Video Project"} | CreativeXCreations`,
          headline: "Thanks for reaching out about your",
          headlineAccent: "project.",
          reply: `Hi ${message.name},\n\nThanks for reaching out! I've reviewed your brief for the ${proj} project and would love to work together.\n\nPlease share your raw footage and reference links when ready so we can lock in the timeline and begin immediately.`,
          timeline: "3–5 business days",
          investment: "Confirmed on reference review",
          deliverables: "Cinematic edit + dynamic sound design + revisions",
          steps: [
            "Share drive link with footage & brand assets",
            "Assembly draft review & polish",
            "Final high-res delivery",
          ],
          primaryLabel: "Reply with Assets",
          primaryUrl: `mailto:${message.email}`,
          senderName: sName,
          senderRole: sRole,
          senderEmail: sEmail,
        };
    }
  };

  const [activePreset, setActivePreset] = useState<PresetKey>("ai");
  const [draft, setDraft] = useState<ReplyDraft>(() => getPreset("ai", "pro"));
  const [customText, setCustomText] = useState<string>("");
  const [isCustomTextMode, setIsCustomTextMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("compose");
  const [copiedType, setCopiedType] = useState<"text" | "card" | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAiControls, setShowAiControls] = useState(false);
  const [showPresetsBar, setShowPresetsBar] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Initialize analysis
  useEffect(() => {
    const analysis = analyzeMessage(message);
    setDetectedAnalysis(analysis);
    if (analysis.language === "hinglish") {
      setAiTone("hinglish");
    }
  }, [message]);

  // Keep plain text synchronized when draft changes, unless user manually edited custom text
  const defaultFormattedText = useMemo(() => buildDefaultBodyText(message, draft), [message, draft]);

  // Current active text to send/copy
  const activeOutgoingText = isCustomTextMode && customText ? customText : defaultFormattedText;

  // HTML email card
  const html = useMemo(() => buildEmailHtml(message, draft), [message, draft]);

  const selectPreset = (key: PresetKey) => {
    setActivePreset(key);
    setIsCustomTextMode(false);
    setCopiedType(null);

    if (key === "ai") {
      setIsAiThinking(true);
      setTimeout(() => {
        const newDraft = getPreset("ai", aiTone);
        setDraft(newDraft);
        setCustomText(buildDefaultBodyText(message, newDraft));
        setIsAiThinking(false);
      }, 250);
    } else {
      const newDraft = getPreset(key);
      setDraft(newDraft);
      setCustomText(buildDefaultBodyText(message, newDraft));
    }
  };

  const regenerateAiReplyWithTone = (tone: AiTone) => {
    setAiTone(tone);
    setActivePreset("ai");
    setIsAiThinking(true);
    setIsCustomTextMode(false);
    setTimeout(() => {
      const newDraft = getPreset("ai", tone);
      setDraft(newDraft);
      setCustomText(buildDefaultBodyText(message, newDraft));
      setIsAiThinking(false);
    }, 200);
  };

  const copyPlainText = async () => {
    try {
      await navigator.clipboard.writeText(activeOutgoingText);
      setCopiedType("text");
      setToast("📋 Formatted email text copied to clipboard!");
      setTimeout(() => setCopiedType(null), 3000);
      return true;
    } catch {
      return false;
    }
  };

  const copyRichCard = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([activeOutgoingText], { type: "text/plain" }),
          }),
        ]);
        setCopiedType("card");
        setToast("🎨 Styled HTML graphic card copied! (Paste with Ctrl+V into Gmail)");
        setTimeout(() => setCopiedType(null), 3000);
        return true;
      }
    } catch {
      // Fallback
    }

    return copyPlainText();
  };

  /**
   * One-click seamless send:
   * 1. Copies the rich visual design into clipboard.
   * 2. Pre-fills Gmail with recipient, subject, and the exact text body (custom edited or default).
   * 3. Opens Gmail in a new tab.
   * 4. Updates backend to mark as read & replied.
   */
  const handleSeamlessSend = async () => {
    setIsSending(true);

    // 1. Copy styled design into clipboard
    await copyRichCard();

    // 2. Open Gmail with prefilled parameters
    const subject = draft.subject || `Re: ${message.subject || message.projectType || "CreativeXCreations Project Inquiry"}`;
    const composeUrl = new URL("https://mail.google.com/mail/");
    composeUrl.searchParams.set("view", "cm");
    composeUrl.searchParams.set("fs", "1");
    composeUrl.searchParams.set("to", message.email);
    composeUrl.searchParams.set("su", subject);
    composeUrl.searchParams.set("body", activeOutgoingText);

    window.open(composeUrl.toString(), "_blank", "noopener,noreferrer");

    // 3. Mark message as replied in database
    try {
      const res = await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: message.id,
          read: true,
          repliedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        onReplied?.({ read: true, repliedAt: new Date().toISOString() });
      }
    } catch {
      // Non-fatal
    }

    setIsSending(false);
    setToast("✨ Gmail opened! Body & recipient pre-filled. (Press Ctrl+V to paste the graphical card if desired).");
  };

  const presetList: { key: PresetKey; label: string; icon: typeof Zap }[] = [
    { key: "ai", label: "🤖 AI Smart Reply", icon: Bot },
    { key: "quick", label: "⚡ Quick Reply", icon: Zap },
    { key: "youtube", label: "🎬 YouTube Edit", icon: Video },
    { key: "reels", label: "📱 Shorts / Reels", icon: Smartphone },
    { key: "retainer", label: "💼 Retainer Pitch", icon: Briefcase },
    { key: "quote", label: "💎 Quote & Scope", icon: FileText },
    { key: "call", label: "📅 Discovery Call", icon: Calendar },
    { key: "decline", label: "🛑 Polite Waitlist", icon: AlertCircle },
  ];

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-purple-500/30 bg-[#0c0c12] shadow-2xl transition-all">
      {/* Compact Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/50 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400">
            <Sparkles className="h-3 w-3" />
          </span>
          <span className="text-xs font-semibold text-white">
            Replying to <span className="text-purple-300">{message.name}</span>
          </span>
          <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
            {message.email}
          </span>
          {detectedAnalysis && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 text-[10px] text-purple-300 font-medium">
              🎯 {detectedAnalysis.categoryLabel} · {detectedAnalysis.urgencyLabel}
              {detectedAnalysis.language === "hinglish" && <span className="ml-1 text-amber-300">· 🇮🇳 Hinglish</span>}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* View Mode Switcher */}
          <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("compose")}
              className={`rounded px-2 py-1 text-[11px] font-medium transition ${
                viewMode === "compose"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Draft
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("editText");
                if (!customText) {
                  setCustomText(defaultFormattedText);
                }
                setIsCustomTextMode(true);
              }}
              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                viewMode === "editText"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Edit3 className="h-2.5 w-2.5" /> Edit Full Text
            </button>
            <button
              type="button"
              onClick={() => setViewMode("previewCard")}
              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                viewMode === "previewCard"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Eye className="h-2.5 w-2.5" /> Visual Card
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-1.5 rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Compact Quick Toolbar: Preset & AI Tone Collapsibles */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/5 bg-[#08080d] px-3.5 py-1.5 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Preset Selector Pill (Click to open list) */}
          <button
            type="button"
            onClick={() => {
              setShowPresetsBar((v) => !v);
              setShowAiControls(false);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white hover:bg-white/10 transition cursor-pointer"
          >
            <Zap className="h-3 w-3 text-purple-400" />
            <span className="text-white/50 text-[10px] uppercase">Preset:</span>
            <span className="font-semibold text-purple-300">
              {presetList.find((p) => p.key === activePreset)?.label || "Custom"}
            </span>
            {showPresetsBar ? <ChevronUp className="h-3 w-3 text-white/50" /> : <ChevronDown className="h-3 w-3 text-white/50" />}
          </button>

          {/* AI Tone Button (Click to open tones) */}
          <button
            type="button"
            onClick={() => {
              setShowAiControls((v) => !v);
              setShowPresetsBar(false);
            }}
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] transition cursor-pointer ${
              activePreset === "ai"
                ? "border-purple-500/40 bg-purple-950/50 text-purple-200"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            <Bot className="h-3 w-3 text-purple-400" />
            <span className="text-white/50 text-[10px] uppercase">AI Tone:</span>
            <span className="font-semibold text-purple-300">{aiTone.toUpperCase()}</span>
            {showAiControls ? <ChevronUp className="h-3 w-3 text-white/50" /> : <ChevronDown className="h-3 w-3 text-white/50" />}
          </button>
        </div>

        {detectedAnalysis && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-purple-300/80">
            Parsed: <strong className="text-white font-medium">{detectedAnalysis.categoryLabel}</strong>
          </span>
        )}
      </div>

      {/* Expanded Presets Carousel (when clicked open) */}
      {showPresetsBar && (
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-purple-500/20 bg-[#0c0c16] px-3.5 py-2 no-scrollbar">
          {presetList.map(({ key, label }) => {
            const isActive = activePreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  selectPreset(key);
                  setShowPresetsBar(false);
                }}
                className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Expanded AI Tone Controls (when clicked open) */}
      {showAiControls && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-purple-500/20 bg-purple-950/30 px-3.5 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300 mr-1">
            Choose Tone:
          </span>
          {(
            [
              { id: "pro", label: "🎯 Balanced Pro" },
              { id: "hinglish", label: "🇮🇳 Hinglish" },
              { id: "creative", label: "🎨 Creative" },
              { id: "growth", label: "🚀 Retention" },
              { id: "concise", label: "⚡ Short" },
            ] as { id: AiTone; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                regenerateAiReplyWithTone(t.id);
                setShowAiControls(false);
              }}
              className={`rounded px-2.5 py-1 text-[10px] font-medium transition cursor-pointer ${
                aiTone === t.id
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-white/5 text-purple-200/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="border-b border-emerald-500/20 bg-emerald-950/40 px-3.5 py-2 text-xs text-emerald-200 flex items-center justify-between">
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Subject Line Field */}
      <div className="px-3.5 pt-3 pb-1">
        <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#060609] px-2.5 py-1.5 text-xs text-white/80">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 shrink-0">
            Subject:
          </span>
          <input
            type="text"
            value={draft.subject}
            onChange={(e) => {
              setDraft((d) => ({ ...d, subject: e.target.value }));
              setCopiedType(null);
            }}
            placeholder="Email Subject Line"
            className="w-full bg-transparent text-xs text-white placeholder-white/30 outline-none"
          />
        </label>
      </div>

      {/* Main View Area */}
      <div className="p-3.5 space-y-3">
        {/* VIEW 1: COMPOSE (Structured Draft) */}
        {viewMode === "compose" && (
          <>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-white/40">
                <span>Message Body (Markdown/Text)</span>
                {isAiThinking && (
                  <span className="text-purple-400 flex items-center gap-1 animate-pulse">
                    <Sparkles className="h-3 w-3" /> Analyzing inquiry...
                  </span>
                )}
              </div>
              <textarea
                rows={4}
                value={draft.reply}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, reply: e.target.value }));
                  setIsCustomTextMode(false);
                  setCopiedType(null);
                }}
                placeholder="Write your reply..."
                className="w-full resize-y rounded-lg border border-white/10 bg-[#060608] p-3 text-xs text-white placeholder-white/30 outline-none focus:border-purple-500/60 leading-relaxed font-sans"
              />
            </div>

            {/* Optional Scope Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-400 hover:text-purple-300"
              >
                {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showDetails ? "Hide Scope & Deliverables" : "+ Customize Timeline, Price & Deliverables"}
              </button>

              {showDetails && (
                <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3 rounded-lg border border-white/5 bg-black/30 p-2.5">
                  <label className="text-[10px] text-white/50 space-y-1 block">
                    <span>Timeline</span>
                    <input
                      value={draft.timeline}
                      onChange={(e) => {
                        setDraft((d) => ({ ...d, timeline: e.target.value }));
                        setIsCustomTextMode(false);
                      }}
                      className="w-full rounded border border-white/10 bg-[#080808] px-2 py-1.5 text-xs text-white outline-none focus:border-purple-400"
                    />
                  </label>
                  <label className="text-[10px] text-white/50 space-y-1 block">
                    <span>Investment</span>
                    <input
                      value={draft.investment}
                      onChange={(e) => {
                        setDraft((d) => ({ ...d, investment: e.target.value }));
                        setIsCustomTextMode(false);
                      }}
                      className="w-full rounded border border-white/10 bg-[#080808] px-2 py-1.5 text-xs text-white outline-none focus:border-purple-400"
                    />
                  </label>
                  <label className="text-[10px] text-white/50 space-y-1 block">
                    <span>Deliverables</span>
                    <input
                      value={draft.deliverables}
                      onChange={(e) => {
                        setDraft((d) => ({ ...d, deliverables: e.target.value }));
                        setIsCustomTextMode(false);
                      }}
                      className="w-full rounded border border-white/10 bg-[#080808] px-2 py-1.5 text-xs text-white outline-none focus:border-purple-400"
                    />
                  </label>
                </div>
              )}
            </div>
          </>
        )}

        {/* VIEW 2: EDIT FULL PREVIEW TEXT */}
        {viewMode === "editText" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-white/50">
              <span>Full Outgoing Email Text (Editable before sending)</span>
              <button
                type="button"
                onClick={() => {
                  setCustomText(defaultFormattedText);
                  setIsCustomTextMode(false);
                  setToast("🔄 Restored to structured template defaults");
                }}
                className="inline-flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300"
              >
                <RotateCcw className="h-2.5 w-2.5" /> Reset to Template
              </button>
            </div>
            <textarea
              rows={9}
              value={isCustomTextMode && customText ? customText : defaultFormattedText}
              onChange={(e) => {
                setCustomText(e.target.value);
                setIsCustomTextMode(true);
                setCopiedType(null);
              }}
              placeholder="Full email message text..."
              className="w-full resize-y rounded-lg border border-purple-500/30 bg-[#060608] p-3 font-mono text-xs text-white/90 placeholder-white/30 outline-none focus:border-purple-500 leading-relaxed"
            />
            <p className="text-[10px] text-white/40">
              💡 Any edits you make here are automatically sent to Gmail or copied via the &ldquo;Copy Formatted Text&rdquo; button.
            </p>
          </div>
        )}

        {/* VIEW 3: VISUAL CARD PREVIEW */}
        {viewMode === "previewCard" && (
          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#050508]">
            <div className="bg-black/60 px-3 py-1.5 text-[10px] text-white/40 flex justify-between items-center">
              <span>Visual HTML Email Card (Designed for Gmail & Outlook)</span>
              <button
                type="button"
                onClick={() => void copyRichCard()}
                className="text-purple-400 hover:text-purple-300 text-[10px] flex items-center gap-1 font-medium"
              >
                <Copy className="h-2.5 w-2.5" /> Copy HTML Card
              </button>
            </div>
            <iframe
              title="Reply Preview"
              srcDoc={html}
              sandbox=""
              className="h-80 w-full border-0 bg-[#050508]"
            />
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => void copyPlainText()}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/80 hover:bg-white/10 hover:text-white transition"
              title="Copy clean plain text"
            >
              {copiedType === "text" ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copiedType === "text" ? "Text Copied!" : "Copy Text"}
            </button>

            <button
              type="button"
              onClick={() => void copyRichCard()}
              className="inline-flex items-center gap-1 rounded-md border border-purple-500/20 bg-purple-500/10 px-2.5 py-1.5 text-[11px] text-purple-200 hover:bg-purple-500/20 transition"
              title="Copy rich visual HTML design"
            >
              {copiedType === "card" ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Sparkles className="h-3 w-3 text-purple-400" />
              )}
              {copiedType === "card" ? "Card Copied!" : "Copy Visual Card"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => void handleSeamlessSend()}
            disabled={isSending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/30 hover:from-purple-500 hover:to-indigo-500 active:scale-95 transition cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            Reply via Gmail <ExternalLink className="h-3 w-3 opacity-60" />
          </button>
        </div>
      </div>
    </div>
  );
}
