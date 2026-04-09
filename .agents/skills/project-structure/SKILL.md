---
name: project-structure
description: Use when creating new features, files, or folders. Defines the feature-driven directory layout, unidirectional import rules, and file placement decisions.
---

# Project Structure

## When to use this skill

Use this skill when you need to:
- Create a new feature module
- Add a new file or folder to the project
- Decide where a piece of code should live
- Understand the import rules and dependency flow

## Overview

This skill defines how the codebase is organized. Every file and folder must be placed according to these rules. The architecture is **feature-driven** — most code lives inside `src/features/`, while truly shared code lives in top-level shared directories.

## Top-Level `src/` Structure

```
src/
├── app/               # Application shell — routes, providers, router config
├── assets/            # Global static files (images, fonts, SVGs)
├── components/        # Shared components used across multiple features
├── config/            # Global configuration (env vars, path definitions)
├── features/          # Feature modules — the core of the application
├── hooks/             # Shared custom hooks
├── lib/               # Pre-configured library wrappers (API client, auth, react-query)
├── stores/            # Global state stores (Zustand)
├── testing/           # Test utilities, mocks, MSW handlers, test db
├── types/             # Shared TypeScript type definitions
└── utils/             # Shared utility functions
```

## The `app/` Directory

The `app/` directory is the application layer. It is responsible for:

- **Route definitions** — All routes are defined in `app/router.tsx` using lazy imports for code splitting
- **Global providers** — `app/provider.tsx` wraps the app with all necessary providers (QueryClient, ErrorBoundary, AuthLoader, etc.)
- **Route components** — Each page lives in `app/routes/` organized by path structure

```
app/
├── routes/
│   ├── landing.tsx
│   ├── not-found.tsx
│   ├── auth/
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── app/
│       ├── root.tsx
│       ├── dashboard.tsx
│       ├── profile.tsx
│       ├── users.tsx
│       └── discussions/
│           ├── discussions.tsx
│           └── discussion.tsx
├── provider.tsx
└── router.tsx
```

### Provider Pattern

```tsx
// app/provider.tsx — wraps the entire application
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = React.useState(() => new QueryClient({ defaultOptions: queryConfig }));

  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <ErrorBoundary FallbackComponent={MainErrorFallback}>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <Notifications />
            <AuthLoader renderLoading={() => <LoadingSpinner />}>
              {children}
            </AuthLoader>
          </QueryClientProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </React.Suspense>
  );
};
```

### Router Pattern (Code Splitting)

```tsx
// app/router.tsx — all routes use lazy() for code splitting
export const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: paths.home.path,
      lazy: () => import('./routes/landing').then(convert(queryClient)),
    },
    {
      path: paths.app.root.path,
      element: <ProtectedRoute><AppRoot /></ProtectedRoute>,
      ErrorBoundary: AppRootErrorBoundary,
      children: [
        {
          path: paths.app.dashboard.path,
          lazy: () => import('./routes/app/dashboard').then(convert(queryClient)),
        },
        // ... more routes
      ],
    },
  ]);
```

## The `features/` Directory

Each feature is a self-contained module. Only include subdirectories that the feature actually needs.

```
src/features/<feature-name>/
├── api/           # API request declarations + react-query hooks
├── assets/        # Feature-specific static files
├── components/    # Feature-specific UI components
├── hooks/         # Feature-specific custom hooks
├── stores/        # Feature-specific Zustand stores
├── types/         # Feature-specific TypeScript types
└── utils/         # Feature-specific utility functions
```

### Rules for Features:

1. **No cross-feature imports** — `features/auth/` MUST NOT import from `features/discussions/`
2. **Compose at app level** — If two features need to interact, compose them in `app/routes/`
3. **Only needed subdirectories** — Don't create empty `hooks/` or `stores/` folders
4. **No barrel files** — Import directly from the source file, not from `index.ts`
5. **Feature independence** — Each feature should be removable without breaking other features

## Unidirectional Import Flow

```
shared (components, hooks, lib, types, utils)
         ↓
    features/<name>
         ↓
       app (routes, providers, router)
```

The code flows in ONE direction: **shared → features → app**

### ESLint Enforcement

```js
// Forbid cross-feature imports
'import/no-restricted-paths': ['error', {
  zones: [
    { target: './src/features/auth', from: './src/features', except: ['./auth'] },
    { target: './src/features', from: './src/app' },
    {
      target: ['./src/components', './src/hooks', './src/lib', './src/types', './src/utils'],
      from: ['./src/features', './src/app'],
    },
  ],
}]
```

## Path Configuration

Use absolute imports with the `@/` prefix:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Example: `import { Button } from '@/components/ui/button'`

## When to Place Code Where

| What you're creating | Where it goes |
|---|---|
| A new feature | `src/features/<feature-name>/` |
| A component used by one feature | `src/features/<feature>/components/` |
| A component used by multiple features | `src/components/` |
| A UI primitive (button, input, dialog) | `src/components/ui/` |
| An API hook for a feature | `src/features/<feature>/api/` |
| A pre-configured library instance | `src/lib/` |
| A global store (notifications, theme) | `src/stores/` or `src/components/ui/<component>/` |
| A feature-specific store | `src/features/<feature>/stores/` |
| A shared TypeScript type | `src/types/` |
| A shared utility function | `src/utils/` |
| A shared custom hook | `src/hooks/` |
| A route/page component | `src/app/routes/` |
| Test utilities & mocks | `src/testing/` |
| Environment variables | `src/config/env.ts` |
| Path definitions | `src/config/paths.ts` |
