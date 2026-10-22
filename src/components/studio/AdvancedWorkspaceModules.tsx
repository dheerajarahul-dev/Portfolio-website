"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Creative X Studio — Advanced Production Operating System Workspace Modules
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Film,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Share2,
  Shield,
  Download,
  Copy,
  Check,
  Video,
  Radio,
  FileCode,
  DollarSign,
  Activity,
  Zap,
  Tag,
  Palette,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Sliders,
  ExternalLink,
  Users,
} from "lucide-react";
import type {
  StudioProject,
  StudioSession,
  StudioTask,
  PipelineStageConfig,
  ProductionPlanResult,
  FootageIntelligence,
  DeliverableValidationReport,
  ParallelDeliverableVariant,
  RevisionSummaryReport,
  SecureShareLink,
  ClientBrandKit,
  ProjectKnowledgeItem,
  ProjectCostLedger,
  DeadlineRiskIndicator,
  AssetLicenseRecord,
} from "@/lib/studio-types";
import { DEFAULT_PIPELINE_STAGES } from "@/lib/studio-orchestration";
import { DELIVERABLE_PRESETS } from "@/lib/studio-media-engine";
import { getDefaultBrandKit, getInitialKnowledgeBase } from "@/lib/studio-brand-kit";

interface Props {
  project: StudioProject;
  session: StudioSession;
  tasks: StudioTask[];
  onTaskCreated?: (task: StudioTask) => void;
  onStatusChange?: (status: StudioProject["status"]) => void;
}

export default function AdvancedWorkspaceModules({
  project,
  session,
  tasks,
  onTaskCreated,
}: Props) {
  const isStaff = session.role === "super_admin" || session.role === "manager";

  // ── 1. Pipeline & Orchestration State ──────────────────────────────────────
  const [pipelineStages] = useState<PipelineStageConfig[]>(DEFAULT_PIPELINE_STAGES);
  const [currentStageOrder, setCurrentStageOrder] = useState(2);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<ProductionPlanResult | null>(null);
  const [applyingPlan, setApplyingPlan] = useState(false);
  const [planAppliedMessage, setPlanAppliedMessage] = useState<string | null>(null);

  // ── 2. Footage Intelligence State ──────────────────────────────────────────
  const [footageData, setFootageData] = useState<FootageIntelligence | null>(null);
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [activeMediaTime, setActiveMediaTime] = useState(0);

  // ── 3. Deliverables & QC Validation State ──────────────────────────────────
  const [variants, setVariants] = useState<ParallelDeliverableVariant[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState(DELIVERABLE_PRESETS[0].id);
  const [validationReport, setValidationReport] = useState<DeliverableValidationReport | null>(null);
  const [validating, setValidating] = useState(false);

  // ── 4. Revision Intelligence & Live Room State ─────────────────────────────
  const [revisionSummary, setRevisionSummary] = useState<RevisionSummaryReport | null>(null);
  const [shareLinks, setShareLinks] = useState<SecureShareLink[]>([]);
  const [shareName, setShareName] = useState("");
  const [creatingShare, setCreatingShare] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // ── 5. Brand Kit & Knowledge Base State ─────────────────────────────────────
  const [brandKit, setBrandKit] = useState<ClientBrandKit>(() =>
    getDefaultBrandKit(project.clientId, project.title)
  );
  const [knowledgeItems, setKnowledgeItems] = useState<ProjectKnowledgeItem[]>(() =>
    getInitialKnowledgeBase(project.id, project.title)
  );
  const [newKbTitle, setNewKbTitle] = useState("");
  const [newKbContent, setNewKbContent] = useState("");
  const [addingKb, setAddingKb] = useState(false);

  // ── 6. Operations & Cost State ─────────────────────────────────────────────
  const [costLedger, setCostLedger] = useState<ProjectCostLedger | null>(null);
  const [deadlineRisk, setDeadlineRisk] = useState<DeadlineRiskIndicator | null>(null);

  // Initial data loading from internal APIs
  useEffect(() => {
    // 1. Load orchestration status
    fetch(`/api/studio/orchestration?projectId=${project.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.currentStageOrder) {
          setCurrentStageOrder(d.currentStageOrder);
        }
      })
      .catch(() => null);

    // 2. Load footage intelligence
    fetch(`/api/studio/intelligence?projectId=${project.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.intelligence) {
          setFootageData(d.intelligence);
        }
      })
      .catch(() => null);

    // 3. Load collaboration data (variants, revisions, shares)
    fetch(`/api/studio/collaboration?projectId=${project.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setVariants(d.deliverableMatrix || []);
          setRevisionSummary(d.revisionSummary || null);
          setShareLinks(d.shareLinks || []);
        }
      })
      .catch(() => null);

    // 4. Load operations & costs
    fetch(`/api/studio/ops?projectId=${project.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCostLedger(d.projectCostLedger || null);
          setDeadlineRisk(d.deadlineRisk || null);
        }
      })
      .catch(() => null);
  }, [project.id]);

  // Handle AI Plan Generation
  async function handleGeneratePlan() {
    setGeneratingPlan(true);
    setPlanAppliedMessage(null);
    try {
      const res = await fetch("/api/studio/orchestration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_plan",
          projectId: project.id,
          projectTitle: project.title,
          projectType: project.type,
          brief: project.description || "Deliver a high-impact narrative video.",
        }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setGeneratedPlan(data.plan);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingPlan(false);
    }
  }

  // Handle Plan Adoption into Workspace Tasks
  async function handleApplyPlan() {
    if (!generatedPlan || applyingPlan) return;
    setApplyingPlan(true);
    try {
      const res = await fetch("/api/studio/orchestration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_plan",
          projectId: project.id,
          steps: generatedPlan.steps,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlanAppliedMessage(`Successfully adopted ${data.appliedTasksCount} production plan tasks into workspace!`);
        setGeneratedPlan(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplyingPlan(false);
    }
  }

  // Handle Deliverable Validation
  async function handleRunValidation() {
    setValidating(true);
    try {
      const res = await fetch("/api/studio/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate_preset",
          assetId: "asset_master_render",
          presetId: selectedPresetId,
          detectedSpecs: {
            codec: "H.264",
            width: selectedPresetId.includes("reels") ? 1080 : 3840,
            height: selectedPresetId.includes("reels") ? 1920 : 2160,
            aspectRatio: selectedPresetId.includes("reels") ? "9:16" : "16:9",
            frameRate: 23.976,
            bitrateMbps: 54.2,
            audioLufs: -14.3,
            audioSampleRateKhz: 48,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setValidationReport(data.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setValidating(false);
    }
  }

  // Handle Share Link Creation
  async function handleCreateShare() {
    if (!shareName.trim() || creatingShare) return;
    setCreatingShare(true);
    try {
      const res = await fetch("/api/studio/collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_share_link",
          projectId: project.id,
          shareName: shareName.trim(),
          durationDays: 7,
          watermarkEnabled: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.share) {
        setShareLinks((prev) => [data.share, ...prev]);
        setShareName("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingShare(false);
    }
  }

  // Handle Share Link Revocation
  async function handleRevokeShare(shareId: string) {
    try {
      await fetch("/api/studio/collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke_share_link",
          shareId,
        }),
      });
      setShareLinks((prev) =>
        prev.map((s) => (s.id === shareId ? { ...s, isRevoked: true } : s))
      );
    } catch (err) {
      console.error(err);
    }
  }

  // Handle Knowledge Item Creation
  async function handleAddKnowledge() {
    if (!newKbTitle.trim() || !newKbContent.trim() || addingKb) return;
    setAddingKb(true);
    try {
      const res = await fetch("/api/studio/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_knowledge_item",
          projectId: project.id,
          title: newKbTitle.trim(),
          category: "creative_brief",
          contentMarkdown: newKbContent.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setKnowledgeItems((prev) => [data.item, ...prev]);
        setNewKbTitle("");
        setNewKbContent("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingKb(false);
    }
  }

  const filteredSegments = footageData?.segments.filter((s) =>
    s.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  ) || [];

  return (
    <div className="space-y-10">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. PRODUCTION PIPELINE ORCHESTRATION & DEPENDENCY GRAPH
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-violet-400" />
              Production Pipeline Orchestration
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Gated stage transitions, dependency resolution, and automated phase advancement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGeneratePlan}
              disabled={generatingPlan}
              className="px-3.5 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 text-xs font-medium flex items-center gap-2 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              {generatingPlan ? "Deconstructing Brief…" : "AI Production Plan"}
            </button>
          </div>
        </div>

        {/* Plan Applied Notification */}
        {planAppliedMessage && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{planAppliedMessage}</span>
          </div>
        )}

        {/* AI Generated Plan Modal/Card */}
        {generatedPlan && (
          <div className="p-5 bg-gradient-to-br from-violet-950/40 via-purple-950/20 to-zinc-900 border border-violet-500/40 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <h3 className="text-sm font-semibold text-white">
                  AI Production Strategy & Breakdown
                </h3>
              </div>
              <span className="text-xs text-zinc-400">
                Est. {generatedPlan.estimatedDays} Days Turnaround
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {generatedPlan.executiveSummary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {generatedPlan.steps.map((st, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span className="font-semibold text-violet-300">{st.phase}</span>
                    <span>{st.estimatedHours}h est.</span>
                  </div>
                  <p className="font-medium text-white">{st.title}</p>
                  <p className="text-zinc-500 text-[11px] truncate">Output: {st.deliverableOutput}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setGeneratedPlan(null)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300"
              >
                Dismiss
              </button>
              <button
                onClick={handleApplyPlan}
                disabled={applyingPlan}
                className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-md shadow-violet-600/30"
              >
                <Check className="w-3.5 h-3.5" />
                {applyingPlan ? "Applying Tasks…" : "Adopt All as Workspace Tasks"}
              </button>
            </div>
          </div>
        )}

        {/* Pipeline Stages Progress Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {pipelineStages.map((stage) => {
            const isCompleted = stage.order < currentStageOrder;
            const isCurrent = stage.order === currentStageOrder;

            return (
              <div
                key={stage.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? "bg-violet-950/40 border-violet-500/60 shadow-lg shadow-violet-500/10"
                    : isCompleted
                    ? "bg-zinc-900/60 border-emerald-800/40 opacity-90"
                    : "bg-black/30 border-white/[0.04] opacity-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Stage {stage.order}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-zinc-600" />
                  )}
                </div>

                <div className="font-semibold text-white text-xs mb-1 truncate">
                  {stage.name}
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {stage.description}
                </p>

                <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500">
                    {stage.requiredApprovals.join(" & ")} sign-off
                  </span>
                  {isStaff && isCurrent && (
                    <button
                      onClick={() => setCurrentStageOrder((o) => Math.min(5, o + 1))}
                      className="text-violet-400 hover:text-violet-300 font-semibold"
                    >
                      Advance &rarr;
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. FOOTAGE INTELLIGENCE & SEARCHABLE TRANSCRIPTS
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
              <Film className="w-5 h-5 text-cyan-400" />
              AI Footage Intelligence & Transcript Engine
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Automated speech-to-text, scene categorization, and viral highlight detection.
            </p>
          </div>

          {/* Transcript Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={transcriptSearch}
              onChange={(e) => setTranscriptSearch(e.target.value)}
              placeholder="Search speech & dialogue…"
              className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transcript Column */}
          <div className="lg:col-span-2 space-y-3">
            <div className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Synchronized Speech-to-Text ({filteredSegments.length} Segments)</span>
              <span className="text-[11px] text-zinc-500">Click timecode to jump</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
              {filteredSegments.map((seg) => (
                <div
                  key={seg.id}
                  onClick={() => setActiveMediaTime(seg.startTimeSec)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    activeMediaTime >= seg.startTimeSec && activeMediaTime <= seg.endTimeSec
                      ? "bg-cyan-950/40 border-cyan-500/50 shadow-sm"
                      : "bg-black/30 border-white/[0.04] hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-cyan-400">{seg.speaker}</span>
                    <span className="font-mono text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded">
                      {Math.floor(seg.startTimeSec)}s - {Math.floor(seg.endTimeSec)}s
                    </span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed">{seg.text}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {seg.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 border border-white/[0.04]"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Viral Highlights & Scene Tags Column */}
          <div className="space-y-4">
            <div className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Suggested High-Retention Clips
            </div>

            <div className="space-y-2.5">
              {footageData?.highlights.map((hl) => (
                <div
                  key={hl.id}
                  className="p-3 bg-gradient-to-r from-amber-950/30 to-black/40 border border-amber-600/30 rounded-xl space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-200 truncate">{hl.title}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                      {hl.viralScore}% VIRAL
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {hl.rationale}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-500">
                    <span>
                      Range: {Math.floor(hl.startTimeSec)}s - {Math.floor(hl.endTimeSec)}s
                    </span>
                    <span className="uppercase text-amber-400/80 font-mono font-medium">
                      Target: {hl.suggestedPlatform}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. PARALLEL DELIVERABLES MATRIX & AUTOMATED QC VALIDATION
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-emerald-400" />
              Parallel Deliverables Matrix & Technical QC
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Manage multi-aspect cuts (16:9, 9:16, 1:1), localized subtitles, and export validation.
            </p>
          </div>

          {/* Validation CTA */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:outline-none"
            >
              {DELIVERABLE_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900">
                  {p.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleRunValidation}
              disabled={validating}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {validating ? "Running QC…" : "Validate Master"}
            </button>
          </div>
        </div>

        {/* Deliverables Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-zinc-400 text-[11px] uppercase tracking-wider">
                <th className="pb-3">Variant / Aspect</th>
                <th className="pb-3">Language & Audio</th>
                <th className="pb-3">Cut Type</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Preset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {variants.map((v) => (
                <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 font-medium text-white flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{v.title}</span>
                  </td>
                  <td className="py-3 text-zinc-300">{v.language}</td>
                  <td className="py-3 text-zinc-400 capitalize">{v.campaignCut.replace("_", " ")}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-white/5 uppercase">
                      {v.status}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-[11px] text-zinc-500">{v.targetPresetId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Validation Report Banner */}
        {validationReport && (
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              validationReport.passed
                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-200"
                : "bg-red-950/40 border-red-800/60 text-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-xs">
                {validationReport.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
                <span>
                  QC Report: {validationReport.presetName} &mdash;{" "}
                  {validationReport.passed ? "PASSED ALL CRITERIA" : "ISSUES FLAGGED"}
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                Loudness: {validationReport.detectedSpecs.audioLufs} LUFS | Bitrate:{" "}
                {validationReport.detectedSpecs.bitrateMbps} Mbps
              </span>
            </div>

            {validationReport.issues.length > 0 ? (
              <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                {validationReport.issues.map((iss, i) => (
                  <div key={i} className="flex items-start gap-2 bg-black/30 p-2.5 rounded-lg">
                    <span className="font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-red-900/60 text-red-300 mt-0.5">
                      {iss.severity}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-white">{iss.message}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Advice: {iss.remediation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-300/80">
                Color gamut, aspect parity, container bitstream, and integrated loudness meet delivery specifications.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. REVISION INTELLIGENCE, ROOMS & SECURE EXPIRING SHARING
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
              <Share2 className="w-5 h-5 text-purple-400" />
              Revision Intelligence & Secure Client Links
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Version-pinned feedback diffing, watermarked review portals, and instant access revocation.
            </p>
          </div>

          <Link
            href={`/studio/review/${project.id}`}
            className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 text-purple-200" />
            Launch Live Review Room
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revision Intelligence Summary */}
          <div className="p-4 bg-black/30 border border-white/5 rounded-xl space-y-3">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Version Feedback Delta (V1 &rarr; V2)
            </h3>

            {revisionSummary && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                  <span className="text-emerald-400 font-semibold">
                    {revisionSummary.resolvedCount} Resolved
                  </span>
                  <span>|</span>
                  <span className="text-amber-400 font-semibold">
                    {revisionSummary.unresolvedCount} Open Points
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-semibold text-zinc-400">Resolved Items in Cut:</p>
                  {revisionSummary.keyFeedbackAddressed.map((kf, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-zinc-300">
                      <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      <span className="truncate">{kf}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Secure Client Sharing Manager */}
          <div className="p-4 bg-black/30 border border-white/5 rounded-xl space-y-3">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Active Expiring Share Links
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareName}
                onChange={(e) => setShareName(e.target.value)}
                placeholder="Share name (e.g. CMO Final Sign-off)"
                className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleCreateShare}
                disabled={creatingShare || !shareName.trim()}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
              >
                Generate Link
              </button>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto">
              {shareLinks.map((sl) => (
                <div
                  key={sl.id}
                  className="p-2.5 bg-zinc-900/60 border border-white/5 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{sl.shareName}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Expires: {new Date(sl.expiresAt).toLocaleDateString()} | Watermarked
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {sl.isRevoked ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                        Revoked
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRevokeShare(sl.id)}
                        className="text-[11px] text-red-400 hover:text-red-300 underline"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. BRAND KITS & PROJECT KNOWLEDGE BASE
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-6">
        <div className="border-b border-white/[0.06] pb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-pink-400" />
            Client Brand Kit & Knowledge Repository
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Reusable brand standards, color palettes, tone guidelines, and creative research.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brand Kit Card */}
          <div className="space-y-4 p-4 bg-black/30 border border-white/5 rounded-xl">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              Brand Palette & Guidelines ({brandKit.brandName})
            </h3>

            {/* Colors */}
            <div className="flex items-center gap-3">
              {brandKit.colors.map((c, idx) => (
                <div key={idx} className="space-y-1 text-center">
                  <div
                    className="w-10 h-10 rounded-xl border border-white/10 shadow-sm"
                    style={{ backgroundColor: c.hex }}
                  />
                  <p className="text-[10px] font-mono text-zinc-400">{c.hex}</p>
                </div>
              ))}
            </div>

            <div className="text-xs space-y-2 pt-2 border-t border-white/5">
              <p className="text-zinc-300">
                <span className="font-semibold text-white">Tone: </span>
                {brandKit.toneOfVoiceGuidelines}
              </p>
              <p className="text-zinc-300">
                <span className="font-semibold text-white">Music: </span>
                {brandKit.musicStyleGuidelines}
              </p>
            </div>
          </div>

          {/* Project Knowledge Base */}
          <div className="space-y-3 p-4 bg-black/30 border border-white/5 rounded-xl">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              Project Knowledge & Creative Brief
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {knowledgeItems.map((kb) => (
                <div key={kb.id} className="p-3 bg-zinc-900/60 border border-white/5 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{kb.title}</span>
                    <span className="text-[10px] text-zinc-500 uppercase">{kb.category}</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] line-clamp-2">{kb.contentMarkdown}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          6. OPERATIONAL METRICS, COSTS & DEADLINE RISK
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-6">
        <div className="border-b border-white/[0.06] pb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-amber-400" />
            Operational Velocity & Deadline Risk Indicators
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time project cost accounting, editor hour allocation, and risk modeling.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Budget vs Actual */}
          <div className="p-4 bg-black/30 border border-white/5 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-400 uppercase font-medium">Budget Allocated</span>
            <div className="text-xl font-bold text-white">
              ${costLedger?.budgetAllocatedUsd.toLocaleString() ?? "3,060"}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              Actual Spend: ${costLedger?.actualCostUsd.toLocaleString() ?? "2,280"}
            </p>
          </div>

          {/* Logged Editor Hours */}
          <div className="p-4 bg-black/30 border border-white/5 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-400 uppercase font-medium">Production Hours</span>
            <div className="text-xl font-bold text-violet-300">
              {costLedger?.loggedHours ?? 24}h / {costLedger?.estimatedHours ?? 36}h
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">Rate: $85 / billable hour</p>
          </div>

          {/* Deadline Risk Score */}
          <div className="p-4 bg-black/30 border border-white/5 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-400 uppercase font-medium">Deadline Risk</span>
            <div
              className={`text-xl font-bold ${
                deadlineRisk?.riskLevel === "critical"
                  ? "text-red-400"
                  : deadlineRisk?.riskLevel === "high"
                  ? "text-orange-400"
                  : "text-emerald-400"
              }`}
            >
              {deadlineRisk?.riskScore ?? 18}% ({deadlineRisk?.riskLevel.toUpperCase() ?? "LOW"})
            </div>
            <p className="text-[10px] text-zinc-500 truncate">
              {deadlineRisk?.primaryRiskFactor ?? "On schedule"}
            </p>
          </div>

          {/* Asset Licensing Clearance */}
          <div className="p-4 bg-black/30 border border-white/5 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-400 uppercase font-medium">Rights & Clearance</span>
            <div className="text-xl font-bold text-emerald-300">100% Cleared</div>
            <p className="text-[10px] text-zinc-500 font-mono">Worldwide commercial royalty-free</p>
          </div>
        </div>
      </section>
    </div>
  );
}
