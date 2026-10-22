-- =============================================================================
-- Creative X Studio — Supabase Database Migration
-- Phase 1: Complete Studio Schema
-- =============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Studio Users (Separate profile table for studio members & clients)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('super_admin', 'manager', 'editor', 'client', 'reviewer')),
  avatar_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  invited_by UUID REFERENCES studio_users(id) ON DELETE SET NULL,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_users_email ON studio_users (lower(email));
CREATE INDEX IF NOT EXISTS idx_studio_users_role ON studio_users (role);
CREATE INDEX IF NOT EXISTS idx_studio_users_active ON studio_users (active);

-- -----------------------------------------------------------------------------
-- 2. Studio Invitations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'manager', 'editor', 'client', 'reviewer')),
  token_hash TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES studio_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_invitations_token_hash ON studio_invitations (token_hash);
CREATE INDEX IF NOT EXISTS idx_studio_invitations_email ON studio_invitations (lower(email));

-- -----------------------------------------------------------------------------
-- 3. Studio Clients (Organizations / Companies)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  user_id UUID REFERENCES studio_users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES studio_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_clients_email ON studio_clients (lower(email));
CREATE INDEX IF NOT EXISTS idx_studio_clients_user_id ON studio_clients (user_id);

-- -----------------------------------------------------------------------------
-- 4. Studio Requests (Client Project Intake)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES studio_clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  project_type TEXT NOT NULL,
  description TEXT NOT NULL,
  objectives TEXT,
  target_audience TEXT,
  platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_format TEXT,
  aspect_ratio TEXT,
  target_duration TEXT,
  deliverable_count INT NOT NULL DEFAULT 1,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  deadline TIMESTAMPTZ,
  deadline_timezone TEXT,
  reference_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  editing_style TEXT,
  budget_range TEXT,
  additional_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'awaiting_info', 'accepted', 'declined')),
  submitted_by UUID NOT NULL REFERENCES studio_users(id),
  reviewed_by UUID REFERENCES studio_users(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_requests_client ON studio_requests (client_id);
CREATE INDEX IF NOT EXISTS idx_studio_requests_status ON studio_requests (status);

-- -----------------------------------------------------------------------------
-- 5. Studio Projects
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES studio_requests(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'request_received' CHECK (
    status IN (
      'request_received', 'awaiting_assignment', 'assets_collecting',
      'ready_for_editing', 'in_production', 'internal_review',
      'client_review', 'revisions_requested', 'final_approval',
      'delivery', 'completed', 'archived'
    )
  ),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  client_id UUID NOT NULL REFERENCES studio_clients(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES studio_users(id) ON DELETE SET NULL,
  deadline TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES studio_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_projects_client_id ON studio_projects (client_id);
CREATE INDEX IF NOT EXISTS idx_studio_projects_manager_id ON studio_projects (manager_id);
CREATE INDEX IF NOT EXISTS idx_studio_projects_status ON studio_projects (status);
CREATE INDEX IF NOT EXISTS idx_studio_projects_priority ON studio_projects (priority);
CREATE INDEX IF NOT EXISTS idx_studio_projects_deadline ON studio_projects (deadline);

-- -----------------------------------------------------------------------------
-- 6. Studio Project Members
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES studio_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'reviewer', 'collaborator')),
  added_by UUID NOT NULL REFERENCES studio_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_studio_members_project ON studio_project_members (project_id);
CREATE INDEX IF NOT EXISTS idx_studio_members_user ON studio_project_members (user_id);

-- -----------------------------------------------------------------------------
-- 7. Studio Milestones
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_milestones_project ON studio_milestones (project_id);

-- -----------------------------------------------------------------------------
-- 8. Studio Tasks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES studio_users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES studio_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_tasks_project ON studio_tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_studio_tasks_assignee ON studio_tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_studio_tasks_status ON studio_tasks (status);
CREATE INDEX IF NOT EXISTS idx_studio_tasks_due_date ON studio_tasks (due_date);

-- -----------------------------------------------------------------------------
-- 9. Studio Deliverables
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_deliverables_project ON studio_deliverables (project_id);

-- -----------------------------------------------------------------------------
-- 10. Studio Assets (Files uploaded into Studio)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES studio_deliverables(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other' CHECK (
    category IN (
      'raw_video', 'wip_export', 'final_video', 'audio', 'music',
      'voiceover', 'image', 'logo', 'document', 'subtitle',
      'script', 'reference', 'project_file', 'other'
    )
  ),
  uploaded_by UUID NOT NULL REFERENCES studio_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_assets_project ON studio_assets (project_id);
CREATE INDEX IF NOT EXISTS idx_studio_assets_deliverable ON studio_assets (deliverable_id);
CREATE INDEX IF NOT EXISTS idx_studio_assets_category ON studio_assets (category);

-- -----------------------------------------------------------------------------
-- 11. Studio Versions (Video Revisions for a Deliverable)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES studio_deliverables(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES studio_assets(id) ON DELETE RESTRICT,
  version_number INT NOT NULL DEFAULT 1,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'submitted', 'in_review', 'changes_requested', 'resubmitted', 'approved', 'superseded', 'archived')
  ),
  submitted_by UUID NOT NULL REFERENCES studio_users(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (deliverable_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_studio_versions_deliverable ON studio_versions (deliverable_id);
CREATE INDEX IF NOT EXISTS idx_studio_versions_status ON studio_versions (status);

-- -----------------------------------------------------------------------------
-- 12. Studio Comments (Timestamped Review Feedback)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES studio_versions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES studio_users(id) ON DELETE CASCADE,
  timestamp_sec NUMERIC(8, 2),
  end_timestamp_sec NUMERIC(8, 2),
  body TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES studio_users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_comments_version ON studio_comments (version_id);
CREATE INDEX IF NOT EXISTS idx_studio_comments_timestamp ON studio_comments (timestamp_sec);

-- -----------------------------------------------------------------------------
-- 13. Studio Comment Replies
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES studio_comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES studio_users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_comment_replies_comment ON studio_comment_replies (comment_id);

-- -----------------------------------------------------------------------------
-- 14. Studio Approvals
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES studio_versions(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  approved_by UUID NOT NULL REFERENCES studio_users(id),
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'changes_requested')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_approvals_version ON studio_approvals (version_id);
CREATE INDEX IF NOT EXISTS idx_studio_approvals_project ON studio_approvals (project_id);

-- -----------------------------------------------------------------------------
-- 15. Studio Messages (Discussion & Internal Notes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES studio_users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_messages_project ON studio_messages (project_id);
CREATE INDEX IF NOT EXISTS idx_studio_messages_internal ON studio_messages (is_internal);

-- -----------------------------------------------------------------------------
-- 16. Studio Notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES studio_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_notifications_user ON studio_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_studio_notifications_read ON studio_notifications (user_id, read);

-- -----------------------------------------------------------------------------
-- 17. Studio Activity Events (Audit & Timeline)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS studio_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES studio_users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_events_project ON studio_events (project_id);
CREATE INDEX IF NOT EXISTS idx_studio_events_created_at ON studio_events (created_at DESC);

-- -----------------------------------------------------------------------------
-- Automatic updated_at Trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  CREATE TRIGGER tr_studio_users_updated_at BEFORE UPDATE ON studio_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER tr_studio_clients_updated_at BEFORE UPDATE ON studio_clients FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER tr_studio_requests_updated_at BEFORE UPDATE ON studio_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER tr_studio_projects_updated_at BEFORE UPDATE ON studio_projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER tr_studio_tasks_updated_at BEFORE UPDATE ON studio_tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER tr_studio_comments_updated_at BEFORE UPDATE ON studio_comments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER tr_studio_messages_updated_at BEFORE UPDATE ON studio_messages FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS) Enablement
-- Studio server routes access DB with SUPABASE_SERVICE_ROLE_KEY which bypasses RLS,
-- but enabling RLS ensures no unintended public anon access is possible.
-- -----------------------------------------------------------------------------
ALTER TABLE studio_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_events ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Default Studio Super Admin Seed
-- Email: dheeraj@gmail.com
-- Password: dheeraj1213
-- -----------------------------------------------------------------------------
INSERT INTO studio_users (
  id,
  email,
  display_name,
  password_hash,
  password_salt,
  role,
  active
) VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'dheeraj@gmail.com',
  'Dheeraj A',
  'c96b401815813a1cf984b2644f01935b0535fbfdb7037b0335380cf48931f241a3da63ad5b8a48ace89a4af1ddc3743690bfeca95f34f3e7793ea99ce3382979',
  'a1b2c3d4e5f60718293a4b5c6d7e8f90',
  'super_admin',
  true
)
ON CONFLICT (email) DO NOTHING;

