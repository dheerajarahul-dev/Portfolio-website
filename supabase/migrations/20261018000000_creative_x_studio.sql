create extension if not exists pgcrypto;

create table if not exists public.studio_profiles (
  id text primary key,
  email text not null unique check (char_length(email) between 3 and 254),
  display_name text not null check (char_length(display_name) between 1 and 160),
  role text not null check (role in ('owner', 'manager', 'editor', 'client', 'reviewer')),
  active boolean not null default true,
  avatar_path text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254),
  role text not null check (role in ('manager', 'editor', 'client', 'reviewer')),
  token_hash text not null unique,
  invited_by text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_project_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id text,
  requester_name text not null check (char_length(requester_name) between 1 and 160),
  requester_email text not null check (char_length(requester_email) between 3 and 254),
  title text not null check (char_length(title) between 1 and 200),
  brief text not null check (char_length(brief) between 1 and 20000),
  details jsonb not null default '{}'::jsonb,
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'under_review', 'awaiting_information', 'accepted', 'declined')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_projects (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.studio_project_requests(id) on delete set null,
  name text not null check (char_length(name) between 1 and 160),
  client_name text not null check (char_length(client_name) between 1 and 160),
  client_email text not null check (char_length(client_email) between 3 and 254),
  status text not null default 'briefing' check (status in ('briefing', 'assets', 'production', 'internal_review', 'client_review', 'changes_requested', 'approved', 'delivery', 'completed', 'archived')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  due_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  profile_id text not null,
  role text not null check (role in ('manager', 'editor', 'client', 'reviewer')),
  created_at timestamptz not null default now(),
  unique (project_id, profile_id)
);

create table if not exists public.studio_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'complete', 'blocked')),
  due_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 5000),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'in_review', 'approved', 'delivered')),
  required boolean not null default true,
  due_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  deliverable_id uuid references public.studio_deliverables(id) on delete set null,
  parent_id uuid references public.studio_tasks(id) on delete cascade,
  assignee_id text,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 10000),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'blocked', 'complete', 'cancelled')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  due_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  uploaded_by text,
  name text not null check (char_length(name) between 1 and 255),
  storage_path text not null unique check (char_length(storage_path) between 1 and 2000),
  category text not null default 'miscellaneous',
  content_type text not null check (char_length(content_type) between 1 and 160),
  size_bytes bigint not null check (size_bytes >= 0),
  sha256 text,
  processing_status text not null default 'ready' check (processing_status in ('queued', 'processing', 'ready', 'failed')),
  private boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  deliverable_id uuid not null references public.studio_deliverables(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  label text not null check (char_length(label) between 1 and 60),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'in_review', 'changes_requested', 'approved', 'superseded', 'archived')),
  review_asset_id uuid references public.studio_assets(id) on delete restrict,
  notes text not null default '' check (char_length(notes) <= 10000),
  submitted_by text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (deliverable_id, version_number)
);

create table if not exists public.studio_review_comments (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.studio_revisions(id) on delete cascade,
  author_id text,
  body text not null check (char_length(body) between 1 and 5000),
  start_seconds numeric(12,3) not null default 0 check (start_seconds >= 0),
  end_seconds numeric(12,3) check (end_seconds is null or end_seconds >= start_seconds),
  status text not null default 'open' check (status in ('open', 'addressed', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_review_annotations (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.studio_review_comments(id) on delete cascade,
  frame_width integer not null check (frame_width > 0),
  frame_height integer not null check (frame_height > 0),
  paths jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_approvals (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.studio_revisions(id) on delete cascade,
  decided_by text not null,
  decision text not null check (decision in ('approved', 'changes_requested')),
  note text not null default '' check (char_length(note) <= 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.studio_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  sender_id text not null,
  body text not null check (char_length(body) between 1 and 10000),
  internal boolean not null default false,
  reply_to uuid references public.studio_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table if not exists public.studio_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id text not null,
  event_type text not null,
  project_id uuid references public.studio_projects(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recipient_id, event_type, project_id, created_at)
);

create table if not exists public.studio_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.studio_projects(id) on delete cascade,
  actor_id text,
  actor_type text not null check (actor_type in ('admin', 'manager', 'editor', 'client', 'reviewer', 'system')),
  event_type text not null check (char_length(event_type) between 1 and 100),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 160),
  description text not null default '' check (char_length(description) <= 5000),
  definition jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_automation_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  trigger_event text not null,
  definition jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_automation_runs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.studio_automation_rules(id) on delete cascade,
  event_key text not null unique,
  status text not null default 'queued' check (status in ('queued', 'running', 'complete', 'failed')),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_proposals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.studio_projects(id) on delete set null,
  request_id uuid references public.studio_project_requests(id) on delete set null,
  number text not null unique check (char_length(number) between 1 and 40),
  client_name text not null check (char_length(client_name) between 1 and 160),
  client_email text not null check (char_length(client_email) between 3 and 254),
  status text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired')),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  valid_until date,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  notes text not null default '' check (char_length(notes) <= 10000),
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.studio_proposals(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 5000),
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  sort_order integer not null default 0
);

create table if not exists public.studio_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id text,
  action text not null,
  target_type text not null,
  target_id text,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_ai_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.studio_projects(id) on delete cascade,
  revision_id uuid references public.studio_revisions(id) on delete cascade,
  job_type text not null check (job_type in ('transcript', 'captions', 'scene_detection', 'highlights', 'editing_brief', 'summary', 'tags')),
  status text not null default 'queued' check (status in ('queued', 'running', 'complete', 'failed', 'cancelled')),
  input_asset_id uuid references public.studio_assets(id) on delete set null,
  result jsonb,
  error_message text,
  created_by text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (project_id is not null or revision_id is not null)
);

create index if not exists studio_projects_status_idx on public.studio_projects(status, updated_at desc);
create index if not exists studio_project_members_profile_idx on public.studio_project_members(profile_id, project_id);
create index if not exists studio_tasks_project_status_idx on public.studio_tasks(project_id, status, due_at);
create index if not exists studio_assets_project_idx on public.studio_assets(project_id, category, created_at desc);
create index if not exists studio_revisions_deliverable_idx on public.studio_revisions(deliverable_id, version_number desc);
create index if not exists studio_comments_revision_time_idx on public.studio_review_comments(revision_id, start_seconds, created_at);
create index if not exists studio_notifications_recipient_idx on public.studio_notifications(recipient_id, read_at, created_at desc);
create index if not exists studio_activity_project_idx on public.studio_activity(project_id, created_at desc);
create index if not exists studio_ai_jobs_status_idx on public.studio_ai_jobs(status, created_at);
create index if not exists studio_audit_events_created_idx on public.studio_audit_events(created_at desc);

create or replace function public.studio_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['studio_profiles', 'studio_project_requests', 'studio_projects', 'studio_tasks', 'studio_review_comments', 'studio_templates', 'studio_proposals'] loop
    execute format('drop trigger if exists %I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.studio_set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['studio_profiles', 'studio_invitations', 'studio_project_requests', 'studio_projects', 'studio_project_members', 'studio_milestones', 'studio_deliverables', 'studio_tasks', 'studio_assets', 'studio_revisions', 'studio_review_comments', 'studio_review_annotations', 'studio_approvals', 'studio_messages', 'studio_notifications', 'studio_activity', 'studio_templates', 'studio_automation_rules', 'studio_automation_runs', 'studio_proposals', 'studio_proposal_items', 'studio_audit_events', 'studio_ai_jobs'] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

comment on schema public is 'Creative X Studio project collaboration data. Anonymous access is denied by default; server routes must enforce object-level permissions.';
comment on table public.studio_ai_jobs is 'AI outputs are drafts and require editor review before publication or client delivery.';
comment on table public.studio_audit_events is 'Append-only security and workflow audit records; ordinary users must not receive update or delete policies.';
