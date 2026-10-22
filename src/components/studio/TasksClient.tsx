"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderKanban,
  Loader2,
} from "lucide-react";
import type { StudioSession, StudioTask, StudioProject, TaskStatus, TaskPriority } from "@/lib/studio-types";

interface Props {
  session: StudioSession;
  initialTasks: StudioTask[];
  projects: StudioProject[];
  isStaff: boolean;
}

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All Tasks", value: "all" },
  { label: "To Do", value: "todo" },
  { label: "In Progress", value: "in_progress" },
  { label: "Blocked", value: "blocked" },
  { label: "Completed", value: "completed" },
];

export default function TasksClient({
  session,
  initialTasks,
  projects,
  isStaff,
}: Props) {
  const [tasks, setTasks] = useState<StudioTask[]>(initialTasks);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [search, setSearch] = useState("");

  // Modal create state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchSearch =
        !search ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        selectedStatus === "all" || task.status === selectedStatus;

      const matchProject =
        selectedProject === "all" || task.projectId === selectedProject;

      return matchSearch && matchStatus && matchProject;
    });
  }, [tasks, search, selectedStatus, selectedProject]);

  async function handleToggleStatus(task: StudioTask) {
    const nextStatus: TaskStatus = task.status === "completed" ? "todo" : "completed";
    try {
      const res = await fetch("/api/studio/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: nextStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !projectId || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/studio/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setTasks((prev) => [data.data, ...prev]);
        setTitle("");
        setDescription("");
        setDueDate("");
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => map.set(p.id, p.title));
    return map;
  }, [projects]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-violet-500" />
            Task Management
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Track video production milestones, editorial passes, and deliverables
          </p>
        </div>

        {projects.length > 0 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-violet-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        )}
      </div>

      {/* Control bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#111113] p-3 rounded-2xl border border-white/[0.06]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3.5 py-2 bg-zinc-900/80 border border-white/[0.06] rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status select */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-zinc-900/80 border border-white/[0.06] rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value} className="bg-zinc-900">
                {s.label}
              </option>
            ))}
          </select>

          {/* Project select */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 bg-zinc-900/80 border border-white/[0.06] rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer max-w-[200px] truncate"
          >
            <option value="all" className="bg-zinc-900">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-zinc-900">
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks Table / List */}
      <div className="bg-[#111113] rounded-2xl border border-white/[0.06] divide-y divide-white/[0.04] overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-16 text-center text-zinc-500 text-sm">
            No tasks match the active filters.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const projectTitle = projectMap.get(task.projectId) || "Project";
            const isCompleted = task.status === "completed";

            return (
              <div
                key={task.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                      isCompleted
                        ? "bg-emerald-600 border-emerald-500 text-white"
                        : "border-zinc-700 hover:border-violet-500"
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0">
                    <div
                      className={`text-sm font-medium truncate ${
                        isCompleted ? "line-through text-zinc-500" : "text-white"
                      }`}
                    >
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                      <Link
                        href={`/studio/projects/${task.projectId}`}
                        className="hover:text-violet-400 transition-colors flex items-center gap-1 truncate"
                      >
                        <FolderKanban className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{projectTitle}</span>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {task.dueDate && (
                    <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-400">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  <span className="text-[10px] px-2 py-0.5 rounded-md uppercase font-bold text-zinc-400 bg-zinc-800">
                    {task.priority}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: New Task */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161619] border border-white/[0.08] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Create New Task</h2>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Project <span className="text-red-400">*</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Task Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Color grading pass on Scene 3"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional instructions or notes..."
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
