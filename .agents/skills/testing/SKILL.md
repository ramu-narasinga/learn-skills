---
name: testing
description: Use when writing any type of test. Defines the integration-first testing strategy, Vitest/Testing Library/Playwright/MSW tooling, test organization, and mock patterns.
---

# Testing

## When to use this skill

Use this skill when you need to:
- Write unit, integration, or E2E tests
- Set up test infrastructure (Vitest, Playwright, MSW)
- Create test utilities and data generators
- Mock API endpoints for testing
- Decide what type of test to write

## Testing Pyramid (Inverted)

```
    ╔══════════════════════════════╗
    ║   E2E Tests (Playwright)     ║  ← Highest confidence, slowest
    ╠══════════════════════════════╣
    ║   Integration Tests          ║  ← MOST VALUABLE — focus here
    ║   (Vitest + Testing Library) ║
    ╠══════════════════════════════╣
    ║   Unit Tests (Vitest)        ║  ← Fast, low confidence alone
    ╚══════════════════════════════╝
```

## Test Types

### 1. Unit Tests

Test individual functions, utilities, and simple components in isolation.

**When to write:**
- Shared utility functions (`src/utils/`)
- Complex business logic
- Shared components with complex behavior

```tsx
// src/components/ui/dialog/confirmation-dialog/__tests__/confirmation-dialog.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmationDialog } from '../confirmation-dialog';

test('renders confirmation dialog with correct content', async () => {
  const onConfirm = vi.fn();

  render(
    <ConfirmationDialog
      title="Delete Item"
      body="Are you sure?"
      confirmButton={<button onClick={onConfirm}>Confirm</button>}
      triggerButton={<button>Delete</button>}
    />
  );

  await userEvent.click(screen.getByRole('button', { name: /delete/i }));
  expect(screen.getByText('Are you sure?')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /confirm/i }));
  expect(onConfirm).toHaveBeenCalled();
});
```

### 2. Integration Tests

Test how multiple components work together, including API interactions.

**When to write:**
- Every feature route/page
- Complex forms with validation and API calls
- Multi-step workflows

```tsx
// src/app/routes/app/discussions/__tests__/discussion.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { createDiscussion } from '@/testing/data-generators';
import { renderApp } from '@/testing/test-utils';

test('renders discussion details', async () => {
  const discussion = createDiscussion();

  renderApp(`/discussions/${discussion.id}`);

  await waitFor(() => {
    expect(screen.getByText(discussion.title)).toBeInTheDocument();
  });
});
```

### 3. E2E Tests

Test the full application flow from the user's perspective.

**When to write:**
- Critical user journeys (login, registration, core CRUD flows)
- Smoke tests for deployment verification

```typescript
// e2e/tests/smoke.spec.ts
import { test, expect } from '@playwright/test';

test('user can login and view dashboard', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/app/dashboard');
  await expect(page.getByText('Dashboard')).toBeVisible();
});
```

## Tooling

### Vitest

Primary test runner for unit and integration tests.

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Testing Library

Test components the way users interact with them — **not implementation details**.

```tsx
// ✅ GOOD — test user behavior
expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
await userEvent.click(screen.getByRole('button', { name: /submit/i }));

// ❌ BAD — testing implementation details
expect(component.state.isSubmitting).toBe(true);
```

### Playwright

E2E test runner, supports both browser and headless modes.

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
  },
});
```

### MSW (Mock Service Worker)

Mock API endpoints for testing and development. Not a real backend — it intercepts HTTP requests in a service worker.

```typescript
// src/testing/mocks/handlers/auth.ts
import { http, HttpResponse } from 'msw';

export const authHandlers = [
  http.post('/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    return HttpResponse.json({
      user: { id: '1', email, role: 'USER' },
      token: 'mock-token',
    });
  }),

  http.get('/auth/me', () => {
    return HttpResponse.json({
      data: { id: '1', email: 'test@example.com', role: 'USER' },
    });
  }),
];
```

```typescript
// src/testing/mocks/db.ts
import { factory, primaryKey } from '@mswjs/data';

export const db = factory({
  user: {
    id: primaryKey(String),
    email: String,
    firstName: String,
    lastName: String,
    role: String,
  },
  discussion: {
    id: primaryKey(String),
    title: String,
    body: String,
    authorId: String,
  },
});
```

## Test File Organization

Tests are colocated with the code they test, in a `__tests__/` directory:

```
src/features/discussions/
├── api/
│   └── get-discussions.ts
├── components/
│   ├── discussion-view.tsx
│   └── __tests__/
│       └── discussion-view.test.tsx
```

For E2E tests:
```
e2e/
├── tests/
│   ├── smoke.spec.ts
│   └── discussions.spec.ts
└── utils/
    └── helpers.ts
```

## Test Utilities

Create shared test utilities in `src/testing/`:

```typescript
// src/testing/test-utils.ts
import { render } from '@testing-library/react';
import { AppProvider } from '@/app/provider';

export const renderApp = (ui: React.ReactElement) => {
  return render(ui, {
    wrapper: AppProvider,
  });
};

// src/testing/data-generators.ts
export const createDiscussion = (overrides = {}) => ({
  id: faker.string.uuid(),
  title: faker.lorem.sentence(),
  body: faker.lorem.paragraphs(),
  createdAt: faker.date.recent().toISOString(),
  ...overrides,
});
```

## Testing Philosophy

1. **Test behavior, not implementation** — Don't test state values, test what the user sees
2. **Integration tests are king** — Passing unit tests don't guarantee the app works
3. **Mock the API, not the modules** — Use MSW to mock HTTP requests, not jest.mock()
4. **Refactor-proof tests** — If you change how a component works internally but the output stays the same, tests should still pass
5. **Test the critical path** — Login, registration, core CRUD, payment flows

## Checklist

- [ ] Vitest configured with jsdom environment
- [ ] Testing Library installed for component testing
- [ ] Playwright configured for E2E tests
- [ ] MSW handlers defined for all API endpoints
- [ ] Test data generators created in `src/testing/`
- [ ] Test utilities (renderApp, etc.) in `src/testing/`
- [ ] Integration tests for every feature route
- [ ] E2E smoke test for critical user journeys
- [ ] Tests colocated in `__tests__/` directories next to source
