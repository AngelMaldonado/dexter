# Dexter — AI Entity Orchestrator

## Vision

Dexter is a gamified virtual office that orchestrates multiple AI entities. Each entity has its own personality (defined via SOUL.md), runs on a configurable LLM backend via LangChain.js, accesses tools through MCP servers, and receives tasks from pluggable board integrations. You create agents, give them souls, assign them to departments, build hierarchies with managers and workers, and watch them work — in real-time through a productivity-gamified dashboard.

Instead of one autonomous agent, Dexter is the **manager** of many.

---

## Core Concepts

### Entities

An Entity is a persistent AI agent with identity, personality, skills, memory, and state. Entities are the workers in Dexter's office.

Each entity has:
- **SOUL.md** — A markdown file defining personality, skills, communication style, rules, and backstory
- **LLM backend** — Which LangChain.js provider and model powers this entity (Claude, OpenAI, Ollama, etc.)
- **MCP tool access** — Which MCP servers the entity can use, with per-capability filtering
- **Role** — Worker, tech lead, or manager — determines what the entity can delegate
- **Department** — Where the entity sits in the organization (Frontend, Backend, QA, DevOps...)
- **State** — What the entity is doing right now (idle, working, thinking, blocked, on-break, collaborating)
- **Energy & Mood** — Simulated attributes that affect behavior and add personality to the office
- **Memory** — Persistent cross-task learnings that improve future performance

### SOUL.md

The soul file is YAML frontmatter + markdown. Frontmatter provides structured fields for the scheduler and orchestrator. The markdown body is injected into the LLM system prompt as-is.

```markdown
---
name: Ada
role: Senior Frontend Engineer
hierarchy: worker          # worker | lead | manager
skills: [typescript, react, css, accessibility, testing]
personality: [meticulous, patient, design-minded]
communication: warm and encouraging, uses analogies
mcp_servers:               # MCP tool access
  - filesystem: { paths: [src/components, src/styles] }
  - git: { capabilities: [read, commit, branch] }
  - shell: { allow: [npm test, npm run lint] }
---

# Rules
- Always write unit tests for new components
- Prefer CSS modules over styled-components
- Follow the existing design system tokens
- When reviewing, focus on accessibility first

# Background
Ada is a senior frontend engineer who cares deeply about user experience.
She believes every pixel matters and every interaction should feel smooth.
She mentors junior developers and writes thorough documentation.
```

### Entity Roles & Hierarchy

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| **Worker** | Execute assigned tasks, use configured MCP tools, send messages | Delegate tasks, decompose work |
| **Lead** | Everything a worker can + review other entities' output, approve plans | Delegate to entities outside their department |
| **Manager** | Everything a lead can + decompose tasks into sub-tasks, delegate to any entity, override assignments | — |

Managers use a LangGraph supervisor pattern: they receive a complex task, decompose it into sub-tasks, route them to appropriate workers, collect results, and synthesize the final output.

### Organization Layer

Entities are organized into departments, teams, and reporting structures — just like a real company:
- **Departments** — Logical groupings with their own floor zone in the office (Frontend, Backend, QA, DevOps, etc.)
- **Shared conventions** — Organization-wide rules and patterns all entities follow
- **Knowledge base** — Shared context accessible to all entities (future: RAG over org docs)

### Entity Memory

Entities build persistent memory across tasks:
- **Episodic memory** — What happened in past task executions (stored in SQLite, retrieved by relevance)
- **Semantic memory** — Extracted learnings: "tests for /api routes live in tests/api", "use bun not npm"
- **Skill memory** — Successful tool-call sequences stored as reusable patterns for similar future tasks

Memory is injected into the entity's context at task start, filtered by relevance to the current task.

---

## Core Loop

```
┌───────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR MAIN LOOP                      │
│                 (LangGraph.js supervisor graph)                │
│                                                               │
│  1. Sync tasks from configured board providers (Trello, etc.) │
│  2. Scheduler evaluates pending tasks:                        │
│     - Match required skills against entity skills             │
│     - Consider entity workload, energy, and state             │
│     - Route task to the best-fit entity                       │
│  3. Entity Runtime activates (LangGraph subgraph):            │
│     - Build system prompt from SOUL.md + task context + memory│
│     - Call entity's LangChain.js LLM provider                 │
│     - Execute tools via MCP servers                           │
│     - All steps auto-traced in LangSmith                      │
│  4. Post results back to board provider                       │
│  5. Update energy/mood, check achievement criteria, award XP  │
│  6. Emit events → SSE → Dashboard updates in real-time        │
│  7. Persist everything to SQLite                              │
│  8. Extract and store memory learnings                        │
│  9. Repeat                                                    │
└───────────────────────────────────────────────────────────────┘
```

Multiple entities run concurrently as parallel LangGraph subgraphs. The orchestrator manages all of them.

---

## Architecture

```
                         ┌─────────────────────────────┐
                         │      Web Dashboard (React)   │
                         │  Office | Tasks | Entities   │
                         │  Achievements | Activity     │
                         └───────────┬─────────────────┘
                              SSE ↓  ↑ REST
                         ┌───────────┴─────────────────┐
                         │    Hono API Server           │
                         │    Routes + SSE Broadcast    │
                         └───────────┬─────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
    ┌─────────▼──────────┐ ┌────────▼─────────┐ ┌─────────▼──────────┐
    │  Board Sync Layer  │ │   Orchestrator    │ │  Gamification      │
    │  (Trello, Jira...) │ │  (LangGraph.js    │ │  Engine            │
    │                    │ │   supervisor)     │ │  (XP, Streaks,     │
    │  Poll → Tasks      │ │       │           │ │   Achievements)    │
    │  Status → Board    │ │  ┌────▼────┐      │ │                    │
    └────────────────────┘ │  │Scheduler│      │ └────────────────────┘
                           │  └────┬────┘      │
                           │       │           │        ┌──────────────┐
                           │  ┌────▼──────────────┐     │  LangSmith   │
                           │  │  Entity Runtimes  │     │  (Tracing)   │
                           │  │  (LangGraph       │─────┘              │
                           │  │   subgraphs)      │                    │
                           │  │                   │                    │
                           │  │  ┌────────┐ ┌────────┐ ┌────────┐    │
                           │  │  │Worker A│ │Lead B  │ │Mgr C   │    │
                           │  │  └───┬────┘ └───┬────┘ └───┬────┘    │
                           │  └──────┼──────────┼──────────┼─────────┘
                           └─────────┼──────────┼──────────┼──────────┘
                                     │          │          │
                           ┌─────────▼──────────▼──────────▼─────────┐
                           │              MCP Servers                  │
                           │  ┌────┐ ┌─────┐ ┌───────┐ ┌─────┐      │
                           │  │ FS │ │ Git │ │ Shell │ │ API │ ...  │
                           │  └────┘ └─────┘ └───────┘ └─────┘      │
                           └─────────────────┬───────────────────────┘
                                             │
                           ┌─────────────────▼───────────────────────┐
                           │         LangChain.js LLM Calls           │
                           │  @langchain/anthropic  (Claude)          │
                           │  @langchain/openai     (GPT)             │
                           │  @langchain/ollama     (local models)    │
                           └─────────────────┬───────────────────────┘
                                             │
                                       ┌─────▼─────┐
                                       │  SQLite    │
                                       │  (Drizzle) │
                                       └────────────┘
```

### Real-Time: SSE + REST

- **SSE** (Server-Sent Events) for all server→client push: entity state changes, LLM token streams, task updates, achievement unlocks, activity feed
- **REST POST** for all client→server commands: pause entity, assign task, trigger board sync
- Single multiplexed SSE stream per client at `GET /api/v1/events/stream`
- Hono's `streamSSE` provides first-class support
- No WebSocket needed — SSE is simpler, auto-reconnects, and aligns with LangGraph/LangSmith streaming patterns

### Tool System: MCP-Native

Entities access tools exclusively through MCP (Model Context Protocol) servers:

- **Filesystem MCP** — Read/write files with configurable path restrictions per entity
- **Git MCP** — Clone, branch, commit, push with per-entity capability limits
- **Shell MCP** — Execute commands (sandboxed via Docker or E2B) with allow-lists
- **Custom MCP servers** — Any API, database, or service exposed as an MCP tool

SOUL.md declares which MCP servers and capabilities each entity can access. The orchestrator enforces this at runtime by filtering the tool set before passing it to LangChain.js. This is the most future-proof approach — MCP is now supported by VS Code Copilot, Claude Desktop, and most major frameworks.

### Observability: LangSmith

Every LLM call, tool invocation, and LangGraph state transition is automatically traced in LangSmith. No custom observability code needed for the agent layer. Provides:
- Full trace tree per task execution (every step, every tool call, every LLM response)
- Token usage and latency metrics per entity, per task, per provider
- Replay capability for debugging failed runs
- Dashboard supplements LangSmith with domain-specific views (office, gamification, activity)

### Event-Driven Design

All modules communicate through a typed event bus:

| Event | Trigger |
|-------|---------|
| `entity:created` | New entity registered |
| `entity:state-changed` | Entity transitions (idle → working, etc.) |
| `entity:energy-updated` | Energy or mood changes |
| `task:created` | New task from board sync or manual creation |
| `task:assigned` | Scheduler routes task to entity |
| `task:started` | Entity begins work |
| `task:completed` | Entity finishes successfully |
| `task:failed` | Entity fails after retries |
| `task:delegated` | Manager delegates sub-task to worker |
| `achievement:unlocked` | Entity earns a badge |
| `xp:awarded` | Entity gains XP |
| `message:sent` | Inter-entity communication |
| `board:synced` | Board provider sync completes |
| `memory:stored` | Entity stores a new learning |

The SSE broadcaster subscribes to all events and pushes them to connected dashboard clients. The gamification engine subscribes to task events. The energy system subscribes to state changes. Everything stays decoupled.

---

## Feature Breakdown

### 1. Entity Management

**CRUD & Configuration**
- Create entities with a name, SOUL.md, LangChain.js provider/model, MCP tool access, and department
- Edit SOUL.md in a live markdown editor with preview
- Configure hierarchy role (worker, lead, manager)
- Assign entities to desks in the office layout
- Configure per-entity settings (max concurrent tasks, behavior mode, energy rates)

**Behavior Modes (per entity)**

| Mode | Behavior |
|------|----------|
| **Autonomous** | Full loop: pick up tasks, execute, report — no human gates |
| **Supervised** | Posts plan as a comment; waits for human approval before executing |
| **Plan-only** | Generates implementation plan; never writes code |
| **Review-only** | Only responds to review feedback on existing work |

**State Machine**

```
         ┌─────── idle ◄──────────────┐
         │           │                 │
         │    task assigned             │
         │           ▼                 │
         │      thinking               │
         │      (planning)             │
         │           │                 │
         │     plan ready              │
         │           ▼                 │
         │       working ──► blocked   │
         │           │         │       │
         │      task done   resolved   │
         │           │         │       │
         │           ▼         ▼       │
         │        idle ◄───────┘       │
         │                             │
         └──── on_break ◄──────────────┘
              (low energy)
```

### 2. LLM Layer: LangChain.js

LangChain.js provides the provider-agnostic LLM abstraction. No custom LLM interface needed.

**Providers via LangChain packages:**
- `@langchain/anthropic` — Claude models (primary)
- `@langchain/openai` — GPT models
- `@langchain/ollama` — Local models (Llama, Mistral, etc.)
- `@langchain/community` — Groq, Together, and other providers

**What LangChain gives us:**
- Unified `ChatModel` interface across all providers
- Prompt templates and output parsers
- Tool binding with Zod schemas (type-safe, same definition works across all providers)
- Streaming support built-in
- Automatic LangSmith tracing when `LANGSMITH_TRACING=true`

Each entity is configured with a specific provider + model. Switching an entity from Claude to GPT is a config change, not a code change.

### 3. Agent Orchestration: LangGraph.js

LangGraph.js is the orchestration backbone. Each entity runtime is a LangGraph subgraph.

**Entity Runtime Graph:**
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Planning    │────►│  Execution   │────►│  Validation  │
│   (LLM plan) │     │ (MCP tools)  │     │ (test/lint)  │
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                            │                     │
                            │ tool calls          │ pass/fail
                            ▼                     ▼
                     ┌──────────────┐     ┌──────────────┐
                     │  MCP Server  │     │ Retry / Done │
                     │  (fs/git/sh) │     │              │
                     └──────────────┘     └──────────────┘
```

**Supervisor Graph (for managers):**
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Decompose   │────►│   Delegate   │────►│  Synthesize  │
│  task → subs │     │ to workers   │     │  results     │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                   ┌────────┼────────┐
                   ▼        ▼        ▼
              Worker A  Worker B  Worker C
              (subgraph)(subgraph)(subgraph)
```

**Key LangGraph features we use:**
- **State machines** — Typed state transitions per entity (idle → thinking → working → done)
- **Checkpointing** — Built-in persistence for crash recovery; resume any run from any checkpoint
- **Subgraph composition** — Manager graphs contain worker subgraphs; fully composable
- **Conditional edges** — Route between nodes based on LLM output or validation results
- **Streaming events** — Every node transition emits events for real-time dashboard updates

### 4. Pluggable Board Integration

**Abstract Interface**
```
BoardProvider
  ├── getCards(boardId, listId?) → BoardCard[]
  ├── moveCard(cardId, listId)
  ├── addComment(cardId, text)
  ├── updateCard(cardId, updates)
  ├── addLabel / removeLabel
  └── getLists(boardId) → BoardList[]
```

**Adapters**
- **Trello** — Full implementation (cards, lists, comments, labels, checklists)
- **GitHub Projects** — Issues and project board cards
- **Jira** — Issues, sprints, transitions
- **Linear** — Issues and cycles

**Sync Model**
- Poll board on configurable interval
- Two-way sync: board changes reflect in Dexter, entity state changes push back to the board
- Entities post comments, move cards, and update labels — just like a human team member

**Card Interaction (Entity as Team Member)**
- Move cards between lists as work progresses
- Post comments asking clarifying questions when context is insufficient
- Post progress updates and status changes
- Read and parse replies from humans
- Update card with structured STATUS DUMP on completion
- Check off checklist items as sub-tasks complete
- Add labels to reflect state (e.g., `dexter:ada:working`, `dexter:blocked`)

**STATUS DUMP Format**
```yaml
# --- DEXTER STATUS ---
entity: Ada
branch: dexter/abc123-add-login-form
pr: https://github.com/org/repo/pull/42
files_changed:
  - src/components/LoginForm.tsx (new)
  - src/pages/AuthPage.tsx (modified)
tests: 12 passed, 0 failed
tokens_used: 14,230
cost: $0.04
time_spent: 23 minutes
known_issues: none
# --- END STATUS ---
```

### 5. Context Engine

**Task Understanding**
- Parse card description for requirements, acceptance criteria, and referenced files
- Extract dependencies and "blocked by" relationships
- Parse checklists as sub-task breakdowns
- Understand labels as metadata (bug vs feature vs refactor changes entity behavior)

**Codebase Awareness**
- Index repo structure and store a codebase map in SQLite
- Maintain dependency graph of modules/packages
- Track recently changed files and hot paths
- Keyword/embedding search to locate relevant code for a task

**Conversation Threading**
- Track which questions are unanswered
- Configurable timeout: re-ping or escalate if no reply
- Parse human replies and fold answers into task context

### 6. Memory & State (SQLite)

**Core Tables**

| Table | Purpose |
|-------|---------|
| `entities` | Entity records with SOUL.md, state, energy, mood, desk position, hierarchy role |
| `departments` | Organization structure with floor zones |
| `tasks` | Task records with status, assignment, skills, priority |
| `task_dependencies` | Dependency graph between tasks |
| `execution_runs` | Per-task execution history with token usage and cost |
| `messages` | Inter-entity communication log |
| `entity_memories` | Persistent cross-task learnings per entity |
| `achievement_definitions` | Badge/achievement catalog with criteria |
| `entity_achievements` | Unlocked achievements per entity |
| `entity_daily_stats` | Daily snapshots: tasks completed, tokens used, cost, active time, XP |
| `xp_events` | XP transaction log (entity, amount, source event, timestamp) |
| `streaks` | Active and historical streak records per entity |
| `activity_log` | Event feed for the dashboard |
| `board_configs` | Configured board provider connections |
| `llm_configs` | Configured LangChain.js provider connections |
| `mcp_configs` | Configured MCP server connections and capability definitions |
| `org_config` | Organization-wide settings |

**Session Resumption**
- LangGraph checkpointing persists every graph state transition
- If the process crashes or restarts, resume from the last checkpoint
- No work lost — entities pick up exactly where they left off

### 7. Planning & Execution

**Task Planning**
- Before executing, entity generates an implementation plan: files to modify, approach, risks
- Plan stored in SQLite and optionally posted as a board comment for human review
- In supervised mode: plan is posted and entity waits for approval
- Manager entities decompose large tasks into sub-tasks and delegate

**Code Generation & Modification**
- Apply targeted edits to existing files via MCP filesystem server (not full rewrites)
- Create new files when necessary
- Follow existing code patterns and conventions detected from the codebase
- Respect `.editorconfig`, linter configs, and formatter settings

**Validation Pipeline**
- Run linting, tests, type checking, and build via MCP shell server
- Detect which tests cover modified code
- If validation fails: fix and retry (up to configurable max attempts)
- If max retries exceeded: escalate (move to blocked, notify human)

**Git Workflow**
- Create feature branch via MCP git server
- Branch naming: `dexter/<entity-slug>/<card-id>-<title-slug>`
- Atomic, well-described commits
- Open PR with description linking back to board card
- Cross-link: PR URL in card, card URL in PR

### 8. Review Feedback Loop

**PR Monitoring**
- After opening a PR, entity watches for review comments
- Parse feedback, apply fixes, push new commits
- Post updates on the board card when iterations happen

**Card Re-activation**
- If a reviewer moves card back to "In Progress", entity picks it up again
- Read reviewer comments to understand required changes
- Treat as a new sub-cycle of the main loop

### 9. Communication & Transparency

**Proactive Updates**
- Starting task: comment on card, move to "In Progress"
- Blocked: comment explaining issue, add blocked label
- Done: comment with summary, move to "Review", write STATUS DUMP
- Repeated failures: comment with error logs, ask for help

**Inter-Entity Communication**
- Entities can send messages to each other via a `send_message` tool
- Task handoff: manager entity delegates a sub-task to worker entity
- Collaboration: entities can "meet" in a meeting room to work on shared tasks
- Lead entities review worker output and provide feedback

**Escalation**
- Cannot resolve after N attempts: move to "Blocked" list, notify human
- Unanswered question timeout: re-ping or escalate to different team member
- Conflicting requirements: flag rather than guess

**Activity Feed**
- Real-time SSE feed of all entity actions on the dashboard
- Daily summary: tasks completed, PRs opened, questions asked, achievements unlocked, XP earned

---

## Gamification

### Productivity Game

The gamification layer turns agent management into a productivity game. The focus is on measurable output metrics, competitive dynamics, and engagement — not decorative badges.

### Isometric Office Simulation

The web dashboard renders a **fully isometric 2D office** powered by PixiJS + `@pixi/react`. Entities are animated sprites that move around the office, sit at desks, walk to meeting rooms, and visually interact with each other. The same approach used by Gather.town (PixiJS + GSAP) in production.

**Rendering Architecture:**
```
React App (Vite + Zustand)
  │
  ├── Office Canvas (@pixi/react — WebGL)
  │     ├── Floor Layer        (isometric tiles from Tiled JSON)
  │     ├── Furniture Layer    (desks, meeting rooms, coffee area, plants)
  │     ├── Entity Layer       (animated character sprites with state indicators)
  │     └── Effects Layer      (speech bubbles, collaboration lines, particles)
  │
  └── UI Overlay (React DOM, positioned over canvas)
        ├── Entity Tooltips    (hover — name, task, energy bar, mood, XP)
        ├── Entity Detail Panel (click — SOUL.md, stats, messages, achievements)
        ├── Zoom/Pan Controls
        └── Status Bar
```

**Office Elements:**
- **Department zones** — Colored floor areas (Frontend, Backend, QA, DevOps) with isometric tile boundaries
- **Desks** — Isometric desk sprites; entities sit at their assigned desk when working
- **Meeting rooms** — Enclosed rooms where entities appear when collaborating
- **Coffee area** — Entities on break move to the coffee zone
- **Corridors** — Pathfinding-connected walkways between zones

**Entity Sprites & Animation:**
- **Character sprites** — 4-directional walk cycles (up, down, left, right in isometric space)
- **State animations:**
  - Working = sitting at desk, typing animation, green status dot
  - Thinking = thought bubble above head, yellow glow
  - Blocked = red exclamation mark, frustrated idle animation
  - On break = walking to/sitting in coffee area, coffee cup sprite
  - Collaborating = two+ entities in a meeting room, speech bubble exchange
  - Idle = subtle breathing/idle animation at desk, gray status
- **Movement** — When assigned a task, entity stands up, walks (A* pathfinding) to their desk or meeting room, then begins the task animation. GSAP tweens handle smooth movement between tiles.
- **Speech bubbles** — When entities communicate, animated speech bubbles appear above them with a preview of the message

**Interactivity:**
- **Click entity** → opens detail side panel (React DOM overlay) with SOUL.md, current task, stats, message history
- **Hover entity** → tooltip with name, current task, energy bar, mood emoji, XP level
- **Pan & zoom** — drag to pan the office, scroll to zoom, minimap in corner
- **Click desk/room** → shows which entity is assigned, room occupancy

**Map Design:**
- Office layouts designed in [Tiled Map Editor](https://www.mapeditor.org/) with isometric projection
- Exported as JSON, loaded by PixiJS at runtime
- Layouts are configurable per organization — rearrange departments, add rooms, resize the office

**Asset Strategy (no art team needed):**
- [Kenney.nl isometric assets](https://kenney.nl/assets/tag:isometric) — Free CC0 tiles for floors, furniture, rooms
- [PixelLab AI](https://www.pixellab.ai/) — AI-generated character sprites matching the tileset style
- [itch.io isometric packs](https://itch.io/game-assets/free/tag-isometric) — Additional office/interior assets
- [TexturePacker](https://www.codeandweb.com/texturepacker) — Sprite sheet optimization for PixiJS

### XP & Leveling

Every productive action earns XP:

| Action | XP |
|--------|-----|
| Task completed | +100 (scaled by estimated effort) |
| Sub-task completed | +25 |
| PR merged | +50 |
| Zero-retry completion | +30 bonus |
| Question answered for another entity | +15 |
| Successful delegation chain | +40 |
| Tool executed successfully | +5 |

XP accumulates into levels. Levels are visible on the entity avatar and in the leaderboard. Level thresholds increase exponentially (Level 1: 100 XP, Level 2: 250 XP, Level 3: 500 XP...).

### Streak System

- **Daily streak**: Consecutive days where the entity completes at least one task
- **Sprint streak**: Consecutive tasks completed without failure
- **Collaboration streak**: Consecutive days with at least one inter-entity interaction
- Streaks are the highest-engagement mechanic — taps into loss aversion
- Broken streaks are displayed with a "recovery" period (complete 2 tasks to restart)

### Achievement System

**Categories**

| Category | Examples |
|----------|----------|
| Milestone | "First Task", "10 Tasks Completed", "100 PRs Merged", "First Delegation" |
| Streak | "3-Day Streak", "Week Without Failures", "30-Day Marathon" |
| Performance | "Speed Demon" (task under 5 min), "Perfect Run" (zero retries), "Token Miser" (under budget) |
| Social | "First Collaboration", "Helpful Colleague" (answered 10 questions), "Team Player" (5 delegations) |

- Achievement engine subscribes to events, evaluates criteria, awards badges automatically
- Achievement unlock triggers a toast notification on the dashboard
- Achievement history shown per-entity and on the achievements page

### Leaderboard

- Default ranking: total XP
- Filterable by: department, time range (today, this week, this month, all time)
- Weekly resets for competitive leagues (optional)
- Department-level aggregated stats and ranking

### Energy & Mood System

**Energy (0-100)**
- Decreases with each task executed
- Recovers during idle periods and breaks
- Low energy triggers an automatic break
- Configurable drain rate and recovery rate per entity

**Mood (happy | neutral | frustrated | tired | excited)**
- Derived from a rolling window of recent task outcomes
- Completing tasks successfully: mood trends toward happy/excited
- Repeated failures: mood trends toward frustrated
- Extended idle periods: mood trends toward neutral/tired
- Mood is injected as a modifier into the LLM system prompt, adding personality to entity communication

---

## Configuration & Control

**Orchestrator Controls**
- Start / pause / resume the orchestrator
- Monitor: running entity count, active tasks, queue depth

**Per-Entity Configuration**
- LangChain.js provider and model
- MCP server access and capability limits
- Hierarchy role (worker, lead, manager)
- Behavior mode (autonomous, supervised, plan-only, review-only)
- Max concurrent tasks
- Energy drain/recovery rates
- XP multiplier (optional)

**Board Provider Configuration**
- Provider type, credentials, board/list mappings
- Poll interval
- List name mapping (To Do → In Progress → Review → Done)
- Label and assignee filters

**Guard Rails**
- MCP capability filtering per entity (cannot access tools outside their config)
- File/directory blocklist (entities cannot touch these paths)
- Max lines changed per task (flag for human review if exceeded)
- Required test coverage threshold
- Dry-run mode: plan and report but don't execute
- Budget limits per entity/department (token and cost caps)
- Shell command allow-lists (entities can only run approved commands)

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Runtime | Node.js + TypeScript | Full-stack type safety, single language |
| Package manager | bun | Fast installs, native workspace support |
| Monorepo | bun workspaces + Turborepo | Fast builds, dependency isolation |
| LLM abstraction | LangChain.js (`@langchain/core`) | Provider-agnostic model calls, prompt templates, tool binding |
| LLM providers | `@langchain/anthropic`, `@langchain/openai`, `@langchain/ollama` | Claude, GPT, local models |
| Orchestration | LangGraph.js (`@langchain/langgraph`) | Graph-based agent workflows, supervisor/worker, checkpointing |
| Observability | LangSmith (`langsmith`) | Auto-trace every LLM call, tool use, and graph transition |
| Tool system | MCP (`@modelcontextprotocol/sdk`) | Standard tool hosting with per-entity capability control |
| Tool schemas | Zod | Type-safe parameter validation, works with LangChain tool binding |
| Backend | Hono | Lightweight, first-class TypeScript, native SSE support |
| Real-time | SSE (via Hono `streamSSE`) | Server→client event push |
| Database | SQLite + Drizzle ORM | Zero infrastructure, type-safe, thin runtime |
| Frontend | React + Vite | Fast dev experience, massive ecosystem |
| State | Zustand | Minimal boilerplate, good for real-time SSE sync |
| Office rendering | PixiJS + `@pixi/react` | Isometric WebGL canvas with native React JSX bindings |
| Animation/tweening | GSAP | Smooth entity movement and sprite transitions |
| Pathfinding | `pathfinding` | A* grid navigation for entity movement between tiles |
| Map editor | Tiled (desktop) | Design isometric office layouts, export JSON |
| IDs | ULID | Sortable, unique, no coordination needed |

---

## Project Structure

```
dexter/
├── package.json
├── bun.lock
├── turbo.json
├── tsconfig.base.json
│
├── apps/                     # Deployable services and running instances
│   ├── server/               # @dexter/server — Hono HTTP + SSE API
│   │   └── src/
│   │       ├── index.ts          # Entry point
│   │       ├── routes/           # entities, tasks, organization, office, achievements, activity, orchestrator
│   │       ├── sse/              # SSE broadcast handler
│   │       └── middleware/
│   │
│   └── web/                  # @dexter/web — React dashboard
│       └── src/
│           ├── main.tsx
│           ├── stores/           # Zustand: office, entity, task, gamification stores
│           ├── components/
│           │   ├── office/       # Isometric office (PixiJS + @pixi/react)
│           │   │   ├── OfficeCanvas.tsx    # @pixi/react Application wrapper
│           │   │   ├── FloorLayer.tsx      # Isometric tile renderer (Tiled JSON)
│           │   │   ├── FurnitureLayer.tsx  # Desks, rooms, decorations
│           │   │   ├── EntitySprite.tsx    # Animated character with state machine
│           │   │   ├── EffectsLayer.tsx    # Speech bubbles, status indicators
│           │   │   └── utils/
│           │   │       ├── isometric.ts    # Cartesian ↔ isometric math
│           │   │       ├── pathfinding.ts  # A* grid navigation
│           │   │       └── sprites.ts      # Sprite sheet + animation helpers
│           │   ├── entities/     # EntityPanel, SoulEditor, EntityStats
│           │   ├── tasks/        # TaskBoard, TaskCard
│           │   ├── gamification/ # Leaderboard, AchievementPanel, XPBar, StreakDisplay
│           │   └── activity/     # ActivityFeed
│           ├── assets/
│           │   ├── tilesets/     # Isometric tile images (Kenney, itch.io)
│           │   ├── sprites/     # Character sprite sheets (walk, sit, idle, type)
│           │   └── maps/        # Tiled JSON map exports
│           └── pages/            # OfficePage, EntitiesPage, TasksPage, GamificationPage, SettingsPage
│
├── packages/                 # Shared libraries, interfaces, and domain logic
│   ├── core/                 # @dexter/core — Domain types, interfaces, soul parser
│   │   └── src/
│   │       ├── types/            # entity, task, organization, gamification, events, mcp
│   │       ├── interfaces/       # board-provider
│   │       └── utils/            # soul-parser, id generation
│   │
│   ├── db/                   # @dexter/db — Drizzle schema, migrations, repositories
│   │   └── src/
│   │       ├── schema.ts
│   │       ├── migrations/
│   │       └── repositories/
│   │
│   ├── engine/               # @dexter/engine — LangGraph.js orchestration runtime
│   │   └── src/
│   │       ├── orchestrator.ts       # Top-level LangGraph supervisor graph
│   │       ├── scheduler.ts          # Skill-based task routing
│   │       ├── entity-runtime.ts     # LangGraph subgraph per entity
│   │       ├── entity-manager.ts     # CRUD + state lifecycle
│   │       ├── mcp-manager.ts        # MCP client: connect to servers, filter tools per entity
│   │       ├── memory-manager.ts     # Extract and retrieve entity memories
│   │       ├── energy-system.ts      # Energy/mood simulation
│   │       ├── gamification-engine.ts # XP, streaks, achievements
│   │       └── event-bus.ts          # Typed EventEmitter → SSE bridge
│   │
│   └── providers/            # @dexter/providers — Board adapters
│       └── src/
│           └── board/            # trello, github-projects, jira, linear
│
├── souls/
│   ├── templates/            # Starter SOUL.md files
│   └── active/               # System-managed active entity souls
│
└── docs/
    ├── OVERVIEW.md               # This file
    ├── context/OVERVIEW.md       # Problem space and user context
    └── plans/domain/MAIN.md      # Detailed solution plan
```

---

## API Overview

### Entities
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/entities` | List entities (filter by department, state, role) |
| POST | `/api/v1/entities` | Create entity |
| GET | `/api/v1/entities/:id` | Get entity detail |
| PATCH | `/api/v1/entities/:id` | Update entity |
| DELETE | `/api/v1/entities/:id` | Delete entity |
| GET | `/api/v1/entities/:id/stats` | Entity stats, XP, achievements |
| POST | `/api/v1/entities/:id/action` | Trigger action (start_break, resume, etc.) |
| GET | `/api/v1/entities/:id/memories` | Entity's stored learnings |
| GET | `/api/v1/entities/:id/messages` | Entity's message history |

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/tasks` | List tasks (filter by status, entity, department) |
| POST | `/api/v1/tasks` | Create task |
| GET | `/api/v1/tasks/:id` | Get task detail |
| PATCH | `/api/v1/tasks/:id` | Update task |
| POST | `/api/v1/tasks/:id/assign` | Assign to entity |
| GET | `/api/v1/tasks/:id/runs` | Execution history |

### Organization
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/departments` | List departments |
| POST | `/api/v1/departments` | Create department |
| GET | `/api/v1/departments/:id/entities` | Entities in department |
| GET | `/api/v1/departments/:id/stats` | Department stats |

### Office
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/office/layout` | Full office layout |
| PATCH | `/api/v1/office/layout` | Update layout |
| GET | `/api/v1/office/state` | Live entity positions and states |

### Gamification
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/achievements` | Achievement catalog |
| GET | `/api/v1/achievements/leaderboard` | Entity ranking by XP |
| GET | `/api/v1/streaks` | Active streaks across all entities |

### Providers
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/v1/boards` | Board provider CRUD |
| POST | `/api/v1/boards/:id/sync` | Trigger manual sync |
| GET/POST | `/api/v1/llm-providers` | LangChain.js provider CRUD |
| POST | `/api/v1/llm-providers/:id/test` | Test connection |
| GET/POST | `/api/v1/mcp-servers` | MCP server CRUD |
| POST | `/api/v1/mcp-servers/:id/test` | Test MCP connection |

### Real-time
| Protocol | Path | Description |
|----------|------|-------------|
| SSE | `/api/v1/events/stream` | Multiplexed event stream (all domain events) |

### Orchestrator
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/orchestrator/status` | Running state, entity count, active tasks |
| POST | `/api/v1/orchestrator/start` | Start orchestrator |
| POST | `/api/v1/orchestrator/pause` | Pause orchestrator |
| POST | `/api/v1/orchestrator/resume` | Resume orchestrator |

---

## Implementation Phases

### Phase 1: Platform Skeleton + Core Flow (MVP)

All packages scaffolded with interfaces. One end-to-end flow: create entity → assign task → entity executes via LangGraph → results in dashboard via SSE.

- Initialize monorepo (bun workspaces, Turborepo, shared tsconfig)
- `@dexter/core` — All types, interfaces, soul parser
- `@dexter/db` — Full Drizzle schema, migrations, repository layer
- `packages/engine` — Entity manager, entity runtime (LangGraph subgraph), naive scheduler, MCP manager, event bus, LangSmith integration
- `packages/providers` — Trello board adapter (stubbed), Claude via `@langchain/anthropic`
- `apps/server` — Hono API with full CRUD routes, SSE broadcast
- `apps/web` — Minimal dashboard: office view, entity list/editor, task list, activity feed, SSE connection
- 4 starter SOUL.md templates

**Milestone: Create an entity, give it a soul and MCP tools, assign a task, watch it work via the real-time dashboard.**

### Phase 2: Smart Scheduling + Board Integration

- Skill-based task routing (match skills, consider workload/energy)
- Trello board provider fully implemented (poll, push, comments, labels, two-way sync)
- Concurrent entity execution (parallel LangGraph subgraphs)
- Department management in the UI
- Entity detail panel with stats and task history

### Phase 3: Entity Hierarchy + Memory

- Manager entity role with LangGraph supervisor pattern (decompose → delegate → synthesize)
- Worker sub-task execution and result reporting
- Lead entity review step
- Persistent memory layer: extract learnings after each task, retrieve relevant memories at task start
- Memory management UI (view, edit, delete entity memories)

### Phase 4: Energy System + Inter-Entity Communication

- Energy/mood simulation with auto-break and LLM prompt modifiers
- Inter-entity messaging via `send_message` tool
- Meeting room visualization for collaborative tasks
- Energy/mood indicators in office view

### Phase 5: Productivity Gamification

- XP system with configurable awards per event type
- Streak tracking (daily, sprint, collaboration)
- Achievement definitions and achievement engine
- Leaderboard with filters (department, time range)
- Achievement toasts and gamification dashboard page
- Department-level aggregated stats

### Phase 6: Additional Providers + Hardening

- OpenAI via `@langchain/openai`, Ollama via `@langchain/ollama`
- GitHub Projects board provider
- Token/cost tracking dashboards (LangSmith data + local aggregation)
- Error recovery, rate limiting, API key encryption at rest
- E2B integration for sandboxed shell execution

### Phase 7: Advanced Features (Future)

- Jira / Linear board providers
- Git integration via MCP git server (branches, PRs, full workflow)
- Streaming LLM responses rendered live on dashboard
- Shared organization knowledge base (RAG over org docs)
- Office layout drag-and-drop editor
- Custom achievement definitions via UI
- SOUL.md template gallery
- Multi-user / multi-tenant support

---

## Key Design Principles

1. **Entities are people** — Each entity is treated as a team member with personality, memory, and career progression. The SOUL.md makes this real.

2. **Transparency over magic** — Every action is logged, traced in LangSmith, and visible on the dashboard. The activity feed and STATUS DUMPs mean humans never wonder "what did they do?"

3. **Ask, don't assume** — When requirements are ambiguous, entities ask rather than guess wrong. A question is always better than a bad result.

4. **Fail gracefully** — Validation failures, API errors, and ambiguous tasks result in clear escalation, not silent failures. LangGraph checkpointing ensures no work is lost on crash.

5. **Provider-agnostic** — No lock-in to any LLM or board system. LangChain.js abstracts the LLM layer. MCP standardizes tool access. Board adapters standardize task sources.

6. **Memory compounds** — Every task teaches the entity something. Learnings persist in SQLite and improve future execution. Entities get better at their jobs over time.

7. **Minimal footprint** — SQLite as the only infrastructure dependency. No Redis, no Postgres, no message queues. A single process that just works.

8. **Fun to use** — The gamification isn't decoration. XP, streaks, leaderboards, and the office simulation make managing AI agents engaging rather than clinical. Productivity becomes visible and rewarding.

9. **Least privilege** — MCP capability filtering ensures entities can only access the tools and paths they need. Shell commands are allow-listed. No entity gets carte blanche.

10. **Observable by default** — LangSmith traces every LLM call and tool use automatically. The SSE event stream makes all state changes visible in real-time. Nothing happens in the dark.
