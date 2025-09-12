Awesome — here’s a single, **full instruction set** you can drop into your repo as a no-code README for teammates/Cursor to execute. It merges the **Client Dashboard**, **Onboarding**, and the **Background AI Agent (Cursor)** automation. No obvious fluff, just the exact pieces and order.

---

# 📖 WebRend — Client Delivery System (Dashboard + Onboarding + Background AI Agent)

## Scope

Role-gated **Client Dashboard** at `/dashboard/client` that:

* Onboards a client (domain + description)
* Automates domain → Cloudflare → Vercel
* Generates milestones via AI
* Prices milestones using WebRend’s **72× raw cost** model
* Creates Stripe products/prices/payment links
* Provisions a GitHub repo in `webrendhq`, attaches a **Cursor** background agent, and continuously ships work
* Surfaces everything in a clean dashboard (milestones, updates, meetings, docs, staging, analytics)

**Keep portfolio/case-study data separate**: portfolio stays in `projects/*`; client delivery lives in `engagements/*`.

---

## 1) Routing, Navbar, Middleware

**Routes**

* Dashboard: `app/dashboard/client/page.tsx`
* Onboarding: `app/dashboard/client/onboarding/page.tsx`

**Navbar**

* Show “Client Dashboard” only when `users/{uid}.role === "client"` (admins/devs may see it via internal link).

**Middleware**

* Match: `/dashboard/:path*`
* Requirements:

  * Auth required
  * Fetch minimal role server-side (session/JWT/custom claim/read)
  * If role ≠ `client` (and not admin/dev override) → redirect `/`
  * If client and onboarding **incomplete** for their active engagement → redirect `/dashboard/client/onboarding`
  * Block dashboard until an `engagementId` exists or onboarding finishes

---

## 2) Data Model (Firestore)

**Users**
`users/{userId}`

* `role: "client" | "admin" | "dev"`
* `displayName, email`

**Engagements (client delivery canonical)**
`engagements/{engagementId}`

* `clientId` (uid)
* `name`
* `status` (`"onboarding" | "active" | "paused" | "completed"`)
* `domain?`
* `cloudflareZoneId?`
* `vercelProjectId?`
* `cursorAgentId?`
* `githubRepo: { org: "webrendhq", name, url }?`
* `createdAt`

**Subcollections under each `engagements/{id}`**

* `milestones/{milestoneId}`

  * `title, description`
  * `status: "pending" | "in_progress" | "ready" | "paid" | "blocked"`
  * `tasks: [{ id, title, status: "todo"|"doing"|"done", assignee?, dueAt? }]`
  * `timeline: { startAt?, targetEndAt? }`
  * `pricing: { currency, rawCost, multiplier: 72, amount }`
  * `stripe: { productId?, priceId?, paymentLinkUrl? }`
  * `approvals: { clientApproved: boolean, approvedAt? }`
  * `order: number`
* `updates/{updateId}`

  * `type: "github" | "deployment" | "note" | "system"`
  * `summary`
  * `detail?`
  * `sourceRef?` (PR/commit/deploy/id)
  * `createdAt`
* `meetings/{meetingId}`

  * `startsAt, endsAt, title, link, recap?, attachments?`
* `links/{linkId}`

  * `type: "staging" | "preview" | "production" | "design" | "doc" | "api"`
  * `label, url, environment?`
* `docs/{docId}`

  * `title, url, type: "contract" | "agreement" | "spec" | "invoice" | "receipt"`
  * `signed?: boolean`
* `analytics/{dayKey}`

  * `date, pageViews, uniqueVisitors, requests, bandwidthMB, errorRate, notes?`
* `flow/{versionId}`

  * `nodes: [...], edges: [...], updatedAt`

**Indexes (describe only)**

* engagements by `clientId, status, createdAt`
* milestones by `status`, ordered `order`
* updates by `createdAt DESC`
* meetings by `startsAt`
* analytics by `date`

---

## 3) Onboarding (Blocking; pre-dashboard)

**Step A — Capture**

* Required: **project description**
* Optional: **domain** (e.g., `example.com`) + consent to automate DNS setup

**Step B — Domain Automation (if domain provided)**

* Detect registrar/NS → add zone to **Cloudflare**
* If NS ≠ Cloudflare:

  * Store required CF nameservers
  * Show top-banner “Pending Nameserver Update”
  * Poll (or scheduled check) until verified
* After NS verified:

  * Create required DNS records for **Vercel**
  * Link domain to **Vercel project**
  * Save `cloudflareZoneId`, `vercelProjectId`, `domain` on engagement
  * Post `updates`: “Domain connected to Cloudflare & Vercel”

**Step C — Milestone Generation (AI)**

* Input: project description + your house build context
* Output: 4–8 milestones, each with:

  * Title + short rationale
  * 5–12 tasks with dependencies
  * Estimated timeline
  * Observability/Analytics milestone
  * Launch/UAT milestone
  * (If domain connected) Production cutover/handover milestone
* Persist milestones under `engagements/{id}/milestones` with `order`

**Onboarding Exit**

* Create/ensure `engagementId`
* If domain NS is pending, permit dashboard access but keep a persistent banner with status/help
* Redirect to `/dashboard/client`

---

## 4) Dashboard (Client-facing)

**Primary cards**

1. **Checklist / Milestones**

   * Collapsible items, % complete from tasks
   * Dates, price, status
   * Actions: client approve → sets milestone to review/ready state (PM final gate)

2. **Recent Updates**

   * GitHub commits/PRs, deploy events, system notes (new repo, agent attached, pricing prepared)

3. **Meetings**

   * Upcoming calls + link to scheduler; past recaps with attachments

4. **Flow Diagram**

   * Read-only React Flow; node tooltips link to repo/docs; “Last updated X”

5. **Staging Links**

   * Preview, Staging, Production (auto or curated)

6. **Contracts & PDFs**

   * Contracts list with status; open PDFs in modal; executed copies stored here

7. **Payments**

   * Milestones table (Title, Amount, Status, Action)
   * If `status="ready"` → show Stripe **Pay Now**
   * On webhook success → set `paid`, add invoice/receipt to `docs`, post update

8. **Analytics (Cloudflare)**

   * Visitors, Page Views, Requests, Bandwidth, Error Rate
   * 7/30-day trend

**Global banners**

* Domain NS pending
* Overdue payment
* Blocked milestone (dependency)

---

## 5) Automations & Integrations

**Stripe**

* Trigger: PM toggles milestone **ready** (or client approve → PM confirm)
* Create **Product/Price/Payment Link** per milestone
* Email “Milestone Ready”
* Webhook on success → `milestone.status = "paid"`, attach invoice/receipt in `docs`, post update

**Email (transactional)**

* Onboarding complete
* NS pending (48h reminders)
* Milestone ready (amount + CTA)
* Payment received (receipt + what unlocks next)
* Meeting recap (summary + links)

**GitHub**

* Webhooks: push/PR/deploy → summarize to `updates`
* (Optional) Issue templates reflect milestone/task structure

**Vercel**

* On deployment: update `links` + post `updates`

**Cloudflare Analytics**

* Nightly job: write stats to `analytics/{dayKey}` (90–180 day rolling)

---

## 6) Background AI Agent (Cursor) — Post-Onboarding

**Trigger:** `OnboardingCompleted(engagementId)`
**Runner:** server job (idempotent)
**Outputs:** GitHub repo, Cursor agent linked, pricing computed, Stripe objects created, dashboard updated

### 6.1 GitHub Provisioning

* Derive repo name from domain (e.g., `acmeco.com` → `acmeco`; fallback suffix on collision)
* Create **private** repo in `webrendhq` with protected `main`
* Seed:

  * `README.md` (client charter)
  * `AGENTS.md` (milestones overview & working norms)
  * `.cursor/rules` (tech choices, constraints, tool permissions)
  * `workflow_state.md` (checkpoint doc for agent to summarize progress)
  * Minimal scaffold per stack
* Add webhooks to your backend → write `updates` items
* Save repo metadata on engagement

### 6.2 Attach Cursor Background Agent

* Start a **headless agent** bound to the repo (or create via web and store its ID)
* Bootstrap instruction (conceptual, not code):

  * Read charter, milestones, workflow state
  * Create branches/PRs per task
  * Keep PRs small, run checks/tests, push daily progress notes (write to `updates`)
  * Use MCP tools to: post updates, create links, push docs, request PM approvals
* Store `cursorAgentId` on engagement
* Post `updates`: “Cursor agent attached”

### 6.3 Estimate Usage → Price (72×)

For each milestone:

* Estimate **agent-minutes** per task (S=\~20m, M=\~60m, L=\~120m; tune per house template)
* Convert to **model/agent cost** (token or agent-minute rate assumption)
* Add **human review/QA** buffer and **infra/CI** minutes
* `rawCost = model + human + infra`
* `amount = round( rawCost × 72 )`
* Persist `pricing` on milestone (`rawCost`, `multiplier: 72`, `amount`)

### 6.4 Stripe Products/Prices/Payment Links

Per milestone:

* Create Product (name: `ENG-{shortId}: {MilestoneTitle}`), metadata: `engagementId`, `milestoneId`
* Create one-time Price (currency, `amount`)
* Create Payment Link (email collection on)
* Persist `stripe.productId/priceId/paymentLinkUrl` in milestone
* Post `updates`: “Milestone pricing prepared”
* **Do not** set `ready` automatically; PM reviews first

### 6.5 Continuous Build Loop

* Agent pulls open tasks → branch/PR per task
* CI gates; on fail → retry; if blocked → agent posts `updates` asking for input
* Merges increment milestone completion %
* When all tasks done → agent proposes `ready`; PM confirms → Stripe **Pay Now** visible
* On payment success → `paid` + invoice to `docs` + update post

**Reliability**

* Idempotent repo/create/Stripe steps (store keys; reuse on retry)
* Health checks: if agent idle N minutes → restart & log update

---

## 7) Pricing Model (explicit)

* **WebRend formula**: `Final Milestone Price = round(72 × Raw Cost)`
* **Raw Cost** components:

  * Agent/model usage (per agent-minute or token price assumption)
  * Human code review/QA hours (internal rate)
  * Infra/CI/build minutes (Vercel/runner)
* Persist `rawCost` and `multiplier` for audit; never expose raw cost to client UI

---

## 8) Security & Permissions

* Clients: read/write only within their `engagements/{id}`; cannot see other clients or internal repos
* Admin/Dev: full access, admin UI controls hidden from clients
* Store GitHub/Stripe/Cloudflare/Vercel/OpenAI/Cursor creds server-side only
* Verify all webhook signatures
* Log audit events to `updates` for milestone state changes, payments, agent restarts, domain automation

---

## 9) Observability & Monitoring

* Track onboarding failures (CF/Vercel/OpenAI)
* Track agent health (idle/error), GitHub/Vercel webhook errors, Stripe webhook errors, Cloudflare analytics fetch errors
* Alerts:

  * Payment webhook failure
  * Domain automation failure
  * Agent idle > threshold
  * Analytics gaps > 48h

---

## 10) Acceptance Criteria (system-level)

* Middleware prevents non-clients from accessing `/dashboard/client`
* Onboarding creates an **engagement** and milestones; domain connects or shows NS pending banner
* Post-onboarding job:

  * GitHub repo created & saved
  * Cursor agent attached & saved
  * Milestones priced with **72×** model
  * Stripe objects created & saved on milestones
  * Updates posted for each event
* Dashboard:

  * Milestones list + amounts; **Pay Now** only when `ready`
  * Stripe payment → `paid` within 1 min; invoice stored in `docs`
  * GitHub pushes/PRs/deploys visible in **Updates**
  * Contracts render in modal
  * Staging links valid
  * Analytics tiles populate daily

---

## 11) Admin Controls (hidden from clients)

* Regenerate milestones (AI)
* Edit pricing / toggle `ready`
* Re-issue Stripe link
* Post manual update
* Upload contracts; mark signed
* Refresh Cloudflare/Vercel states
* Restart Cursor agent

---

## 12) Migration (if any client ops data lives in `projects/*`)

* Freeze writes to client ops under `projects/*`
* Export & reinsert to `engagements/*`
* Point webhooks and UI to `engagementId`
* QA payments, updates, docs, analytics on one engagement, then flip all

---

## 13) State Machines (concise)

**Milestone.status**

* `pending` → work not started
* `in_progress` → active PRs/commits exist
* `blocked` → external dependency
* `ready` → PM confirmed, payment link visible
* `paid` → Stripe success webhook processed

**Task.status**: `todo` → `doing` → `done`

**Engagement.status**: `onboarding` → `active` → (`paused` | `completed`)

---

## 14) Notification Triggers (subjects only)

* Onboarding complete → “Welcome to your WebRend dashboard”
* NS pending → “Action needed: update nameservers to complete domain setup”
* Milestone ready → “Milestone ‘{title}’ is ready — review & pay securely”
* Payment received → “Payment received for ‘{title}’ — here’s your receipt”
* Meeting recap → “Recap: {meeting title} — next steps inside”

---

## 15) Task Order (for Cursor to execute)

1. **Routes & Middleware**

   * Add `/dashboard/client` + `/dashboard/client/onboarding`
   * Add `/dashboard/:path*` to middleware; role gate; onboarding redirect

2. **Data Model**

   * Create `engagements/*` + subcollections; add indexes

3. **Onboarding**

   * Capture description/domain → Cloudflare zone → Vercel connect
   * Generate milestones (AI) → Firestore

4. **Dashboard UI**

   * Milestones, Updates, Meetings, Flow, Staging, Docs, Payments, Analytics
   * Global banners and empty states

5. **Stripe Integration**

   * Webhooks verified; per-milestone Product/Price/Payment Link; `ready` → email → webhook → `paid` + docs

6. **GitHub/Vercel/Cloudflare**

   * Webhooks: commits/deploys → updates; analytics nightly

7. **Background AI Agent (Cursor)**

   * Create repo in `webrendhq`; seed files; protect main; save on engagement
   * Attach agent; save `cursorAgentId`
   * Agent loop: branches/PRs, updates, proposes `ready`

8. **Pricing Engine**

   * Estimate raw cost per milestone; apply **72×** multiplier; persist

9. **Admin Controls**

   * Hidden actions for PM/developers

10. **QA vs Acceptance Criteria**

    * Run through end-to-end on a test engagement

---

## 16) Data Contract (fields you must write/read)

**engagements/{id}**

* `clientId, name, status, domain?, cloudflareZoneId?, vercelProjectId?, cursorAgentId?, githubRepo?{org,name,url}, createdAt`

**…/milestones/{id}**

* `title, description, status, tasks[], timeline{}, pricing{currency, rawCost, multiplier, amount}, stripe{productId, priceId, paymentLinkUrl}, approvals{clientApproved, approvedAt}, order`

**…/updates/{id}**

* `type, summary, detail?, sourceRef?, createdAt`

**…/links/{id}**

* `type, label, url, environment?`

**…/docs/{id}**

* `title, url, type, signed?`

**…/analytics/{dayKey}**

* `date, pageViews, uniqueVisitors, requests, bandwidthMB, errorRate, notes?`

**Stripe Product/Price metadata**

* `engagementId, milestoneId`

---

## 17) Failure Handling & Idempotency

* **Repo creation**: if name taken, suffix `-1`, `-2`…; save final name
* **Agent attach**: retry with fresh auth; on repeated failure, flag admin and post `updates`
* **Stripe**: use idempotency keys; reuse existing product/price/link if present
* **Domain**: if NS not updated in 7 days, auto-email escalation and keep banner
* **Analytics**: if fetch fails, backfill on next run; mark a gap in `updates`

---

that is the complete plan