# clocked

A Internal Dashboard (Refine) project built with Session-Driven Development.

## Tech Stack

- **Framework**: Refine (latest) + Next.js 16.0.7
- **Language**: TypeScript 5.9.3
- **Ui**: React 19.2.1 + shadcn/ui components
- **Forms**: React Hook Form 7.66.0 + Zod 4.1.12
- **Styling**: Tailwind CSS 4.1.17

## Quality Gates: Production-Ready

- ✓ Linting (ESLint/Ruff)
- ✓ Formatting (Prettier/Ruff)
- ✓ Type checking (TypeScript strict/Pyright)
- ✓ Basic unit tests (Jest/pytest)
- ✓ 80% test coverage minimum
- ✓ Pre-commit hooks (Husky + lint-staged)
- ✓ Secret scanning (git-secrets, detect-secrets)
- ✓ Dependency vulnerability scanning
- ✓ Basic SAST (ESLint security/bandit)
- ✓ License compliance checking
- ✓ Code complexity enforcement
- ✓ Code duplication detection
- ✓ Dead code detection
- ✓ Type coverage enforcement (>90%)
- ✓ Mutation testing (>75% score)
- ✓ Integration tests required
- ✓ Unit test coverage (>80%)
- ✓ E2E tests (Playwright)
- ✓ Health check endpoints
- ✓ Metrics and observability
- ✓ Error tracking (Sentry)
- ✓ Structured logging
- ✓ Production build validation
- ✓ Security scanning (no continue-on-error)
- ✓ Bundle analysis (@next/bundle-analyzer)
- ✓ Lighthouse CI (performance + accessibility)

**Test Coverage Target**: 90%

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit http://localhost:3000

### Environment Setup

```bash
# Copy environment template
cp .env.local.example .env.local
# Edit .env.local with your database connection and other settings
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### E2E Testing

Playwright browsers are installed during project setup. To run E2E tests:

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e -- --ui

# Run specific test file
npm run test:e2e -- tests/e2e/example.spec.ts
```

If browsers need to be reinstalled:

```bash
npx playwright install --with-deps
```

### Accessibility Testing

```bash
# Run accessibility tests
npm run test:a11y
```

### Lighthouse CI (Performance Testing)

Lighthouse CI runs performance, accessibility, best practices, and SEO audits:

```bash
# Run Lighthouse CI
npm run lighthouse
```

This uses Playwright's Chromium browser automatically. Results are uploaded to temporary public storage.

## Additional Features

- ✓ **GitHub Actions CI/CD**: Automated testing and deployment workflows
- ✓ **Environment Templates**: .env files and .editorconfig for all editors

## Documentation

See `ARCHITECTURE.md` for detailed technical documentation including:

- Architecture decisions and trade-offs
- Project structure reference
- Code patterns and examples
- Database workflow
- Troubleshooting guides

## Session-Driven Development

This project uses Session-Driven Development (Solokit) for organized, AI-augmented development.

### Commands

- `/sk:work-new` - Create a new work item
- `/sk:work-list` - List all work items
- `/sk:start` - Start working on a work item
- `/sk:status` - Check current session status
- `/sk:validate` - Validate quality gates
- `/sk:end` - Complete current session
- `/sk:learn` - Capture a learning

### Documentation

See `.session/` directory for:

- Work item specifications (`.session/specs/`)
- Session briefings (`.session/briefings/`)
- Session summaries (`.session/history/`)
- Captured learnings (`.session/tracking/learnings.json`)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
