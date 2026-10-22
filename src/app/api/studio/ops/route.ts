// Studio Operations API — Action Center, Cost Tracking, Deadline Risk & Adobe Handoff
import { NextRequest, NextResponse } from "next/server";
import { requireStudioSession, StudioAuthError } from "@/lib/studio-auth";
import {
  compileActionCenter,
  calculateProjectCostLedger,
  calculateDeadlineRisk,
  generateAdobeHandoff,
  checkSystemHealth,
} from "@/lib/studio-ops";
import { listProjects, listTasks, listComments, getProjectById } from "@/lib/studio-db";

export async function GET(request: NextRequest) {
  try {
    await requireStudioSession();
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("projectId");
    const format = searchParams.get("export");

    if (format === "adobe_xml" && projectId) {
      const project = await getProjectById(projectId);
      const comments = await listComments(projectId).catch(() => []);
      const handoff = generateAdobeHandoff(project?.title || "Production", 1, comments);
      return NextResponse.json({ success: true, handoff });
    }

    const [projectsResult, tasks] = await Promise.all([
      listProjects({ limit: 50 }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 50, hasMore: false })),
      listTasks().catch(() => []),
    ]);

    const projects = projectsResult.items;

    // 1. Unified Action Center items across active projects
    const actionCenterItems = compileActionCenter({ projects, tasks });

    // 2. Specific project analytics (if projectId provided)
    let projectCostLedger = null;
    let deadlineRisk = null;

    if (projectId) {
      const targetProj = projects.find((p) => p.id === projectId) ?? (await getProjectById(projectId));
      if (targetProj) {
        const projectTasks = tasks.filter((t) => t.projectId === projectId);
        projectCostLedger = calculateProjectCostLedger(targetProj, projectTasks);
        deadlineRisk = calculateDeadlineRisk(targetProj, projectTasks);
      }
    }

    // 3. System health diagnostics
    const systemHealth = checkSystemHealth();

    return NextResponse.json({
      success: true,
      actionCenterItems,
      projectCostLedger,
      deadlineRisk,
      systemHealth,
    });
  } catch (err) {
    if (err instanceof StudioAuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("GET /api/studio/ops error:", err);
    return NextResponse.json({ error: "Failed to load operations telemetry" }, { status: 500 });
  }
}
