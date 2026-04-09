---
name: project-standards
description: Use when configuring linting, formatting, naming conventions, or project tooling. Covers ESLint rules, Prettier config, TypeScript strict mode, Husky pre-commit hooks, absolute imports, and file naming conventions.
---

# Project Standards

## When to use this skill

Use this skill when you need to:
- Configure ESLint rules and import restrictions
- Set up Prettier for consistent formatting
- Configure TypeScript with strict mode
- Set up Husky and lint-staged for pre-commit hooks
- Enforce file and folder naming conventions
- Configure absolute imports with `@/` prefix

## ESLint

ESLint enforces code quality and catches errors early.

### Key Rules

```js
// .eslintrc.cjs
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier', // eslint-config-prettier — disables conflicting rules
  ],
  rules: {
    // Enforce unidirectional imports
    'import/no-restricted-paths': ['error', {
      zones: [
        // No cross-feature imports
        { target: './src/features/auth', from: './src/features', except: ['./auth'] },
        { target: './src/features/comments', from: './src/features', except: ['./comments'] },
        { target: './src/features/discussions', from: './src/features', except: ['./discussions'] },
        // Features can't import from app
        { target: './src/features', from: './src/app' },
        // Shared can't import from features or app
        {
          target: ['./src/components', './src/hooks', './src/lib', './src/types', './src/utils'],
          from: ['./src/features', './src/app'],
        },
      ],
    }],

    // File naming conventions
    'check-file/filename-naming-convention': ['error', {
      '**/*.{ts,tsx}': 'KEBAB_CASE',
    }, {
      ignoreMiddleExtensions: true,
    }],
    'check-file/folder-naming-convention': ['error', {
      'src/**/!(__tests__)': 'KEBAB_CASE',
    }],
  },
};
```

### What ESLint Enforces:
- No unused variables
- React hooks rules (dependency arrays, call order)
- Import order and restrictions
- File and folder naming conventions
- No cross-feature imports
- Unidirectional code flow

## Prettier

Prettier handles code formatting. Enable **format on save** in your IDE.

```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 80,
  "tabWidth": 2,
  "semi": true
}
```

### Rules:
- **Format on save** — Always enabled
- If auto-formatting fails, it signals a syntax error
- Prettier and ESLint work together — Prettier handles formatting, ESLint handles logic

## TypeScript

TypeScript is mandatory. It catches type errors at build time and makes refactoring safe.

### Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### TypeScript Rules:
- **Strict mode** — Always enabled
- **No `any`** — Use proper types; `unknown` when the type is truly unknown
- **Zod for runtime validation** — TypeScript only checks at build time
- **Type-first refactoring** — When refactoring, update type declarations first, then fix TypeScript errors

### React TypeScript Patterns

```tsx
// ✅ Component props
type ButtonProps = {
  variant: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
};

// ✅ Component with forwardRef
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size = 'md', children, onClick, ...props }, ref) => {
    return (
      <button ref={ref} onClick={onClick} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ✅ Generic component
type ListProps<T> = {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
};

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>;
}
```

## Husky (Git Hooks)

Husky runs code validation before commits to prevent broken code from being pushed.

### Pre-commit Hook

```sh
# .husky/pre-commit
npx lint-staged
```

### Lint-staged Configuration

```js
// lint-staged.config.mjs
export default {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md}': ['prettier --write'],
};
```

### What Runs Before Each Commit:
1. **ESLint** — Lints and auto-fixes changed files
2. **Prettier** — Formats changed files
3. **TypeScript** — Type-checks (optional, can be slow on large codebases)

## Absolute Imports

Always use the `@/` prefix for imports from `src/`:

```tsx
// ✅ GOOD — absolute import
import { Button } from '@/components/ui/button';
import { useDiscussions } from '@/features/discussions/api/get-discussions';

// ❌ BAD — relative import hell
import { Button } from '../../../components/ui/button';
```

### Configuration

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

## File Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Files | `kebab-case` | `create-discussion.ts` |
| Folders | `kebab-case` | `awesome-feature/` |
| Components (exports) | `PascalCase` | `export const CreateDiscussion` |
| Hooks (exports) | `camelCase` with `use` prefix | `export const useDiscussions` |
| Types (exports) | `PascalCase` | `export type Discussion` |
| Constants | `SCREAMING_SNAKE_CASE` | `export const API_URL` |
| Test files | `kebab-case.test.tsx` | `confirmation-dialog.test.tsx` |
| Story files | `kebab-case.stories.tsx` | `button.stories.tsx` |
| Test directories | `__tests__/` | `__tests__/` |

## Import Order

Organize imports in this order:

```tsx
// 1. React and external libraries
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal absolute imports (@/)
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';

// 3. Relative imports (same feature)
import { getDiscussionsQueryOptions } from './get-discussions';

// 4. Types
import type { Discussion } from '@/types/api';
```

## No Barrel Files

Do NOT create `index.ts` barrel files that re-export from other files:

```tsx
// ❌ BAD — barrel file hinders tree shaking
// src/features/discussions/index.ts
export * from './api/get-discussions';
export * from './components/discussion-view';

// ✅ GOOD — import directly
import { useDiscussions } from '@/features/discussions/api/get-discussions';
import { DiscussionView } from '@/features/discussions/components/discussion-view';
```

## Checklist

- [ ] ESLint configured with import restrictions and naming rules
- [ ] Prettier configured with format-on-save
- [ ] TypeScript strict mode enabled
- [ ] Absolute imports configured with `@/` prefix
- [ ] Husky + lint-staged for pre-commit hooks
- [ ] `kebab-case` for all file and folder names
- [ ] No barrel files / index.ts re-exports
- [ ] No `any` types — use proper typing
