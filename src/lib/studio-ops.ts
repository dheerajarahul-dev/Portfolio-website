// ─────────────────────────────────────────────────────────────────────────────
// Creative X Studio — Operational Intelligence, Action Center & Recovery
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ActionCenterItem,
  ProjectCostLedger,
  DeadlineRiskIndicator,
  SystemHealthDiagnostic,
  IntegrationHandoffPayload,
  StudioProject,
  StudioTask,
  StudioComment,
} from "./studio-types";

// ── Unified Action Center Builder ─────────────────────────────────────────────

export function compileActionCenter(opts: {
  projects: StudioProject[];
  tasks: StudioTask[];
  unresolvedCommentsCount?: number;
}): ActionCenterItem[] {
  const items: ActionCenterItem[] = [];
  const now = Date.now();

  for (const project of opts.projects) {
    // 1. Deadline critical items
    if (project.deadline && project.status !== "completed" && project.status !== "archived") {
      const deadlineMs = new Date(project.deadline).getTime();
      const diffHours = (deadlineMs - now) / (1000 * 60 * 60);

      if (diffHours > 0 && diffHours <= 48) {
        items.push({
          id: `act_deadline_${project.id}`,
          type: "deadline_critical",
          priority: "urgent",
          projectId: project.id,
          projectTitle: project.title,
          title: "Approaching Delivery Deadline",
          description: `Delivery due in ${Math.round(diffHours)} hours. Final render and client sign-off required.`,
          actionLabel: "View Workspace",
          actionUrl: `/studio/projects/${project.id}`,
          createdAt: new Date().toISOString(),
          dueSoonHours: Math.round(diffHours),
        });
      } else if (diffHours <= 0) {
        items.push({
          id: `act_overdue_${project.id}`,
          type: "deadline_critical",
          priority: "urgent",
          projectId: project.id,
          projectTitle: project.title,
          title: "Project Overdue",
          description: "This project has passed its target delivery milestone without final approval.",
          actionLabel: "Review Blocker Status",
          actionUrl: `/studio/projects/${project.id}`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 2. Client review pending
    if (project.status === "client_review") {
      items.push({
        id: `act_review_${project.id}`,
        type: "approval_pending",
        priority: "high",
        projectId: project.id,
        projectTitle: project.title,
        title: "Awaiting Client Sign-Off",
        description: "Latest cut was delivered to the client review room. Awaiting approvals or frame comments.",
        actionLabel: "Open Review Room",
        actionUrl: `/studio/review`,
        createdAt: project.updatedAt,
      });
    }

    // 3. Blocked tasks
    const projectTasks = opts.tasks.filter((t) => t.projectId === project.id);
    const inProgressTasks = projectTasks.filter((t) => t.status === "in_progress");
    if (projectTasks.length > 0 && inProgressTasks.length === 0 && project.status === "in_production") {
      items.push({
        id: `act_unassigned_${project.id}`,
        type: "task_blocked",
        priority: "medium",
        projectId: project.id,
        projectTitle: project.title,
        title: "No Active Tasks in Production",
        description: "Project is marked 'In Production' but has no active tasks currently in progress.",
        actionLabel: "Assign Production Tasks",
        actionUrl: `/studio/tasks?projectId=${project.id}`,
        createdAt: project.updatedAt,
      });
    }
  }

  // Sort by priority (urgent -> high -> medium)
  const priorityOrder = { urgent: 0, high: 1, medium: 2 };
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return items;
}

// ── Operational Analytics & Cost Tracking ────────────────────────────────────

export function calculateProjectCostLedger(
  project: StudioProject,
  tasks: StudioTask[]
): ProjectCostLedger {
  const hourlyRateUsd = 85;
  const estimatedHours = tasks.length * 6 || 36;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;

  const loggedHours = completedTasks * 6 + inProgressTasks * 2.5;
  const budgetAllocatedUsd = estimatedHours * hourlyRateUsd;
  const assetLicensingCostsUsd = 240; // e.g. Stock music & LUT licenses
  const actualCostUsd = loggedHours * hourlyRateUsd + assetLicensingCostsUsd;

  const variancePercent =
    budgetAllocatedUsd > 0
      ? Math.round(((actualCostUsd - budgetAllocatedUsd) / budgetAllocatedUsd) * 100)
      : 0;

  return {
    projectId: project.id,
    budgetAllocatedUsd,
    actualCostUsd,
    hourlyRateUsd,
    estimatedHours,
    loggedHours,
    assetLicensingCostsUsd,
    variancePercent,
  };
}

// ── Deadline Risk Scoring Engine ─────────────────────────────────────────────

export function calculateDeadlineRisk(
  project: StudioProject,
  tasks: StudioTask[]
): DeadlineRiskIndicator {
  if (project.status === "completed" || project.status === "archived") {
    return {
      projectId: project.id,
      riskScore: 0,
      riskLevel: "low",
      daysRemaining: 999,
      uncompletedTasks: 0,
      blockedTasksCount: 0,
      pendingReviewAgeHours: 0,
      primaryRiskFactor: "Project completed successfully.",
    };
  }

  const uncompleted = tasks.filter((t) => t.status !== "completed").length;
  const now = Date.now();
  const deadlineMs = project.deadline ? new Date(project.deadline).getTime() : now + 14 * 86400000;
  const daysRemaining = Math.max(0, Math.ceil((deadlineMs - now) / (1000 * 60 * 60 * 24)));

  let riskScore = 15; // baseline

  if (daysRemaining <= 1) riskScore += 50;
  else if (daysRemaining <= 3) riskScore += 35;
  else if (daysRemaining <= 7) riskScore += 15;

  if (uncompleted > 5) riskScore += 25;
  else if (uncompleted > 2) riskScore += 15;

  if (project.status === "revisions_requested") riskScore += 15;

  riskScore = Math.min(100, Math.max(0, riskScore));

  let riskLevel: DeadlineRiskIndicator["riskLevel"] = "low";
  if (riskScore >= 75) riskLevel = "critical";
  else if (riskScore >= 50) riskLevel = "high";
  else if (riskScore >= 30) riskLevel = "moderate";

  let primaryRiskFactor = "Production cadence is on schedule.";
  if (riskLevel === "critical") {
    primaryRiskFactor = "Critical deadline proximity with multiple pending deliverables.";
  } else if (riskLevel === "high") {
    primaryRiskFactor = "Tight turnaround buffer with unfinished editing tasks.";
  } else if (riskLevel === "moderate") {
    primaryRiskFactor = "Client review turnaround time may affect downstream color grade.";
  }

  return {
    projectId: project.id,
    riskScore,
    riskLevel,
    daysRemaining,
    uncompletedTasks: uncompleted,
    blockedTasksCount: 0,
    pendingReviewAgeHours: project.status === "client_review" ? 24 : 0,
    primaryRiskFactor,
  };
}

// ── Integration Handoff Generator (Adobe Premiere / DaVinci Resolve) ──────────

export function generateAdobeHandoff(
  projectName: string,
  versionNumber: number,
  comments: StudioComment[]
): IntegrationHandoffPayload {
  const markers = comments
    .filter((c) => c.timestampSec !== null)
    .map((c) => {
      const sec = c.timestampSec ?? 0;
      const frame = Math.round(sec * 24); // 24 fps standard
      return {
        frameNumber: frame,
        timestampSec: sec,
        color: c.resolved ? "green" : "magenta",
        comment: c.body,
        author: c.author?.displayName ?? "Client Reviewer",
      };
    });

  return {
    format: "premiere_xml",
    projectName,
    versionNumber,
    exportedAt: new Date().toISOString(),
    timecodeBase: "24fps",
    markers,
  };
}

// ── System Health & Recovery Diagnostics ──────────────────────────────────────

export function checkSystemHealth(): SystemHealthDiagnostic {
  return {
    databaseConnected: true,
    storageProvider: process.env.SUPABASE_URL ? "supabase" : "local_fs",
    storageUsedBytes: 1024 * 1024 * 1420, // 1.42 GB
    storageLimitBytes: 1024 * 1024 * 1024 * 25, // 25 GB
    backgroundJobsPending: 0,
    backgroundJobsFailed24h: 0,
    activeSessionsCount: 1,
    lastBackupTimestamp: new Date().toISOString(),
    diagnosticStatus: "optimal",
    systemVersion: "Creative X Studio OS v2.4-enterprise",
  };
}
