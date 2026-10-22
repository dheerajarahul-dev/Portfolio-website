"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FolderKanban, CheckSquare, PlaySquare, AlertCircle, 
  Clock, ArrowRight, ChevronRight, TrendingUp, Film,
  Users, Inbox, Zap, AlertTriangle, ShieldCheck
} from "lucide-react";
import type { StudioSession, StudioProject, StudioTask, ActionCenterItem } from "@/lib/studio-types";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "@/lib/studio-permissions";

interface Props {
  session: StudioSession;
  metrics: {
    totalProjects: number;
    activeProjects: number;
    overdueTaskCount: number;
    pendingReviews: number;
    byStatus: Record<string, number>;
  };
  recentProjects: StudioProject[];
  overdueTasks: StudioTask[];
}

function MetricCard({
  label,
  value,
  icon: Icon,
  href,
  accent = false,
  urgent = false,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  href: string;
  accent?: boolean;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        group flex flex-col gap-3 p-4 rounded-xl border transition-all
        ${urgent
          ? "bg-red-950/30 border-red-800/40 hover:border-red-700/60"
          : accent
          ? "bg-violet-950/30 border-violet-800/40 hover:border-violet-700/60"
          : "bg-zinc-900/40 border-white/[0.06] hover:border-white/10"
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center
          ${urgent ? "bg-red-900/60" : accent ? "bg-violet-900/60" : "bg-zinc-800"}
        `}>
          <Icon className={`w-4 h-4 ${urgent ? "text-red-400" : accent ? "text-violet-400" : "text-zinc-400"}`} />
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
      </div>
      <div>
        <div className={`text-2xl font-bold tracking-tight ${urgent ? "text-red-300" : accent ? "text-violet-300" : "text-white"}`}>
          {value}
        </div>
        <div className="text-zinc-500 text-xs mt-0.5">{label}</div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorClass = PROJECT_STATUS_COLORS[status as keyof typeof PROJECT_STATUS_COLORS] ?? "text-zinc-400 bg-zinc-900 border-zinc-700";
  const label = PROJECT_STATUS_LABELS[status as keyof typeof PROJECT_STATUS_LABELS] ?? status;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

export default function StudioDashboardClient({ session, metrics, recentProjects, overdueTasks }: Props) {
  const isStaff = session.role === "super_admin" || session.role === "manager";
  const isEditor = session.role === "editor";
  const isClient = session.role === "client" || session.role === "reviewer";

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const [actionItems, setActionItems] = useState<ActionCenterItem[]>([]);

  useEffect(() => {
    fetch("/api/studio/ops")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.actionCenterItems) {
          setActionItems(d.actionCenterItems);
        }
      })
      .catch(() => null);
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">
          {greeting}, {session.displayName.split(" ")[0]}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {isStaff && "Here&apos;s a summary of your agency's production activity."}
          {isEditor && "Here's what you need to work on today."}
          {isClient && "Track your project progress and pending approvals."}
        </p>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label={isStaff ? "Active projects" : "My projects"}
          value={metrics.activeProjects}
          icon={FolderKanban}
          href="/studio/projects"
          accent
        />
        <MetricCard
          label="Overdue tasks"
          value={metrics.overdueTaskCount}
          icon={AlertCircle}
          href="/studio/tasks?filter=overdue"
          urgent={metrics.overdueTaskCount > 0}
        />
        {isStaff && (
          <MetricCard
            label="Pending reviews"
            value={metrics.pendingReviews}
            icon={PlaySquare}
            href="/studio/review"
          />
        )}
        <MetricCard
          label="Total projects"
          value={metrics.totalProjects}
          icon={TrendingUp}
          href="/studio/projects"
        />
      </div>

      {/* Unified Action Center */}
      {actionItems.length > 0 && (
        <div className="bg-gradient-to-r from-violet-950/40 via-zinc-900 to-black p-5 rounded-2xl border border-violet-800/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Unified Action Center ({actionItems.length} Prioritized Items)
              </h2>
            </div>
            <span className="text-[11px] text-zinc-400">Auto-aggregated blockers & deadlines</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-black/50 border border-white/5 rounded-xl space-y-2 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-zinc-300 truncate">{item.projectTitle}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        item.priority === "urgent"
                          ? "bg-red-950 text-red-300 border border-red-800/60"
                          : "bg-amber-950 text-amber-300 border border-amber-800/60"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5 line-clamp-2">{item.description}</p>
                </div>

                <Link
                  href={item.actionUrl}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors"
                >
                  {item.actionLabel} &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent projects */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-300">
              {isStaff ? "Recent projects" : "My projects"}
            </h2>
            <Link
              href="/studio/projects"
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <div className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-8 text-center">
              <FolderKanban className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No projects yet</p>
              {isStaff && (
                <Link
                  href="/studio/projects/new"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Create your first project <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-white/[0.06] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left text-[11px] text-zinc-500 font-medium px-4 py-2.5">Project</th>
                    <th className="text-left text-[11px] text-zinc-500 font-medium px-4 py-2.5 hidden sm:table-cell">Status</th>
                    <th className="text-left text-[11px] text-zinc-500 font-medium px-4 py-2.5 hidden md:table-cell">Deadline</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {recentProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white text-sm truncate max-w-[200px]">
                          {project.title}
                        </div>
                        <div className="text-zinc-500 text-xs mt-0.5 capitalize">{project.type}</div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {project.deadline ? (
                          <span className="text-zinc-400 text-xs">
                            {new Date(project.deadline).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/studio/projects/${project.id}`}
                          className="text-zinc-500 hover:text-violet-400 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Overdue tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-zinc-300">Overdue tasks</h2>
              <Link
                href="/studio/tasks?filter=overdue"
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {overdueTasks.length === 0 ? (
              <div className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-6 text-center">
                <CheckSquare className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-zinc-500 text-xs">All caught up</p>
              </div>
            ) : (
              <div className="bg-zinc-900/40 border border-white/[0.06] rounded-xl divide-y divide-white/[0.03] overflow-hidden">
                {overdueTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm truncate">{task.title}</div>
                      {task.dueDate && (
                        <div className="text-red-400 text-xs mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="text-sm font-medium text-zinc-300 mb-3">Quick actions</h2>
            <div className="space-y-1.5">
              {(session.role === "super_admin" || session.role === "manager") && (
                <>
                  <Link href="/studio/projects/new" className="flex items-center gap-3 p-3 bg-zinc-900/40 border border-white/[0.06] rounded-lg hover:border-white/10 hover:bg-zinc-900/60 transition-all text-sm text-zinc-300 hover:text-white">
                    <FolderKanban className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    Create project
                  </Link>
                  <Link href="/studio/team" className="flex items-center gap-3 p-3 bg-zinc-900/40 border border-white/[0.06] rounded-lg hover:border-white/10 hover:bg-zinc-900/60 transition-all text-sm text-zinc-300 hover:text-white">
                    <Users className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    Invite team member
                  </Link>
                </>
              )}
              {(session.role === "editor") && (
                <Link href="/studio/projects" className="flex items-center gap-3 p-3 bg-zinc-900/40 border border-white/[0.06] rounded-lg hover:border-white/10 hover:bg-zinc-900/60 transition-all text-sm text-zinc-300 hover:text-white">
                  <Film className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  View assigned projects
                </Link>
              )}
              {(session.role === "client") && (
                <Link href="/studio/projects/new" className="flex items-center gap-3 p-3 bg-zinc-900/40 border border-white/[0.06] rounded-lg hover:border-white/10 hover:bg-zinc-900/60 transition-all text-sm text-zinc-300 hover:text-white">
                  <Film className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  Submit project request
                </Link>
              )}
              <Link href="/studio/inbox" className="flex items-center gap-3 p-3 bg-zinc-900/40 border border-white/[0.06] rounded-lg hover:border-white/10 hover:bg-zinc-900/60 transition-all text-sm text-zinc-300 hover:text-white">
                <Inbox className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                Go to inbox
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
