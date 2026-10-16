# CreativeXCreations — Portfolio Website

A dark, cinematic portfolio site for a video-editing agency, built with **Next.js 16 (App Router, Turbopack)**, **React 19**, **Tailwind CSS v4**, and **Framer Motion**. Content is managed through a built-in admin CMS with inline live editing. Local development uses JSON files; serverless production deployments use Supabase for persistent CMS data and media uploads.

## Quick start

```bash
npm install
npm run dev        # development server at http://localhost:3000
npm run dev:https  # optional local HTTPS with Next.js development certificates
```

Production:

```bash
npm run build
npm start          # serves the optimized build at http://localhost:3000
```

Lint and type-check:

```bash
npm run lint
npx tsc --noEmit
```

## Configuration

Copy `.env.example` to `.env.local` and set:

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_USERNAME` | Recommended | Owner username used when the account store is first bootstrapped. Defaults to `dheeraj_a`. |
| `ADMIN_PASSWORD` | **Yes** (for `/admin`) | Initial owner password when the account store is empty. Existing accounts are managed in the Accounts tab. |
| `ADMIN_SESSION_SECRET` | **Required in production** | Independent random secret for signing admin sessions. Local development may fall back to `ADMIN_PASSWORD`. |
| `NEXT_PUBLIC_SITE_URL` | Recommended in prod | Absolute HTTPS site URL used for canonical URLs, sitemap, and OpenGraph metadata. Netlify's deployment URL is used as a fallback. |
| `SUPABASE_URL` | Required for Netlify/serverless CMS persistence | Hosted Supabase project base URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for Netlify/serverless CMS persistence | Secure backend key used only on the server. |
| `SUPABASE_STORAGE_BUCKET` | Required for hosted uploads | Public Supabase Storage bucket for uploaded thumbnails, images, and videos. Defaults to `cxc-media`. |
| `CMS_STORAGE_PROVIDER` | Optional | Set to `supabase` when using hosted persistence. |
| `ALLOW_LOCAL_JSON_STORAGE` | Optional, dev only | Allows local file writes in development; keep disabled on Netlify. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Optional | Enables Plausible analytics. |
| `NEXT_PUBLIC_GA_ID` | Optional | Enables Google Analytics 4. |

### Netlify / serverless deployment note

The project no longer treats `data/site-content.json` and `public/uploads/` as reliable production persistence. On Netlify, set `CMS_STORAGE_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`. Admin content and messages are stored through Supabase REST, while uploaded assets go to Supabase Storage. Local JSON writes remain for local development only unless explicitly allowed.

Create these Supabase tables before deploying:

```sql
create table if not exists public.site_content (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key,
  name text not null,
  email text not null,
  subject text,
  project_type text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false,
  deleted_at timestamptz
);

-- Existing installations: add the recycle-bin marker before deploying this version.
alter table public.contact_messages
  add column if not exists deleted_at timestamptz;

create table if not exists public.admin_users (
  id text primary key,
  username text not null unique,
  password_salt text not null,
  password_hash text not null,
  role text not null check (role in ('owner', 'editor', 'media', 'messages')),
  permissions jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Create a public Storage bucket named `cxc-media` or set `SUPABASE_STORAGE_BUCKET` to your bucket name. Set the bucket's maximum file size to at least 100 MB and allow JPG, PNG, WebP, GIF, MP4, and WebM. Hosted uploads use short-lived signed URLs so large file bytes go directly from the browser to Supabase instead of through a Netlify function. The app uses the service-role key only in server route handlers; never expose it as a `NEXT_PUBLIC_` variable.

## How it works

- **Content store** — `src/lib/storage.ts` uses Supabase for production when configured, or local JSON files for development. Local writes are serialized through a queue, atomic (temp file + rename), and keep up to 20 timestamped backups in `data/backups/`.
- **Pages**
  - `/` — public landing page (server-rendered, revalidates every 15 s).
  - `/player` — dedicated video player (`/player?videoUrl=…&title=…`).
  - `/admin` — password-protected CMS (content editing + contact inbox).
  - `/library` — published media library.
- **Featured work** — only published videos checked as Home appear. Up to nine selected videos fill a square collage: one main tile and up to eight small tiles. Unchecking Home removes a video from the homepage.
- **Inline editing** — visiting `/?edit=1` while logged in enables text/image selection, editing, dragging, and resizing on the live page (see `SiteContentContext` + `src/components/edit/`).
- **API routes**
  - `POST/DELETE /api/admin/login` — session login/logout (hashed session cookie, brute-force throttle).
  - `GET /api/admin/session` — whether the caller is authenticated.
  - `GET/PUT /api/content` — read/update site content (`PUT` requires admin).
  - `POST /api/contact` — public contact form submission.
  - `GET/PATCH/DELETE /api/messages` — contact inbox (admin only).
  - `POST /api/upload` and `POST /api/upload/sign` — image/video uploads (≤ 100 MB, allow-listed types; hosted uploads use signed storage URLs).
  - `GET/POST/PATCH/DELETE /api/admin/users` — owner-managed admin accounts and permissions.
- **Media** — video cards support YouTube, Google Drive, and uploaded MP4/WebM URLs. YouTube thumbnails come from `img.youtube.com` (allowed in `next.config.ts`).

## Project structure

```
src/
  app/                 # App Router pages + API routes
  components/
    sections/          # Landing page sections (Hero, Stats, Pricing, …)
    ui/                # Shared UI (video cards, ambient frames, loaders)
    edit/              # Inline live-editing widgets
    admin/             # Admin CMS widgets
    player/            # Dedicated player page client
  context/             # SiteContentContext (content + edit mode state)
  hooks/               # useGeoLocation (region-based pricing)
  lib/                 # storage, auth, media/YouTube helpers, types, defaults
data/                  # Runtime JSON content + messages + backups
public/assets/         # Sample media served statically
```

## Deploy notes

For a serverless Netlify deployment, configure `CMS_STORAGE_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`; serverless filesystems do not persist JSON or local uploads. A Node server deployment can use local storage when its disk is persistent and writable.

The production response includes HSTS. In Netlify, configure a valid TLS certificate for the deployed domain and enable **Force HTTPS** in the domain settings; the app cannot provision certificates or choose a canonical hostname. Set `NEXT_PUBLIC_SITE_URL` to the absolute HTTPS production URL. Local HTTPS is optional and uses Next.js development certificates.
