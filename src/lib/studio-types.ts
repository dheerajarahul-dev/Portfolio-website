// ─────────────────────────────────────────────────────────────────────────────
// Creative X Studio — Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

// ── Roles & Permissions ──────────────────────────────────────────────────────

export type StudioRole =
  | "super_admin"    // Full platform control
  | "manager"        // Project/client management
  | "editor"         // Video editor
  | "client"         // Client user
  | "reviewer";      // External reviewer (limited)

export type StudioPermission =
  | "projects:create"
  | "projects:read_all"
  | "projects:update"
  | "projects:delete"
  | "projects:archive"
  | "clients:manage"
  | "team:manage"
  | "media:upload"
  | "media:delete"
  | "media:read_all"
  | "reviews:submit"
  | "reviews:approve"
  | "reviews:comment"
  | "deliverables:download"
  | "messages:send"
  | "messages:read_internal"
  | "tasks:manage"
  | "invitations:send"
  | "settings:manage"
  | "reports:view"
  | "audit:view";

// ── User ─────────────────────────────────────────────────────────────────────

export interface StudioUser {
  id: string;
  email: string;
  displayName: string;
  role: StudioRole;
  avatarUrl: string | null;
  active: boolean;
  invitedBy: string | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

// Safe view without password fields (all studio_users rows are safe — no passwords stored here)
export type StudioUserPublic = Omit<StudioUser, "updatedAt">;

// ── Invitation ────────────────────────────────────────────────────────────────

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface StudioInvitation {
  id: string;
  email: string;
  role: StudioRole;
  invitedBy: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  // tokenHash is never returned to the browser
}

// ── Client ────────────────────────────────────────────────────────────────────

export interface StudioClient {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  notes: string | null;
  userId: string | null; // linked studio_user if they have a login
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── Project Request ───────────────────────────────────────────────────────────

export type RequestStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "awaiting_info"
  | "accepted"
  | "declined";

export interface StudioRequest {
  id: string;
  clientId: string;
  title: string;
  projectType: string;
  description: string;
  objectives: string | null;
  targetAudience: string | null;
  platforms: string[];
  videoFormat: string | null;
  aspectRatio: string | null;
  targetDuration: string | null;
  deliverableCount: number;
  languages: string[];
  deadline: string | null;
  deadlineTimezone: string | null;
  referenceLinks: string[];
  editingStyle: string | null;
  budgetRange: string | null;
  additionalInstructions: string | null;
  status: RequestStatus;
  submittedBy: string;
  reviewedBy: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Project ───────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | "request_received"
  | "awaiting_assignment"
  | "assets_collecting"
  | "ready_for_editing"
  | "in_production"
  | "internal_review"
  | "client_review"
  | "revisions_requested"
  | "final_approval"
  | "delivery"
  | "completed"
  | "archived";

export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export interface StudioProject {
  id: string;
  requestId: string | null;
  title: string;
  type: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  clientId: string;
  managerId: string | null;
  deadline: string | null;
  startDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Joined fields (not in DB column, populated by queries)
  client?: StudioClient;
  manager?: StudioUserPublic;
  members?: StudioProjectMember[];
}

export interface StudioProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: "editor" | "reviewer" | "collaborator";
  addedBy: string;
  createdAt: string;
  user?: StudioUserPublic;
}

// ── Milestone ─────────────────────────────────────────────────────────────────

export interface StudioMilestone {
  id: string;
  projectId: string;
  title: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

// ── Task ──────────────────────────────────────────────────────────────────────

export type TaskStatus = "todo" | "in_progress" | "blocked" | "completed" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface StudioTask {
  id: string;
  projectId: string;
  assigneeId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  orderIndex?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignee?: StudioUserPublic;
}

// ── Deliverable ───────────────────────────────────────────────────────────────

export interface StudioDeliverable {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  createdAt: string;
  versions?: StudioVersion[];
}

// ── Asset ─────────────────────────────────────────────────────────────────────

export type AssetCategory =
  | "raw_video"
  | "wip_export"
  | "final_video"
  | "audio"
  | "music"
  | "voiceover"
  | "image"
  | "logo"
  | "document"
  | "subtitle"
  | "script"
  | "reference"
  | "project_file"
  | "other";

export interface StudioAsset {
  id: string;
  projectId: string;
  deliverableId: string | null;
  filename: string;
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  category: AssetCategory;
  uploadedBy: string;
  createdAt: string;
  uploader?: StudioUserPublic;
  // Signed URL is generated on demand, not stored
  downloadUrl?: string;
}

// ── Version ───────────────────────────────────────────────────────────────────

export type VersionStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "changes_requested"
  | "resubmitted"
  | "approved"
  | "superseded"
  | "archived";

export interface StudioVersion {
  id: string;
  deliverableId: string;
  assetId: string;
  versionNumber: number;
  notes: string | null;
  status: VersionStatus;
  submittedBy: string;
  submittedAt: string;
  createdAt: string;
  asset?: StudioAsset;
  submitter?: StudioUserPublic;
  comments?: StudioComment[];
  approval?: StudioApproval;
}

// ── Comment (Timestamped) ─────────────────────────────────────────────────────

export interface StudioComment {
  id: string;
  versionId: string;
  authorId: string;
  timestampSec: number | null;   // playback position, null = general
  endTimestampSec: number | null; // for range annotations
  body: string;
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author?: StudioUserPublic;
  replies?: StudioCommentReply[];
}

export interface StudioCommentReply {
  id: string;
  commentId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author?: StudioUserPublic;
}

// ── Approval ──────────────────────────────────────────────────────────────────

export type ApprovalDecision = "approved" | "changes_requested";

export interface StudioApproval {
  id: string;
  versionId: string;
  projectId: string;
  approvedBy: string;
  decision: ApprovalDecision;
  notes: string | null;
  createdAt: string;
  approver?: StudioUserPublic;
}

// ── Message ───────────────────────────────────────────────────────────────────

export interface StudioMessage {
  id: string;
  projectId: string;
  authorId: string;
  body: string;
  isInternal: boolean; // internal agency notes — NEVER returned to clients
  createdAt: string;
  updatedAt: string;
  author?: StudioUserPublic;
}

// ── Notification ──────────────────────────────────────────────────────────────

export type NotificationType =
  | "assignment"
  | "project_request"
  | "status_change"
  | "deadline_approaching"
  | "task_overdue"
  | "file_uploaded"
  | "version_submitted"
  | "comment_added"
  | "mention"
  | "revision_requested"
  | "approval_decision"
  | "new_message"
  | "invitation_accepted"
  | "security_event";

export interface StudioNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  message?: string;
  link: string | null;
  actionUrl?: string | null;
  read: boolean;
  createdAt: string;
}

// ── Activity Event ─────────────────────────────────────────────────────────────

export type StudioEventType =
  | "project_created"
  | "project_status_changed"
  | "editor_assigned"
  | "client_assigned"
  | "file_uploaded"
  | "version_submitted"
  | "comment_added"
  | "revision_requested"
  | "approval_granted"
  | "approval_declined"
  | "deliverable_downloaded"
  | "deadline_changed"
  | "task_created"
  | "task_completed"
  | "project_completed"
  | "project_archived"
  | "member_added"
  | "member_removed";

export interface StudioEvent {
  id: string;
  projectId: string | null;
  actorId: string;
  eventType: StudioEventType;
  payload: Record<string, unknown>;
  createdAt: string;
  actor?: StudioUserPublic;
}

// ── API Response Helpers ──────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ── Studio Session (returned to client) ──────────────────────────────────────

export interface StudioSession {
  userId: string;
  role: StudioRole;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Creative X Studio — Advanced Production Operating System Types
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Pipeline Orchestration & Dependency Graph ─────────────────────────────

export interface PipelineStageConfig {
  id: string;
  name: string;
  order: number;
  description: string;
  requiredTasks: string[];
  requiredApprovals: ("internal" | "client")[];
  autoTransitionOnComplete: boolean;
  color: string;
}

export interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
  type: "finish_to_start" | "start_to_start";
}

export interface TaskBlockerAnalysis {
  taskId: string;
  isBlocked: boolean;
  blockedBy: {
    taskId: string;
    title: string;
    status: TaskStatus;
    assigneeName?: string;
  }[];
  criticalPath: boolean;
}

export interface ProductionPlanPrompt {
  projectId: string;
  projectTitle: string;
  projectType: string;
  brief: string;
  targetDeadline?: string;
  targetAudience?: string;
  channels: string[];
}

export interface ProductionPlanStep {
  phase: string;
  title: string;
  estimatedHours: number;
  suggestedRole: StudioRole;
  deliverableOutput: string;
  dependencies: string[];
}

export interface ProductionPlanResult {
  projectId: string;
  generatedAt: string;
  executiveSummary: string;
  estimatedDays: number;
  riskFactors: string[];
  recommendedGearAndSoftware: string[];
  steps: ProductionPlanStep[];
  status: "draft" | "approved" | "applied";
}

// ── 2. Footage Intelligence & Transcripts ─────────────────────────────────────

export interface TranscriptSegment {
  id: string;
  startTimeSec: number;
  endTimeSec: number;
  speaker: string;
  text: string;
  confidence: number;
  keywords: string[];
}

export interface SceneMetadataTag {
  id: string;
  startTimeSec: number;
  endTimeSec: number;
  category: "b_roll" | "talking_head" | "product_shot" | "graphic_overlay" | "action";
  description: string;
  visualQualityScore: number; // 1-100
  pacing: "fast" | "moderate" | "slow";
}

export interface HighlightSuggestion {
  id: string;
  startTimeSec: number;
  endTimeSec: number;
  title: string;
  rationale: string;
  viralScore: number; // 1-100
  suggestedPlatform: "tiktok" | "reels" | "youtube_short" | "quote_card";
}

export interface FootageIntelligence {
  assetId: string;
  projectId: string;
  durationSec: number;
  transcriptionStatus: "pending" | "processing" | "ready" | "failed";
  language: string;
  segments: TranscriptSegment[];
  scenes: SceneMetadataTag[];
  highlights: HighlightSuggestion[];
  updatedAt: string;
}

// ── 3. Automated Deliverable Validation & Presets ────────────────────────────

export interface TechnicalSpecRule {
  field: "codec" | "resolution" | "aspectRatio" | "frameRate" | "bitrateMbps" | "audioFormat" | "audioLufs";
  expected: string | number;
  tolerance?: number;
  severity: "error" | "warning";
  remediationAdvice: string;
}

export interface DeliverablePreset {
  id: string;
  name: string;
  platform: "youtube" | "instagram" | "tiktok" | "broadcast_smpte" | "web_archive";
  targetAspect: "16:9" | "9:16" | "1:1" | "4:5";
  container: "mp4" | "mov" | "mxf";
  videoCodec: string;
  minBitrateMbps: number;
  maxBitrateMbps: number;
  targetLufs: number; // e.g. -14 LUFS for YouTube, -24 LUFS for EBU R128 Broadcast
  audioSampleRateKhz: number;
}

export interface ValidationIssue {
  severity: "error" | "warning" | "info";
  rule: string;
  found: string;
  expected: string;
  message: string;
  remediation: string;
}

export interface DeliverableValidationReport {
  assetId: string;
  presetId: string;
  presetName: string;
  passed: boolean;
  validatedAt: string;
  fileSizeBytes: number;
  checksum: string;
  detectedSpecs: {
    codec: string;
    width: number;
    height: number;
    aspectRatio: string;
    frameRate: number;
    bitrateMbps: number;
    audioLufs: number;
    audioSampleRateKhz: number;
  };
  issues: ValidationIssue[];
}

// ── 4. Revision Intelligence & Version Diffing ───────────────────────────────

export interface UnresolvedFeedbackItem {
  commentId: string;
  versionNumber: number;
  timestampSec: number | null;
  authorName: string;
  authorRole: StudioRole;
  text: string;
  status: "open" | "addressed" | "wont_fix";
  addressedInVersion?: number;
  editorResolutionNote?: string;
}

export interface RevisionSummaryReport {
  projectId: string;
  fromVersion: number;
  toVersion: number;
  generatedAt: string;
  totalComments: number;
  resolvedCount: number;
  unresolvedCount: number;
  summaryHighlights: string[];
  keyFeedbackAddressed: string[];
  pendingOpenPoints: string[];
}

// ── 5. Client-Editor Collaboration Rooms ─────────────────────────────────────

export interface RoomPresenceUser {
  userId: string;
  displayName: string;
  role: StudioRole;
  avatarUrl: string | null;
  joinedAt: string;
  lastActiveAt: string;
  currentPlaybackSec: number;
  isPlaybackLeader: boolean;
}

export interface CollaborationRoomState {
  roomId: string;
  projectId: string;
  versionId: string;
  activeUsers: RoomPresenceUser[];
  playbackTimestampSec: number;
  playbackState: "playing" | "paused";
  sharedNotes: string;
  updatedAt: string;
}

// ── 6. Parallel Deliverables Matrix ──────────────────────────────────────────

export interface ParallelDeliverableVariant {
  id: string;
  projectId: string;
  title: string;
  format: "16:9_master" | "9:16_vertical" | "1:1_square" | "4:5_feed";
  language: string;
  campaignCut: "full_length" | "60s_cutdown" | "30s_teaser" | "15s_hook";
  assignedEditorId: string | null;
  assignedEditorName?: string;
  status: "queued" | "editing" | "rendering" | "qa_passed" | "delivered";
  targetPresetId: string;
  deliverableAssetId?: string;
  lastUpdated: string;
}

// ── 7. Brand Kits & Project Knowledge Bases ──────────────────────────────────

export interface BrandColor {
  name: string;
  hex: string;
  usage: "primary" | "secondary" | "accent" | "background";
}

export interface BrandFont {
  family: string;
  weight: string;
  role: "heading" | "body" | "subheading";
  specimenUrl?: string;
}

export interface ClientBrandKit {
  clientId: string;
  brandName: string;
  logoPrimaryUrl: string | null;
  logoSecondaryUrl: string | null;
  colors: BrandColor[];
  fonts: BrandFont[];
  toneOfVoiceGuidelines: string;
  musicStyleGuidelines: string;
  prohibitedElements: string[];
  introOutroBumperAssetIds: string[];
  updatedAt: string;
}

export interface ProjectKnowledgeItem {
  id: string;
  projectId: string;
  title: string;
  category: "creative_brief" | "research" | "interview_notes" | "script_draft" | "competitor_ref";
  contentMarkdown: string;
  sourceUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ── 8. Unified Action Center ─────────────────────────────────────────────────

export type ActionItemType =
  | "approval_pending"
  | "task_blocked"
  | "upload_failed"
  | "deadline_critical"
  | "license_expiring"
  | "revision_unresolved";

export interface ActionCenterItem {
  id: string;
  type: ActionItemType;
  priority: "urgent" | "high" | "medium";
  projectId: string;
  projectTitle: string;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  createdAt: string;
  dueSoonHours?: number;
}

// ── 9. Secure Client Sharing & Expiring Access ───────────────────────────────

export interface SecureShareLink {
  id: string;
  projectId: string;
  versionId: string;
  token: string;
  shareName: string;
  clientEmail?: string;
  expiresAt: string;
  passcodeHash?: string;
  allowDownload: boolean;
  watermarkEnabled: boolean;
  watermarkText?: string;
  isRevoked: boolean;
  viewCount: number;
  lastViewedAt: string | null;
  createdBy: string;
  createdAt: string;
}

// ── 10. Media Processing Queue ────────────────────────────────────────────────

export type MediaJobType =
  | "generate_proxy"
  | "extract_thumbnails"
  | "transcribe_speech"
  | "validate_technical_spec"
  | "detect_scenes"
  | "normalize_audio";

export interface MediaProcessingJob {
  id: string;
  assetId: string;
  projectId: string;
  jobType: MediaJobType;
  status: "queued" | "processing" | "completed" | "failed";
  progressPercent: number;
  attemptCount: number;
  maxAttempts: number;
  errorLog?: string;
  outputPayload?: Record<string, unknown>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// ── 12. Operational Analytics & Cost Tracking ────────────────────────────────

export interface ProjectCostLedger {
  projectId: string;
  budgetAllocatedUsd: number;
  actualCostUsd: number;
  hourlyRateUsd: number;
  estimatedHours: number;
  loggedHours: number;
  assetLicensingCostsUsd: number;
  variancePercent: number;
}

export interface DeadlineRiskIndicator {
  projectId: string;
  riskScore: number; // 0 - 100
  riskLevel: "low" | "moderate" | "high" | "critical";
  daysRemaining: number;
  uncompletedTasks: number;
  blockedTasksCount: number;
  pendingReviewAgeHours: number;
  primaryRiskFactor: string;
}

// ── 13. Rights & Licensing Records ───────────────────────────────────────────

export interface AssetLicenseRecord {
  id: string;
  assetId: string;
  projectId: string;
  assetTitle: string;
  assetType: "footage" | "music_track" | "sound_effect" | "font" | "stock_photo";
  licensor: string;
  licenseNumberOrUrl?: string;
  licenseType: "royalty_free" | "commercial_exclusive" | "editorial_only" | "creative_commons" | "commissioned";
  territory: "worldwide" | "north_america" | "online_only" | "custom";
  expiresAt: string | null;
  clearanceStatus: "cleared" | "pending_review" | "flagged" | "expired";
  commercialUsagePermitted: boolean;
  notes?: string;
  createdAt: string;
}

// ── 14. Recovery Tooling & Audit Diagnostics ─────────────────────────────────

export interface SystemHealthDiagnostic {
  databaseConnected: boolean;
  storageProvider: "supabase" | "local_fs";
  storageUsedBytes: number;
  storageLimitBytes: number;
  backgroundJobsPending: number;
  backgroundJobsFailed24h: number;
  activeSessionsCount: number;
  lastBackupTimestamp: string;
  diagnosticStatus: "optimal" | "degraded" | "action_required";
  systemVersion: string;
}

export interface IntegrationHandoffPayload {
  format: "premiere_xml" | "edl_markers" | "davinci_fcpxml";
  projectName: string;
  versionNumber: number;
  exportedAt: string;
  timecodeBase: string;
  markers: {
    frameNumber: number;
    timestampSec: number;
    color: string;
    comment: string;
    author: string;
  }[];
}

