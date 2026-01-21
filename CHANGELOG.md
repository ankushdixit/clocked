# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
