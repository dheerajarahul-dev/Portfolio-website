"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Film,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
  Plus,
  Check,
} from "lucide-react";
import type { StudioSession, StudioClient, ProjectPriority } from "@/lib/studio-types";

interface Props {
  session: StudioSession;
  existingClients: StudioClient[];
}

const PROJECT_TYPES = [
  "YouTube Long-form",
  "Brand Commercial",
  "Social Media Reel / Short",
  "Corporate Explainer",
  "Documentary",
  "Podcast Episode",
  "Event Highlight",
  "Product Showcase",
  "Other",
];

export default function NewProjectClient({ session, existingClients }: Props) {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState(PROJECT_TYPES[0]);
  const [customType, setCustomType] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [deadline, setDeadline] = useState("");
  const [startDate, setStartDate] = useState("");

  // Client mode
  const [clientMode, setClientMode] = useState<"existing" | "new">(
    existingClients.length > 0 ? "existing" : "new"
  );
  const [selectedClientId, setSelectedClientId] = useState(
    existingClients[0]?.id ?? ""
  );
  const [clientCompanyName, setClientCompanyName] = useState("");
  const [clientContactName, setClientContactName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const resolvedType = type === "Other" && customType.trim() ? customType.trim() : type;

    if (!title.trim()) {
      setError("Project title is required");
      return;
    }

    if (clientMode === "existing" && !selectedClientId) {
      setError("Please select a client organisation");
      return;
    }

    if (clientMode === "new") {
      if (!clientCompanyName.trim() || !clientContactName.trim() || !clientEmail.trim()) {
        setError("All client fields (company, contact name, email) are required");
        return;
      }
    }

    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        type: resolvedType,
        description: description.trim() || undefined,
        priority,
        deadline: deadline || undefined,
        startDate: startDate || undefined,
      };

      if (clientMode === "existing") {
        payload.clientId = selectedClientId;
      } else {
        payload.clientCompanyName = clientCompanyName.trim();
        payload.clientContactName = clientContactName.trim();
        payload.clientEmail = clientEmail.trim().toLowerCase();
      }

      const res = await fetch("/api/studio/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create project");
        setLoading(false);
        return;
      }

      router.push(`/studio/projects/${data.data.id}`);
    } catch {
      setError("A network error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Top back link */}
      <div>
        <Link
          href="/studio/projects"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2.5">
          <Film className="w-6 h-6 text-violet-500" />
          Create New Project
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Set up a new video production project workspace for your client.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <span>
                {error.toLowerCase().includes("authenticated")
                  ? "Your session is not authenticated or has expired. Please log in again."
                  : error}
              </span>
            </div>
            {error.toLowerCase().includes("authenticated") && (
              <Link
                href="/studio/login"
                className="shrink-0 px-3 py-1.5 rounded-lg bg-red-800/60 hover:bg-red-700 text-xs font-medium text-white transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        )}

        {/* Section: Project Essentials */}
        <div className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-5">
          <h2 className="text-base font-semibold text-white border-b border-white/[0.06] pb-3">
            Project Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                Project Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer Brand Campaign Video — 60s Cut"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                Video Type <span className="text-red-400">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-zinc-900">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent / Rush</option>
              </select>
            </div>

            {/* Custom Type input if 'Other' */}
            {type === "Other" && (
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Specify Project Type
                </label>
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="e.g., Cinema 4D 3D Animation"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            )}

            {/* Description / Creative Brief */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                Creative Brief & Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key objectives, pacing, target platforms, music style, color grade preferences, and deliverables needed..."
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Section: Client Selection */}
        <div className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h2 className="text-base font-semibold text-white">Client Information</h2>
            <div className="flex items-center gap-2 text-xs">
              {existingClients.length > 0 && (
                <button
                  type="button"
                  onClick={() => setClientMode("existing")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    clientMode === "existing"
                      ? "bg-violet-600 text-white font-medium"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Existing Client
                </button>
              )}
              <button
                type="button"
                onClick={() => setClientMode("new")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  clientMode === "new"
                    ? "bg-violet-600 text-white font-medium"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                + New Client
              </button>
            </div>
          </div>

          {clientMode === "existing" && existingClients.length > 0 ? (
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                Select Client
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
              >
                {existingClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.contactName} — {c.email})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientCompanyName}
                  onChange={(e) => setClientCompanyName(e.target.value)}
                  placeholder="Acme Studios"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Contact Person <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientContactName}
                  onChange={(e) => setClientContactName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Client Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="jane@acme.com"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section: Timeline & Dates */}
        <div className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-5">
          <h2 className="text-base font-semibold text-white border-b border-white/[0.06] pb-3">
            Schedule & Deadlines
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                Production Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                Final Delivery Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/studio/projects"
            className="px-5 py-2.5 rounded-xl border border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.04] text-sm font-medium transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium text-sm transition-colors flex items-center gap-2 shadow-lg shadow-violet-600/20"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating Project..." : "Launch Project Workspace"}
          </button>
        </div>
      </form>
    </div>
  );
}
