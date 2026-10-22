// ─────────────────────────────────────────────────────────────────────────────
// Creative X Studio — Brand Kits & Project Knowledge Bases
// ─────────────────────────────────────────────────────────────────────────────

import type { ClientBrandKit, ProjectKnowledgeItem } from "./studio-types";

// Default agency brand kit template for client onboarding
export function getDefaultBrandKit(clientId: string, clientName = "Client Brand"): ClientBrandKit {
  return {
    clientId,
    brandName: clientName,
    logoPrimaryUrl: null,
    logoSecondaryUrl: null,
    colors: [
      { name: "Primary Brand Violet", hex: "#7c3aed", usage: "primary" },
      { name: "Dark Surface", hex: "#09090b", usage: "background" },
      { name: "Accent Coral", hex: "#f43f5e", usage: "accent" },
      { name: "Muted Secondary", hex: "#71717a", usage: "secondary" },
    ],
    fonts: [
      { family: "Space Grotesk", weight: "700", role: "heading" },
      { family: "Inter", weight: "400", role: "body" },
      { family: "Outfit", weight: "600", role: "subheading" },
    ],
    toneOfVoiceGuidelines: "Authoritative, modern, forward-thinking, and cinematic. Avoid generic stock corporate pacing.",
    musicStyleGuidelines: "Driving electronic percussion, melodic synth beds, minimal vocal chops. Peak energy at 0:15.",
    prohibitedElements: [
      "No cheesy 90s star-wipe transitions",
      "No unbranded generic sans-serif fonts",
      "No clipped or distorted audio peaks above -1 dBTP",
      "No low-resolution compressed logo artifacts",
    ],
    introOutroBumperAssetIds: [],
    updatedAt: new Date().toISOString(),
  };
}

// Initial project knowledge items (creative brief, script, research)
export function getInitialKnowledgeBase(projectId: string, projectTitle: string): ProjectKnowledgeItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: `kb_${Date.now()}_1`,
      projectId,
      title: "Core Creative Brief & Target Audience",
      category: "creative_brief",
      contentMarkdown: `# Project Creative Brief: ${projectTitle}

## Objective
Deliver a high-impact narrative video showcasing the product's premium value proposition.

## Target Audience
- Tech-forward creators, agency founders, and creative directors (22-45).
- High demand for visual authenticity and cinematic production polish.

## Key Takeaway
"Creative X Creations delivers studio-grade production velocity with zero compromise on craftsmanship."
`,
      tags: ["brief", "audience", "creative-direction"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `kb_${Date.now()}_2`,
      projectId,
      title: "Script Treatment & Story Beats",
      category: "script_draft",
      contentMarkdown: `### Story Beats
- **Beat 1 (0:00 - 0:04)**: High-speed montage hook establishing tension and creative ambition.
- **Beat 2 (0:05 - 0:15)**: The problem: Disjointed client reviews and endless revision limbo.
- **Beat 3 (0:16 - 0:35)**: The solution: Unified Studio OS — frame comments, AI footage search, instant QC presets.
- **Beat 4 (0:36 - 0:45)**: Climax & Call to Action: Final brand reveal with hero anamorphic sting.
`,
      tags: ["script", "storyboard", "pacing"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `kb_${Date.now()}_3`,
      projectId,
      title: "Audio & Music Direction Notes",
      category: "research",
      contentMarkdown: `### Sound & Acoustic Specs
- **Master Target**: -14.0 LUFS integrated (YouTube spec).
- **Dialogue Channel**: EQ shelf at 80Hz highpass, sidechain ducked -3.5dB against music bed.
- **BGM Track**: Modern hybrid trap / synthwave hybrid.
`,
      tags: ["audio", "music", "specs"],
      createdAt: now,
      updatedAt: now,
    },
  ];
}
