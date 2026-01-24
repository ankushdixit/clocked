# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Project Detail Page**: Complete redesign with dashboard-style layout
  - Hero metrics row: Sessions, Session Time, API Cost, Messages with sparklines
  - Time Breakdown Card: Cascading funnel visualization (Clock → Session → Active → Human/AI)
  - Cost Analysis Card: Input, Output, Cache Write, Cache Read costs with savings
  - Quick Stats Card: Tool calls, busiest day, longest session, average duration
  - Merged Projects Card: Grid display of merged projects with unmerge action
  - Recent Sessions: 2-column grid of session cards with date, summary, duration
  - Responsive layout with proper card height alignment

- **Dashboard Real Data Support**: Dashboard cards now display real project data
  - TimeDistributionCard, TopProjectsCard, HourlyDistributionCard accept projects prop
  - Interactive tooltips on pie chart segments
  - Fallback to mock data when no projects available

- **Group Reordering**: Move groups up/down in the projects list
  - Move up/down buttons on group headers
  - Boundary detection (disable at first/last position)
  - Sort order swap via database updates

- **Resume Session in IDE**: Click any session to resume it in your preferred IDE
  - Settings page IDE preference with detection of installed IDEs
  - Support for 11 IDEs: Terminal, iTerm2, VS Code, Cursor, Warp, Windsurf, VSCodium, Zed, Void, Positron, Antigravity
  - macOS AppleScript automation for opening projects and typing resume commands
  - Loading states and error handling with user-friendly messages
  - Sessions sorted by most recent first in project detail view

- **Comprehensive Test Suite**: 422 new tests bringing total to 1,456
  - useProjectsData hook: 29 tests for sorting, filtering, grouping
  - useProjectsListState hook: 43 tests for select mode, merge workflow
  - ProjectGroupSection: 25 tests for collapse, reorder, selection
  - Dashboard cards: 135 tests for metrics, charts, edge cases
  - Core infrastructure: 127 tests for IPC, Refine wrapper, dashboard page

### Changed

- **Projects List View Redesign**: Complete UI overhaul with compact inline design
  - Replaced progress bars with 7-day activity sparklines for better visualization
  - Inline stats layout (sessions, time, last activity) with fixed-width columns for alignment
  - Responsive design: stats wrap to second row below 1024px
  - Collapsible group headers with colored accent indicators
  - Improved sort dropdown with direction arrows (↑/↓) indicating sort order
  - Intuitive arrow direction for name sort (↓ = A-Z, ↑ = Z-A)
  - Checkbox styling shows tick instead of filled background when selected
  - Group-colored checkboxes and selection highlights in merge mode
  - Consistent button styling across Sort, Merge, and Cancel buttons
  - Mobile-responsive toolbar with shortened text on small screens

### Added

- **Project Merge Backend**: Complete backend implementation for merging duplicate projects
  - Database schema: `merged_into` column on projects table with index
  - Database functions: `mergeProjects()`, `unmergeProject()`, `getMergedProjects()`
  - IPC handlers: `projects:merge`, `projects:unmerge`, `projects:getMergedProjects`
  - Preload bridge methods for renderer-to-main communication
  - Idempotent migration for existing databases
  - 22 new tests for merge operations
  - Fixed foreign key constraint error in `deleteProject()` by deleting sessions first

- **Project Merge UI**: Frontend interface for merging duplicate projects
  - Multi-select mode with colored checkboxes matching group colors
  - Merge dialog for selecting primary project
  - Merged projects badge showing count on primary project
  - Unmerge option in project action menu

- **Comprehensive Test Coverage**: 211 tests for project components
  - `ProjectRow.test.tsx` - 30 tests for row rendering and interactions
  - `ProjectRowStats.test.tsx` - 21 tests for sparkline and stats display
  - `ProjectRowActionMenu.test.tsx` - 23 tests for dropdown menu actions
  - `ProjectGroupHeader.test.tsx` - 13 tests for collapsible headers
  - `ProjectsToolbar.test.tsx` - 41 tests for sort/merge controls
  - `MergeDialog.test.tsx` - 22 tests for merge confirmation dialog
  - `activity.test.ts` - 16 tests for activity data generation
  - `time.test.ts` - 17 new tests for `formatLastActivity` function

- **New Utility Functions**:
  - `formatLastActivity()` in `lib/formatters/time.ts` for relative date formatting
  - `generateActivityData()` in `lib/projects/activity.ts` for deterministic sparkline data

### Refactored

- **Projects Components Architecture**: Extracted into modular components
  - `ProjectRow.tsx` - Individual project row with sub-components
  - `ProjectRowStats.tsx` - Sparkline and statistics display
  - `ProjectRowActionMenu.tsx` - Dropdown action menu
  - `ProjectGroupHeader.tsx` - Collapsible group header
  - `ProjectsToolbar.tsx` - Sort dropdown and merge controls
  - `MergeDialog.tsx` - Merge confirmation dialog
  - `ProjectGroupSection.tsx` - Group section wrapper
  - `useProjectsListState.ts` - Custom hook for UI state management
  - `useProjectsData.ts` - Custom hook for data transformations

- **Fixed ESLint Warnings**: Refactored 7 files to comply with max-lines-per-function rule
  - `projects/page.tsx` - Extracted loading/error/empty states
  - `settings/page.tsx` - Extracted section components
  - `ActivityHeatmap.tsx` - Extracted cell and legend components
  - `HumanAIRatioCard.tsx` - Extracted chart sub-components
  - `ProjectsList.tsx` - Extracted custom hooks
  - `ProjectsToolbar.tsx` - Extracted dropdown sub-components
  - `ipc-data-provider.ts` - Extracted resource handlers

### Fixed

- Scroll chaining issue on Projects page (body scroll when scrolling project list)

- Redesigned Dashboard with new card-based UI components:
  - **Hero Metrics Row**: 4 prominent metric cards (Sessions, Session Time, API Cost, Value) with sparklines and trend badges
  - **Today vs Daily Average Card**: Comparison of today's metrics against daily averages
  - **Claude Max Limits Card**: Visual usage trackers for Claude Max subscription limits
  - **Quick Stats Card**: 6 quick stat items (Busiest Day, Longest Session, Peak Hour, Messages, Avg Session, Cost/Session)
  - **Activity Heatmap**: Redesigned with responsive sizing
  - **Session Distribution Card**: Hourly distribution bar chart
  - **Cumulative Cost Card**: Line chart showing cumulative cost trend over time
  - **Top Projects Card**: Sparkline-based project activity visualization
  - **Time Distribution Card**: Morning/Afternoon/Evening/Night time breakdown
  - **Human:AI Ratio Card**: Dual-axis bar chart comparing coding time and API costs
  - **Sparkline Component**: Reusable SVG sparkline for inline trend visualization
  - Mock data generators (`lib/mockData.ts`) for dashboard development

- Comprehensive responsive design across all breakpoints:
  - **Hero cards**: 2/3-1/3 width split with sparklines, responsive font sizes at 768px/896px/1024px/1536px
  - **Combined grid sections**: Unified rows 2+3 into responsive 6-column grid with CSS order-based reflow
  - **Mobile-first layouts**: Cards stack to full-width below 936px and 640px breakpoints
  - **Adaptive trend badges**: Inline with icon between lg-xl, with sparkline otherwise
  - Mobile browser e2e testing enabled in Playwright config

- Monthly Usage Dashboard (`/`) with comprehensive usage analytics:
  - **Usage Meter**: Progress bar showing estimated usage percentage with color coding
  - **Metrics Grid**: 6 metric cards (Sessions, Session Time, API Cost, Subscription, Value Multiplier, Human:AI ratio)
  - **Activity Heatmap**: GitHub-style calendar showing daily session activity with 6 intensity levels and tooltips
  - **Top Projects**: Top 5 projects by session time with progress bars and navigation links
  - IPC handler `analytics:getMonthlySummary` for monthly data aggregation
  - Usage calculator utilities (`lib/calculators/usage-calculator.ts`) for value multiplier and time ratio
  - Relative intensity coloring for heatmap based on actual data distribution
- date-fns dependency for date manipulation in dashboard components

- Frameless window UI shell redesign for native macOS/Windows experience:
  - **macOS**: Hidden title bar with native traffic lights (close/minimize/maximize)
  - **Windows/Linux**: Custom window controls component (minimize/maximize/close buttons)
  - **Drag regions**: Sidebar header enables window dragging
  - **Logo branding**: Updated sidebar with Clocked logo below traffic lights
- Window control IPC handlers: `window:minimize`, `window:maximize`, `window:close`, `window:isMaximized`
- Platform detection via `window.electron.platform` for OS-specific styling
- Updated logo-lockup.svg with new clock icon design

- Project management features for organizing Claude Code projects:
  - **Hide/Show Projects**: Mark projects as hidden with toggle to show/hide in list
  - **Project Groups**: Create named groups with colors to organize related projects
  - **Default Project**: Set a default project displayed prominently on dashboard
- Settings page (`/settings`) for managing hidden projects and project groups
- Dashboard default project card with session count, total time, and message stats
- Dropdown menu actions on project rows (hide, set group, set as default)
- Path decoder improvements to handle `.` and `-` in project names correctly
- Orphaned project cleanup during sync (removes entries for deleted directories)
- Automatic better-sqlite3 rebuild scripts (`rebuild:node`, `rebuild:electron`)
- 151 new tests for project management features (468 total, 98.53% coverage)

- Initial project setup with Session-Driven Development
- Session Index Parser & SQLite Cache for Claude Code session data
  - SQLite database (`~/.clocked/cache.db`) with WAL mode for performance
  - Session parser to discover and parse `sessions-index.json` from `~/.claude/projects/`
  - URL path decoder for Claude Code's encoded directory names
  - IPC handlers: `projects:getAll`, `projects:getByPath`, `sessions:getAll`, `sessions:getByProject`, `sessions:getByDateRange`, `data:sync`, `data:status`
  - Refine data provider (`ipc-data-provider.ts`) for frontend integration
  - Comprehensive test suite (226 tests) with 90%+ coverage
- Electron desktop application foundation with secure IPC communication
  - Main process (`electron/main.ts`) with BrowserWindow (1200x800, contextIsolation enabled)
  - Preload script (`electron/preload.ts`) with contextBridge API
  - Type-safe IPC client (`lib/electron/ipc.ts`) for renderer communication
  - Type definitions for `window.electron` API
- Electron development scripts: `electron:dev`, `electron:build`, `electron:start`
- Next.js configuration for Electron static export
- Home page with Electron connection status and health check display

### Changed

- Redesigned dashboard layout from metrics grid to card-based sections
- Sidebar width reduced from 64 (w-64) to 52 (w-52) for more dashboard space
- Dashboard header simplified to minimal title + date range display
- Updated home page to display "Clocked is ready" with Electron connection status
- Updated e2e tests to match new home page content
- Added ESLint rules for Electron and type definition files

### Fixed

- Accessibility color contrast issues (WCAG AA compliance):
  - Trend badge text colors updated to emerald-700/red-700 for better contrast
  - Neutral badge text changed to foreground/70 for improved readability
  - Quick Stats labels and subvalues use foreground/70 for accessibility
  - Highlighted values use emerald-600 instead of emerald-500

### Removed

- Deprecated dashboard components: `MetricCard`, `MetricsGrid`, `TopProjects`, `UsageMeter`
