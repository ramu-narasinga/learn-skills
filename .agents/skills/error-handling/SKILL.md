---
name: error-handling
description: Use when implementing error boundaries, API error handling, or production error tracking. Covers centralized API error interceptors, multi-level error boundaries, React Query error states, and Sentry integration.
---

# Error Handling

## When to use this skill

Use this skill when you need to:
- Handle API errors centrally
- Add error boundaries to components or routes
- Display error states in the UI
- Set up production error tracking (Sentry)
- Handle React Query error states

## API Errors

API errors are handled centrally in the API client's response interceptor.

### Central Error Interceptor

```typescript
// src/lib/api-client.ts — response error interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message;

    // Show notification to user
    useNotifications.getState().addNotification({
      type: 'error',
      title: 'Error',
      message,
    });

    // Redirect on 401 unauthorized
    if (error.response?.status === 401) {
      window.location.href = paths.auth.login.getHref(window.location.pathname);
    }

    return Promise.reject(error);
  },
);
```

### Rules:
- **All API errors trigger a notification** — Users always see what went wrong
- **401 errors redirect to login** — Automatic session expiration handling
- **Errors are re-thrown** — So react-query can handle them in the `error` state
- **Custom error handling per mutation** — Override with `onError` in `mutationConfig`

```tsx
// ✅ Custom error handling for a specific mutation
const createResource = useCreateResource({
  mutationConfig: {
    onError: (error) => {
      // Custom handling in addition to the global notification
      console.error('Failed to create resource:', error);
    },
  },
});
```

## In-App Errors (Error Boundaries)

Use React Error Boundaries to catch rendering errors. **Place multiple error boundaries** at different levels — don't just have one for the entire app.

### Global Error Boundary (App Level)

```tsx
// src/app/provider.tsx
import { ErrorBoundary } from 'react-error-boundary';
import { MainErrorFallback } from '@/components/errors/main';

<ErrorBoundary FallbackComponent={MainErrorFallback}>
  <RestOfApp />
</ErrorBoundary>
```

```tsx
// src/components/errors/main.tsx
export const MainErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
};
```

### Route-Level Error Boundaries

Each route group can have its own error boundary so errors in one section don't break the whole app:

```tsx
// src/app/router.tsx
{
  path: paths.app.root.path,
  element: <ProtectedRoute><AppRoot /></ProtectedRoute>,
  ErrorBoundary: AppRootErrorBoundary,  // ← route-level error boundary
  children: [
    {
      path: paths.app.discussion.path,
      lazy: () => import('./routes/app/discussions/discussion'),
    },
  ],
}
```

### Component-Level Error Boundaries

Wrap individual components or sections that might fail independently:

```tsx
// ✅ Isolate error to a single component
<ErrorBoundary fallback={<p>Failed to load discussion</p>}>
  <DiscussionView />
</ErrorBoundary>
```

### Error Boundary Strategy:
1. **App-level** — Catches catastrophic errors, shows full-page error
2. **Route-level** — Catches route-specific errors, keeps navigation working
3. **Component-level** — Catches feature-specific errors, keeps rest of page working

## React Query Error States

React Query provides built-in error states for queries and mutations:

```tsx
// ✅ Handle query errors in the component
const { data, error, isError, isLoading } = useDiscussions({ page });

if (isError) {
  return <div>Error loading discussions: {error.message}</div>;
}
```

```tsx
// ✅ Handle mutation errors
const mutation = useCreateDiscussion({
  mutationConfig: {
    onError: (error) => {
      // Error notification already shown by interceptor
      // Add any additional handling here
    },
    onSuccess: () => {
      addNotification({ type: 'success', title: 'Created!' });
    },
  },
});

// In JSX
{mutation.isError && <p>Failed: {mutation.error.message}</p>}
```

## Error Tracking (Production)

Use **Sentry** for production error tracking:

- Reports runtime errors automatically
- Shows platform, browser, and device context
- Upload source maps so stack traces reference original source code
- Captures unhandled promise rejections and uncaught exceptions

### Setup:

```typescript
// Initialize Sentry early in the app
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.NODE_ENV,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### Integration with Error Boundary:

```tsx
// Use Sentry's error boundary wrapper
import * as Sentry from '@sentry/react';

<Sentry.ErrorBoundary fallback={<MainErrorFallback />}>
  <App />
</Sentry.ErrorBoundary>
```

## Error Handling Hierarchy

```
API Error
  → Interceptor catches it
  → Shows notification toast
  → If 401, redirect to login
  → React Query stores error state
  → Component renders error UI

Render Error
  → Error boundary catches it
  → Shows fallback UI at appropriate level
  → Sentry reports it to production monitoring

Unhandled Error
  → Global error boundary catches it
  → Full-page error fallback shown
  → Sentry reports it
```

## Checklist

- [ ] API client has response error interceptor with notifications
- [ ] 401 errors redirect to login automatically
- [ ] App-level error boundary wraps entire application
- [ ] Route-level error boundaries isolate page errors
- [ ] Component-level error boundaries for risky UI sections
- [ ] React Query error states are handled in components
- [ ] Sentry (or similar) configured for production error tracking
- [ ] Source maps uploaded for readable stack traces
