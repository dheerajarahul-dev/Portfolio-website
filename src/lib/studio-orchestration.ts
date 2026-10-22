// ─────────────────────────────────────────────────────────────────────────────
// Creative X Studio — Production Pipeline Orchestration & Dependency Engine
// ─────────────────────────────────────────────────────────────────────────────

import type {
  PipelineStageConfig,
  TaskBlockerAnalysis,
  TaskDependency,
  ProductionPlanPrompt,
  ProductionPlanResult,
  StudioTask,
  ProjectStatus,
} from "./studio-types";

// Standard production stages with gating requirements
export const DEFAULT_PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    id: "pre_production",
    name: "Pre-Production & Ingestion",
    order: 1,
    description: "Creative brief intake, asset collection, script development, and shot planning.",
    requiredTasks: ["Intake Brief Approval", "Media Ingestion"],
    requiredApprovals: ["internal"],
    autoTransitionOnComplete: true,
    color: "#6366f1",
  },
  {
    id: "assembly_rough",
    name: "Assembly & Rough Cut (V1)",
    order: 2,
    description: "Syncing audio, footage selection, timeline stringout, and initial pacing cut.",
    requiredTasks: ["A-roll Assembly", "Audio Sync"],
    requiredApprovals: ["internal"],
    autoTransitionOnComplete: true,
    color: "#8b5cf6",
  },
  {
    id: "fine_cut",
    name: "Fine Cut & Sound Design (V2)",
    order: 3,
    description: "B-roll integration, motion graphics, audio mix (-14 LUFS), and color grade.",
    requiredTasks: ["Client Feedback Implementation", "Audio Master", "Color Grade"],
    requiredApprovals: ["client"],
    autoTransitionOnComplete: true,
    color: "#ec4899",
  },
  {
    id: "qa_finishing",
    name: "Finishing & QC Validation",
    order: 4,
    description: "Technical spec verification across all target formats, aspect ratios, and subtitle tracks.",
    requiredTasks: ["Preset Compliance Check", "Full Render QC"],
    requiredApprovals: ["internal"],
    autoTransitionOnComplete: true,
    color: "#10b981",
  },
  {
    id: "final_delivery",
    name: "Final Delivery & Archive",
    order: 5,
    description: "High-bitrate master delivery to client, clean archive backup, and project closeout.",
    requiredTasks: ["Client Master Download", "Project Archive"],
    requiredApprovals: ["client"],
    autoTransitionOnComplete: false,
    color: "#06b6d4",
  },
];

/**
 * Evaluates task dependency graph and flags tasks that are blocked by uncompleted prerequisites.
 */
export function analyzeTaskDependencies(
  tasks: StudioTask[],
  dependencies: TaskDependency[]
): Record<string, TaskBlockerAnalysis> {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const result: Record<string, TaskBlockerAnalysis> = {};

  for (const task of tasks) {
    const parentDeps = dependencies.filter((d) => d.taskId === task.id);
    const blockers = parentDeps
      .map((d) => {
        const depTask = taskMap.get(d.dependsOnTaskId);
        if (!depTask || depTask.status === "done" || depTask.status === "completed") return null;
        return {
          taskId: depTask.id,
          title: depTask.title,
          status: depTask.status,
          assigneeName: depTask.assigneeId ?? undefined,
        };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);

    const isCurrentTaskDone = task.status === "done" || task.status === "completed";
    result[task.id] = {
      taskId: task.id,
      isBlocked: blockers.length > 0 && !isCurrentTaskDone,
      blockedBy: blockers,
      criticalPath: parentDeps.length > 0 || dependencies.some((d) => d.dependsOnTaskId === task.id),
    };
  }

  return result;
}

/**
 * Checks whether all prerequisite tasks for a stage transition are satisfied.
 */
export function evaluateStageTransition(
  currentStageOrder: number,
  tasks: StudioTask[],
  approvals: { type: "internal" | "client"; approved: boolean }[]
): { canAdvance: boolean; reason: string; nextStage?: PipelineStageConfig } {
  const currentStage = DEFAULT_PIPELINE_STAGES.find((s) => s.order === currentStageOrder);
  const nextStage = DEFAULT_PIPELINE_STAGES.find((s) => s.order === currentStageOrder + 1);

  if (!nextStage) {
    return { canAdvance: false, reason: "Project has reached the final production stage." };
  }

  if (currentStage) {
    // Check required approvals
    for (const reqApp of currentStage.requiredApprovals) {
      const isApproved = approvals.some((a) => a.type === reqApp && a.approved);
      if (!isApproved) {
        return {
          canAdvance: false,
          reason: `Stage transition blocked: Pending ${reqApp} approval.`,
        };
      }
    }
  }

  // Check undone tasks
  const openTasks = tasks.filter((t) => t.status !== "done" && t.status !== "completed");
  if (openTasks.length > 0) {
    const blockedCount = openTasks.length;
    return {
      canAdvance: false,
      reason: `Stage transition blocked: ${blockedCount} pending task(s) remaining in this phase.`,
    };
  }

  return {
    canAdvance: true,
    reason: `All requirements met. Ready to advance to ${nextStage.name}.`,
    nextStage,
  };
}

/**
 * Maps high-level pipeline stage to ProjectStatus enum.
 */
export function mapStageToProjectStatus(stageOrder: number): ProjectStatus {
  switch (stageOrder) {
    case 1:
      return "assets_collecting";
    case 2:
      return "in_production";
    case 3:
      return "client_review";
    case 4:
      return "final_approval";
    case 5:
      return "delivery";
    default:
      return "in_production";
  }
}

/**
 * AI Production Planner: Deconstructs a creative brief into an actionable multi-phase production plan.
 */
export function generateProductionPlan(prompt: ProductionPlanPrompt): ProductionPlanResult {
  const isShortForm =
    prompt.projectType.toLowerCase().includes("reel") ||
    prompt.projectType.toLowerCase().includes("short") ||
    prompt.projectType.toLowerCase().includes("tiktok");

  const isCommercial =
    prompt.projectType.toLowerCase().includes("commercial") ||
    prompt.projectType.toLowerCase().includes("brand");

  const steps = isShortForm
    ? [
        {
          phase: "Pre-Production",
          title: "Hook & Script Development (0-3s retention analysis)",
          estimatedHours: 4,
          suggestedRole: "manager" as const,
          deliverableOutput: "Approved script & visual storyboard",
          dependencies: [],
        },
        {
          phase: "Production Assembly",
          title: "Fast-Paced Timeline Assembly & Dynamic Subtitling",
          estimatedHours: 6,
          suggestedRole: "editor" as const,
          deliverableOutput: "Rough vertical cut (9:16)",
          dependencies: ["Hook & Script Development"],
        },
        {
          phase: "Post-Production Polish",
          title: "Sound Design, SFX Impact & Color Grading",
          estimatedHours: 3,
          suggestedRole: "editor" as const,
          deliverableOutput: "Master V1 Polish",
          dependencies: ["Fast-Paced Timeline Assembly & Dynamic Subtitling"],
        },
        {
          phase: "Distribution Prep",
          title: "Multi-Platform Export (TikTok, IG Reels, YT Shorts)",
          estimatedHours: 2,
          suggestedRole: "editor" as const,
          deliverableOutput: "Validated 1080x1920 MP4 deliverables",
          dependencies: ["Sound Design, SFX Impact & Color Grading"],
        },
      ]
    : isCommercial
    ? [
        {
          phase: "Pre-Production",
          title: "Creative Treatment & Client Moodboard Review",
          estimatedHours: 12,
          suggestedRole: "manager" as const,
          deliverableOutput: "Brand-aligned creative deck",
          dependencies: [],
        },
        {
          phase: "A-Roll Assembly",
          title: "Main Narrative Assembly & Dialog Leveling (-14 LUFS)",
          estimatedHours: 16,
          suggestedRole: "editor" as const,
          deliverableOutput: "Director's Cut V1",
          dependencies: ["Creative Treatment & Client Moodboard Review"],
        },
        {
          phase: "B-Roll & Graphics",
          title: "B-Roll Cut-ins, Motion Graphics & Product Showcase Callouts",
          estimatedHours: 14,
          suggestedRole: "editor" as const,
          deliverableOutput: "Client Review Cut V2",
          dependencies: ["Main Narrative Assembly & Dialog Leveling (-14 LUFS)"],
        },
        {
          phase: "Color & Sound Finish",
          title: "Cinema Grade, Surround/Stereo Stems & Deliverable Matrix",
          estimatedHours: 8,
          suggestedRole: "editor" as const,
          deliverableOutput: "ProRes 422 HQ 4K Master",
          dependencies: ["B-Roll Cut-ins, Motion Graphics & Product Showcase Callouts"],
        },
      ]
    : [
        {
          phase: "Ingestion & Organization",
          title: "Footage Ingestion, Speech-to-Text & B-Roll Tagging",
          estimatedHours: 6,
          suggestedRole: "editor" as const,
          deliverableOutput: "Tagged project media library",
          dependencies: [],
        },
        {
          phase: "Story Cut",
          title: "Narrative Arc Construction & Audio Sync",
          estimatedHours: 14,
          suggestedRole: "editor" as const,
          deliverableOutput: "Rough Cut V1",
          dependencies: ["Footage Ingestion, Speech-to-Text & B-Roll Tagging"],
        },
        {
          phase: "Refinement",
          title: "Pacing Polish, Lower Thirds, Music Scoring & Client Feedback",
          estimatedHours: 10,
          suggestedRole: "editor" as const,
          deliverableOutput: "Fine Cut V2",
          dependencies: ["Narrative Arc Construction & Audio Sync"],
        },
        {
          phase: "Quality Assurance",
          title: "Technical Spec Validation & Chapter Markers",
          estimatedHours: 4,
          suggestedRole: "manager" as const,
          deliverableOutput: "Final YouTube Master & Thumbnail Pack",
          dependencies: ["Pacing Polish, Lower Thirds, Music Scoring & Client Feedback"],
        },
      ];

  const totalHours = steps.reduce((acc, s) => acc + s.estimatedHours, 0);
  const estimatedDays = Math.ceil(totalHours / 6);

  return {
    projectId: prompt.projectId,
    generatedAt: new Date().toISOString(),
    executiveSummary: `Generated production strategy for "${prompt.projectTitle}". Optimized for high audience retention across ${prompt.channels.join(", ") || "target channels"}. Estimated turnaround: ${estimatedDays} business days (${totalHours} total editor hours).`,
    estimatedDays,
    riskFactors: [
      "Client feedback latency between Rough Cut and Fine Cut",
      "Asset licensing clearance for featured music/B-roll",
      "Format parity across vertical (9:16) and horizontal (16:9) aspect ratios",
    ],
    recommendedGearAndSoftware: [
      "Adobe Premiere Pro 2026 / DaVinci Resolve Studio 19",
      "iZotope RX Advanced (Dialogue Denoise & De-reverb)",
      "Motion Bro / Mister Horse Dynamic Transitions",
      "Frame.io / Creative X Frame Review Engine",
    ],
    steps,
    status: "draft",
  };
}
