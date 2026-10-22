// Studio Intelligence API — Footage Transcripts, Scene Metadata, QC Validation & Media Queue
import { NextRequest, NextResponse } from "next/server";
import { requireStudioSession, StudioAuthError } from "@/lib/studio-auth";
import {
  DELIVERABLE_PRESETS,
  validateDeliverable,
  getFootageIntelligence,
  createMediaJob,
  transitionMediaJob,
} from "@/lib/studio-media-engine";
import type { MediaJobType } from "@/lib/studio-types";

export async function GET(request: NextRequest) {
  try {
    await requireStudioSession();
    const { searchParams } = request.nextUrl;
    const assetId = searchParams.get("assetId") || "asset_demo_footage";
    const projectId = searchParams.get("projectId") || "proj_default";

    const intelligence = getFootageIntelligence(assetId, projectId);

    return NextResponse.json({
      success: true,
      intelligence,
      availablePresets: DELIVERABLE_PRESETS,
    });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("GET /api/studio/intelligence error:", err);
    return NextResponse.json({ error: "Failed to load footage intelligence" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireStudioSession();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = body.action as string;

    if (action === "validate_preset") {
      const assetId = String(body.assetId || "asset_master");
      const presetId = String(body.presetId || "preset_youtube_4k");
      const detected = (body.detectedSpecs as Record<string, unknown>) || {
        codec: "H.264",
        width: 3840,
        height: 2160,
        aspectRatio: "16:9",
        frameRate: 23.976,
        bitrateMbps: 58.4,
        audioLufs: -14.2,
        audioSampleRateKhz: 48,
      };

      const report = validateDeliverable(assetId, presetId, {
        codec: String(detected.codec || "H.264"),
        width: Number(detected.width || 3840),
        height: Number(detected.height || 2160),
        aspectRatio: String(detected.aspectRatio || "16:9"),
        frameRate: Number(detected.frameRate || 23.976),
        bitrateMbps: Number(detected.bitrateMbps || 58.4),
        audioLufs: Number(detected.audioLufs || -14.2),
        audioSampleRateKhz: Number(detected.audioSampleRateKhz || 48),
      });

      return NextResponse.json({ success: true, report });
    }

    if (action === "queue_job") {
      const assetId = String(body.assetId || "asset_1");
      const projectId = String(body.projectId || "proj_1");
      const jobType = (body.jobType as MediaJobType) || "transcribe_speech";

      const job = createMediaJob(assetId, projectId, jobType);
      const processedJob = transitionMediaJob(job, "completed", 100);

      return NextResponse.json({ success: true, job: processedJob });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("POST /api/studio/intelligence error:", err);
    return NextResponse.json({ error: "Intelligence operation failed" }, { status: 500 });
  }
}
