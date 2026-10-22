"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Building2,
  Clock,
  PlaySquare,
  CheckSquare,
  HardDrive,
  MessageSquare,
  Activity,
  Plus,
  Upload,
  Send,
  Lock,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  FileText,
  FileAudio,
  FileImage,
  ExternalLink,
  Loader2,
  User,
  Sparkles,
} from "lucide-react";
import AdvancedWorkspaceModules from "./AdvancedWorkspaceModules";
import type {
  StudioSession,
  StudioProject,
  StudioClient,
  StudioUser,
  StudioTask,
  StudioAsset,
  StudioMessage,
  StudioEvent,
  ProjectStatus,
  TaskPriority,
} from "@/lib/studio-types";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  ALLOWED_PROJECT_TRANSITIONS,
} from "@/lib/studio-permissions";

interface Props {
  session: StudioSession;
  project: StudioProject;
  client: StudioClient | null;
  manager: StudioUser | null;
  initialTasks: StudioTask[];
  initialAssets: StudioAsset[];
  initialClientMessages: StudioMessage[];
  initialInternalMessages: StudioMessage[];
  events: StudioEvent[];
  teamUsers: StudioUser[];
  isStaff: boolean;
}

export default function ProjectWorkspaceClient({
  session,
  project: initialProject,
  client,
  manager,
  initialTasks,
  initialAssets,
  initialClientMessages,
  initialInternalMessages,
  events,
  teamUsers,
  isStaff,
}: Props) {
  const [project, setProject] = useState<StudioProject>(initialProject);
  const [activeTab, setActiveTab] = useState<
    "overview" | "production_os" | "tasks" | "assets" | "messages" | "timeline"
  >("overview");

  // Status transition state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Tasks state
  const [tasks, setTasks] = useState<StudioTask[]>(initialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Assets state
  const [assets, setAssets] = useState<StudioAsset[]>(initialAssets);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Messages state
  const [messageTab, setMessageTab] = useState<"client" | "internal">("client");
  const [clientMessages, setClientMessages] = useState<StudioMessage[]>(initialClientMessages);
  const [internalMessages, setInternalMessages] = useState<StudioMessage[]>(initialInternalMessages);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Handle status update
  async function handleStatusChange(newStatus: ProjectStatus) {
    if (newStatus === project.status || updatingStatus) return;
    setStatusError(null);
    setUpdatingStatus(true);

    try {
      const res = await fetch(`/api/studio/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusError(data.error || "Failed to update project status");
        setUpdatingStatus(false);
        return;
      }
      setProject((prev) => ({ ...prev, status: newStatus }));
    } catch {
      setStatusError("Network error updating status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  // Handle task creation
  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim() || taskSubmitting) return;
    setTaskSubmitting(true);

    try {
      const res = await fetch("/api/studio/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          title: newTaskTitle.trim(),
          assigneeId: newTaskAssignee || undefined,
          priority: newTaskPriority,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setTasks((prev) => [data.data, ...prev]);
        setNewTaskTitle("");
        setIsAddingTask(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTaskSubmitting(false);
    }
  }

  // Handle task status toggle
  async function toggleTaskStatus(task: StudioTask) {
    const nextStatus = task.status === "completed" ? "todo" : "completed";
    try {
      const res = await fetch("/api/studio/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          status: nextStatus,
        }),
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

  // Handle asset upload via signed URL
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);

    try {
      // 1. Get signed upload URL
      const signRes = await fetch("/api/studio/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          projectId: project.id,
        }),
      });
      const signData = await signRes.json();
      if (!signRes.ok) {
        setUploadError(signData.error || "Failed to initiate upload");
        setUploading(false);
        return;
      }

      // 2. Upload file to Supabase storage signed URL
      const uploadRes = await fetch(signData.data.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!uploadRes.ok) {
        setUploadError("Direct storage upload failed. Verify Supabase bucket configuration.");
        setUploading(false);
        return;
      }

      // 3. Register asset record in DB
      let category = "other";
      if (file.type.startsWith("video/")) category = "wip_export";
      else if (file.type.startsWith("audio/")) category = "audio";
      else if (file.type.startsWith("image/")) category = "image";

      const recordRes = await fetch("/api/studio/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          filename: signData.data.filename,
          originalFilename: file.name,
          storagePath: signData.data.storagePath,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          category,
        }),
      });

      const recordData = await recordRes.json();
      if (recordRes.ok && recordData.data) {
        setAssets((prev) => [recordData.data, ...prev]);
      }
    } catch {
      setUploadError("Error during file upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // Handle sending message
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim() || sendingMessage) return;
    setSendingMessage(true);

    const isInternal = messageTab === "internal";

    try {
      const res = await fetch("/api/studio/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          messageText: messageText.trim(),
          isInternal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        if (isInternal) {
          setInternalMessages((prev) => [...prev, data.data]);
        } else {
          setClientMessages((prev) => [...prev, data.data]);
        }
        setMessageText("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  }

  const currentStatusColor =
    PROJECT_STATUS_COLORS[project.status] ??
    "text-zinc-400 bg-zinc-900 border-zinc-700";
  const currentStatusLabel =
    PROJECT_STATUS_LABELS[project.status] ?? project.status;
  const allowedNextStatuses = ALLOWED_PROJECT_TRANSITIONS[project.status] ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <Link
              href="/studio/projects"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Projects
            </Link>
            <span>/</span>
            <span className="text-zinc-200">{client?.companyName ?? "Workspace"}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            {project.title}
            <span className="text-xs px-2.5 py-0.5 rounded-md border text-zinc-400 border-zinc-700 bg-zinc-800/60 font-medium">
              {project.type}
            </span>
          </h1>
        </div>

        {/* Status Dropdown / Indicator */}
        <div className="flex items-center gap-3">
          {isStaff && allowedNextStatuses.length > 0 ? (
            <div className="relative">
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                disabled={updatingStatus}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider cursor-pointer focus:outline-none transition-colors ${currentStatusColor}`}
              >
                <option value={project.status} disabled>
                  Current: {currentStatusLabel}
                </option>
                {allowedNextStatuses.map((st) => (
                  <option key={st} value={st} className="bg-zinc-900 text-zinc-200">
                    &rarr; Move to: {PROJECT_STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span
              className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider ${currentStatusColor}`}
            >
              {currentStatusLabel}
            </span>
          )}

          {/* Video Review CTA Button */}
          <Link
            href={`/studio/review/${project.id}`}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full text-xs font-semibold transition-colors shadow-lg shadow-violet-600/20"
          >
            <PlaySquare className="w-3.5 h-3.5" />
            Review Studio
          </Link>
        </div>
      </div>

      {statusError && (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{statusError}</span>
        </div>
      )}

      {/* Meta Bar: Client info, Manager, Deadline */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Client */}
        <div className="bg-[#111113] p-3.5 rounded-xl border border-white/[0.06] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-zinc-500 uppercase font-medium">Client</div>
            <div className="text-white text-xs font-semibold truncate">
              {client?.companyName ?? "No Client Linked"}
            </div>
            {client?.contactName && (
              <div className="text-zinc-400 text-[11px] truncate">{client.contactName}</div>
            )}
          </div>
        </div>

        {/* Manager */}
        <div className="bg-[#111113] p-3.5 rounded-xl border border-white/[0.06] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-950/60 border border-violet-800/40 flex items-center justify-center text-violet-400 flex-shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-zinc-500 uppercase font-medium">Producer / Lead</div>
            <div className="text-white text-xs font-semibold truncate">
              {manager?.displayName ?? "Unassigned"}
            </div>
            {manager?.email && (
              <div className="text-zinc-400 text-[11px] truncate">{manager.email}</div>
            )}
          </div>
        </div>

        {/* Deadline */}
        <div className="bg-[#111113] p-3.5 rounded-xl border border-white/[0.06] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-zinc-500 uppercase font-medium">Delivery Deadline</div>
            <div className="text-white text-xs font-semibold truncate">
              {project.deadline
                ? new Date(project.deadline).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No deadline specified"}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-white/[0.06] space-x-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "overview"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <PlaySquare className="w-3.5 h-3.5" />
          Overview & Brief
        </button>

        <button
          onClick={() => setActiveTab("production_os")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "production_os"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          Production OS (Pipeline, QC & AI)
        </button>

        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "tasks"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Tasks ({tasks.length})
        </button>

        <button
          onClick={() => setActiveTab("assets")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "assets"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          Files & Media ({assets.length})
        </button>

        <button
          onClick={() => setActiveTab("messages")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "messages"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Messages ({clientMessages.length + (isStaff ? internalMessages.length : 0)})
        </button>

        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "timeline"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Activity Log
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Creative Brief */}
            <div className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                Creative Brief & Requirements
              </h2>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                {project.description || "No project brief provided yet."}
              </p>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                Studio Review & Export Pipeline
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href={`/studio/review/${project.id}`}
                  className="p-4 rounded-xl bg-violet-950/30 border border-violet-800/40 hover:border-violet-600 transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <PlaySquare className="w-5 h-5 text-violet-400" />
                    <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-semibold">Video Review Studio</h3>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      Frame-accurate scrubber, timestamped markers, client signoff
                    </p>
                  </div>
                </Link>

                <div
                  onClick={() => setActiveTab("assets")}
                  className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/20 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <HardDrive className="w-5 h-5 text-zinc-400" />
                    <span className="text-xs text-zinc-500 font-medium">{assets.length} items</span>
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-semibold">Upload Production Media</h3>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      Upload raw footage, WIP exports, master audio stems, and graphics
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar: Summary & Team */}
          <div className="space-y-6">
            <div className="bg-[#111113] p-5 rounded-2xl border border-white/[0.06] space-y-4">
              <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
                Production Checklist
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-zinc-400">Total Tasks</span>
                  <span className="font-semibold text-white">{tasks.length}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-zinc-400">Completed Tasks</span>
                  <span className="font-semibold text-emerald-400">
                    {tasks.filter((t) => t.status === "completed").length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-zinc-400">Total Media Assets</span>
                  <span className="font-semibold text-white">{assets.length}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-zinc-400">Priority Level</span>
                  <span className="font-semibold text-amber-400 uppercase">
                    {project.priority}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Production OS */}
      {activeTab === "production_os" && (
        <AdvancedWorkspaceModules
          project={project}
          session={session}
          tasks={tasks}
          onTaskCreated={(t) => setTasks((prev) => [...prev, t])}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Tab 2: Tasks */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Project Tasks</h2>
            {isStaff && (
              <button
                onClick={() => setIsAddingTask((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </button>
            )}
          </div>

          {/* Add task inline modal/box */}
          {isAddingTask && (
            <form
              onSubmit={handleCreateTask}
              className="p-4 bg-[#111113] border border-violet-500/30 rounded-xl space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task title (e.g. Rough cut assembly, Sound design pass)..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.08] rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="flex-1 px-3 py-2 bg-zinc-900 border border-white/[0.08] rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <button
                    type="submit"
                    disabled={taskSubmitting}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    {taskSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tasks list */}
          <div className="bg-[#111113] rounded-2xl border border-white/[0.06] divide-y divide-white/[0.04]">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No tasks logged for this project.
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        task.status === "completed"
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : "border-zinc-700 hover:border-violet-500"
                      }`}
                    >
                      {task.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <span
                      className={`text-sm truncate ${
                        task.status === "completed"
                          ? "line-through text-zinc-500"
                          : "text-zinc-200"
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-md uppercase font-bold text-zinc-400 bg-zinc-800">
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Media & Files */}
      {activeTab === "assets" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">Media Files & Master Assets</h2>
              <p className="text-zinc-400 text-xs">
                High-resolution exports, footage files, audio mixes, and deliverables
              </p>
            </div>

            {/* Upload button with hidden file input */}
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium text-xs cursor-pointer transition-colors shadow-lg shadow-violet-600/20">
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{uploading ? "Uploading..." : "Upload File"}</span>
              <input
                type="file"
                disabled={uploading}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {uploadError && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Files grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {assets.length === 0 ? (
              <div className="col-span-full py-16 text-center text-zinc-500 text-sm bg-[#111113] rounded-2xl border border-white/[0.06]">
                No files uploaded to this project yet. Use the upload button above to add assets.
              </div>
            ) : (
              assets.map((asset) => {
                const isVideo = asset.mimeType.startsWith("video/");
                const isAudio = asset.mimeType.startsWith("audio/");
                const isImg = asset.mimeType.startsWith("image/");
                const Icon = isVideo
                  ? FileVideo
                  : isAudio
                  ? FileAudio
                  : isImg
                  ? FileImage
                  : FileText;

                return (
                  <div
                    key={asset.id}
                    className="p-4 bg-[#111113] rounded-xl border border-white/[0.06] flex items-center gap-3.5 hover:border-violet-500/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-violet-400 flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-white text-xs font-medium truncate" title={asset.originalFilename || asset.filename}>
                        {asset.originalFilename || asset.filename}
                      </div>
                      <div className="text-zinc-500 text-[11px] mt-0.5">
                        {(asset.sizeBytes / (1024 * 1024)).toFixed(1)} MB &bull; {asset.category}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Messages */}
      {activeTab === "messages" && (
        <div className="space-y-4">
          {/* Sub-tabs if staff */}
          {isStaff && (
            <div className="flex gap-2">
              <button
                onClick={() => setMessageTab("client")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  messageTab === "client"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Client Discussion
              </button>
              <button
                onClick={() => setMessageTab("internal")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  messageTab === "internal"
                    ? "bg-amber-950/60 border border-amber-800 text-amber-300"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Lock className="w-3 h-3 text-amber-400" />
                Internal Agency Notes (Hidden from Client)
              </button>
            </div>
          )}

          {/* Messages Feed */}
          <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-4 min-h-[300px] max-h-[500px] overflow-y-auto space-y-3">
            {((messageTab === "internal" ? internalMessages : clientMessages).length === 0) ? (
              <div className="h-48 flex items-center justify-center text-zinc-500 text-xs">
                No messages yet. Send a note below to start the conversation.
              </div>
            ) : (
              (messageTab === "internal" ? internalMessages : clientMessages).map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-xl border max-w-lg ${
                    msg.authorId === session.userId
                      ? "ml-auto bg-violet-950/30 border-violet-800/40 text-violet-100"
                      : "bg-zinc-900/60 border-white/[0.06] text-zinc-200"
                  }`}
                >
                  <div className="text-[11px] text-zinc-400 font-medium mb-1">
                    {msg.author?.displayName ?? "User"} &bull;{" "}
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="text-xs leading-relaxed whitespace-pre-wrap">{msg.body}</div>
                </div>
              ))
            )}
          </div>

          {/* Composer */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={
                messageTab === "internal"
                  ? "Type internal agency note (visible only to managers and editors)..."
                  : "Type message to client..."
              }
              className="flex-1 px-4 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <button
              type="submit"
              disabled={sendingMessage || !messageText.trim()}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          </form>
        </div>
      )}

      {/* Tab 5: Timeline / Events */}
      {activeTab === "timeline" && (
        <div className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Project Event History
          </h2>
          <div className="space-y-4 text-xs">
            {events.length === 0 ? (
              <p className="text-zinc-500">No events recorded yet.</p>
            ) : (
              events.map((evt) => (
                <div key={evt.id} className="flex items-start gap-3 border-l-2 border-violet-500/30 pl-4 py-1">
                  <div className="min-w-0">
                    <span className="font-semibold text-white uppercase tracking-wider text-[10px]">
                      {evt.eventType.replace(/_/g, " ")}
                    </span>
                    <span className="text-zinc-500 ml-2">
                      {new Date(evt.createdAt).toLocaleString()}
                    </span>
                    <p className="text-zinc-400 mt-0.5">
                      Actor: {evt.actor?.displayName ?? "System"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
