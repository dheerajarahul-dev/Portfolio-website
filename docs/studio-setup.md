# Creative X Studio — Setup & Deployment Guide

Creative X Studio is the client collaboration, task management, and frame-accurate video review platform for Creative X Creations. It operates under `/studio` as a dedicated sub-application while keeping the public portfolio and CMS untouched.

---

## 1. Database Setup (Supabase)

1. Open your **Supabase Dashboard** at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase project.
3. Open [`supabase/migrations/20261018000000_studio_schema.sql`](../supabase/migrations/20261018000000_studio_schema.sql).
4. Run the SQL script to create all 17 studio tables, indexes, triggers, and security policies.

### Supabase Storage Bucket
Create a private storage bucket named:
- **Bucket Name**: `studio` (or your preferred storage path)
- **Public**: `false` (Private — file access is controlled via time-limited signed URLs)

---

## 2. Seeding Initial Super Admin User

The database migration automatically seeds the default Super Administrator account:

- **Email**: `dheeraj@gmail.com`
- **Password**: `dheeraj1213`
- **Role**: `super_admin`

You can also manually insert or update users into `studio_users`:
```sql
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
```

---

## 3. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
STUDIO_SESSION_SECRET=<random-64-char-hex-secret>
```

---

## 4. Architecture & Security

- **Independent Session**: Uses the `cxs_session` httpOnly HMAC-SHA256 signed cookie (8-hour TTL).
- **Role-Based Access Control**:
  - `super_admin`: Full platform control, invites, team, settings.
  - `manager`: Project creation, editor assignment, client management.
  - `editor`: Project tasks, media uploads, WIP cuts, review comments.
  - `client`: Client review, video approval, feedback, deliverable downloads.
  - `reviewer`: Video review and frame commenting only.
- **Internal Messaging Security**: Internal agency notes (`is_internal = true`) are strictly filtered at the DB query level and never returned to clients or reviewers.
- **Large Video Uploads**: Video files upload directly from the browser to Supabase Storage using signed presigned PUT URLs, bypassing Netlify's execution limit.

---

## 5. Routes Reference

| Route | Purpose | Access |
|---|---|---|
| `/studio/login` | Studio authentication | Public |
| `/studio/dashboard` | Role-adaptive dashboard overview | Authenticated |
| `/studio/projects` | Project directory & filter | All Roles (scoped) |
| `/studio/projects/new` | Create new video production project | Staff |
| `/studio/projects/[id]` | Full project workspace | Assigned Members / Staff |
| `/studio/tasks` | Production task board | Staff & Editors |
| `/studio/media` | Media library & asset browser | Staff & Editors |
| `/studio/review` | Video review queue | All Roles |
| `/studio/review/[id]` | Video review player & frame comments | All Roles |
| `/studio/inbox` | Notifications & alerts | All Roles |
| `/studio/team` | Team & invitation management | Super Admin & Manager |
| `/studio/clients` | Client organizations directory | Super Admin & Manager |
| `/studio/settings` | Platform storage & security settings | Super Admin |
| `/studio/profile` | User profile & password reset | All Roles |
