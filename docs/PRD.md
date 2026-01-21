# Clocked - Product Requirements Document

## Executive Summary

**Clocked** is a desktop application for Claude Code users (especially Max subscribers) to analyze and understand their usage patterns, calculate project costs, and measure human-in-the-loop time across all their projects. The app reads session data stored locally by Claude Code (`~/.claude/projects/`), parses conversation histories, calculates time splits between human and AI activity, correlates with git/GitHub data, and presents insights through an intuitive dashboard interface.

**Website:** clocked.dev

---

## Problem Statement

### The Problem

Claude Code Max subscribers currently have no visibility into:

1. **Subscription utilization** - How much of their monthly limit have they used?
2. **Project costs** - Which projects consume the most resources?
3. **API equivalent** - What would this cost on API pricing?
4. **Time allocation** - How is time split between human effort and AI processing?
5. **Workflow efficiency** - Where are the bottlenecks in their development process?

Claude Code stores rich session data locally (`~/.claude/projects/`), but there's no tool to aggregate this data across projects, visualize usage patterns, calculate costs and value, or measure human-in-the-loop time.

### Goals

| Goal                        | Measurable Outcome                                            |
| --------------------------- | ------------------------------------------------------------- |
| Subscription ROI visibility | Users can see value multiplier (API cost / subscription cost) |
| Project cost tracking       | Users can compare costs across all projects                   |
| Human:AI ratio insight      | Users can see their 64%:36% (approx) time split               |
| Workflow optimization       | Users can identify which tools/patterns consume most time     |
| Real-time awareness         | Dashboard updates as users work in Claude Code                |

### Non-Goals

- Modifying Claude Code session data
- Syncing data to cloud services
- Team collaboration features (future consideration)
- Mobile app version
- Browser extension

---

## User Personas

### Primary: Claude Code Max Subscribers

- **Who**: Heavy Claude Code users paying $100-200/month for Max subscription
- **Needs**: Understand subscription value, track project costs, optimize workflow
- **Pain Points**: No visibility into usage, can't compare API equivalent cost, don't know human:AI time ratio

### Secondary: Claude Code API Users

- **Who**: Developers using Claude Code with API credits
- **Needs**: Track actual costs, consider switching to Max subscription
- **Pain Points**: Can't easily see if Max would be more economical

### Tertiary: Team Leads / Managers

- **Who**: Engineering managers evaluating AI-assisted development
- **Needs**: Understand productivity impact, estimate project costs
- **Pain Points**: No data to justify AI tooling investment

---

## Technical Constraints

### Stack

- **Framework**: Solokit Dashboard Refine stack (initialized via `sk init`)
- **Desktop Wrapper**: Electron (cross-platform support)
- **Frontend**: React 19 + Next.js 16 + TypeScript 5.9
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Charts**: Recharts
- **Data Provider**: Refine (with custom IPC data provider)
- **Backend (Electron Main)**: Node.js + better-sqlite3 + chokidar + date-fns
- **Testing**: Jest + React Testing Library + Playwright

### External Dependencies

| Service           | Purpose                  | Rate Limits | Auth Method       |
| ----------------- | ------------------------ | ----------- | ----------------- |
| Local file system | Read ~/.claude/projects/ | N/A         | File permissions  |
| Git CLI           | Parse commit history     | N/A         | Local git         |
| GitHub CLI (gh)   | Fetch PR/CI data         | 5000/hour   | OAuth via gh auth |

### Performance Requirements

- Parse 100 sessions in < 5 seconds
- Support projects with 1000+ sessions
- App startup time < 3 seconds
- Token counting accuracy within 5% of actual

### Security Requirements

- **Authentication**: None (local desktop app)
- **Authorization**: Inherits user's file system permissions
- **Data handling**: All data stays local, no network requests except GitHub API (via gh CLI)

### Technical Rules

- **Must use**:
  - Electron IPC for main/renderer communication
  - SQLite for caching parsed data
  - Refine data provider abstraction
  - chokidar for file watching
  - date-fns for date manipulation
- **Must not use**:
  - Direct file access from renderer process
  - External analytics services
  - Cloud storage

---

## MVP Definition

### Must Have (MVP - Phases 1-2)

- [x] Electron app with Next.js renderer
- [x] Session index parser
- [x] SQLite caching layer
- [x] Projects list view
- [x] Monthly usage dashboard with metrics cards
- [x] Basic project detail view
- [x] JSONL message parsing
- [x] Human vs Claude time calculation
- [x] Token counting and cost estimation
- [x] Tool usage breakdown

### Should Have (Post-MVP - Phases 3-4)

- [ ] Git commit integration
- [ ] GitHub PR/CI integration
- [ ] Timeline view
- [ ] Settings panel
- [ ] File watching for real-time updates
- [ ] Session detail view
- [ ] Date range filtering
- [ ] Export functionality (JSON, CSV)
- [ ] Light/dark theme support

### Could Have (Future)

- [ ] MCP server integration
- [ ] VS Code extension
- [ ] Menu bar widget
- [ ] AI-powered workflow recommendations
- [ ] Historical trend analysis

### Won't Have (Out of Scope)

- Team/multi-user features
- Cloud sync
- Mobile app
- Data modification capabilities
- Paid features or subscriptions

---

## User Stories

### Phase 0: Infrastructure

#### Story 0.1: Electron Application Foundation & Setup

**As a** developer
**I want** a fully configured Electron app with Next.js renderer
**So that** I have a working desktop application foundation to build upon

**Acceptance Criteria:**

1. Given the project is initialized with Solokit Dashboard Refine stack
   When I install Electron dependencies
   Then the following packages are installed:
   - `electron` (runtime)
   - `electron-builder` (packaging)
   - `concurrently` (dev scripts)
   - `wait-on` (dev scripts)
   - `cross-env` (cross-platform env vars)
     And package.json contains correct Electron configuration

2. Given Electron is installed
   When I create the main process file (`electron/main.ts`)
   Then it creates a BrowserWindow with:
   - Width: 1200, Height: 800
   - Title: "Clocked"
   - webPreferences.contextIsolation: true
   - webPreferences.nodeIntegration: false
   - webPreferences.preload: points to preload script
     And it loads the Next.js app (dev server in development, built files in production)

3. Given the main process is configured
   When I create the preload script (`electron/preload.ts`)
   Then it uses contextBridge to expose a safe `window.electron` API:
   - `getAppVersion()`: returns app version
   - `getHealth()`: returns { status: 'ok', timestamp: Date }
   - `invoke(channel, ...args)`: generic IPC invoke wrapper
   - `on(channel, callback)`: event listener for main→renderer messages
     And no Node.js APIs are directly exposed to the renderer

4. Given the IPC bridge is configured
   When I set up IPC handlers in the main process
   Then handlers are registered for:
   - `app:version` → returns app.getVersion()
   - `app:health` → returns { status: 'ok', timestamp: new Date().toISOString() }
     And handlers use ipcMain.handle() for async request/response pattern

5. Given Next.js is the renderer
   When I configure the build process
   Then `next.config.js` includes:
   - `output: 'export'` for static export (production)
   - Proper asset prefix for Electron file:// protocol
     And development mode uses `next dev` with hot reload
     And production mode loads from `out/` directory

6. Given all configuration is complete
   When I run `npm run electron:dev`
   Then the Next.js dev server starts
   And Electron waits for the server to be ready
   And the desktop window opens showing the Next.js app
   And hot reload works when editing React components

7. Given the app is running
   When the renderer calls `window.electron.getAppVersion()`
   Then the current version string is returned
   And response time is < 50ms
   And no console errors are present

8. Given the app is running
   When I view the home page
   Then a health check message is displayed: "Clocked is ready"
   And the message confirms IPC is working: "Connected to Electron"

**Technical Notes:**

File Structure:

```
electron/
├── main.ts           # Main process entry point
├── preload.ts        # Preload script (contextBridge)
└── tsconfig.json     # Separate TS config for Electron
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── lib/
│   └── electron/
│       └── ipc.ts    # Type-safe IPC client for renderer
```

Package.json Scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:3000 && electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron:start": "electron ."
  },
  "main": "electron/main.js"
}
```

Electron Main Process Key Code:

```typescript
// electron/main.ts
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Clocked",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"));
  }
}

// IPC Handlers
ipcMain.handle("app:version", () => app.getVersion());
ipcMain.handle("app:health", () => ({ status: "ok", timestamp: new Date().toISOString() }));

app.whenReady().then(createWindow);
```

Preload Script Key Code:

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  getAppVersion: () => ipcRenderer.invoke("app:version"),
  getHealth: () => ipcRenderer.invoke("app:health"),
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
});
```

Type Definitions for Renderer:

```typescript
// src/types/electron.d.ts
declare global {
  interface Window {
    electron: {
      getAppVersion: () => Promise<string>;
      getHealth: () => Promise<{ status: string; timestamp: string }>;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, callback: (...args: any[]) => void) => void;
    };
  }
}
export {};
```

**Dependencies to Install:**

```bash
# Electron runtime and build tools
npm install electron electron-builder

# Development utilities
npm install --save-dev concurrently wait-on cross-env

# Data processing (for later stories)
npm install better-sqlite3 chokidar date-fns
npm install --save-dev @types/better-sqlite3
```

**Testing Requirements:**

- Unit: IPC handler registration, preload script exposes correct API
- Integration: Main-renderer communication round-trip (invoke and response)
- E2E: App launches, displays health message, no console errors

**Dependencies:** None (first story)
**Complexity:** L

---

### Phase 1: Core Dashboard MVP

#### Story 1.1: Session Index Parser & SQLite Cache

**As a** Claude Code user
**I want** the app to read my session data from ~/.claude/projects/
**So that** I can see all my Claude Code activity

**Acceptance Criteria:**

1. Given Claude Code projects exist at ~/.claude/projects/
   When the app starts
   Then all project directories are discovered
   And sessions-index.json is parsed for each project
   And data is cached in SQLite database

2. Given a sessions-index.json file exists
   When parsing the file
   Then the following fields are extracted:
   - sessionId, projectPath, created, modified, messageCount, summary, firstPrompt, gitBranch
     And invalid/malformed entries are skipped with warning logged

3. Given session data is parsed
   When querying the cache
   Then I can retrieve sessions by project
   And I can retrieve sessions by date range
   And response time is < 100ms for 1000 sessions

4. Given no ~/.claude/projects/ directory exists
   When the app starts
   Then an empty state is shown: "No Claude Code sessions found"
   And instructions are provided: "Start using Claude Code to see your activity here"

5. Given a project path is URL-encoded in the directory name
   When parsing the project
   Then the path is correctly decoded (e.g., `-Users-name-project` → `/Users/name/project`)
   And the project name is derived from the last path segment

**Technical Notes:**

- Database location: `~/.clocked/cache.db`
- Tables: `projects`, `sessions`
- Parser: `src/lib/parsers/session-index-parser.ts`
- IPC channels: `sessions:getAll`, `sessions:getByProject`, `projects:getAll`

**Testing Requirements:**

- Unit: Session index parsing logic, path decoding
- Integration: SQLite read/write operations
- E2E: App shows correct project count after parsing

**Dependencies:** Story 0.1
**Complexity:** M

---

#### Story 1.2: Projects List View

**As a** Claude Code user
**I want** to see all my projects with basic metrics
**So that** I can understand my usage across projects

**Acceptance Criteria:**

1. Given session data is loaded
   When I view the Projects page
   Then I see a list of all projects sorted by last activity (most recent first)
   And each project shows: name, session count, total session time, last activity date

2. Given the projects list is displayed
   When I click on a project row
   Then I navigate to the project detail page
   And the URL updates to `/projects/[encoded-path]`

3. Given the projects list is displayed
   When I click the "Sessions" column header
   Then the list sorts by session count (descending)
   And clicking again reverses the sort order

4. Given the projects list is displayed
   When I click the "Time" column header
   Then the list sorts by total session time (descending)
   And time is formatted as "Xh Ym" (e.g., "15h 30m")

5. Given no projects exist
   When I view the Projects page
   Then the empty state from Story 1.1 is shown

**Technical Notes:**

- Page: `src/app/projects/page.tsx`
- Component: `src/components/projects/ProjectsList.tsx`
- Uses Refine's `useList` hook with IPC data provider

**Testing Requirements:**

- Unit: Time formatting, sorting logic
- Integration: Data provider fetches from IPC correctly
- E2E: Projects list renders with correct data

**Dependencies:** Story 1.1
**Complexity:** S

---

#### Story 1.3: Monthly Usage Dashboard

**As a** Claude Code Max subscriber
**I want** to see my monthly usage at a glance
**So that** I can understand my subscription utilization

**Acceptance Criteria:**

1. Given session data is loaded
   When I view the Dashboard page (home route `/`)
   Then I see the current month header (e.g., "JANUARY 2026 USAGE")
   And I see a usage progress bar (estimated percentage)
   And I see days remaining in the billing period

2. Given session data is loaded
   When viewing the metrics cards
   Then I see 6 cards displaying:
   - Total sessions this month
   - Total active time (formatted as "Xh Ym")
   - Estimated API cost (formatted as "$X.XX")
   - Subscription cost ($100 or $200 based on settings)
   - Value multiplier (API cost / subscription cost, formatted as "X.XXx")
   - Human/AI ratio (formatted as "X% / Y%")

3. Given session data spans multiple days
   When viewing the activity heatmap
   Then I see a GitHub-style calendar heatmap for the current month
   And each day's intensity reflects session count (0-4+ sessions = 5 color levels)
   And hovering a day shows tooltip: "X sessions, Y time"

4. Given session data is loaded
   When viewing the "Top Projects" section
   Then I see top 5 projects by session time
   And each row shows: name, session count, time, estimated cost, percentage bar
   And clicking a project navigates to its detail page

5. Given it's the first day of a new month
   When viewing the dashboard
   Then only current month data is shown
   And previous month data is accessible via date selector

**Technical Notes:**

- Page: `src/app/page.tsx` (dashboard)
- Components: `UsageMeter`, `MetricsGrid`, `ActivityHeatmap`, `TopProjects`
- Usage percentage formula: `(estimatedApiCost / ESTIMATED_MAX_EQUIVALENT) * 100` where `ESTIMATED_MAX_EQUIVALENT = 400`

**Testing Requirements:**

- Unit: Usage percentage calculation, date range filtering
- Integration: Monthly aggregation queries
- E2E: Dashboard displays all sections with real data

**Dependencies:** Story 1.1, Story 1.2
**Complexity:** M

---

#### Story 1.4: Basic Project Detail View

**As a** Claude Code user
**I want** to see detailed metrics for a single project
**So that** I can understand that project's usage

**Acceptance Criteria:**

1. Given I navigate to `/projects/[encoded-path]`
   When the page loads
   Then I see the project name as the page title
   And I see a "Back" button that returns to projects list

2. Given project data is loaded
   When viewing the "Time Layers" card
   Then I see:
   - Wall Clock Time: first timestamp → last timestamp
   - Session Time: sum of (modified - created) for all sessions
   - (Active Time, Human Time, Claude Time shown as "—" until Story 2.1)

3. Given project data is loaded
   When viewing the "Activity Metrics" card
   Then I see:
   - Session count
   - Message count (sum across all sessions)
   - (Tool calls shown as "—" until Story 2.2)

4. Given project has sessions
   When viewing the "Recent Sessions" list
   Then I see sessions sorted by date (most recent first)
   And each session shows: date/time, summary (or first prompt), duration, message count
   And clicking a session navigates to session detail (placeholder until Story 4.3)

5. Given a project has no sessions
   When viewing the project detail
   Then empty state is shown: "No sessions found for this project"

**Technical Notes:**

- Page: `src/app/projects/[path]/page.tsx`
- Components: `TimeLayersCard`, `ActivityMetricsCard`, `SessionsList`
- Duration formatting: Use date-fns `formatDuration`

**Testing Requirements:**

- Unit: Time layer calculations, duration formatting
- Integration: Project-specific queries
- E2E: Project detail shows correct metrics

**Dependencies:** Story 1.2
**Complexity:** M

---

### Phase 2: Deep Analysis

#### Story 2.1: JSONL Message Parsing & Time Calculations

**As a** Claude Code user
**I want** detailed time breakdown for my sessions
**So that** I can understand my human vs AI time split

**Acceptance Criteria:**

1. Given a session exists with a JSONL file
   When parsing the JSONL file
   Then each message is extracted with: uuid, timestamp, type (user/assistant/tool_result), content
   And messages are sorted chronologically
   And parsing handles malformed lines gracefully (skip with warning)

2. Given messages are parsed for a session
   When calculating active interaction time
   Then time between consecutive messages is summed
   And gaps > 30 minutes (configurable) are excluded as "idle time"
   And the result is stored as `activeTime` in the cache

3. Given messages are parsed for a session
   When calculating human vs Claude time
   Then "human time" = time between assistant response → next user message (< 30min gaps)
   And "Claude time" = time between user message → assistant response (< 30min gaps)
   And tool_result → assistant time is counted as Claude time
   And the ratio is approximately 64% human : 36% Claude

4. Given time calculations are complete
   When viewing the Project Detail page
   Then the Time Layers card shows:
   - Active Interaction Time (with percentage of session time)
   - Human Time (with percentage of active time)
   - Claude Time (with percentage of active time)

5. Given time calculations are complete
   When viewing the Human vs AI card
   Then a horizontal bar chart shows the split
   And exact hours are displayed (e.g., "4.98h vs 2.76h")

**Known Limitation & Solution:**

- JSONL timestamps record when response **finishes**, not starts
- Streaming time is compressed in the data
- Solution: Accept this as a known limitation; the 64:36 ratio is still directionally accurate

**Technical Notes:**

- Parser: `src/lib/parsers/jsonl-parser.ts`
- Calculator: `src/lib/calculators/time-calculator.ts`
- IPC channels: `sessions:parseMessages`, `sessions:getTimeSplit`
- Idle threshold configurable via settings (default: 30 minutes)

**Testing Requirements:**

- Unit: Gap detection, time split calculation with various message patterns
- Integration: Full session parsing and caching
- E2E: Time split displays correctly on project detail

**Dependencies:** Story 1.4
**Complexity:** L

---

#### Story 2.2: Token Counting & Cost Estimation

**As a** Claude Code Max subscriber
**I want** to see estimated API costs for my usage
**So that** I can understand my subscription value

**Acceptance Criteria:**

1. Given messages are parsed from JSONL
   When extracting token usage
   Then the following fields are summed per session:
   - input_tokens
   - output_tokens
   - cache_creation_input_tokens
   - cache_read_input_tokens

2. Given token counts are available
   When calculating API cost
   Then Opus pricing is used by default:
   - Input: $15/MTok
   - Output: $75/MTok
   - Cache Write: $18.75/MTok
   - Cache Read: $1.50/MTok
     And total cost = (input _ 15 + output _ 75 + cache*write * 18.75 + cache*read * 1.5) / 1,000,000

3. Given cost is calculated
   When viewing the project detail "Cost Analysis" card
   Then I see breakdown:
   - Input cost
   - Output cost
   - Cache write cost
   - Cache read cost
   - Total cost
   - Cache savings (what full input price would have been for cached reads)

4. Given monthly costs are aggregated
   When viewing the dashboard
   Then the "Estimated API Cost" card shows monthly total
   And the "Value Multiplier" card shows: `totalApiCost / subscriptionCost`
   And values > 1x are highlighted in green (good value)

5. Given subscription type is set in settings
   When calculating value multiplier
   Then $100 is used for US subscribers
   And $200 is used for non-US subscribers

**Technical Notes:**

- Calculator: `src/lib/calculators/cost-calculator.ts`
- Pricing stored in config: `src/lib/config/pricing.ts`
- Format currency with Intl.NumberFormat

**Testing Requirements:**

- Unit: Cost calculation with various token combinations
- Integration: Aggregation across sessions and projects
- E2E: Cost displays on dashboard and project detail

**Dependencies:** Story 2.1
**Complexity:** M

---

#### Story 2.3: Tool Usage Analytics

**As a** Claude Code user
**I want** to see which tools Claude uses most
**So that** I can understand my workflow patterns

**Acceptance Criteria:**

1. Given messages are parsed from JSONL
   When extracting tool calls
   Then each `tool_use` content block is counted
   And tool name is extracted from the `name` field
   And counts are aggregated per session and per project

2. Given tool counts are available
   When viewing the Project Detail "Tool Usage" section
   Then I see a horizontal bar chart
   And tools are sorted by count (descending)
   And each bar shows: tool name, count, visual bar
   And top tools typically include: Bash, Edit, Read, Write, Glob, Grep, Task

3. Given tool counts are available
   When viewing the project Activity Metrics card
   Then total tool calls count is displayed

4. Given tool usage data spans multiple sessions
   When viewing tool breakdown
   Then I can see all-time totals for the project
   And optionally filter by date range

**Technical Notes:**

- Extractor: `src/lib/parsers/tool-extractor.ts`
- Component: `src/components/charts/ToolUsageChart.tsx`
- Use Recharts BarChart

**Testing Requirements:**

- Unit: Tool extraction from various content structures
- Integration: Aggregation across sessions
- E2E: Tool chart renders with correct data

**Dependencies:** Story 2.1
**Complexity:** S

---

### Phase 3: External Data Integration

#### Story 3.1: Git & GitHub Integration

**As a** Claude Code user
**I want** to correlate my sessions with git commits and PRs
**So that** I can see how much work happens inside vs outside sessions

**Acceptance Criteria:**

1. Given a project has a git repository
   When analyzing the project
   Then git log is parsed: `git log --format="%H|||%ai|||%s" --all`
   And commit data is extracted: hash, timestamp, message
   And commits are stored in the cache

2. Given commits are parsed
   When correlating with sessions
   Then commits are marked as "in session" if timestamp falls within any session's (created, modified) range
   And a percentage is calculated: `commitsInSession / totalCommits`

3. Given gh CLI is authenticated
   When fetching PR data
   Then PRs are retrieved: `gh pr list --state all --json number,title,createdAt,mergedAt,state`
   And PR creation/merge times are correlated with sessions
   And PRs are marked as "in session" if both created AND merged within session time

4. Given gh CLI is authenticated
   When fetching CI data
   Then runs are retrieved: `gh run list --json databaseId,status,conclusion,createdAt,updatedAt`
   And CI run duration is calculated
   And runs are marked if they completed during a session

5. Given git/GitHub data is available
   When viewing project detail
   Then Activity Metrics shows:
   - Commits: X (Y% in session)
   - PRs Merged: X (Y% in session)
   - CI Runs: X

6. Given gh CLI is not authenticated or not installed
   When fetching GitHub data
   Then gracefully skip with message: "GitHub data unavailable - run 'gh auth login' to enable"
   And git data (commits) still works independently

**Technical Notes:**

- Parser: `src/lib/parsers/git-parser.ts`
- Fetcher: `src/lib/fetchers/github-fetcher.ts`
- IPC channels: `git:getCommits`, `github:getPRs`, `github:getCIRuns`
- Cache git path per project for faster subsequent access

**Testing Requirements:**

- Unit: Git log parsing, session correlation logic
- Integration: Git and GitHub CLI execution
- E2E: Git metrics display on project detail

**Dependencies:** Story 2.3
**Complexity:** L

---

#### Story 3.2: Timeline View

**As a** Claude Code user
**I want** to see a chronological view of all project events
**So that** I can understand my workflow patterns

**Acceptance Criteria:**

1. Given a project has sessions, commits, PRs, and CI data
   When viewing the Timeline page (`/projects/[path]/timeline`)
   Then all events are displayed chronologically
   And events are grouped by date

2. Given events are displayed
   When viewing the timeline
   Then each event type has a distinct icon and color:
   - Session start/end: green
   - Commit: amber
   - PR created/merged: indigo
   - CI start/end: cyan
     And events show timestamp and label

3. Given events overlap
   When a commit occurs during a session
   Then the commit is tagged with "[IN SESSION]"
   When CI is running during a commit
   Then the commit is tagged with "[CI RUNNING]"

4. Given the timeline is displayed
   When I click an event type filter
   Then only events of that type are shown
   And multiple filters can be active simultaneously

5. Given the timeline has many events
   When scrolling
   Then events load progressively (virtualized list)
   And date headers remain sticky while scrolling

**Technical Notes:**

- Page: `src/app/projects/[path]/timeline/page.tsx`
- Component: `src/components/timeline/Timeline.tsx`
- Event model matches spec's `TimelineEvent` interface
- Use react-window for virtualization

**Testing Requirements:**

- Unit: Event sorting, overlap detection
- Integration: Event aggregation from multiple sources
- E2E: Timeline renders with all event types

**Dependencies:** Story 3.1
**Complexity:** M

---

### Phase 4: Polish & Advanced Features

#### Story 4.1: Settings Panel

**As a** user
**I want** to configure the app settings
**So that** I can customize it to my needs

**Acceptance Criteria:**

1. Given the app is running
   When I click the Settings button in the header
   Then a settings panel opens (modal or slide-over)

2. Given the settings panel is open
   When viewing subscription settings
   Then I can select:
   - Max $100/month (US)
   - Max $200/month (Outside US)
   - API (no subscription)
     And selection is persisted to localStorage
     And changing selection updates dashboard calculations immediately

3. Given the settings panel is open
   When viewing data settings
   Then I see the Claude projects directory path (default: `~/.claude/projects/`)
   And I can change the path via folder picker
   And invalid paths show error: "Directory not found"

4. Given the settings panel is open
   When viewing analysis settings
   Then I can configure idle threshold (default: 30 minutes)
   And valid range is 5-120 minutes
   And changing threshold triggers recalculation of time splits

5. Given the settings panel is open
   When viewing appearance settings
   Then I can select theme: Light / Dark / System
   And theme change applies immediately
   And preference is persisted

**Technical Notes:**

- Component: `src/components/settings/SettingsPanel.tsx`
- Store: `src/lib/stores/settings-store.ts` (Zustand or similar)
- Persist to: localStorage + optional ~/.clocked/settings.json

**Testing Requirements:**

- Unit: Settings validation, default values
- Integration: Settings persistence and retrieval
- E2E: Settings changes affect app behavior

**Dependencies:** Story 2.2
**Complexity:** M

---

#### Story 4.2: File Watching & Real-time Updates

**As a** Claude Code user
**I want** the dashboard to update as I work
**So that** I can see live usage data

**Acceptance Criteria:**

1. Given the app is running
   When a new session file is created in ~/.claude/projects/
   Then the sessions list updates within 2 seconds
   And the dashboard metrics update

2. Given the app is running
   When an existing session's JSONL is modified
   Then the cached data is invalidated
   And the session is re-parsed
   And updated metrics are displayed

3. Given the app is running
   When a sessions-index.json file is modified
   Then the session list for that project is refreshed
   And any new sessions are added to the cache

4. Given file watching is active
   When CPU usage is checked
   Then file watching uses < 1% CPU when idle
   And debounces rapid changes (100ms threshold)

5. Given the app is minimized or in background
   When returning to the app
   Then any missed file changes are processed
   And the UI reflects current state

**Technical Notes:**

- Watcher: `src/lib/watchers/file-watcher.ts`
- Use chokidar with appropriate ignore patterns
- IPC channel: `watch:start`, `watch:stop`, `watch:change`
- Debounce file changes to avoid excessive parsing

**Testing Requirements:**

- Unit: Debounce logic, change detection
- Integration: File system event handling
- E2E: UI updates when session file modified

**Dependencies:** Story 1.3
**Complexity:** M

---

#### Story 4.3: Session Detail View

**As a** Claude Code user
**I want** to analyze individual sessions in detail
**So that** I can understand specific work periods

**Acceptance Criteria:**

1. Given I click on a session in the sessions list
   When the session detail page loads (`/sessions/[sessionId]`)
   Then I see session summary, duration, and timestamps
   And I see the first prompt and summary if available

2. Given session messages are parsed
   When viewing the message breakdown
   Then I see count of user messages, assistant messages, and tool results
   And I see total messages count

3. Given token usage is available
   When viewing the token breakdown
   Then I see:
   - Input tokens
   - Output tokens
   - Cached tokens
   - Cache hit rate (cached / total input \* 100)

4. Given tool calls are extracted
   When viewing the session tool breakdown
   Then I see tool usage specific to this session
   And the breakdown matches the project-level chart format

5. Given time calculations are available
   When viewing the session time analysis
   Then I see:
   - Session duration (modified - created)
   - Active time (excluding idle gaps)
   - Human time / Claude time split
   - Idle time (time in gaps > threshold)

**Technical Notes:**

- Page: `src/app/sessions/[sessionId]/page.tsx`
- Components: `SessionHeader`, `MessageBreakdown`, `TokenBreakdown`, `SessionToolUsage`, `SessionTimeAnalysis`

**Testing Requirements:**

- Unit: Session-level calculations
- Integration: Single session data fetching
- E2E: Session detail displays all metrics

**Dependencies:** Story 2.3
**Complexity:** M

---

### Phase 5: Distribution

#### Story 5.1: Desktop Application Packaging

**As a** user
**I want** to download and install Clocked easily
**So that** I can use it on my computer

**Acceptance Criteria:**

1. Given the build command is run
   When building for macOS
   Then a .dmg installer is produced
   And the app is code-signed (if certificate available)
   And the app passes macOS Gatekeeper

2. Given the build command is run
   When building for Windows
   Then a .exe installer is produced (NSIS)
   And the app can be installed without admin rights (user install)

3. Given the build command is run
   When building for Linux
   Then an .AppImage is produced
   And a .deb package is produced
   And both are executable on Ubuntu 22.04+

4. Given the app is installed
   When checking for updates (future)
   Then auto-updater infrastructure is in place
   And update check can be triggered manually from settings

5. Given the app is built
   When checking the bundle
   Then the app size is < 150MB
   And startup time is < 3 seconds on reasonable hardware
   And no external dependencies are required

**Technical Notes:**

- Builder: electron-builder
- Config: `electron-builder.json`
- Scripts: `package:mac`, `package:win`, `package:linux`
- Assets: App icon in multiple sizes (16, 32, 64, 128, 256, 512, 1024)

**Testing Requirements:**

- Unit: N/A
- Integration: Build scripts execute successfully
- E2E: Packaged app launches and functions correctly

**Dependencies:** All previous stories
**Complexity:** L

---

## Data Models

### Project

```
Field           | Type      | Constraints
----------------|-----------|------------------------------------------
path            | string    | Primary key, URL-decoded project path
name            | string    | Derived from last segment of path
firstActivity   | datetime  | Earliest session created timestamp
lastActivity    | datetime  | Latest session modified timestamp
sessionCount    | integer   | Count of sessions
messageCount    | integer   | Sum of messages across sessions
```

### Session

```
Field           | Type      | Constraints
----------------|-----------|------------------------------------------
id              | string    | Primary key, session UUID
projectPath     | string    | Foreign key to Project
created         | datetime  | Session start time
modified        | datetime  | Session end time
duration        | integer   | ms, modified - created
messageCount    | integer   | From sessions-index.json
summary         | string    | Optional, auto-generated summary
firstPrompt     | string    | Optional, first user message
gitBranch       | string    | Optional, git branch name
activeTime      | integer   | ms, excluding idle gaps
humanTime       | integer   | ms, human contribution
claudeTime      | integer   | ms, AI contribution
inputTokens     | integer   | Sum of input_tokens
outputTokens    | integer   | Sum of output_tokens
cacheCreation   | integer   | Sum of cache_creation_input_tokens
cacheRead       | integer   | Sum of cache_read_input_tokens
```

### Message (in-memory, not persisted)

```
Field           | Type      | Constraints
----------------|-----------|------------------------------------------
uuid            | string    | Unique identifier
sessionId       | string    | Parent session
timestamp       | datetime  | Message timestamp
type            | enum      | user | assistant | tool_result
role            | enum      | user | assistant
content         | array     | MessageContent[]
inputTokens     | integer   | Optional, from usage
outputTokens    | integer   | Optional, from usage
model           | string    | Optional, model identifier
```

### Commit

```
Field           | Type      | Constraints
----------------|-----------|------------------------------------------
hash            | string    | Primary key, git commit hash
projectPath     | string    | Foreign key to Project
timestamp       | datetime  | Commit timestamp
message         | string    | Commit message
inSession       | boolean   | Whether commit occurred during a session
sessionId       | string    | Optional, associated session
```

### PullRequest

```
Field           | Type      | Constraints
----------------|-----------|------------------------------------------
number          | integer   | PR number
projectPath     | string    | Foreign key to Project
title           | string    | PR title
createdAt       | datetime  | Creation timestamp
mergedAt        | datetime  | Optional, merge timestamp
state           | enum      | open | closed | merged
inSession       | boolean   | Whether fully handled in session
```

### TimelineEvent

```
Field           | Type      | Constraints
----------------|-----------|------------------------------------------
timestamp       | datetime  | Event timestamp
type            | enum      | session_start | session_end | commit | pr_created | pr_merged | ci_start | ci_end
label           | string    | Display label
projectPath     | string    | Associated project
sessionId       | string    | Optional, associated session
metadata        | object    | Type-specific data (prNumber, commitHash, ciStatus, etc.)
```

### Settings

```
Field               | Type      | Constraints
--------------------|-----------|------------------------------------------
subscriptionType    | enum      | max_100 | max_200 | api
claudeProjectsDir   | string    | Default: ~/.claude/projects/
idleThresholdMin    | integer   | Default: 30, range: 5-120
theme               | enum      | light | dark | system
```

---

## API Specifications (IPC Channels)

### Projects

**Get All Projects**

- **Channel**: `projects:getAll`
- **Request**: `{}`
- **Response**: `{ projects: Project[] }`
- **Errors**: `PARSE_ERROR` if sessions-index.json malformed

**Get Project by Path**

- **Channel**: `projects:getByPath`
- **Request**: `{ path: string }`
- **Response**: `{ project: Project | null }`

### Sessions

**Get Sessions by Project**

- **Channel**: `sessions:getByProject`
- **Request**: `{ projectPath: string, limit?: number, offset?: number }`
- **Response**: `{ sessions: Session[], total: number }`

**Get Session Detail**

- **Channel**: `sessions:getById`
- **Request**: `{ sessionId: string }`
- **Response**: `{ session: Session | null }`

**Parse Session Messages**

- **Channel**: `sessions:parseMessages`
- **Request**: `{ sessionId: string }`
- **Response**: `{ messages: Message[], timeSplit: TimeSplit, toolCalls: Record<string, number> }`

### Analytics

**Get Monthly Summary**

- **Channel**: `analytics:getMonthlySummary`
- **Request**: `{ month: string }` (format: "2026-01")
- **Response**: `{ summary: MonthlySummary }`

**Get Project Summary**

- **Channel**: `analytics:getProjectSummary`
- **Request**: `{ projectPath: string }`
- **Response**: `{ summary: ProjectSummary }`

### Git/GitHub

**Get Commits**

- **Channel**: `git:getCommits`
- **Request**: `{ projectPath: string }`
- **Response**: `{ commits: Commit[], inSessionCount: number }`

**Get Pull Requests**

- **Channel**: `github:getPRs`
- **Request**: `{ projectPath: string }`
- **Response**: `{ prs: PullRequest[] }` or `{ error: "NOT_AUTHENTICATED" }`

**Get CI Runs**

- **Channel**: `github:getCIRuns`
- **Request**: `{ projectPath: string }`
- **Response**: `{ runs: CIRun[] }` or `{ error: "NOT_AUTHENTICATED" }`

### Timeline

**Get Timeline Events**

- **Channel**: `timeline:getEvents`
- **Request**: `{ projectPath: string, types?: string[], startDate?: string, endDate?: string }`
- **Response**: `{ events: TimelineEvent[] }`

### Settings

**Get Settings**

- **Channel**: `settings:get`
- **Request**: `{}`
- **Response**: `{ settings: Settings }`

**Update Settings**

- **Channel**: `settings:update`
- **Request**: `{ settings: Partial<Settings> }`
- **Response**: `{ success: boolean }`

### File Watching

**Start Watching**

- **Channel**: `watch:start`
- **Request**: `{}`
- **Response**: `{ watching: boolean }`

**Stop Watching**

- **Channel**: `watch:stop`
- **Request**: `{}`
- **Response**: `{ watching: boolean }`

**Change Event** (Main → Renderer)

- **Channel**: `watch:change`
- **Payload**: `{ type: 'add' | 'change' | 'unlink', path: string }`

---

## Success Metrics

| Metric                 | Target         | How Measured                       |
| ---------------------- | -------------- | ---------------------------------- |
| Parse 100 sessions     | < 5 seconds    | Benchmark test                     |
| Support 1000+ sessions | No degradation | Load test                          |
| Token accuracy         | Within 5%      | Compare with Claude API logs       |
| App startup            | < 3 seconds    | Measure cold start                 |
| Test coverage          | 80%+           | Jest coverage report               |
| Bundle size            | < 150MB        | electron-builder output            |
| CPU idle               | < 1%           | Activity Monitor during file watch |

---

## Risks and Mitigations

| Risk                               | Likelihood | Impact | Mitigation                                                |
| ---------------------------------- | ---------- | ------ | --------------------------------------------------------- |
| Claude Code data format changes    | M          | H      | Version check, graceful degradation, clear error messages |
| Large projects slow performance    | M          | M      | SQLite indexing, pagination, virtualized lists            |
| gh CLI not installed/authenticated | H          | L      | Graceful fallback, clear setup instructions               |
| Token counting inaccuracy          | L          | M      | Document as estimate, compare with known values           |
| Electron security vulnerabilities  | L          | H      | Keep dependencies updated, use contextIsolation           |

---

## Color Palette

| Element     | Light Mode    | Dark Mode     | CSS Variable      |
| ----------- | ------------- | ------------- | ----------------- |
| Human Time  | `blue-500`    | `blue-400`    | `--color-human`   |
| Claude Time | `purple-500`  | `purple-400`  | `--color-claude`  |
| Session     | `green-500`   | `green-400`   | `--color-session` |
| Commit      | `amber-500`   | `amber-400`   | `--color-commit`  |
| PR          | `indigo-500`  | `indigo-400`  | `--color-pr`      |
| CI          | `cyan-500`    | `cyan-400`    | `--color-ci`      |
| Cost/Value  | `emerald-500` | `emerald-400` | `--color-cost`    |

---

_PRD Version: 1.0_
_Last Updated: January 21, 2026_
_Status: Ready for Implementation_
