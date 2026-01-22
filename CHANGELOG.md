# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

- Updated home page to display "Clocked is ready" with Electron connection status
- Updated e2e tests to match new home page content
- Added ESLint rules for Electron and type definition files

### Fixed

### Removed
