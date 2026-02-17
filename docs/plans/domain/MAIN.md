# Solution Plan

## Chosen Approach

**Gamified AI Entity Orchestrator** built on the LangChain.js ecosystem. LangGraph.js handles agent orchestration (supervisor/worker graphs, checkpointing, state machines). LangChain.js provides the provider-agnostic LLM abstraction. LangSmith gives full trace observability. MCP servers provide the tool layer. A Hono API with SSE streaming powers a React dashboard that renders a real-time virtual office with productivity gamification.

The architecture follows a **platform skeleton** approach for Phase 1: all packages scaffolded with defined interfaces and types, with core flows (entity creation → task assignment → LLM execution → dashboard visualization) implemented end-to-end.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js + TypeScript | Full-stack type safety |
| Package manager | bun | Fast installs, workspace support |
| Monorepo | bun workspaces + Turborepo | Build orchestration, dependency isolation |
| LLM abstraction | LangChain.js (`@langchain/core`) | Provider-agnostic model calls, prompt templates, output parsers |
| LLM providers | `@langchain/anthropic`, `@langchain/openai`, `@langchain/ollama` | Claude, GPT, local models |
| Agent orchestration | LangGraph.js (`@langchain/langgraph`) | Graph-based agent workflows, supervisor/worker, checkpointing |
| Observability | LangSmith (`langsmith`) | Trace every LLM call, tool use, and agent step |
| Tool system | MCP (`@modelcontextprotocol/sdk`) | Standard tool hosting — filesystem, git, shell, custom |
| Tool schemas | Zod | Type-safe tool parameter validation |
| Database | SQLite via `better-sqlite3` | Zero-infra persistence |
| ORM | Drizzle (`drizzle-orm` + `drizzle-kit`) | Type-safe schema, migrations, queries |
| Backend | Hono | HTTP API + SSE streaming |
| Real-time | SSE (via Hono `streamSSE`) | Server → client event push |
| Frontend | React 19 + Vite | Dashboard UI |
| State management | Zustand | Real-time store sync via SSE |
| Office rendering | PixiJS + `@pixi/react` | Isometric WebGL canvas with React JSX bindings |
| Animation | GSAP (`gsap`) | Smooth entity movement and sprite transitions |
| Pathfinding | `pathfinding` | A* grid navigation for entity movement |
| Map editor | Tiled (desktop app) | Isometric office layout design, JSON export |
| IDs | ULID (`ulid`) | Sortable, unique identifiers |
| Validation | Zod | Request/response validation across the stack |
| Memory | mem0 (self-hosted) or SQLite vector search | Cross-task entity memory |

---

## Architecture Overview

```
                         ┌─────────────────────────────┐
                         │      Web Dashboard (React)   │
                         │  ┌─────────────────────────┐ │
                         │  │ Office Floor | Tasks     │ │
                         │  │ Entities | Achievements  │ │
                         │  │ Activity | Settings      │ │
                         │  └────────┬────────────────┘ │
                         └───────────┼─────────────────┘
                              SSE ↓  ↑ REST
                         ┌───────────┼─────────────────┐
                         │    Hono API Server           │
                         │  ┌────────┴────────────────┐ │
                         │  │ Routes  │ SSE Broadcast  │ │
                         │  └────────┬────────────────┘ │
                         └───────────┼─────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
    ┌─────────▼──────────┐ ┌────────▼─────────┐ ┌─────────▼──────────┐
    │  Board Sync Layer  │ │   Orchestrator    │ │  Gamification      │
    │  (Trello, Jira...) │ │   (LangGraph.js)  │ │  Engine            │
    │                    │ │                   │ │  (XP, Streaks,     │
    │  Poll → Tasks      │ │  Supervisor Graph │ │   Achievements)    │
    │  Status → Board    │ │       │           │ │                    │
    └────────────────────┘ │  ┌────▼────┐      │ └────────────────────┘
                           │  │ Entity  │      │
                           │  │ Manager │      │           ┌──────────────┐
                           │  └────┬────┘      │           │  LangSmith   │
                           │       │           │           │  (Tracing)   │
                           │  ┌────▼──────────────────┐    └──────┬───────┘
                           │  │  Entity Runtimes      │           │
                           │  │  (LangGraph subgraphs)│───────────┘
                           │  │                       │
                           │  │  ┌──────┐ ┌──────┐   │
                           │  │  │Ent A │ │Ent B │   │
                           │  │  └──┬───┘ └──┬───┘   │
                           │  └─────┼────────┼───────┘
                           └────────┼────────┼────────┘
                                    │        │
                    ┌───────────────┼────────┼───────────────┐
                    │               ▼        ▼               │
                    │         MCP Servers (Tools)             │
                    │  ┌────────┐ ┌─────┐ ┌───────┐ ┌─────┐ │
                    │  │  FS    │ │ Git │ │ Shell │ │ API │ │
                    │  └────────┘ └─────┘ └───────┘ └─────┘ │
                    └────────────────────────────────────────┘
                                    │
                              ┌─────▼─────┐
                              │  LangChain │
                              │  LLM Calls │
                              │ ┌────────┐ │
                              │ │Claude  │ │
                              │ │OpenAI  │ │
                              │ │Ollama  │ │
                              │ └────────┘ │
                              └─────┬──────┘
                                    │
                              ┌─────▼─────┐
                              │  SQLite    │
                              │  (Drizzle) │
                              └────────────┘
```

### Key Architectural Decisions

**LangGraph.js as the orchestration backbone**: Each entity runtime is a LangGraph subgraph with its own state, tools, and checkpoints. The supervisor (orchestrator) is a top-level LangGraph graph that routes tasks to entity subgraphs. This gives us: state machines with typed transitions, built-in checkpointing for crash recovery, and composable agent hierarchies.

**MCP for tool access**: Entities don't call tools directly. They connect to MCP servers that expose tools over a standard protocol. SOUL.md declares which MCP servers (and which capabilities within them) an entity is allowed to use. The orchestrator enforces this at runtime by filtering available tools before passing them to LangChain.

**SSE + REST (not WebSocket)**: SSE for all server→client push (entity state changes, LLM token streams, task updates, achievement unlocks). REST POST for all client→server commands (pause entity, assign task, trigger sync). This is simpler, aligns with how LangGraph and LangSmith stream events, and Hono has first-class SSE support.

**LangSmith for observability**: Every LLM call, tool invocation, and graph transition is automatically traced. No custom observability code needed for the agent layer. The dashboard supplements this with domain-specific views (office, tasks, achievements).

**Event-driven via typed emitter**: A typed EventEmitter bridges the LangGraph runtime events to the SSE broadcast layer. LangGraph emits graph state transitions; our event bridge transforms them into domain events (`entity:state-changed`, `task:completed`, etc.) and pushes them to connected SSE clients.

---

## Key Flows

### Flow 1: Entity Creation

1. User opens dashboard → Entities page → "Create Entity"
2. User fills: name, SOUL.md (live editor with preview), department, LLM provider/model
3. User configures MCP tool access: selects which MCP servers the entity can use
4. User optionally sets: behavior mode, energy rates, hierarchy role (worker/lead/manager)
5. POST `/api/v1/entities` → server validates, persists to SQLite, creates LangGraph subgraph config
6. SSE emits `entity:created` → dashboard updates office floor with new entity at desk
7. Entity is now in `idle` state, ready for task assignment

### Flow 2: Task Lifecycle (Autonomous Mode)

1. Board sync polls Trello → new card detected → Task created in SQLite
2. SSE emits `task:created` → dashboard shows new task in Pending column
3. Scheduler evaluates: match `task.requiredSkills` against all idle entities' `soul.skills`
4. Best-fit entity selected → task assigned → SSE emits `task:assigned`
5. Entity transitions: `idle` → `thinking` → LangGraph subgraph activates
6. Entity runtime builds system prompt: SOUL.md personality + task context + org conventions
7. LangGraph executes the entity's graph:
   a. Planning node: LLM generates implementation plan
   b. Execution node: LLM makes tool calls via MCP (file edits, git operations, etc.)
   c. Validation node: run tests/lint via MCP shell tool
   d. If validation fails → loop back to execution (up to max retries)
8. All steps traced in LangSmith automatically
9. Entity transitions: `thinking` → `working` → (on tool calls) → `idle`
10. Task status: `in_progress` → `review` → entity posts STATUS DUMP to board
11. Gamification engine: award XP, check streak, evaluate achievement criteria
12. SSE emits: `task:completed`, `entity:state-changed`, `entity:energy-updated`, possibly `achievement:unlocked`
13. Energy decreases, mood updates based on outcome

### Flow 3: Hierarchical Delegation

1. Manager entity receives a complex task
2. Manager's LangGraph graph enters a "decomposition" node
3. LLM (as manager persona via SOUL.md) breaks task into sub-tasks
4. Manager uses a `delegate` tool to assign sub-tasks to specific worker entities
5. Orchestrator creates sub-task records, assigns to workers
6. Workers execute in parallel (separate LangGraph subgraphs)
7. Workers report results back → manager's graph receives results at a "review" node
8. Manager synthesizes results, runs final validation
9. Manager completes the parent task

### Flow 4: Inter-Entity Communication

1. Entity A encounters a question about a module owned by Entity B's department
2. Entity A uses a `send_message` tool → message stored in SQLite, SSE emits `message:sent`
3. Entity B's next activation includes the message as context
4. Entity B responds via `send_message` → Entity A receives the answer
5. Dashboard shows message thread in the activity feed and entity detail panels

### Flow 5: Real-Time Isometric Dashboard Experience

1. User opens dashboard → establishes SSE connection to `/api/v1/events/stream`
2. Initial state loaded via REST: `GET /api/v1/office/state` (all entities, positions, states, tasks)
3. Zustand stores hydrated with initial state
4. PixiJS `@pixi/react` renders isometric office: floor tiles, furniture, entity sprites at their desk positions
5. SSE events arrive → Zustand actions update stores → PixiJS components react:
   - `task:assigned` → entity sprite stands up, A* pathfinding calculates route, GSAP tweens walk animation to destination desk/room
   - `entity:state-changed` → sprite animation swaps (idle → typing, typing → thinking bubble)
   - `message:sent` → speech bubble appears above sender entity with message preview
   - `entity:energy-updated` → energy bar overlay updates, mood emoji changes
6. Clicking an entity sprite → React DOM overlay opens detail side panel (SOUL.md, current task, stats, messages, achievements)
7. Hovering an entity sprite → tooltip with name, task summary, energy bar, XP level
8. Pan (drag) and zoom (scroll) to navigate the office; minimap in corner for orientation
9. Task board page shows Kanban with real-time card movement
10. Activity feed scrolls with timestamped events
11. Achievement toasts pop up when entities unlock badges
12. Leaderboard updates as XP changes

---

## User Stories

- **US-01:** As an operator, I want to create an entity with a SOUL.md file, so that the AI agent has a defined personality and skill set.
- **US-02:** As an operator, I want to assign an LLM provider and model to each entity, so that different entities can use different AI backends.
- **US-03:** As an operator, I want to configure which MCP servers an entity can access, so that I control what tools each entity has.
- **US-04:** As an operator, I want to organize entities into departments, so that the office simulation reflects a real team structure.
- **US-05:** As an operator, I want to see a real-time office floor plan with entity states, so that I can monitor what all entities are doing at a glance.
- **US-06:** As an operator, I want tasks from Trello to automatically sync into Dexter, so that entities can pick up work without manual intervention.
- **US-07:** As an operator, I want the scheduler to automatically route tasks to the best-fit entity, so that work is distributed based on skills.
- **US-08:** As an operator, I want to define manager entities that can delegate sub-tasks to workers, so that complex tasks are decomposed automatically.
- **US-09:** As an operator, I want entities to remember learnings from past tasks, so that they improve over time.
- **US-10:** As an operator, I want to see XP, streaks, and achievements for each entity, so that I can track productivity in an engaging way.
- **US-11:** As an operator, I want a real-time activity feed showing all entity actions, so that I have full transparency into agent behavior.
- **US-12:** As an operator, I want all LLM calls and tool uses traced in LangSmith, so that I can debug and audit agent behavior.
- **US-13:** As an operator, I want entities to post status updates and move cards on the board, so that they behave like human team members.
- **US-14:** As an operator, I want to pause/resume individual entities or the entire orchestrator via the dashboard.

---

## Implementation Phases

### Phase 1: Platform Skeleton + Core Flow (MVP)

**Scope:** All packages scaffolded with interfaces. One end-to-end flow working: create entity → assign task → entity executes via LangGraph → results in dashboard.

**Deliverables:**

1. **Monorepo scaffold**
   - `package.json`, `bun.lock`, `turbo.json`, `tsconfig.base.json`
   - `apps/` for deployable services, `packages/` for shared libraries
   - All workspaces created with `package.json`, `tsconfig.json`, `src/index.ts`

2. **`packages/core`** (`@dexter/core`) — All types and interfaces
   - `types/entity.ts` — Entity, EntityState, Mood, ParsedSoul
   - `types/task.ts` — Task, TaskStatus, TaskAssignment
   - `types/organization.ts` — Department, OrgConfig
   - `types/gamification.ts` — Achievement, XP, Streak, OfficeLayout, DeskPosition
   - `types/events.ts` — DexterEvent discriminated union (all event types)
   - `types/mcp.ts` — MCPServerConfig, EntityToolAccess
   - `interfaces/board-provider.ts` — BoardProvider interface
   - `utils/soul-parser.ts` — Parse SOUL.md YAML frontmatter + markdown
   - `utils/id.ts` — ULID generation

3. **`packages/db`** (`@dexter/db`) — Schema and repositories
   - Full Drizzle schema: entities, departments, tasks, task_dependencies, execution_runs, messages, achievement_definitions, entity_achievements, entity_daily_stats, activity_log, board_configs, llm_configs, org_config
   - Repositories: EntityRepo, TaskRepo, DepartmentRepo, ActivityRepo
   - Migration infrastructure

4. **`packages/engine`** (`@dexter/engine`) — Orchestrator with LangGraph.js
   - `event-bus.ts` — Typed EventEmitter with DexterEvent
   - `entity-manager.ts` — CRUD + state transitions for entities
   - `entity-runtime.ts` — LangGraph subgraph per entity: system prompt from SOUL.md → LLM call → tool execution via MCP → result
   - `orchestrator.ts` — Top-level LangGraph supervisor graph: receives tasks, routes to entity runtimes
   - `scheduler.ts` — Naive scheduler (manual assignment + basic skill matching)
   - LangSmith integration: auto-trace all LangGraph/LangChain calls

5. **`packages/providers`** (`@dexter/providers`) — One LLM + one board provider
   - `llm/langchain-setup.ts` — LangChain.js provider initialization (Claude via `@langchain/anthropic`)
   - `board/trello.ts` — Trello adapter (read cards, move cards, post comments) — stubbed interface, minimal implementation
   - `mcp/manager.ts` — MCP client manager: connect to MCP servers, filter tools per entity capabilities

6. **`apps/server`** (`@dexter/server`) — Hono API
   - `routes/entities.ts` — Full CRUD
   - `routes/tasks.ts` — Full CRUD + assign
   - `routes/departments.ts` — Full CRUD
   - `routes/office.ts` — Layout + live state
   - `routes/activity.ts` — Activity feed
   - `routes/orchestrator.ts` — Start/pause/resume
   - `sse/broadcast.ts` — SSE event broadcaster (subscribes to EventBus, pushes to connected clients)

7. **`apps/web`** (`@dexter/web`) — Isometric dashboard
   - `components/office/OfficeCanvas.tsx` — `@pixi/react` Application wrapper with zoom/pan
   - `components/office/FloorLayer.tsx` — Isometric tile renderer loading Tiled JSON maps
   - `components/office/FurnitureLayer.tsx` — Desks, rooms, decorations as isometric sprites
   - `components/office/EntitySprite.tsx` — Animated character with walk/sit/idle/type state machine
   - `components/office/EffectsLayer.tsx` — Speech bubbles, status indicators
   - `components/office/utils/isometric.ts` — Cartesian ↔ isometric coordinate conversion + depth sorting
   - `components/office/utils/pathfinding.ts` — A* grid navigation wrapper
   - `components/office/utils/sprites.ts` — Sprite sheet loading + animation helpers
   - `pages/OfficePage.tsx` — Isometric office view (PixiJS canvas + React DOM overlay)
   - `pages/EntitiesPage.tsx` — Entity list, create/edit modal with SOUL.md editor
   - `pages/TasksPage.tsx` — Task list with status
   - `stores/office-store.ts`, `stores/entity-store.ts`, `stores/task-store.ts` — Zustand + SSE sync
   - `assets/tilesets/` — Kenney isometric tiles
   - `assets/sprites/` — Character sprite sheets
   - `assets/maps/` — Default office layout (Tiled JSON)
   - `api/client.ts` — REST API client
   - `api/sse.ts` — SSE connection manager
   - Layout shell: sidebar, header, main content area

8. **Soul templates**
   - `souls/templates/frontend-dev.soul.md`
   - `souls/templates/backend-dev.soul.md`
   - `souls/templates/qa-engineer.soul.md`
   - `souls/templates/devops-engineer.soul.md`

### Phase 2: Smart Scheduling + Board Integration

**Scope:** Skill-based task routing. Trello two-way sync. Concurrent entity execution.

- Scheduler scores entities by skill match, workload, energy
- Trello board provider fully implemented (poll, push, comments, labels)
- Board sync loop with configurable interval
- Multiple entity runtimes executing in parallel
- Department management UI
- Entity detail panel with stats and task history

### Phase 3: Entity Hierarchy + Memory

**Scope:** Manager/worker delegation. Persistent cross-task memory.

- Manager entity role: can decompose tasks and delegate via `delegate` tool
- Worker entities execute sub-tasks, report back to manager
- LangGraph supervisor pattern: manager graph fans out to worker subgraphs
- Persistent memory layer: entities extract and store learnings after each task
- Memory retrieval: relevant past learnings injected into entity context at task start
- Tech lead role: reviews worker output before marking task complete

### Phase 4: Energy System + Inter-Entity Communication

**Scope:** Office simulation depth. Entity messaging. Mood system.

- Energy decreases with work, recovers during idle/breaks
- Low energy triggers auto-break (entity state → `on_break`)
- Mood derived from rolling window of task outcomes
- Mood modifier injected into LLM system prompt
- Inter-entity messaging: `send_message` tool available to all entities
- Meeting room visualization when entities collaborate
- Energy/mood indicators in office view (energy bar, mood emoji)

### Phase 5: Productivity Gamification

**Scope:** XP, streaks, achievements, leaderboards.

- XP system: configurable XP per event type (task completed, tool used, delegation, etc.)
- Streak tracking: consecutive days/hours with completed tasks
- Achievement definitions seeded: milestone, streak, performance, social categories
- Achievement engine: subscribes to events, evaluates criteria, awards
- Leaderboard: entity ranking by XP, filterable by department and time range
- Achievement toasts on dashboard
- Department-level aggregated stats

### Phase 6: Additional Providers + Hardening

**Scope:** Multi-provider support. Production readiness.

- OpenAI via `@langchain/openai`
- Ollama via `@langchain/ollama`
- GitHub Projects board provider
- Token usage and cost tracking per entity (from LangSmith + LangChain callbacks)
- Cost dashboards and budget limits
- Error recovery: retry logic, graceful degradation, crash resumption via LangGraph checkpoints
- Rate limiting for external APIs
- API key encryption at rest

### Phase 7: Advanced Features (Future)

- Jira / Linear board providers
- Code execution sandbox via E2B
- Git integration (branch creation, PR opening via MCP git server)
- Streaming LLM responses rendered live on dashboard
- Shared organization knowledge base (RAG over org docs)
- Office layout drag-and-drop editor
- Custom achievement definitions via UI
- SOUL.md template marketplace
- Multi-user / multi-tenant support

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **LangGraph.js maturity** — JS ecosystem is younger than Python LangGraph | Pin versions, wrap in thin abstraction for critical paths, fall back to manual graph composition if needed |
| **LangSmith free tier limits** — May hit trace volume limits | Self-host Langfuse as fallback; both use similar trace/span models |
| **MCP security** — MCP servers lack auth by default | Run MCP servers locally only, use capability filtering per entity, sandbox shell access via Docker/E2B |
| **SQLite concurrent writes** — Multiple entity runtimes writing simultaneously | WAL mode, serialize writes through repository layer, single write queue |
| **LLM cost accumulation** — Many entities = many API calls | Per-entity budget caps, token tracking via LangChain callbacks, prefer smaller models for routine tasks |
| **Manager delegation errors** — LLM-based routing may pick wrong worker | Typed skill matching as pre-filter before LLM decides; human override via dashboard |
| **SOUL.md prompt bloat** — Complex personalities inflate context | Max SOUL.md size limit, extract only relevant sections per task type |
| **SSE connection management** — Browser limits concurrent SSE connections | Single multiplexed SSE stream with event type filtering client-side |
| **Scope creep in Phase 1** — Platform skeleton is broad | Strict definition: interfaces defined, but only entity→task→execute→display flow works end-to-end |

---

## Alternatives Considered

### Vercel AI SDK instead of LangChain.js

The Vercel AI SDK provides a cleaner, lighter provider-agnostic interface with excellent TypeScript support. However, it lacks: graph-based orchestration (LangGraph), built-in checkpointing, supervisor/worker patterns, and integrated observability (LangSmith). For a multi-agent orchestrator, LangChain.js + LangGraph.js provides significantly more out of the box. The Vercel AI SDK would require building all orchestration primitives from scratch.

### WebSocket instead of SSE + REST

WebSocket provides bidirectional communication in a single channel. However, SSE is simpler (HTTP-based, auto-reconnect, no connection upgrade), aligns with how LangGraph and LangSmith stream events, and Hono has first-class SSE support. Client→server commands are infrequent and well-served by REST POST. WebSocket adds complexity without meaningful benefit for this use case.

### Custom tool system instead of MCP

Building a custom tool registry would give full control but zero interoperability. MCP is now supported by VS Code Copilot, Claude Desktop, and most major frameworks. Using MCP means entities can leverage a growing ecosystem of standard tool servers (filesystem, git, shell, databases, APIs) without custom integration code per tool.

### CrewAI / AutoGen instead of LangGraph.js

CrewAI's hierarchical process has documented wrong-agent delegation bugs. AutoGen is Python-only and uses a group chat model that doesn't map well to our department/hierarchy concept. LangGraph.js provides the most control, the best observability, and is available in JavaScript.

### In-house gamification vs. Trophy API

Trophy provides headless gamification APIs (XP, streaks, leaderboards). However, our gamification is tightly coupled to domain events (entity state changes, task completions, LLM metrics) that are too specific for a generic service. Building in-house on SQLite keeps it simple and avoids an external dependency. Trophy remains an option if the gamification layer grows complex.

### Phaser 3 instead of PixiJS for isometric office

Phaser 3 has built-in isometric tilemap support and a reference implementation (SkyOffice — MIT, 2.3k stars). However, Phaser manages its own game loop and scene system, requiring awkward manual bridging with React state. PixiJS with `@pixi/react` v8 provides native React JSX bindings — office entities are React components that read from Zustand and render to WebGL. This means the office visualization participates naturally in React's state management and lifecycle. PixiJS is also smaller (~450KB vs ~1.2MB), faster in benchmarks, and proven at scale by Gather.town.

### CSS/SVG instead of PixiJS for office rendering

CSS transforms and SVG can achieve isometric projection with zero new dependencies. However, DOM manipulation for each entity's position update triggers re-layout and re-painting per frame. With 20-50 animated entities, speech bubbles, and movement animations, this performs poorly. WebGL (via PixiJS) batches all rendering in a single canvas, handling hundreds of sprites at 60fps.

### Three.js / React Three Fiber for 3D isometric

Three.js with an orthographic camera can produce an isometric look using actual 3D geometry. React Three Fiber provides excellent React bindings. However, this uses 3D engines and 3D modeling workflows for what is fundamentally a 2D sprite-based visualization. The asset pipeline (3D models vs sprite sheets), tooling complexity, and rendering overhead are all higher than needed. If the office visualization later upgrades to full 3D, R3F becomes the right choice.
