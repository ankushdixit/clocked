# Claude Code Time Tracker - Complete Product Specification

_Version 2.0 | January 2026_

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [The Human-in-the-Loop Concept](#the-human-in-the-loop-concept)
4. [Target Users](#target-users)
5. [Tech Stack](#tech-stack)
6. [Data Sources & Architecture](#data-sources--architecture)
7. [Multi-Layer Time Model](#multi-layer-time-model)
8. [Data Models](#data-models)
9. [Core Features](#core-features)
10. [UI/UX Design](#uiux-design)
11. [Implementation Phases](#implementation-phases)
12. [Parsing & Calculation Logic](#parsing--calculation-logic)
13. [Pricing Model & Cost Calculations](#pricing-model--cost-calculations)
14. [Success Metrics](#success-metrics)
15. [Future Considerations](#future-considerations)
16. [Appendix: Sample Data Structures](#appendix-sample-data-structures)

---

## Executive Summary

**Claude Code Time Tracker** is a desktop application for Claude Code users (especially Max subscribers) to analyze and understand their usage patterns, calculate project costs, and measure human-in-the-loop time across all their projects.

### Key Metrics We Track

| Metric                  | Description                                      | Example Value    |
| ----------------------- | ------------------------------------------------ | ---------------- |
| Wall Clock Time         | Calendar span from first to last activity        | 30.39 hours      |
| Session Time            | Sum of all Claude Code session durations         | 15.59 hours      |
| Active Interaction Time | Message-to-message time (excluding 30min+ gaps)  | 7.73 hours       |
| Human Time              | Time spent reading, thinking, testing, reviewing | 4.98 hours (64%) |
| Claude Time             | Time spent on AI processing and generation       | 2.76 hours (36%) |
| API Equivalent Cost     | What the project would cost on API pricing       | $75.00           |
| Value Multiplier        | API cost / Max subscription cost                 | 3.35x            |

### App Name Options

- `cctime` (Claude Code Time)
- `codetracker`
- `sessionstats`

---

## Problem Statement

Claude Code Max subscribers currently have no visibility into:

1. **Subscription utilization** - How much of their monthly limit have they used?
2. **Project costs** - Which projects consume the most resources?
3. **API equivalent** - What would this cost on API pricing?
4. **Time allocation** - How is time split between human effort and AI processing?
5. **Workflow efficiency** - Where are the bottlenecks in their development process?

### The Gap

Claude Code stores rich session data locally (`~/.claude/projects/`), but there's no tool to:

- Aggregate this data across projects
- Visualize usage patterns
- Calculate costs and value
- Measure human-in-the-loop time

This app fills that gap.

---

## The Human-in-the-Loop Concept

> "One metric I obsess over is _human-in-the-loop time_—how long it takes me to go from idea to shipped product. I've compressed this from weeks to days to hours. Eventually, I want to bring it down to minutes."

### Definition

**Human-in-the-loop time** represents the total human effort required to ship a product when working with AI assistance. This is different from:

- **Wall clock time**: Calendar time from start to finish (includes sleep, breaks, other work)
- **AI processing time**: Time the AI spends generating responses
- **Tool execution time**: Time spent running tests, builds, deployments

### Why It Matters

The goal is to **minimize human-in-the-loop time while maintaining quality**. This requires:

1. **Perfect context continuity** - AI should know everything about the project
2. **Automated quality gates** - Tests, linting, type checking run automatically
3. **Captured learnings** - Never rediscover the same gotcha twice
4. **Efficient workflows** - Minimize time spent re-explaining or debugging AI mistakes

By measuring these time layers, we can identify bottlenecks and optimize the human-AI collaboration.

### Key Finding: 2:1 Human to AI Ratio

During active interaction, the split is approximately **64% human : 36% AI**. This means:

- For every hour of AI processing, there's ~1.8 hours of human activity
- Human time includes reading, thinking, testing, and reviewing
- AI time includes API latency, thinking, and generation

---

## Target Users

### Primary: Claude Code Max Subscribers

- Heavy users who want to understand their value vs subscription cost
- Solo developers building multiple projects
- Developers optimizing their AI-assisted workflow

### Secondary: Claude Code API Users

- Users considering switching to Max subscription
- Users wanting to compare API costs vs subscription

### Tertiary: Team Leads / Managers

- Understanding team productivity with AI tools
- Estimating project costs and timelines

---

## Tech Stack

### Core Framework

- **Solokit Dashboard Refine Stack** - Initialized from solokit templates
- **Electron** - Desktop app wrapper for cross-platform support

### Frontend

- **React 19** - UI framework
- **Next.js 16** - React framework (runs in Electron renderer)
- **TypeScript 5.9** - Type safety throughout
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library
- **Recharts** - Data visualization and charts
- **Refine** - Data provider abstraction and hooks

### Backend (Electron Main Process)

- **Node.js** - Runtime for Electron main process
- **better-sqlite3** - Local SQLite database for caching parsed data
- **chokidar** - File watching for real-time updates
- **date-fns** - Date manipulation

### Development

- **ESLint + Prettier** - Linting and formatting
- **Jest + React Testing Library** - Unit tests
- **Playwright** - E2E tests

### Build & Distribution

- **electron-builder** - Package for Mac/Windows/Linux
- **electron-updater** - Auto-updates (future)

### Project Initialization

```bash
# Step 1: Initialize with solokit Dashboard Refine stack
cd /Users/ankushdixit/Projects/project-time
sk init
# Select: Dashboard Refine
# Select: Standard tier (or higher)
# Select: 80% coverage

# Step 2: Add Electron dependencies
npm install electron electron-builder
npm install --save-dev concurrently wait-on cross-env

# Step 3: Add data processing dependencies
npm install better-sqlite3 chokidar date-fns
npm install --save-dev @types/better-sqlite3
```

---

## Data Sources & Architecture

### Primary Data Source: Claude Code Sessions

**Location:** `~/.claude/projects/{project-path-encoded}/`

**Files:**

- `sessions-index.json` - Index of all sessions with metadata
- `{session-id}.jsonl` - Full conversation history for each session

### Secondary Data Sources

| Source      | Command                                | Data Provided                  |
| ----------- | -------------------------------------- | ------------------------------ |
| Git Commits | `git log --format="%ai\|\|\|%s" --all` | Timestamps, messages, authors  |
| GitHub PRs  | `gh pr list --state all --json ...`    | Creation, merge times, titles  |
| GitHub CI   | `gh run list --json ...`               | CI run times, pass/fail status |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ELECTRON APPLICATION                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                     RENDERER PROCESS (Next.js)                      │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │ │
│  │  │  Dashboard  │  │   Project   │  │   Session   │                │ │
│  │  │    View     │  │   Detail    │  │   Detail    │                │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │ │
│  │  │  Timeline   │  │   Charts    │  │  Settings   │                │ │
│  │  │    View     │  │ (Recharts)  │  │    View     │                │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                │ │
│  │                          │                                          │ │
│  │                          ▼                                          │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │              Refine Data Provider (IPC Bridge)               │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    │ IPC                                 │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                       MAIN PROCESS (Node.js)                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │ │
│  │  │   Session   │  │   Message   │  │    Cost     │                │ │
│  │  │   Parser    │  │   Parser    │  │ Calculator  │                │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │ │
│  │  │     Git     │  │   GitHub    │  │    Time     │                │ │
│  │  │  Analyzer   │  │  Analyzer   │  │ Calculator  │                │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                │ │
│  │                          │                                          │ │
│  │                          ▼                                          │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │                    SQLite Cache (better-sqlite3)             │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         FILE SYSTEM                                 │ │
│  │  ~/.claude/projects/   │   git repos   │   GitHub API              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### File Watching Strategy

The app watches `~/.claude/projects/` for changes using chokidar:

- New session files trigger re-parsing
- Modified sessions update cached data
- Provides real-time usage tracking during active work

---

## Multi-Layer Time Model

Time spent on a project is understood as nested layers, each progressively more granular:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: Wall Clock Time                                      30.39 hours  │
│ (First activity to last activity - includes sleep, breaks)                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ LAYER 2: Session Time                                  15.59 hours   │  │
│  │ (Sum of all Claude Code session durations)             (51% of L1)   │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │ LAYER 3: Active Interaction Time                7.73 hours     │  │  │
│  │  │ (Time between messages, excluding 30min+ gaps)  (50% of L2)     │  │  │
│  │  │  ┌───────────────────────────────────────────────────────────┐  │  │  │
│  │  │  │ LAYER 4A: Human Time           4.98 hrs (64%)            │  │  │  │
│  │  │  │ (Reading, thinking, testing, reviewing)                   │  │  │  │
│  │  │  ├───────────────────────────────────────────────────────────┤  │  │  │
│  │  │  │ LAYER 4B: Claude Time          2.76 hrs (36%)            │  │  │  │
│  │  │  │ (API calls, thinking, generating)                         │  │  │  │
│  │  │  └───────────────────────────────────────────────────────────┘  │  │  │
│  │  │  [Gaps within sessions: 7.86 hrs - longer pauses]               │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │  [Between sessions: 14.80 hrs - breaks, sleep, other work]            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

PARALLEL TRACKS (not additive):
├── CI/CD Time:    1.52 hours (runs while you work)
└── PR Lifecycle:  1.68 hours (subset of session time)
```

### Layer Definitions

| Layer | Name               | Definition                                           | Use Case                                                         |
| ----- | ------------------ | ---------------------------------------------------- | ---------------------------------------------------------------- |
| 1     | Wall Clock         | First timestamp → Last timestamp                     | "How long was this project active?"                              |
| 2     | Session Time       | Sum of (session.modified - session.created)          | "How much time did I spend working?" Best for billing/estimation |
| 3     | Active Interaction | Time between messages, excluding 30min+ gaps         | "How much was actual keyboard time?"                             |
| 4A    | Human Time         | Time between Claude response end → next user message | "How much was MY contribution?"                                  |
| 4B    | Claude Time        | Time between user message → Claude response start    | "How much was AI processing?"                                    |

### Key Insight: Session Time is Primary

For projects built with Claude Code:

- **94% of commits happen inside sessions**
- **90%+ of PRs are created and merged inside sessions**
- **CI runs in parallel and doesn't block work**

Therefore, **Session Time** is the most accurate measure of actual human effort.

---

## Data Models

### Session Record

```typescript
interface Session {
  id: string;
  projectPath: string;
  projectName: string; // Derived from path
  created: Date;
  modified: Date;
  duration: number; // milliseconds
  messageCount: number;
  summary?: string;
  firstPrompt?: string;
  gitBranch?: string;

  // Calculated fields (from JSONL parsing)
  activeTime?: number; // ms, excluding 30min+ gaps
  humanTime?: number; // ms
  claudeTime?: number; // ms
  tokens?: TokenUsage;
  toolCalls?: Record<string, number>;
}
```

### Message Record

```typescript
interface Message {
  uuid: string;
  sessionId: string;
  timestamp: Date;
  type: "user" | "assistant" | "tool_result";
  role?: "user" | "assistant";
  content?: MessageContent[];
  tokens?: TokenUsage;
  model?: string;
}

interface MessageContent {
  type: "text" | "thinking" | "tool_use" | "tool_result";
  text?: string;
  thinking?: string;
  name?: string; // tool name
  input?: object; // tool input
  duration?: number; // for tool_result, execution time
}

interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}
```

### Project Summary

```typescript
interface ProjectSummary {
  path: string;
  name: string;
  firstActivity: Date;
  lastActivity: Date;

  // Time metrics
  wallClockTime: number; // ms
  sessionTime: number; // ms
  activeTime: number; // ms
  humanTime: number; // ms
  claudeTime: number; // ms

  // Activity metrics
  sessionCount: number;
  messageCount: number;
  toolCalls: Record<string, number>;

  // Token metrics
  totalTokens: {
    input: number;
    output: number;
    cached: number;
  };

  // Git metrics (if available)
  commits?: number;
  commitsInSession?: number;
  prs?: number;
  prsInSession?: number;

  // Cost metrics
  estimatedApiCost: number;
}
```

### Monthly Summary

```typescript
interface MonthlySummary {
  month: string; // "2026-01"
  startDate: Date;
  endDate: Date;
  daysRemaining: number;

  // Aggregates
  projects: ProjectSummary[];
  totalSessions: number;
  totalSessionTime: number;
  totalActiveTime: number;
  totalHumanTime: number;
  totalClaudeTime: number;
  totalApiCost: number;

  // Subscription metrics
  subscriptionCost: number; // $100 or $200
  valueMultiplier: number; // totalApiCost / subscriptionCost
  estimatedUsagePercent: number; // Based on typical limits
}
```

### Timeline Event

```typescript
interface TimelineEvent {
  timestamp: Date;
  type:
    | "session_start"
    | "session_end"
    | "commit"
    | "pr_created"
    | "pr_merged"
    | "ci_start"
    | "ci_end";
  label: string;
  sessionId?: string;
  metadata?: {
    prNumber?: number;
    commitHash?: string;
    ciStatus?: "success" | "failure";
    inSession?: boolean;
    ciRunning?: boolean;
  };
}
```

---

## Core Features

### 1. Monthly Usage Dashboard

**Purpose:** Show subscription utilization at a glance.

**Key Metrics:**

- Usage percentage (estimated from token consumption)
- Total sessions this month
- Total active time
- Estimated API cost vs subscription cost
- Value multiplier

**Visualizations:**

- Usage meter (progress bar)
- Daily activity heatmap (GitHub-style)
- Time trend line chart

### 2. Project Breakdown

**Purpose:** Compare all projects by usage.

**Key Metrics per Project:**

- Session count
- Session time
- Estimated API cost
- Percentage of total usage

**Features:**

- Sort by sessions, time, cost, or percentage
- Filter by date range
- Click to drill into project detail

### 3. Project Detail View

**Purpose:** Deep dive into a single project.

**Sections:**

- **Time Layers** - Wall clock, session, active, human/AI split
- **Human vs AI Split** - Visual bar chart showing ratio
- **Activity Metrics** - Sessions, messages, tool calls, commits, PRs
- **Tool Breakdown** - Bar chart of tool usage (Bash, Edit, Read, Write, etc.)
- **Cost Analysis** - Token breakdown with pricing

### 4. Timeline View

**Purpose:** Chronological view of all project events.

**Event Types:**

- Session start/end
- Commits
- PR created/merged
- CI start/end

**Features:**

- Color-coded by event type
- Shows overlap (commit during session, CI while working)
- Filterable by event type
- Zoomable date range

### 5. Session Detail View

**Purpose:** Analyze individual sessions.

**Sections:**

- Session summary and duration
- Message breakdown (user vs assistant)
- Token usage with cache hit rate
- Tool usage breakdown
- Human vs Claude time split

### 6. Settings

**Purpose:** Configure the app.

**Options:**

- Subscription type (Max $100 / Max $200 / API)
- Claude projects directory path (default: `~/.claude/projects/`)
- Idle threshold for gap detection (default: 30 minutes)
- Theme (light/dark/system)

---

## UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌─────────┐                                              ┌──────────┐  │
│  │  Logo   │        Claude Code Time Tracker              │ Settings │  │
│  └─────────┘                                              └──────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────────────────────────────────────┐ │
│ │             │ │                                                     │ │
│ │  SIDEBAR    │ │                    MAIN CONTENT                     │ │
│ │             │ │                                                     │ │
│ │  Dashboard  │ │  ┌─────────────────────────────────────────────┐   │ │
│ │  Projects   │ │  │                                             │   │ │
│ │  Timeline   │ │  │           (View-specific content)           │   │ │
│ │             │ │  │                                             │   │ │
│ │ ─────────── │ │  │                                             │   │ │
│ │             │ │  └─────────────────────────────────────────────┘   │ │
│ │  Recent     │ │                                                     │ │
│ │  Projects:  │ │  ┌─────────────────────────────────────────────┐   │ │
│ │  - solokit  │ │  │                                             │   │ │
│ │  - metab... │ │  │           (Secondary panels/charts)         │   │ │
│ │  - rainc... │ │  │                                             │   │ │
│ │             │ │  └─────────────────────────────────────────────┘   │ │
│ │             │ │                                                     │ │
│ └─────────────┘ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Dashboard View Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        JANUARY 2026 USAGE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Usage: [████████████████████████░░░░░░░░░░░░░] 65%              │   │
│  │  Days remaining: 10                                               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   127           │  │   48.5 hrs      │  │   $485          │         │
│  │   Sessions      │  │   Active Time   │  │   API Cost      │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   $100          │  │   4.85x         │  │   64% / 36%     │         │
│  │   Subscription  │  │   Value         │  │   Human / AI    │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  ACTIVITY HEATMAP                                                 │   │
│  │  [GitHub-style calendar heatmap showing daily session activity]   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  TOP PROJECTS                                                     │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │ solokit        45 sessions   22.3h   $180    ████████ 37%  │  │   │
│  │  │ metabolikal    24 sessions   15.6h    $75    ████     15%  │  │   │
│  │  │ raincheck      32 sessions   18.2h    $95    █████    20%  │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Project Detail View Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back                    METABOLIKAL                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────┐  ┌─────────────────────────┐   │
│  │  TIME LAYERS                        │  │  HUMAN vs AI            │   │
│  │                                     │  │                         │   │
│  │  Wall Clock:    30.39 hours         │  │  Human ████████████ 64% │   │
│  │  Session Time:  15.59 hours         │  │  Claude ███████    36%  │   │
│  │  Active Time:    7.73 hours         │  │                         │   │
│  │  ├─ Human:       4.98 hours         │  │  4.98h vs 2.76h         │   │
│  │  └─ Claude:      2.76 hours         │  │                         │   │
│  └─────────────────────────────────────┘  └─────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────┐  ┌─────────────────────────┐   │
│  │  ACTIVITY METRICS                   │  │  COST ANALYSIS          │   │
│  │                                     │  │                         │   │
│  │  Sessions:       24                 │  │  Input:   $37.50        │   │
│  │  Messages:      877                 │  │  Output:  $37.50        │   │
│  │  Tool Calls:  2,375                 │  │  Cache:  -$18.00        │   │
│  │  Commits:        48 (94% in sess)   │  │  ─────────────────      │   │
│  │  PRs Merged:     21                 │  │  TOTAL:   $57.00        │   │
│  └─────────────────────────────────────┘  └─────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  TOOL USAGE                                                       │   │
│  │                                                                   │   │
│  │  Bash  ████████████████████████████████████████  777             │   │
│  │  Edit  ████████████████████████████              533             │   │
│  │  Read  ██████████████████████████                495             │   │
│  │  Write ████████████                              228             │   │
│  │  Glob  ██                                         42             │   │
│  │  Grep  ██                                         41             │   │
│  │  Other █████████                                 259             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  RECENT SESSIONS                                                  │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │ Jan 20, 18:31  "Quality checks and bug fixes"    37m  76msg│  │   │
│  │  │ Jan 20, 14:02  "Fix Sidebar"                      7m  33msg│  │   │
│  │  │ Jan 20, 10:13  "Dashboard Navigation"            37m  45msg│  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Color Palette

Using shadcn/ui defaults with custom semantic colors:

| Element     | Light Mode    | Dark Mode     | Purpose            |
| ----------- | ------------- | ------------- | ------------------ |
| Human Time  | `blue-500`    | `blue-400`    | Human contribution |
| Claude Time | `purple-500`  | `purple-400`  | AI contribution    |
| Session     | `green-500`   | `green-400`   | Active work        |
| Commit      | `amber-500`   | `amber-400`   | Git activity       |
| PR          | `indigo-500`  | `indigo-400`  | GitHub activity    |
| CI          | `cyan-500`    | `cyan-400`    | CI/CD activity     |
| Cost        | `emerald-500` | `emerald-400` | Money/value        |

---

## Implementation Phases

### Phase 1: Foundation & Core Dashboard (MVP)

**Goal:** Working Electron app with basic dashboard

**Tasks:**

1. Initialize solokit Dashboard Refine stack
2. Set up Electron with Next.js renderer
3. Configure IPC bridge between main and renderer
4. Implement session-index.json parser
5. Build SQLite caching layer
6. Create monthly usage dashboard
7. Create projects list view
8. Basic project detail (session time only)

**Deliverables:**

- Electron app that launches
- Dashboard showing monthly usage
- Projects list with session counts and times
- Basic project detail view

### Phase 2: Deep Analysis

**Goal:** JSONL parsing and human/AI split

**Tasks:**

1. Implement JSONL message parser
2. Calculate active interaction time
3. Calculate human vs Claude time split
4. Token counting and aggregation
5. Tool call extraction and counting
6. Update all views with new metrics
7. Add cost estimation

**Deliverables:**

- Human/AI time split on all views
- Tool usage breakdown charts
- Token counts and cost estimates
- Active time vs session time comparison

### Phase 3: Timeline & Git Integration

**Goal:** Unified timeline with git/GitHub data

**Tasks:**

1. Implement git log parser
2. Implement GitHub PR/CI fetcher (via `gh` CLI)
3. Build timeline event model
4. Create timeline visualization component
5. Detect session/commit/PR overlaps
6. Add commit/PR metrics to project detail

**Deliverables:**

- Timeline view with all event types
- Overlap detection (commits in session, etc.)
- Git/PR metrics on project pages
- Workflow pattern insights

### Phase 4: Polish & Advanced Features

**Goal:** Production-ready app

**Tasks:**

1. Add settings view
2. Implement file watching for real-time updates
3. Add date range filtering
4. Add export functionality (JSON, CSV)
5. Add session detail view
6. Performance optimization for large datasets
7. Error handling and edge cases
8. Add light/dark theme support

**Deliverables:**

- Complete settings panel
- Real-time updates as you work
- Export capabilities
- Polished UI with themes

### Phase 5: Distribution

**Goal:** Distributable app

**Tasks:**

1. Configure electron-builder for Mac/Windows/Linux
2. Code signing (Mac)
3. Auto-updater setup
4. Create landing page / documentation
5. GitHub releases automation

**Deliverables:**

- Downloadable .dmg / .exe / .AppImage
- Auto-update mechanism
- Documentation site

---

## Parsing & Calculation Logic

### Parsing Session Index

```typescript
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface SessionIndexEntry {
  sessionId: string;
  fullPath: string;
  fileMtime: number;
  firstPrompt?: string;
  summary?: string;
  messageCount: number;
  created: string;
  modified: string;
  gitBranch?: string;
  projectPath: string;
  isSidechain: boolean;
}

interface SessionIndex {
  version: number;
  entries: SessionIndexEntry[];
}

function getClaudeProjectsDir(): string {
  return path.join(os.homedir(), ".claude", "projects");
}

function getAllProjects(): string[] {
  const projectsDir = getClaudeProjectsDir();
  return fs.readdirSync(projectsDir).filter((name) => {
    const fullPath = path.join(projectsDir, name);
    return fs.statSync(fullPath).isDirectory();
  });
}

function getSessionIndex(projectDir: string): SessionIndex | null {
  const indexPath = path.join(projectDir, "sessions-index.json");
  if (!fs.existsSync(indexPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  } catch (e) {
    console.error(`Failed to parse ${indexPath}:`, e);
    return null;
  }
}

function parseSessionData(entry: SessionIndexEntry): Session {
  const created = new Date(entry.created);
  const modified = new Date(entry.modified);

  return {
    id: entry.sessionId,
    projectPath: entry.projectPath,
    projectName: path.basename(entry.projectPath),
    created,
    modified,
    duration: modified.getTime() - created.getTime(),
    messageCount: entry.messageCount,
    summary: entry.summary,
    firstPrompt: entry.firstPrompt,
    gitBranch: entry.gitBranch,
  };
}
```

### Parsing JSONL Messages

```typescript
import * as readline from "readline";
import * as fs from "fs";

interface JSONLEntry {
  uuid: string;
  timestamp: string;
  type: "user" | "assistant" | "tool_result";
  sessionId: string;
  message?: {
    role: "user" | "assistant";
    content: any[];
    model?: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
}

async function parseJSONLFile(filePath: string): Promise<Message[]> {
  const messages: Message[] = [];

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const entry: JSONLEntry = JSON.parse(line);
      if (!entry.timestamp) continue;

      messages.push({
        uuid: entry.uuid,
        sessionId: entry.sessionId,
        timestamp: new Date(entry.timestamp),
        type: entry.type,
        role: entry.message?.role,
        content: parseMessageContent(entry.message?.content),
        tokens: entry.message?.usage,
        model: entry.message?.model,
      });
    } catch (e) {
      // Skip malformed lines
      continue;
    }
  }

  return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

function parseMessageContent(content: any[] | undefined): MessageContent[] {
  if (!content) return [];

  return content.map((item) => {
    if (item.type === "text") {
      return { type: "text", text: item.text };
    }
    if (item.type === "thinking") {
      return { type: "thinking", thinking: item.thinking };
    }
    if (item.type === "tool_use") {
      return { type: "tool_use", name: item.name, input: item.input };
    }
    if (item.type === "tool_result") {
      return { type: "tool_result", name: item.name };
    }
    return item;
  });
}
```

### Calculating Time Splits

```typescript
const IDLE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

interface TimeSplit {
  activeTime: number;
  humanTime: number;
  claudeTime: number;
  idleTime: number;
}

function calculateTimeSplit(messages: Message[]): TimeSplit {
  let humanTime = 0;
  let claudeTime = 0;
  let idleTime = 0;

  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const curr = messages[i];
    const diff = curr.timestamp.getTime() - prev.timestamp.getTime();

    // Skip gaps > threshold (likely idle)
    if (diff > IDLE_THRESHOLD_MS) {
      idleTime += diff;
      continue;
    }

    // Human time: between Claude response and next user message
    if (prev.type === "assistant" && curr.type === "user") {
      humanTime += diff;
    }
    // Claude time: between user message and Claude response
    else if (prev.type === "user" && curr.type === "assistant") {
      claudeTime += diff;
    }
    // Tool results are part of Claude's turn
    else if (prev.type === "tool_result" && curr.type === "assistant") {
      claudeTime += diff;
    } else if (prev.type === "assistant" && curr.type === "tool_result") {
      claudeTime += diff;
    }
  }

  return {
    activeTime: humanTime + claudeTime,
    humanTime,
    claudeTime,
    idleTime,
  };
}
```

### Extracting Tool Calls

```typescript
function extractToolCalls(messages: Message[]): Record<string, number> {
  const toolCalls: Record<string, number> = {};

  for (const message of messages) {
    if (!message.content) continue;

    for (const content of message.content) {
      if (content.type === "tool_use" && content.name) {
        toolCalls[content.name] = (toolCalls[content.name] || 0) + 1;
      }
    }
  }

  return toolCalls;
}
```

### Aggregating Tokens

```typescript
interface TokenSummary {
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
  cached: number; // cacheCreation + cacheRead
}

function aggregateTokens(messages: Message[]): TokenSummary {
  const summary: TokenSummary = {
    input: 0,
    output: 0,
    cacheCreation: 0,
    cacheRead: 0,
    cached: 0,
  };

  for (const message of messages) {
    if (!message.tokens) continue;

    summary.input += message.tokens.input_tokens || 0;
    summary.output += message.tokens.output_tokens || 0;
    summary.cacheCreation += message.tokens.cache_creation_input_tokens || 0;
    summary.cacheRead += message.tokens.cache_read_input_tokens || 0;
  }

  summary.cached = summary.cacheCreation + summary.cacheRead;
  return summary;
}
```

---

## Pricing Model & Cost Calculations

### Claude API Pricing (as of January 2026)

| Model           | Input    | Output   | Cache Write | Cache Read |
| --------------- | -------- | -------- | ----------- | ---------- |
| Claude Opus 4.5 | $15/MTok | $75/MTok | $18.75/MTok | $1.50/MTok |
| Claude Sonnet 4 | $3/MTok  | $15/MTok | $3.75/MTok  | $0.30/MTok |

### Claude Code Max Subscription

| Plan | Price      | Region     |
| ---- | ---------- | ---------- |
| Max  | $100/month | US         |
| Max  | $200/month | Outside US |

### Cost Calculation Function

```typescript
interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  cacheWriteCost: number;
  cacheReadCost: number;
  totalCost: number;
  cacheSavings: number; // What you saved vs no caching
}

function calculateApiCost(tokens: TokenSummary, model: "opus" | "sonnet" = "opus"): CostBreakdown {
  const pricing =
    model === "opus"
      ? { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 }
      : { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 };

  const inputCost = (tokens.input / 1_000_000) * pricing.input;
  const outputCost = (tokens.output / 1_000_000) * pricing.output;
  const cacheWriteCost = (tokens.cacheCreation / 1_000_000) * pricing.cacheWrite;
  const cacheReadCost = (tokens.cacheRead / 1_000_000) * pricing.cacheRead;

  // Cache savings: what we would have paid at full input price
  const cacheSavings = (tokens.cacheRead / 1_000_000) * (pricing.input - pricing.cacheRead);

  return {
    inputCost,
    outputCost,
    cacheWriteCost,
    cacheReadCost,
    totalCost: inputCost + outputCost + cacheWriteCost + cacheReadCost,
    cacheSavings,
  };
}

function calculateValueMultiplier(apiCost: number, subscriptionCost: number = 100): number {
  return apiCost / subscriptionCost;
}
```

### Usage Percentage Estimation

Since exact Max subscription limits aren't public, we estimate based on typical heavy usage:

```typescript
// Rough estimate: ~$300-500 API equivalent per month is "heavy" Max usage
const ESTIMATED_MAX_EQUIVALENT = 400; // $400 API equivalent

function estimateUsagePercent(apiCost: number): number {
  return Math.min(100, (apiCost / ESTIMATED_MAX_EQUIVALENT) * 100);
}
```

---

## Success Metrics

### User Value

- Users can see their subscription ROI (value multiplier)
- Users identify which projects consume most resources
- Users understand their human:AI time ratio
- Users optimize workflow based on data

### Technical Metrics

- Parse 100 sessions in < 5 seconds
- Support projects with 1000+ sessions
- Accurate token counting (within 5% of actual)
- Reliable git/GitHub correlation
- App startup time < 3 seconds

### Quality Metrics

- 80%+ test coverage
- No critical security vulnerabilities
- Accessible UI (WCAG 2.1 AA)

---

## Future Considerations

### MCP Server Integration

An MCP server could expose these capabilities directly in Claude Code:

```typescript
const tools = [
  {
    name: "get_usage_summary",
    description: "Get current month's Claude Code usage summary",
    parameters: { month: { type: "string", optional: true } },
  },
  {
    name: "get_project_analysis",
    description: "Get detailed time and cost analysis for a project",
    parameters: { project_path: { type: "string", required: true } },
  },
  {
    name: "get_human_ai_split",
    description: "Calculate human vs AI time for a project or session",
    parameters: {
      project_path: { type: "string", optional: true },
      session_id: { type: "string", optional: true },
    },
  },
];
```

### Team Features

- Aggregate usage across team members
- Compare individual productivity
- Team-level cost tracking

### Additional Integrations

- VS Code extension showing current session stats
- Menu bar widget for quick usage check
- Slack/Discord notifications for usage milestones

### AI Insights

- Automatic workflow recommendations
- Productivity pattern detection
- Cost optimization suggestions
- Predict when you'll hit usage limits

### Historical Analysis

- Long-term trends
- Seasonal patterns
- Project lifecycle analysis
- Efficiency improvements over time

---

## Appendix: Sample Data Structures

### sessions-index.json

```json
{
  "version": 1,
  "entries": [
    {
      "sessionId": "c960dc1a-bb6e-4f5f-bafd-460d0d5ce142",
      "fullPath": "/Users/.../.claude/projects/-Users-name-project/c960dc1a.jsonl",
      "fileMtime": 1768936131707,
      "firstPrompt": "run linting, formatting, type checks and...",
      "summary": "Quality checks and bug fixes",
      "messageCount": 76,
      "created": "2026-01-20T18:31:14.171Z",
      "modified": "2026-01-20T19:08:51.407Z",
      "gitBranch": "main",
      "projectPath": "/Users/name/Projects/metabolikal",
      "isSidechain": false
    }
  ]
}
```

### JSONL Message Entry (Assistant with Tool Use)

```json
{
  "parentUuid": "6d5b3244-8b34-4d50-894e-42c7a9f39409",
  "isSidechain": false,
  "userType": "external",
  "cwd": "/Users/name/Projects/metabolikal",
  "sessionId": "c960dc1a-bb6e-4f5f-bafd-460d0d5ce142",
  "version": "2.1.12",
  "gitBranch": "main",
  "type": "assistant",
  "message": {
    "model": "claude-opus-4-5-20251101",
    "id": "msg_01XtHwbvn8817wQh8FQy8s7Y",
    "type": "message",
    "role": "assistant",
    "content": [
      {
        "type": "thinking",
        "thinking": "The user wants me to run the linting checks...",
        "signature": "zbbJhbGciOiJFU..."
      },
      {
        "type": "tool_use",
        "id": "toolu_01Abc123",
        "name": "Bash",
        "input": {
          "command": "npm run lint",
          "description": "Run ESLint"
        }
      }
    ],
    "usage": {
      "input_tokens": 5000,
      "output_tokens": 1500,
      "cache_creation_input_tokens": 28492,
      "cache_read_input_tokens": 0
    }
  },
  "uuid": "deaa06cc-bf26-469d-947c-f3a808191fb2",
  "timestamp": "2026-01-20T18:32:15.792Z"
}
```

### JSONL Message Entry (User)

```json
{
  "parentUuid": "deaa06cc-bf26-469d-947c-f3a808191fb2",
  "isSidechain": false,
  "userType": "external",
  "cwd": "/Users/name/Projects/metabolikal",
  "sessionId": "c960dc1a-bb6e-4f5f-bafd-460d0d5ce142",
  "version": "2.1.12",
  "gitBranch": "main",
  "type": "user",
  "message": {
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "Now fix the type errors"
      }
    ]
  },
  "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-01-20T18:33:45.123Z"
}
```

### Sample Unified Timeline Output

```
Legend: 🟢 Session Start  🔴 Session End  📝 Commit  🔵 PR Created  🟣 PR Merged  ⚙️ CI Start  ✅ CI End

┌─────────────────────────────────────────────────────────────────┐
│  2026-01-19                                                      │
└─────────────────────────────────────────────────────────────────┘
🟢 12:46:30 │ SESSION_START │ Project initialization
📝 15:39:56 │ COMMIT        │ chore: Initialize project [IN SESSION]
🔴 15:50:30 │ SESSION_END   │
🟢 18:19:31 │ SESSION_START │ Supabase Configuration
🔵 18:28:10 │ PR_CREATED    │ #1 Health Check [IN SESSION]
📝 18:30:09 │ COMMIT        │ feat: Add health check [IN SESSION]
🟣 18:30:09 │ PR_MERGED     │ #1 [IN SESSION]
🔴 18:30:25 │ SESSION_END   │

┌─────────────────────────────────────────────────────────────────┐
│  2026-01-20                                                      │
└─────────────────────────────────────────────────────────────────┘
🟢 14:02:26 │ SESSION_START │ Fix Sidebar
📝 14:05:01 │ COMMIT        │ fix: Sidebar fixed position [IN SESSION]
⚙️ 14:06:07 │ CI_START      │ Tests (success) [IN SESSION]
🔵 14:05:57 │ PR_CREATED    │ #15 [IN SESSION]
📝 14:08:15 │ COMMIT        │ Merge PR #15 [IN SESSION] [CI RUNNING]
🟣 14:08:15 │ PR_MERGED     │ #15 [IN SESSION] [CI RUNNING]
✅ 14:08:19 │ CI_END        │ Tests [IN SESSION]
🔴 14:09:02 │ SESSION_END   │
```

---

## Current Limitations & Known Issues

### Human Time May Be Overcounted

The current calculation includes all gaps < 30 minutes as "human time," but some may be:

- Brief interruptions (bathroom, coffee)
- Switching to another application
- Reading documentation elsewhere

### Claude Time May Be Undercounted

The JSONL timestamps record when a response **finishes**, not when it **starts**:

- Streaming time is compressed
- Can't distinguish between thinking time and generation time
- Extended thinking blocks aren't separately tracked

### Tool Execution Time Not Fully Captured

Current parsing doesn't accurately capture:

- Time spent waiting for bash commands
- Build and test durations
- File operation latency

### Token Usage Assumptions

- We assume Opus pricing for all sessions (most Max users use Opus)
- Cache pricing is estimated based on typical patterns
- Actual Max subscription limits are not publicly documented

---

_Last updated: January 21, 2026_
_Version: 2.0_
