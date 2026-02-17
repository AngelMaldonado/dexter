---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---

# Discovery & Solution Architecture

## Overview

Transform a user's raw pain point or problem into a fully researched, validated solution design. This is a structured multi-phase process that moves from problem understanding → deep research → technology selection → documented solution plan.

**Output artifacts:**
- `docs/context/OVERVIEW.md` — Expanded problem space, pain points, and user context
- `docs/plans/domain/MAIN.md` — Detailed solution proposal with technologies, flows, and user stories

---

## Phase 1: Problem Deep-Dive

**Goal:** Deeply understand what the user actually needs — not just what they said.

When the user gives you their initial prompt (a pain point, problem, or idea):

1. **Analyze the prompt silently first.** Before responding, consider:
   - What is the explicit problem stated?
   - What implicit problems might exist underneath it?
   - Who is affected? (end users, developers, operations, business?)
   - What is the current workflow or status quo they want to change?
   - What would "solved" look like from their perspective?

2. **Enter interview mode** and formulate targeted questions. Ask questions using `AskUserQuestion`. Focus on:
   - **Problem scope:** "Who exactly experiences this problem? How often? What triggers it?"
   - **Current state:** "How is this handled today? What tools or processes exist?"
   - **Impact:** "What happens when this problem occurs? What's the cost (time, money, frustration)?"
   - **Constraints:** "Are there budget, timeline, team size, or technology constraints?"
   - **Prior attempts:** "Has anything been tried before? What worked or didn't?"
   - **Success criteria:** "How will you know this is solved? What does the ideal outcome look like?"

3. **Prefer multiple-choice questions** when you can anticipate likely answers. Use open-ended questions only when the answer space is too broad to predict.

4. **Ask 4-6 questions total** in this phase. Do not overwhelm — each question should build on previous answers to progressively narrow the problem space.

---

## Phase 2: Technology Research

**Goal:** Find the best technological approaches to solve the validated problem.

Once you have enough problem context:

1. **Web research first.** Use `WebSearch` to explore:
   - How similar problems are solved in the industry
   - Existing products, tools, or services that address this space
   - Best practices, architectural patterns, and common pitfalls
   - Recent developments (prioritize current year sources)
   - Open-source vs. commercial solutions

2. **Deep-dive with Context7.** Use the `context7` MCP tool (if available) to search for:
   - Specific libraries and their documentation
   - Framework comparisons and benchmarks
   - API capabilities and limitations
   - Integration patterns between shortlisted technologies

3. **Synthesize findings** into 2-3 concrete solution approaches, each with:
   - Core technology stack
   - Key libraries/frameworks
   - Architecture pattern (monolith, microservices, serverless, etc.)
   - Pros, cons, and trade-offs
   - Rough complexity estimate (low / medium / high)

---

## Phase 3: Solution Proposal & User Alignment

**Goal:** Present your researched options and let the user shape the final direction.

1. **Present approaches using `AskUserQuestion`**, structured as:
   - **Option A (Recommended):** Brief description with why you recommend it
   - **Option B:** Alternative approach with different trade-offs
   - **Option C (if applicable):** Lighter/heavier alternative

2. **For each selected approach, drill down** with follow-up questions:
   - Technology preferences: "Do you have experience with or preference for any of these?"
   - Deployment: "Where will this run? Cloud, on-prem, edge, hybrid?"
   - Scale: "What's the expected load/usage? Is this a prototype or production target?"
   - Integration: "What existing systems does this need to connect to?"

3. **Converge on a single solution direction** before proceeding to documentation.

---

## Phase 4: Documentation

**Goal:** Produce the two key artifacts with all gathered context.

### `docs/context/OVERVIEW.md`

Write this file with the following structure:

```markdown
# Project Overview

## Problem Statement
[Clear, expanded description of the core problem — written so that anyone reading it cold understands the pain]

## Pain Points
[Bulleted list of specific pain points discovered during Phase 1, each with context on who is affected and how]

## Current State
[How things work today — the status quo the user wants to change]

## Target State
[What "solved" looks like — the desired outcome in concrete terms]

## Success Criteria
[Measurable or observable criteria that indicate the problem is solved]

## Constraints & Assumptions
[Budget, timeline, team, technology, and other constraints gathered during discovery]
```

### `docs/plans/domain/MAIN.md`

Write this file with the following structure:

```markdown
# Solution Plan

## Chosen Approach
[Name and one-paragraph summary of the selected solution direction]

## Technology Stack
[Specific technologies, libraries, frameworks, and tools — with version recommendations where relevant]

| Layer          | Technology   | Purpose                    |
| -------------- | ------------ | -------------------------- |
| [e.g. Runtime] | [e.g. Bun]   | [e.g. JS runtime & bundler] |
| ...            | ...          | ...                        |

## Architecture Overview
[High-level architecture description — components, their responsibilities, and how they interact. Include a text diagram if helpful]

## Key Flows
[Describe the main user/system flows step by step. Use numbered lists for sequential flows]

### Flow 1: [Name]
1. Step...
2. Step...

## User Stories (if applicable)
[User stories in standard format: "As a [role], I want [goal], so that [benefit]"]

- **US-01:** As a [role], I want to [action], so that [outcome].
- ...

## Implementation Phases
[Break the solution into ordered phases/milestones. Each phase should be independently deliverable]

### Phase 1: [Name]
- Scope: [what's included]
- Deliverable: [what's produced]

### Phase 2: [Name]
- ...

## Risks & Mitigations
[Known risks and how the plan addresses them]

## Alternatives Considered
[Brief mention of rejected approaches from Phase 3 and why they were not selected]
```

---

## Key Principles

- **One question at a time** — Never overwhelm with multiple questions in a single message
- **Multiple choice preferred** — Easier to answer than open-ended; use when possible
- **Research before proposing** — Never propose technologies without first searching for current best options
- **Show your work** — When presenting options, explain the reasoning and trade-offs
- **User decides, you advise** — Present recommendations with reasoning, but the user makes the final call
- **YAGNI ruthlessly** — Scope the solution to the actual problem, not hypothetical future needs
- **Concrete over abstract** — Name specific technologies, libraries, and patterns rather than vague categories
