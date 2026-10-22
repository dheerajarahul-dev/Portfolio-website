"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Search,
  Plus,
  Filter,
  Calendar,
  User,
  Clock,
  ArrowRight,
  LayoutGrid,
  List,
  Sparkles,
  Building2,
  AlertCircle,
} from "lucide-react";
import type { StudioSession, StudioProject, ProjectStatus, ProjectPriority } from "@/lib/studio-types";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "@/lib/studio-permissions";

interface ProjectsListClientProps {
  session: StudioSession;
  initialProjects: StudioProject[];
  total: number;
  isStaff: boolean;
}

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All Statuses", value: "all" },
  { label: "In Production", value: "in_production" },
  { label: "Review", value: "client_review" },
  { label: "Internal Review", value: "internal_review" },
  { label: "Requests", value: "request_received" },
  { label: "Completed", value: "completed" },
  { label: "Archived", value: "archived" },
];

const PRIORITY_COLORS: Record<ProjectPriority, string> = {
  low: "text-zinc-400 bg-zinc-800/40 border-zinc-700/40",
  medium: "text-blue-400 bg-blue-950/40 border-blue-800/40",
  high: "text-amber-400 bg-amber-950/40 border-amber-800/40",
  urgent: "text-red-400 bg-red-950/40 border-red-800/40",
};

export default function ProjectsListClient({
  session,
  initialProjects,
  total,
  isStaff,
}: ProjectsListClientProps) {
  const [projects] = useState<StudioProject[]>(initialProjects);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Text search
      const term = search.toLowerCase().trim();
      const matchSearch =
        !term ||
        project.title.toLowerCase().includes(term) ||
        project.type.toLowerCase().includes(term) ||
        project.client?.companyName?.toLowerCase().includes(term) ||
        project.client?.contactName?.toLowerCase().includes(term);

      // Status filter
      const matchStatus =
        selectedStatus === "all" || project.status === selectedStatus;

      // Priority filter
      const matchPriority =
        selectedPriority === "all" || project.priority === selectedPriority;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [projects, search, selectedStatus, selectedPriority]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-violet-500" />
            {isStaff ? "Project Directory" : "My Projects"}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {isStaff
              ? `Managing ${projects.length} active studio video productions`
              : "Track all videos currently in progress and pending reviews"}
          </p>
        </div>

        {isStaff && (
          <Link
            href="/studio/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-violet-600/20"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        )}
      </div>

      {/* Control Bar: Search + Filters + View Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#111113] p-3 rounded-2xl border border-white/[0.06]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project title, client, or type..."
            className="w-full pl-9 pr-3.5 py-2 bg-zinc-900/80 border border-white/[0.06] rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-zinc-900/80 border border-white/[0.06] rounded-xl text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500/50 cursor-pointer"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value} className="bg-zinc-900 text-zinc-200">
                {s.label}
              </option>
            ))}
          </select>

          {/* Priority Dropdown */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 bg-zinc-900/80 border border-white/[0.06] rounded-xl text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500/50 cursor-pointer"
          >
            <option value="all" className="bg-zinc-900 text-zinc-200">All Priorities</option>
            <option value="urgent" className="bg-zinc-900 text-zinc-200">Urgent</option>
            <option value="high" className="bg-zinc-900 text-zinc-200">High</option>
            <option value="medium" className="bg-zinc-900 text-zinc-200">Medium</option>
            <option value="low" className="bg-zinc-900 text-zinc-200">Low</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-900 rounded-xl p-0.5 border border-white/[0.06]">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-violet-600 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table" ? "bg-violet-600 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Content */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-[#111113]/50 rounded-2xl border border-white/[0.06]">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-3">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-white font-medium text-base">No projects found</h3>
          <p className="text-zinc-500 text-sm max-w-sm mt-1">
            {search || selectedStatus !== "all" || selectedPriority !== "all"
              ? "Try adjusting your search criteria or clearing active filters."
              : "No video projects have been created yet."}
          </p>
          {isStaff && (
            <Link
              href="/studio/projects/new"
              className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Create First Project
            </Link>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const statusColor =
              PROJECT_STATUS_COLORS[project.status] ??
              "text-zinc-400 bg-zinc-900 border-zinc-700";
            const statusLabel =
              PROJECT_STATUS_LABELS[project.status] ?? project.status;
            const priorityColor =
              PRIORITY_COLORS[project.priority] ?? PRIORITY_COLORS.medium;

            return (
              <Link
                key={project.id}
                href={`/studio/projects/${project.id}`}
                className="group flex flex-col justify-between p-5 bg-[#111113] hover:bg-[#161619] rounded-2xl border border-white/[0.06] hover:border-violet-500/30 transition-all duration-200 shadow-sm"
              >
                <div>
                  {/* Badges header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${statusColor}`}
                    >
                      {statusLabel}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] uppercase font-bold tracking-wider ${priorityColor}`}
                    >
                      {project.priority}
                    </span>
                  </div>

                  {/* Title & Type */}
                  <h3 className="text-white font-semibold text-base group-hover:text-violet-400 transition-colors line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-zinc-400 text-xs mt-0.5 font-medium">
                    {project.type}
                  </p>

                  {/* Description if present */}
                  {project.description && (
                    <p className="text-zinc-500 text-xs mt-2.5 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>

                {/* Footer details */}
                <div className="mt-5 pt-3.5 border-t border-white/[0.04] space-y-2 text-xs text-zinc-400">
                  {/* Client organization */}
                  {project.client && (
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Building2 className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                      <span className="truncate">{project.client.companyName}</span>
                    </div>
                  )}

                  {/* Deadline */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "No deadline"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-violet-400 group-hover:translate-x-0.5 transition-transform font-medium">
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-[#111113] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-xs uppercase font-semibold text-zinc-500 tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Project</th>
                  <th className="px-4 py-3.5">Client</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Deadline</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredProjects.map((project) => {
                  const statusColor =
                    PROJECT_STATUS_COLORS[project.status] ??
                    "text-zinc-400 bg-zinc-900 border-zinc-700";
                  const statusLabel =
                    PROJECT_STATUS_LABELS[project.status] ?? project.status;
                  const priorityColor =
                    PRIORITY_COLORS[project.priority] ?? PRIORITY_COLORS.medium;

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/studio/projects/${project.id}`}
                          className="font-medium text-white hover:text-violet-400 transition-colors block"
                        >
                          {project.title}
                        </Link>
                        <span className="text-xs text-zinc-500">{project.type}</span>
                      </td>
                      <td className="px-4 py-4 text-zinc-300">
                        {project.client?.companyName ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${statusColor}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] uppercase font-bold tracking-wider ${priorityColor}`}
                        >
                          {project.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-zinc-400">
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/studio/projects/${project.id}`}
                          className="text-xs font-semibold text-violet-400 hover:text-violet-300 inline-flex items-center gap-1"
                        >
                          View
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
