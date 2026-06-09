# Sauma CRM — Product Specification
**For:** Claude Code Implementation  
**Author:** Taren Cary / Sauma AI  
**Version:** 1.0  
**Stack:** Next.js 14 (App Router) + Supabase + Tailwind CSS + shadcn/ui

---

## 0. Overview

Sauma CRM is a developer-native client relationship management system built for a solo AI automation agency. Unlike generic CRMs, it unifies three layers that solo dev shops must track simultaneously:

1. **Relationship layer** — communication, trust, billing, contracts
2. **Project layer** — tasks, milestones, scope, timelines
3. **System layer** — tech stack, integrations, architecture notes, deployment state

The application is a private, single-user Next.js web app backed by Supabase. It is not multi-tenant. Authentication is via Supabase Auth (magic link or email/password — operator's choice).

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14, App Router, TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS + shadcn/ui |
| State | React state + SWR or React Query for data fetching |
| Hosting | Vercel (recommended) |
| Icons | Lucide React |

**Do not** use Prisma. Use Supabase's JS client (`@supabase/supabase-js`) directly with typed query helpers.

---

## 2. Database Schema

### 2.1 `clients`

```sql
create table clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Identity
  name text not null,
  company text,
  email text,
  phone text,
  timezone text,

  -- Relationship
  status text not null default 'active',
  -- status options: prospect | active | maintenance | at_risk | paused | churned
  health_score integer default 3 check (health_score between 1 and 5),
  -- 1=critical, 2=at-risk, 3=stable, 4=good, 5=excellent
  comm_preference text default 'async',
  -- comm_preference options: async | sync | email_only | slack | whatsapp

  -- Billing
  billing_model text,
  -- billing_model options: retainer | project | hourly | hybrid
  monthly_value numeric(10,2),
  hourly_rate numeric(10,2),
  contract_start date,
  contract_end date,
  contract_renewal date,
  payment_terms text,
  -- e.g. "Net 15", "50% upfront"

  -- Notes
  notes text,
  tags text[] default '{}'
);
```

### 2.2 `client_systems`

One client can have multiple systems (e.g. voice bot + lead nurture bot).

```sql
create table client_systems (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  name text not null,
  -- e.g. "Lead Capture Voice Bot", "WhatsApp Follow-up Agent"
  description text,
  status text default 'active',
  -- active | building | paused | deprecated

  -- Tech
  tech_stack text[],
  -- e.g. ['OpenClaw', 'Retell AI', 'Supabase', 'Twilio']
  repo_url text,
  staging_url text,
  production_url text,
  last_deployed_at timestamptz,

  -- Credentials & Integrations (store vault reference, NOT secrets)
  credentials_vault_note text,
  -- e.g. "1Password vault: Sauma/ClientName"
  integrations jsonb default '[]',
  -- Array of { name, endpoint, type, status }
  -- e.g. [{"name":"GoHighLevel","endpoint":"https://...","type":"CRM","status":"active"}]

  -- Architecture
  architecture_notes text,
  -- Free-form markdown: agent roles, data flow, known constraints
  known_issues text,
  -- Ongoing bugs or gotchas to remember

  -- Maintenance
  monitoring_url text,
  on_call_instructions text
);
```

### 2.3 `projects`

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  system_id uuid references client_systems(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  name text not null,
  description text,
  status text default 'scoping',
  -- scoping | in_progress | review | complete | on_hold | cancelled

  phase text,
  -- e.g. "Phase 1: Voice Bot", "Phase 2: CRM Integration"

  estimated_hours numeric(6,1),
  actual_hours numeric(6,1) default 0,
  estimated_value numeric(10,2),

  start_date date,
  deadline date,
  completed_at timestamptz,

  scope_locked boolean default false,
  -- When true, any additions are flagged as scope creep

  notes text
);
```

### 2.4 `tasks`

```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  title text not null,
  description text,
  status text default 'todo',
  -- todo | in_progress | blocked | review | done

  priority text default 'medium',
  -- low | medium | high | urgent

  is_scope_creep boolean default false,
  -- Flag tasks added after scope_locked = true

  estimated_hours numeric(5,1),
  actual_hours numeric(5,1),

  due_date date,
  completed_at timestamptz,

  tags text[] default '{}'
);
```

### 2.5 `communications`

```sql
create table communications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  created_at timestamptz default now(),

  type text not null,
  -- call | email | message | meeting | loom | note
  direction text default 'outbound',
  -- inbound | outbound | internal

  subject text,
  summary text not null,
  -- Key decisions, commitments, or context — not transcripts

  decisions_made text[],
  -- Array of decision strings for easy retrieval
  -- e.g. ["Agreed to $1,200/mo retainer","Using GHL not a custom CRM"]

  follow_up_required boolean default false,
  follow_up_date date,
  follow_up_note text,

  logged_at timestamptz default now()
);
```

### 2.6 `pipeline`

For prospects not yet converted to active clients.

```sql
create table pipeline (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  name text not null,
  company text,
  email text,
  phone text,
  source text,
  -- referral | webinar | cold_outreach | inbound | social

  stage text default 'lead',
  -- lead | contacted | discovery | proposal | negotiation | won | lost

  estimated_value numeric(10,2),
  probability integer default 50 check (probability between 0 and 100),
  expected_close date,

  system_type text,
  -- What they'd likely need: e.g. "Voice bot + lead nurture"
  platform_notes text,
  -- e.g. "Currently on Beside AI, uses GoHighLevel"

  next_action text,
  next_action_date date,

  notes text,
  lost_reason text
);
```

### 2.7 `time_logs`

```sql
create table time_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  task_id uuid references tasks(id) on delete set null,
  created_at timestamptz default now(),

  description text not null,
  hours numeric(5,2) not null,
  logged_date date default current_date,
  billable boolean default true
);
```

### 2.8 `decisions_log`

Decisions that apply at the client level (not tied to a single communication).

```sql
create table decisions_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  system_id uuid references client_systems(id) on delete set null,
  created_at timestamptz default now(),

  decision text not null,
  rationale text,
  made_by text default 'internal',
  -- internal | client | joint

  logged_at timestamptz default now()
);
```

### 2.9 Triggers

Add `updated_at` auto-update triggers on all tables that have that column:

```sql
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to each table:
create trigger set_updated_at before update on clients
  for each row execute function update_updated_at();
-- Repeat for client_systems, projects, tasks, pipeline
```

---

## 3. Application Structure

```
/app
  /dashboard          → Command center (default route)
  /clients
    /page.tsx          → Client list view
    /[id]
      /page.tsx        → Client detail view
      /systems         → Systems tab
      /projects        → Projects tab
      /comms           → Communications tab
      /decisions       → Decisions log tab
  /pipeline
    /page.tsx          → Pipeline kanban/list
  /tasks
    /page.tsx          → Global task queue (all clients)
  /time
    /page.tsx          → Time logging + summary
  /settings
    /page.tsx          → App settings, profile

/components
  /ui                  → shadcn components
  /crm
    ClientCard.tsx
    SystemCard.tsx
    TaskRow.tsx
    CommEntry.tsx
    HealthBadge.tsx
    StatusBadge.tsx
    PipelineCard.tsx
    TimeLogForm.tsx
    QuickLogComm.tsx

/lib
  /supabase
    client.ts          → Browser client
    server.ts          → Server client (for RSCs)
    types.ts           → Database type definitions (generated or manual)
  /utils.ts
```

---

## 4. Pages & Features

### 4.1 Dashboard (`/dashboard`)

The command center. Loads on login. Designed to answer: **"What needs my attention right now?"**

**Sections:**

**Top metrics bar (4 cards):**
- Active clients (count)
- Tasks due this week (count, clickable)
- MRR / monthly billed value (sum of active client `monthly_value`)
- Follow-ups overdue (count from `communications` where `follow_up_required=true` and `follow_up_date < today`)

**Client Health Grid:**
- All active clients sorted by health_score ASC (critical first)
- Each card shows: name, health badge, status, last contact date, open task count, days until contract renewal (if < 30 days, highlight red)
- Clicking a card navigates to `/clients/[id]`

**Today's Priority Queue:**
- Tasks with `due_date = today` or `priority = urgent`, across all clients
- Grouped by client
- Inline checkbox to mark complete

**Overdue Follow-ups:**
- List of communication entries where follow_up_required=true and follow_up_date is past
- Shows client name, follow-up note, days overdue

**Pipeline snapshot:**
- Count of prospects per stage
- Total pipeline value

**Recent Activity feed:**
- Last 10 communications or task completions, across all clients, sorted by created_at DESC

---

### 4.2 Client List (`/clients`)

**Layout:** Table or card grid toggle

**Columns (table view):**
- Name / Company
- Status badge
- Health score (colored dot: red/orange/yellow/green/blue)
- Billing model + monthly value
- Last contact (relative: "3 days ago")
- Open tasks (count)
- Contract renewal (date, red if < 30 days)
- Actions: View, Quick log

**Filters:** Status, Health score, Billing model, Tags

**Search:** Full-text across name, company, tags

**"Add Client" button** → opens slide-over form (not a new page)

---

### 4.3 Client Detail (`/clients/[id]`)

The most important page. Tabbed layout.

**Header (always visible):**
- Client name, company, status badge, health score
- Key info: email, phone, timezone, comm preference
- Billing: model, monthly value, contract dates
- Quick actions: Log Communication, Add Task, Log Time

---

**Tab 1: Overview**

- Health score editor (click to change, 1–5 with labels)
- Client notes (rich text or markdown textarea, auto-saves)
- Tags editor
- Blockers section — what's waiting on the client vs. what's waiting on you (two columns, free-form text)
- Open scope creep flags (tasks marked `is_scope_creep=true`)

---

**Tab 2: Systems**

List of all `client_systems` for this client.

Each system card expands to show:
- Status, tech stack tags (rendered as pills)
- Repo URL, staging URL, production URL (clickable links)
- Last deployed date
- Credentials vault note
- Integrations list (name, endpoint, type, status — rendered as a small table)
- Architecture notes (rendered as markdown)
- Known issues (rendered as markdown, highlighted in yellow)
- On-call instructions

"Add System" button → inline form or slide-over

---

**Tab 3: Projects**

List of all `projects` for this client.

Each project shows:
- Name, phase, status badge
- Progress bar: actual_hours / estimated_hours
- Deadline (red if overdue)
- Scope locked indicator
- Scope creep warning if any tasks are flagged

Expanding a project shows its task list (filtered `tasks` by `project_id`).

Task list supports:
- Inline status update (dropdown)
- Inline priority update
- Quick add task form
- Hours logging per task
- Scope creep flag toggle

---

**Tab 4: Communications**

Chronological log of all communication with this client.

Each entry shows:
- Date, type icon (📞 call, 📧 email, 💬 message, 📹 loom, 📝 note)
- Direction (inbound/outbound/internal)
- Subject
- Summary
- Decisions made (rendered as a bullet list)
- Follow-up badge (if follow_up_required=true, shows date and note)

"Log Communication" button → slide-over form:
- Type selector
- Direction selector
- Subject
- Summary (textarea)
- Decisions made (dynamic multi-input — add/remove items)
- Follow-up toggle → shows date picker and note field

---

**Tab 5: Decisions Log**

All key decisions made for this client — aggregated from both `decisions_log` table and extracted decisions from communications.

Shows: date, decision, rationale, made-by.

"Log Decision" button → quick form.

Purpose: searchable institutional memory so nothing gets re-litigated.

---

**Tab 6: Time**

All time logs for this client.

Summary at top: total hours (all time), this month, billable vs. non-billable.

Log table with columns: date, project, task, description, hours, billable.

"Log Time" button → slide-over: client pre-selected, project/task dropdowns populated from this client's data.

---

### 4.4 Global Task Queue (`/tasks`)

All tasks across all clients in one view.

**Default sort:** due_date ASC, then priority DESC

**Filters:**
- Client (multi-select)
- Status
- Priority
- Due date range
- Scope creep only toggle

**Bulk actions:** Mark complete, change priority, reassign to project

**Quick add:** Floating input at top — "Add task for [client dropdown]"

---

### 4.5 Pipeline (`/pipeline`)

**Layout:** Kanban board by stage (columns: Lead → Contacted → Discovery → Proposal → Negotiation → Won → Lost)

Each card shows:
- Name / Company
- Estimated value
- Probability
- Expected close date
- Platform notes (key detail for conversion context)
- Next action + date

Drag to move between stages.

"Add Prospect" button → slide-over form.

Won → triggers prompt: "Convert to active client?" → pre-populates a new client form.

Pipeline summary bar: total pipeline value, weighted value (value × probability), count by stage.

---

### 4.6 Time Dashboard (`/time`)

**Summary:** This week / this month / all time — total hours, billable hours, non-billable hours, estimated revenue (hours × rates or retainer)

**Chart:** Hours by client (bar chart, last 30 days) — use Recharts

**Log table:** All logs sortable by date, client, project, billable status

**Quick log form** always visible at top of page

---

### 4.7 Settings (`/settings`)

- Display name
- Default hourly rate
- Default timezone
- Notification preferences (future: email reminders for follow-ups and renewals)
- Export data (JSON export of all tables)

---

## 5. Key UX Patterns

### 5.1 Slide-overs (not modals or new pages)

All "create" and "edit" actions open in a right-side slide-over panel (Sheet component from shadcn). This keeps context visible — the user never loses their place.

### 5.2 Inline editing

Health score, status, tags, and task status should be editable inline without opening a form. Use click-to-edit patterns.

### 5.3 Auto-save for long-form fields

Client notes, architecture notes, and known issues should auto-save on blur (Supabase upsert on blur event).

### 5.4 Relative dates

All dates shown as relative ("3 days ago", "due tomorrow") with absolute date on hover tooltip.

### 5.5 Empty states

Every list view needs a thoughtful empty state with a clear action — not just a blank page.

### 5.6 Keyboard shortcuts (nice to have, implement last)

- `c` → New client
- `t` → New task
- `l` → Log communication
- `/` → Global search

---

## 6. Visual Design

### Color system

```css
--bg-base: #0f1117;         /* near-black */
--bg-surface: #1a1d27;      /* card background */
--bg-elevated: #22263a;     /* hover/selected state */
--border: #2e3347;
--text-primary: #e8eaf0;
--text-secondary: #8b91a8;
--text-muted: #555b72;
--accent: #5b7cfa;          /* primary blue */
--accent-hover: #7494fc;
--success: #34d399;
--warning: #fbbf24;
--danger: #f87171;
--info: #60a5fa;
```

### Health score colors

| Score | Label | Color |
|---|---|---|
| 1 | Critical | `#f87171` (red) |
| 2 | At Risk | `#fb923c` (orange) |
| 3 | Stable | `#fbbf24` (yellow) |
| 4 | Good | `#34d399` (green) |
| 5 | Excellent | `#60a5fa` (blue) |

### Status badge colors

| Status | Color |
|---|---|
| active | green |
| maintenance | blue |
| at_risk | orange |
| paused | yellow |
| churned | red |
| prospect | purple |

### Typography

- Font: `Geist` or `IBM Plex Mono` for a dev-native feel
- Import from Google Fonts or use Next.js font optimization
- Monospace for code snippets, tech stack tags, URLs

### Layout

- Dark theme only
- Left sidebar navigation (collapsed to icons on small screens)
- Max content width: 1280px
- Sidebar width: 240px expanded, 56px collapsed

---

## 7. Implementation Order

Implement in this sequence to have a usable app at each stage:

**Stage 1 — Foundation**
1. Supabase project setup + schema creation (all tables from Section 2)
2. Next.js project scaffold with Tailwind + shadcn/ui
3. Supabase auth (magic link)
4. Basic layout: sidebar nav + page shell

**Stage 2 — Core Client Management**
5. Client list page (read + create)
6. Client detail page with Overview tab
7. Systems tab
8. Quick communication log (most-used feature)

**Stage 3 — Work Management**
9. Projects + tasks (client detail tab)
10. Global task queue
11. Time logging

**Stage 4 — Intelligence Layer**
12. Dashboard (command center)
13. Pipeline (kanban)
14. Decisions log

**Stage 5 — Polish**
15. Search (global)
16. Filters across all list views
17. Export
18. Keyboard shortcuts

---

## 8. Supabase Setup Notes

- Enable Row Level Security (RLS) on all tables
- Since this is single-user, the RLS policy is simply: `auth.uid() is not null`
- Create a single Supabase project named `sauma-crm`
- Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars
- For server-side queries (RSC), also set `SUPABASE_SERVICE_ROLE_KEY`
- Generate TypeScript types after schema is created:
  ```bash
  npx supabase gen types typescript --project-id [project-id] > lib/supabase/database.types.ts
  ```

---

## 9. Key Files to Create First

```
.env.local                           → Supabase keys
lib/supabase/client.ts               → createBrowserClient()
lib/supabase/server.ts               → createServerClient()
lib/supabase/database.types.ts       → generated types
app/layout.tsx                       → root layout with sidebar
app/dashboard/page.tsx               → command center
components/crm/HealthBadge.tsx       → reused everywhere
components/crm/StatusBadge.tsx       → reused everywhere
supabase/migrations/001_init.sql     → full schema from Section 2
```

---

## 10. Out of Scope (v1)

These are intentionally excluded from v1 to keep scope manageable:

- Email/calendar sync (can add later via Gmail MCP)
- Client-facing portal
- Automated reminders / notifications
- Multi-user / team access
- Mobile app
- Invoice generation (track values only, not invoicing)

---

*End of specification. This document is the single source of truth for Claude Code implementation of Sauma CRM v1.*
