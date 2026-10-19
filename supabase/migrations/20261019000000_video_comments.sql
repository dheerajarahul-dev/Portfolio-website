create table if not exists public.video_comments (
  id uuid primary key default gen_random_uuid(),
  video_url text not null check (char_length(video_url) between 1 and 2000),
  author_name text not null check (char_length(author_name) between 1 and 80),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists video_comments_video_created_idx
  on public.video_comments (video_url, created_at desc);

alter table public.video_comments enable row level security;
revoke all on table public.video_comments from anon, authenticated;
grant all on table public.video_comments to service_role;