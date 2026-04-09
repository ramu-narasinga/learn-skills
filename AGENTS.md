# AGENTS.md — Bulletproof React Architecture Guide

This document defines the codebase architecture rules, conventions, and skill references for AI agents working on this project. All code produced must follow the **Bulletproof React** architecture patterns. These are non-negotiable standards.

## Architecture Philosophy

This codebase follows a **feature-driven, unidirectional architecture** inspired by [bulletproof-react](https://github.com/alan2207/bulletproof-react). The core principles are:

1. **Feature-based modularity** — Code is organized by feature, not by type
2. **Unidirectional data flow** — `shared → features → app` (never the reverse)
3. **Colocation** — Keep things as close as possible to where they're used
4. **Type safety** — TypeScript everywhere, Zod for runtime validation
5. **Separation of concerns** — API layer, state, UI, and business logic are cleanly separated

## Project Structure

```
src/
├── app/               # Application layer (routes, providers, router)
│   ├── routes/        # Route components (pages)
│   ├── provider.tsx   # Global providers wrapper
│   └── router.tsx     # Route definitions with code splitting
├── assets/            # Static files (images, fonts, etc.)
├── components/        # Shared UI components used across the app
│   └── ui/            # Reusable UI primitives (button, form, dialog, etc.)
├── config/            # Global config, env variables, path definitions
├── features/          # Feature-based modules (the core of the app)
│   └── <feature>/
│       ├── api/       # API requests + react-query hooks
│       ├── assets/    # Feature-specific static files
│       ├── components/# Feature-specific components
│       ├── hooks/     # Feature-specific hooks
│       ├── stores/    # Feature-specific state stores
│       ├── types/     # Feature-specific TypeScript types
│       └── utils/     # Feature-specific utility functions
├── hooks/             # Shared hooks
├── lib/               # Pre-configured library instances (api-client, auth, etc.)
├── stores/            # Global state stores
├── testing/           # Test utilities and mocks
├── types/             # Shared TypeScript types
└── utils/             # Shared utility functions
```

## Import Rules (Unidirectional)

**Allowed import directions:**

- `app/` can import from → `features/`, `components/`, `hooks/`, `lib/`, `types/`, `utils/`, `config/`, `stores/`
- `features/<name>/` can import from → `components/`, `hooks/`, `lib/`, `types/`, `utils/`, `config/`, `stores/`
- `components/`, `hooks/`, `lib/`, `types/`, `utils/` can import from → each other (shared layer)

**Forbidden imports:**

- `features/` MUST NOT import from `app/`
- `features/<name>/` MUST NOT import from `features/<other>/` (no cross-feature imports)
- Shared modules (`components/`, `hooks/`, `lib/`, `types/`, `utils/`) MUST NOT import from `features/` or `app/`

## Agent Skills Reference

Skills follow the [Agent Skills](https://github.com/skills) open format. Each skill is a folder with a `SKILL.md` file containing YAML frontmatter (name + description) and Markdown instructions.

**How skills work:**
1. **Discovery** — At startup, agents load only the `name` and `description` from each `SKILL.md` frontmatter
2. **Activation** — When a task matches a skill's description, the agent reads the full `SKILL.md` instructions
3. **Execution** — The agent follows the instructions, loading referenced files as needed

| Skill | Folder | When to Use |
|-------|--------|-------------|
| Project Structure | `.agents/skills/project-structure/` | Creating new features, files, or folders |
| Components & Styling | `.agents/skills/components-and-styling/` | Building any UI component |
| API Layer | `.agents/skills/api-layer/` | Creating API requests, hooks, or data fetching |
| State Management | `.agents/skills/state-management/` | Managing any kind of state |
| Security & Auth | `.agents/skills/security/` | Auth flows, authorization, route protection |
| Error Handling | `.agents/skills/error-handling/` | Error boundaries, API errors, error tracking |
| Testing | `.agents/skills/testing/` | Writing any type of test |
| Performance | `.agents/skills/performance/` | Optimization, code splitting, rendering |
| Project Standards | `.agents/skills/project-standards/` | Linting, formatting, naming conventions |
| Deployment | `.agents/skills/deployment/` | Build, deploy, CI/CD concerns |

## Quick Rules for Agents

### When creating a new feature:
1. Activate the `project-structure` skill
2. Create `src/features/<feature-name>/` with only the subdirectories needed
3. API hooks go in `api/`, components in `components/`, etc.
4. Never import from other features — compose at the `app/` level

### When creating a component:
1. Activate the `components-and-styling` skill
2. If shared across features → `src/components/`
3. If feature-specific → `src/features/<feature>/components/`
4. Use Tailwind CSS for styling
5. Use ShadCN UI patterns for UI primitives

### When adding an API endpoint:
1. Activate the `api-layer` skill
2. Define Zod schema for input/output
3. Create fetcher function using the shared `api` client
4. Create react-query hook (`useQuery` for reads, `useMutation` for writes)
5. Invalidate relevant queries on mutations

### When managing state:
1. Activate the `state-management` skill
2. Start with component state (`useState`/`useReducer`)
3. Server data → react-query (NEVER put in global state)
4. Global UI state → Zustand stores
5. Form state → React Hook Form + Zod validation
6. URL state → react-router params/search params

### When handling auth/security:
1. Activate the `security` skill
2. Use `react-query-auth` pattern for auth state
3. Wrap protected routes with `ProtectedRoute`
4. Use `Authorization` component for RBAC/PBAC
5. Store tokens in HttpOnly cookies, never localStorage
6. Sanitize all user inputs before rendering

### File Naming
- All files and folders: `kebab-case`
- Components: `PascalCase` exports from `kebab-case` files
- Use absolute imports with `@/` prefix (e.g., `@/components/ui/button`)
- No barrel files (import directly from source files)
