# Project Overview

## Problem Statement

Managing multiple AI agents for real-world software tasks is currently fragmented, opaque, and joyless. Existing multi-agent frameworks (CrewAI, AutoGen, LangGraph) provide orchestration primitives but no unified interface for creating, monitoring, and managing a team of AI entities with distinct identities, skills, and tool access. There is no product that lets you build and run an AI development team as an engaging, observable, gamified experience.

Dexter solves this by providing a **gamified virtual office** where you create AI entities with personalities (SOUL.md), assign them to departments, give them tools via MCP, route tasks from external boards, and watch them work in real-time through a productivity-focused dashboard — complete with XP, streaks, leaderboards, and achievements.

## Pain Points

- **No unified entity management** — Today, running multiple AI agents means juggling separate scripts, configs, and prompts with no central control plane. Each agent is a one-off setup.

- **Zero observability into agent work** — When an AI agent is executing a task, most frameworks provide log spam, not structured real-time visibility. You cannot see what multiple agents are doing concurrently without building custom dashboards.

- **No persistent identity or memory** — Agents are stateless by default. They don't remember past tasks, learn from mistakes, or develop expertise. Every run starts from zero context.

- **No team dynamics** — Existing frameworks treat agents as isolated workers. There's no concept of departments, hierarchies, delegation chains, or inter-agent communication that mirrors how real teams operate.

- **Tool access is ad-hoc** — Giving agents access to filesystem, git, shell, or APIs requires custom wiring per framework. There's no standard way to define what tools an agent can and cannot use, tied to its role.

- **Task routing is manual or naive** — Most multi-agent systems require explicit task assignment. Skill-based routing that considers agent specialization, workload, and energy doesn't exist out of the box.

- **Managing AI agents is boring** — Current tools are developer-facing CLI/API experiences with no engagement layer. There's no reason to check in on your agents unless something breaks. No sense of progress, achievement, or team performance.

- **Board integration is one-off** — Connecting AI agents to Trello, Jira, Linear, or GitHub Projects requires custom integration code for each project. No pluggable adapter system exists.

## Current State

Teams wanting to use AI agents for development tasks have these options:

1. **Single-agent tools** (Claude Code, Cursor, GitHub Copilot) — Powerful but single-threaded. One agent, one task, one developer supervising. No team simulation.

2. **Multi-agent frameworks** (CrewAI, AutoGen, LangGraph) — Provide orchestration primitives but require significant custom code to build a usable system. No built-in UI, no persistent identity, no gamification. Python-centric (except LangGraph.js).

3. **Custom solutions** — Teams build bespoke agent pipelines with LangChain or raw API calls. High effort, no reusability, no standard patterns.

4. **Enterprise platforms** (Anthropic Teams, OpenAI Platform) — Provide API access and basic monitoring but not multi-agent orchestration, tool management, or task routing.

None of these provide: entity identity + tool access control + task routing + real-time dashboard + gamification + board integration in a single product.

## Target State

A running Dexter instance where:

1. You open a web dashboard and see an **isometric virtual office** (PixiJS + @pixi/react) with departments, desks, and animated entity sprites
2. Each entity has a **SOUL.md** defining its personality, skills, communication style, and rules
3. Entities connect to **MCP servers** for tool access (filesystem, git, shell, APIs) with per-entity capability control
4. Tasks flow in from **external boards** (Trello, Jira, Linear, GitHub Projects) via pluggable adapters
5. A **scheduler** routes tasks to the best-fit entity based on skills, workload, and energy
6. **Manager entities** can delegate sub-tasks to worker entities, creating hierarchical workflows
7. Entities build **persistent memory** across tasks — they learn, remember, and improve
8. The dashboard shows **real-time SSE streams** of entity activity, LLM token generation, and task progress
9. A **productivity gamification layer** tracks XP, streaks, achievements, and leaderboards
10. All orchestration runs on **LangGraph.js** with **LangSmith** tracing for full observability
11. Everything persists in **SQLite** — crash-safe, resumable, zero external infrastructure

## Success Criteria

- **Entity lifecycle works end-to-end**: Create entity with SOUL.md, assign LLM provider via LangChain.js, configure MCP tool access, assign task, entity executes autonomously, results visible in dashboard
- **Real-time isometric dashboard**: SSE events trigger PixiJS sprite animations (entity walks to desk, state changes, speech bubbles) within 500ms
- **Task routing**: Scheduler correctly matches tasks to entities by skill overlap > 70% of the time
- **Board sync**: Two-way sync with at least one board provider (Trello) — cards in, status updates out
- **Memory persistence**: Entity recalls relevant context from past tasks when starting a new related task
- **Hierarchy**: A manager entity can decompose a task and delegate sub-tasks to appropriate worker entities
- **Gamification engagement**: XP, streaks, and achievements update automatically based on entity activity
- **Observability**: Every LLM call, tool use, and state transition is traceable in LangSmith
- **Platform skeleton**: All packages exist with defined interfaces, even if not all flows are implemented end-to-end

## Constraints & Assumptions

- **Package manager**: bun (not npm/pnpm)
- **Monorepo**: bun workspaces + Turborepo
- **Runtime**: Node.js + TypeScript (not Python — rules out pure-Python frameworks)
- **Database**: SQLite only — no Redis, Postgres, or external message queues
- **LLM ecosystem**: LangChain.js + LangGraph.js for orchestration, LangSmith for observability
- **Tool system**: MCP-native — entities interact with tools via MCP servers
- **Real-time**: SSE for server-to-client push, REST for client-to-server commands
- **Frontend**: React + Vite (decided in prior iteration)
- **Office rendering**: PixiJS + `@pixi/react` for isometric WebGL canvas, GSAP for animation, `pathfinding` for A* entity movement
- **Map design**: Tiled Map Editor for isometric office layouts (export JSON)
- **Art assets**: Kenney.nl isometric tiles (free CC0), PixelLab AI for character sprites, itch.io packs
- **State management**: Zustand (decided in prior iteration)
- **Backend**: Hono (decided in prior iteration)
- **Single-user MVP**: No multi-tenancy in Phase 1
- **Local-first**: Runs on a single machine. No distributed deployment needed initially
- **Budget**: Open-source tools preferred. LangSmith has a free tier sufficient for development
- **Team size**: Solo developer building incrementally
