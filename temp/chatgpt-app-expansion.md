Got it, Simeon. Below is a Kevin‑informed specification for each module you listed—written as build documentation + component guidance. I’m going to treat Kevin’s preferences as hard constraints where applicable (especially: Dominant-driven system, self-declared submissive state, transparency-by-default, “don’t obey the app,” and “no autopilot”).

Global first-principles constraints from Kevin
These apply everywhere:

Authority routing: Kevin obeys you, not the app. The app is a conduit + memory + structure, never the authority.

Dominant-driven execution: Tasks/discipline/rewards should be authored or explicitly approved by you. AI can draft; you approve.

Self-declared state: Kevin sets Active / Low‑Energy / Paused (Paused Play). App never infers.

Transparency default: Kevin prefers you can see everything by default (no hidden thoughts/ideas).

Anti-autopilot: The system must periodically demonstrate your presence (e.g., occasional new task, deliberate feedback, “hand-authored” touches).

Low-friction UX: If using the app becomes harder than not using it, Kevin will stop.

1) Bonds
Purpose
A high-level “relationship constitution” layer: identity, roles, symbolism, and what the dynamic means to both of you.

Kevin-informed requirements
Must reinforce your leadership presence (not a sterile profile page).

Must be stable and readable—Kevin likes predictable “grounding anchors.”

UX / Components
Bond Overview Card: “What this dynamic is for” (short, stable text).

Roles & Titles: role names, honorifics, allowed language, tone presets.

Symbols of Bond: ritual objects, recurring ceremonies, “why” statements.

Bond Moments Log (optional): intentional moments you mark as meaningful.

Data / Implementation notes
bonds table: mission, roles, tone rules, display settings.

Realtime: update bond display instantly when you adjust framing.

2) Rules & Protocols
Purpose
Turn agreements into clear expectations without ambiguity.

Kevin-informed requirements
Predictable routines are core.

Occasional new tasks are reassurance (proof he’s not forgotten).

Protocol should never feel like “obeying a checklist” more than obeying you.

UX / Components
Protocol Today (Primary): the daily ritual list (fast clarity <10 seconds).

Protocol Library: recurring rituals, categorized (morning, office, evening, etc.).

“New from Simeon” banner (important): highlights an intentionally authored addition.

Expectation Detail Drawer: instructions + acceptance criteria + “why it matters.”

Data / Engine
Protocol definitions + schedule rules → daily instances.

Realtime: live completion visibility (if you want) without nagging Kevin.

Edge / Realtime
Edge function: generate_daily_protocol(workspace_id, date)

Realtime subscription: protocol_instance_items for both clients.

3) Boundaries
Purpose
Keep consent and safety legible, not implied.

Kevin-informed requirements
Boundary system must support “pause play” and honest check-in.

App must never infer readiness.

UX / Components
Boundaries Ledger: hard limits, soft limits, “requires discussion,” and notes.

Pause Play Button (always visible): triggers immediate non-play mode.

Boundary Change Proposals: proposed → discussed → accepted, with history.

Data
boundaries + boundary_versions (optional) or embed in covenant version.

pause_events unified with “Paused Submission/Play.”

4) Contract & Consent
Purpose
The Covenant. Versioned, acknowledged, never silently changed.

Kevin-informed requirements
Change must be visible and acknowledged.

Paused state must disable sexualized tone + task expectations.

UX / Components
Active Covenant View: readable sections, not overwhelming.

Version Timeline: clear “what changed” and who authored.

Acknowledgement Panel: who has acknowledged current version.

Review Cadence Widget: scheduled renegotiation.

Implementation
covenant_versions, acknowledgements

Edge function: activate_covenant_version(version_id) (admin-only)

Realtime: covenant status changes propagate immediately.

5) Communication
Purpose
Structure communication without replacing it—especially around “off” moments.

Kevin-informed requirements
Three check-in triggers:

scheduled alignment check

after scenes/new things

if something feels off → pause play

Kevin prefers openness; you can see everything by default.

UX / Components
Signal: “Pause Play / Need Honest Talk” (instant, prominent)

Check-in Module:

quick state selector (Active / Low / Paused)

optional note (“what I need”)

Feedback Composer (Simeon):

requires “thoughtful framing,” not generic praise

can use AI draft, but clearly labeled “Draft — Simeon edits”

Conversation Threads (optional): “praise / correction / alignment / repair”

AI guardrails
AI can draft phrasing that preserves hierarchy + intention.

Output must always be editable and explicitly “from Simeon.”

6) Tasks
Purpose
Your authored structure in executable form.

Kevin-informed requirements
Tasks should feel like your intent, not automation.

Low-energy mode: fewer tasks, fewer choices, clearer instructions.

On very low energy: Kevin may need a night off (paused).

UX / Components
Task Assign (Simeon):

instruction, acceptance criteria, time window

“tone tag” (strict, ceremonial, corrective, neutral)

Task Execute (Kevin):

single-screen clarity

completion note (optional)

request exception (no guilt)

Task Load Governor:

if Kevin is Low-energy: default reduces quantity and removes optional branches

if Paused: disable assignments (or queue drafts only)

Data
tasks (definitions) + task_instances (daily)

Realtime updates for completion.

7) Rewards
Purpose
Relational reinforcement, not points-for-points.

Kevin-informed requirements
Rewards should reinforce hierarchy and permission-based submission.

He explicitly values rewards that are symbolic of your superiority (note: keep the app non-explicit in UI language if you prefer, but allow private coding).

UX / Components
Reward Menu (Simeon-defined):

“permission rewards” (allowed acts, ceremonies)

“privilege rewards” (access, closeness, ritual)

Grant Reward (Simeon action): explicit “granted by Simeon”

Reward Ledger: history of granted rewards (and why)

Implementation
rewards, reward_grants

Optional “private labels” if you want discreet naming.

8) Achievements
Purpose
Track consistency without shame.

Kevin-informed requirements
He can track checkmarks himself; achievements should not replace your attention.

Achievements must not create “autopilot” feeling.

UX / Components
Milestones that are Simeon-authored (important):

“I am setting this standard for you.”

Consistency Badges (optional, quiet)

Presence Achievements: achievements that reflect your engagement:

“New ritual authored this month”

“3 thoughtful feedback notes delivered”

This flips achievements from “system congratulates you” → “Simeon recognizes you.”

9) Calendar
Purpose
Make structure predictable: rituals, reviews, and planned dynamics.

Kevin-informed requirements
Predictability is grounding.

Reviews should be scheduled.

After-scene check-ins should be optionally scheduled.

UX / Components
Ritual Calendar Overlay: recurring routines

Review Events: renegotiation cadence

Scene/Intensity Markers (optional, discreet labeling)

“Aftercare Check-in” event template

Automation
n8n: weekly reminders, upcoming review prompts.

Edge: generate recurring events into instances.

10) Journal
Purpose
Reflection and memory—without hiding from you.

Kevin-informed requirements
Transparency by default (he doesn’t want to hide thoughts).

Journaling should feel like devotion/record, not therapy homework.

UX / Components
Daily Reflection Prompt (optional)

Shared Journal Default (with optional “private” if you ever mutually want it)

“From Simeon” prompt drops: you can occasionally assign a reflection prompt (presence)

AI
AI proposes reflection prompts; Kevin writes.

AI can summarize for review, but only with explicit consent and “draft” labeling.

11) Analytics
Purpose
Insight without turning obedience into KPI pressure.

Kevin-informed requirements
Avoid shame mechanics.

Analytics should support your leadership decisions, not “judge Kevin.”

UX / Components
Leadership Dashboard (Simeon):

completion patterns

low-energy frequency

pause events frequency

“novelty cadence” (how often you authored a new task)

Kevin View (minimal):

simple “consistency rhythm”

no red/green scoring feel

Guiding rule
Analytics should answer: “How can Simeon lead better?” not “How is Kevin performing?”

12) Library & Guides
Purpose
A Dominant-facing “playbook” and shared education space.

Kevin-informed requirements
He explicitly wants a place where you explore your Dominant/controlling energy.

This should empower you with ideas, framing, and examples—without the app taking over.

UX / Components
Simeon’s Guidebook (private area)

“dominant energy prompts”

example feedback scripts (hierarchy-consistent, non-generic)

“discipline decision tree” (context-sensitive)

Shared Guides (optional)

consent practices

renegotiation templates

aftercare guides

Notion + Sync
Notion is ideal CMS for guides/prompts → sync into Supabase for in-app reading.

Cross-cutting “Kevin Preference” features you should treat as core
These are not optional polish—they’re central to adoption:

Self-declared State Control (Kevin): Active / Low-energy / Paused

Pause Play = Pause Submission: one unified mechanism

Simeon Presence Signals:

occasional new task authored

thoughtful feedback composer

“from Simeon” prompts/messages

Low-friction Kevin UX: quiet, simple, minimal screens

Simeon Control Surface: where intention is authored and delivered

If you want the next step, I’ll produce the actual build artifacts
I can generate, module by module:

PRD pages (Notion-ready) for each section above

Supabase schemas (tables + RLS) per module

Component list (shadcn pages, dialogs, cards)

Realtime channels and Edge function map

n8n workflow set tied to each module

Tell me which order you want to build (typical spine is: Contract/Consent → State/Pause → Protocol/Tasks → Communication → Rewards → Calendar → Journal → Analytics → Library).