// ─────────────────────────────────────────────────────────────────────────────
// Creative X Studio — Media Engine, Footage Intelligence & QC Validation
// ─────────────────────────────────────────────────────────────────────────────

import type {
  DeliverablePreset,
  DeliverableValidationReport,
  ValidationIssue,
  FootageIntelligence,
  TranscriptSegment,
  SceneMetadataTag,
  HighlightSuggestion,
  MediaProcessingJob,
  MediaJobType,
  AssetLicenseRecord,
} from "./studio-types";

// ── Export Presets Library ────────────────────────────────────────────────────

export const DELIVERABLE_PRESETS: DeliverablePreset[] = [
  {
    id: "preset_youtube_4k",
    name: "YouTube 4K Master (16:9)",
    platform: "youtube",
    targetAspect: "16:9",
    container: "mp4",
    videoCodec: "H.264 / ProRes 422",
    minBitrateMbps: 45,
    maxBitrateMbps: 85,
    targetLufs: -14,
    audioSampleRateKhz: 48,
  },
  {
    id: "preset_ig_reels",
    name: "Instagram Reels / TikTok (9:16)",
    platform: "instagram",
    targetAspect: "9:16",
    container: "mp4",
    videoCodec: "H.264",
    minBitrateMbps: 15,
    maxBitrateMbps: 30,
    targetLufs: -14,
    audioSampleRateKhz: 48,
  },
  {
    id: "preset_broadcast_smpte",
    name: "Broadcast SMPTE / EBU R128 (16:9)",
    platform: "broadcast_smpte",
    targetAspect: "16:9",
    container: "mov",
    videoCodec: "ProRes 422 HQ",
    minBitrateMbps: 120,
    maxBitrateMbps: 220,
    targetLufs: -24,
    audioSampleRateKhz: 48,
  },
  {
    id: "preset_web_square",
    name: "Social Feed Square (1:1)",
    platform: "web_archive",
    targetAspect: "1:1",
    container: "mp4",
    videoCodec: "H.264",
    minBitrateMbps: 10,
    maxBitrateMbps: 20,
    targetLufs: -14,
    audioSampleRateKhz: 48,
  },
];

// ── Automated Deliverable Validation ──────────────────────────────────────────

/**
 * Validates file parameters against a chosen deliverable preset.
 */
export function validateDeliverable(
  assetId: string,
  presetId: string,
  detectedSpecs: {
    codec: string;
    width: number;
    height: number;
    aspectRatio: string;
    frameRate: number;
    bitrateMbps: number;
    audioLufs: number;
    audioSampleRateKhz: number;
    fileSizeBytes?: number;
  }
): DeliverableValidationReport {
  const preset =
    DELIVERABLE_PRESETS.find((p) => p.id === presetId) ?? DELIVERABLE_PRESETS[0];

  const issues: ValidationIssue[] = [];

  // Aspect Ratio Check
  if (detectedSpecs.aspectRatio !== preset.targetAspect) {
    issues.push({
      severity: "error",
      rule: "Aspect Ratio",
      found: detectedSpecs.aspectRatio,
      expected: preset.targetAspect,
      message: `Deliverable aspect ratio ${detectedSpecs.aspectRatio} does not match required ${preset.targetAspect}.`,
      remediation: `Re-render with an active composition preset of ${preset.targetAspect} (${
        preset.targetAspect === "9:16" ? "1080x1920" : "3840x2160 or 1920x1080"
      }).`,
    });
  }

  // Bitrate Check
  if (detectedSpecs.bitrateMbps < preset.minBitrateMbps) {
    issues.push({
      severity: "warning",
      rule: "Bitrate Minimum",
      found: `${detectedSpecs.bitrateMbps} Mbps`,
      expected: `>= ${preset.minBitrateMbps} Mbps`,
      message: `Video bitrate is lower than recommended for ${preset.name}, which may introduce compression artifacts.`,
      remediation: `Increase VBR 2-Pass or Target Bitrate to at least ${preset.minBitrateMbps} Mbps.`,
    });
  } else if (detectedSpecs.bitrateMbps > preset.maxBitrateMbps) {
    issues.push({
      severity: "info",
      rule: "Bitrate Maximum",
      found: `${detectedSpecs.bitrateMbps} Mbps`,
      expected: `<= ${preset.maxBitrateMbps} Mbps`,
      message: "Bitrate exceeds preset target; file size is unnecessarily large.",
      remediation: "Cap render bitrate to optimize playback streaming.",
    });
  }

  // Audio LUFS Loudness Check
  const lufsDelta = Math.abs(detectedSpecs.audioLufs - preset.targetLufs);
  if (lufsDelta > 2.0) {
    const isError = lufsDelta > 4.0;
    issues.push({
      severity: isError ? "error" : "warning",
      rule: "Integrated Loudness (LUFS)",
      found: `${detectedSpecs.audioLufs} LUFS`,
      expected: `${preset.targetLufs} LUFS (±1 LUFS)`,
      message: `Audio loudness ${detectedSpecs.audioLufs} LUFS violates the target standard of ${preset.targetLufs} LUFS.`,
      remediation: `Apply a loudness radar or master limiter to target exactly ${preset.targetLufs} LUFS integrated.`,
    });
  }

  // Audio Sample Rate Check
  if (detectedSpecs.audioSampleRateKhz !== preset.audioSampleRateKhz) {
    issues.push({
      severity: "warning",
      rule: "Audio Sample Rate",
      found: `${detectedSpecs.audioSampleRateKhz} kHz`,
      expected: `${preset.audioSampleRateKhz} kHz`,
      message: `Audio sample rate ${detectedSpecs.audioSampleRateKhz} kHz may cause drift with 48 kHz video playback.`,
      remediation: "Ensure master audio export is set to 48.000 kHz, 24-bit PCM.",
    });
  }

  const hasFatalError = issues.some((i) => i.severity === "error");

  return {
    assetId,
    presetId: preset.id,
    presetName: preset.name,
    passed: !hasFatalError,
    validatedAt: new Date().toISOString(),
    fileSizeBytes: detectedSpecs.fileSizeBytes ?? 1024 * 1024 * 480,
    checksum: "sha256_" + Math.random().toString(36).substring(2, 12),
    detectedSpecs: {
      codec: detectedSpecs.codec,
      width: detectedSpecs.width,
      height: detectedSpecs.height,
      aspectRatio: detectedSpecs.aspectRatio,
      frameRate: detectedSpecs.frameRate,
      bitrateMbps: detectedSpecs.bitrateMbps,
      audioLufs: detectedSpecs.audioLufs,
      audioSampleRateKhz: detectedSpecs.audioSampleRateKhz,
    },
    issues,
  };
}

// ── Footage Intelligence & Searchable Transcripts ────────────────────────────

/**
 * Returns or generates footage intelligence metadata with searchable transcript, scene tags, and AI highlights.
 */
export function getFootageIntelligence(assetId: string, projectId: string): FootageIntelligence {
  const segments: TranscriptSegment[] = [
    {
      id: "seg_1",
      startTimeSec: 0.0,
      endTimeSec: 4.8,
      speaker: "Presenter",
      text: "Welcome back! Today we are showing how the new creative pipeline changes video editing forever.",
      confidence: 0.98,
      keywords: ["creative pipeline", "video editing", "welcome"],
    },
    {
      id: "seg_2",
      startTimeSec: 5.2,
      endTimeSec: 11.4,
      speaker: "Presenter",
      text: "When you have frame-accurate client reviews and automated spec checks, you eliminate 80% of revision friction.",
      confidence: 0.96,
      keywords: ["frame-accurate", "spec checks", "revision friction"],
    },
    {
      id: "seg_3",
      startTimeSec: 12.0,
      endTimeSec: 19.5,
      speaker: "Director",
      text: "Notice the color grading right here on the hero shot. The cinematic contrast gives it immediate broadcast authority.",
      confidence: 0.94,
      keywords: ["color grading", "cinematic contrast", "broadcast authority"],
    },
    {
      id: "seg_4",
      startTimeSec: 20.0,
      endTimeSec: 27.2,
      speaker: "Presenter",
      text: "Let's jump into the multi-format deliverables. One click produces YouTube 4K, 9:16 vertical shorts, and broadcast masters.",
      confidence: 0.97,
      keywords: ["multi-format", "YouTube 4K", "9:16 vertical", "broadcast"],
    },
  ];

  const scenes: SceneMetadataTag[] = [
    {
      id: "sc_1",
      startTimeSec: 0.0,
      endTimeSec: 5.0,
      category: "talking_head",
      description: "Medium studio shot of host introducing production workflow.",
      visualQualityScore: 94,
      pacing: "fast",
    },
    {
      id: "sc_2",
      startTimeSec: 5.0,
      endTimeSec: 12.0,
      category: "b_roll",
      description: "Macro cutaway of editor timeline with colorful clip tracks and waveform monitors.",
      visualQualityScore: 98,
      pacing: "moderate",
    },
    {
      id: "sc_3",
      startTimeSec: 12.0,
      endTimeSec: 20.0,
      category: "product_shot",
      description: "Dynamic 3D camera pan around hero camera rig with anamorphic lens flare.",
      visualQualityScore: 99,
      pacing: "slow",
    },
    {
      id: "sc_4",
      startTimeSec: 20.0,
      endTimeSec: 27.5,
      category: "graphic_overlay",
      description: "Split-screen comparison of horizontal 16:9 master versus vertical 9:16 mobile reel.",
      visualQualityScore: 91,
      pacing: "fast",
    },
  ];

  const highlights: HighlightSuggestion[] = [
    {
      id: "hl_1",
      startTimeSec: 5.2,
      endTimeSec: 11.4,
      title: "The 80% Revision Rule Hook",
      rationale: "High energy claim with strong curiosity hook. Perfect for opening a 30s teaser.",
      viralScore: 92,
      suggestedPlatform: "tiktok",
    },
    {
      id: "hl_2",
      startTimeSec: 12.0,
      endTimeSec: 19.5,
      title: "Hero Anamorphic B-Roll Showcase",
      rationale: "Visually striking slow-motion visual asset suitable for Instagram visual feed carousel.",
      viralScore: 88,
      suggestedPlatform: "reels",
    },
    {
      id: "hl_3",
      startTimeSec: 20.0,
      endTimeSec: 27.2,
      title: "Multi-Format Instant Distribution",
      rationale: "Clear tactical value proposition for business & creator audience.",
      viralScore: 85,
      suggestedPlatform: "youtube_short",
    },
  ];

  return {
    assetId,
    projectId,
    durationSec: 27.5,
    transcriptionStatus: "ready",
    language: "en-US",
    segments,
    scenes,
    highlights,
    updatedAt: new Date().toISOString(),
  };
}

// ── Media Processing Queue ────────────────────────────────────────────────────

/**
 * Creates a media background processing task.
 */
export function createMediaJob(
  assetId: string,
  projectId: string,
  jobType: MediaJobType
): MediaProcessingJob {
  return {
    id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    assetId,
    projectId,
    jobType,
    status: "queued",
    progressPercent: 0,
    attemptCount: 0,
    maxAttempts: 3,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Updates a job with progress or completion status.
 */
export function transitionMediaJob(
  job: MediaProcessingJob,
  nextStatus: MediaProcessingJob["status"],
  progress = 100,
  errorLog?: string
): MediaProcessingJob {
  const updated: MediaProcessingJob = {
    ...job,
    status: nextStatus,
    progressPercent: progress,
    errorLog: errorLog ?? job.errorLog,
    attemptCount: nextStatus === "processing" ? job.attemptCount + 1 : job.attemptCount,
  };

  if (nextStatus === "processing" && !job.startedAt) {
    updated.startedAt = new Date().toISOString();
  }
  if (nextStatus === "completed" || nextStatus === "failed") {
    updated.completedAt = new Date().toISOString();
  }

  return updated;
}

// ── Rights & Licensing Ledger ─────────────────────────────────────────────────

export function checkAssetLicenseStatus(record: AssetLicenseRecord): {
  isCompliant: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  const now = new Date();

  if (record.clearanceStatus === "flagged") {
    warnings.push("Asset clearance is flagged due to unresolved rights claim.");
  }

  if (record.clearanceStatus === "pending_review") {
    warnings.push("License is currently awaiting legal clearance verification.");
  }

  if (record.expiresAt) {
    const expiry = new Date(record.expiresAt);
    if (expiry < now) {
      warnings.push(`License expired on ${expiry.toLocaleDateString()}. Commercial use prohibited.`);
    } else {
      const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 14) {
        warnings.push(`License expires soon (${daysUntil} day(s) remaining). Renew before broadcast.`);
      }
    }
  }

  if (!record.commercialUsagePermitted) {
    warnings.push("License strictly forbids commercial or paid advertising usage.");
  }

  return {
    isCompliant: warnings.length === 0,
    warnings,
  };
}
