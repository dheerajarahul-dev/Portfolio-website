// Studio Orchestration API — Pipelines, Dependencies, AI Planning
import { NextRequest, NextResponse } from "next/server";
import { requireStudioSession, StudioAuthError } from "@/lib/studio-auth";
import {
  DEFAULT_PIPELINE_STAGES,
  analyzeTaskDependencies,
  evaluateStageTransition,
  generateProductionPlan,
  mapStageToProjectStatus,
} from "@/lib/studio-orchestration";
import { listTasks, getProjectById, updateProject, createTask } from "@/lib/studio-db";
import type { TaskDependency } from "@/lib/studio-types";

export async function GET(request: NextRequest) {
  try {
    await requireStudioSession();
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const tasks = await listTasks({ projectId }).catch(() => []);

    // Infer finish-to-start dependencies sequentially if not explicitly stored
    const dependencies: TaskDependency[] = [];
    for (let i = 1; i < tasks.length; i++) {
      dependencies.push({
        taskId: tasks[i].id,
        dependsOnTaskId: tasks[i - 1].id,
        type: "finish_to_start",
      });
    }

    const blockerAnalysis = analyzeTaskDependencies(tasks, dependencies);

    // Evaluate stage transition based on current stage (derived from task completion ratio)
    const completedTasksCount = tasks.filter((t) => t.status === "completed").length;
    const inferredStageOrder = Math.min(
      5,
      Math.max(1, Math.floor((completedTasksCount / Math.max(1, tasks.length)) * 5) + 1)
    );

    const transitionEval = evaluateStageTransition(inferredStageOrder, tasks, [
      { type: "internal", approved: completedTasksCount >= 1 },
      { type: "client", approved: completedTasksCount >= Math.floor(tasks.length * 0.75) },
    ]);

    return NextResponse.json({
      success: true,
      stages: DEFAULT_PIPELINE_STAGES,
      currentStageOrder: inferredStageOrder,
      blockerAnalysis,
      transitionEval,
    });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("GET /api/studio/orchestration error:", err);
    return NextResponse.json({ error: "Failed to load orchestration status" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStudioSession();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = body.action as string;

    if (action === "generate_plan") {
      const prompt = {
        projectId: String(body.projectId || ""),
        projectTitle: String(body.projectTitle || "Production"),
        projectType: String(body.projectType || "Commercial"),
        brief: String(body.brief || "Deliver a high-impact narrative video."),
        targetDeadline: body.targetDeadline ? String(body.targetDeadline) : undefined,
        channels: Array.isArray(body.channels) ? (body.channels as string[]) : ["YouTube", "Instagram"],
      };

      const plan = generateProductionPlan(prompt);
      return NextResponse.json({ success: true, plan });
    }

    if (action === "apply_plan") {
      const projectId = String(body.projectId || "");
      const steps = Array.isArray(body.steps)
        ? (body.steps as Array<{ title: string; estimatedHours: number; phase: string }>)
        : [];

      for (const step of steps) {
        await createTask({
          projectId,
          title: `[${step.phase}] ${step.title}`,
          description: `Estimated workload: ${step.estimatedHours} hours. Auto-generated from production brief.`,
          createdBy: session.userId,
          priority: "medium",
        }).catch(() => null);
      }

      return NextResponse.json({ success: true, appliedTasksCount: steps.length });
    }

    if (action === "advance_stage") {
      const projectId = String(body.projectId || "");
      const nextStageOrder = Number(body.nextStageOrder || 2);
      const newStatus = mapStageToProjectStatus(nextStageOrder);

      const updated = await updateProject(projectId, { status: newStatus });
      return NextResponse.json({ success: true, updated, newStatus });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("POST /api/studio/orchestration error:", err);
    return NextResponse.json({ error: "Orchestration operation failed" }, { status: 500 });
  }
}
