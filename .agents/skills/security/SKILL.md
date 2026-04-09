---
name: security
description: Use when implementing auth flows, route protection, role-based access control, or XSS prevention. Covers JWT auth, react-query-auth, RBAC/PBAC, and input sanitization.
---

# Security & Authentication

## When to use this skill

Use this skill when you need to:
- Set up authentication (login, register, logout)
- Protect routes from unauthenticated users
- Implement role-based or policy-based access control
- Handle token storage securely
- Sanitize user-generated content (XSS prevention)

## Authentication

Authentication verifies the identity of a user. The application uses **JWT tokens** stored in **HttpOnly cookies**.

### Token Storage

| Method | Security | Recommendation |
|--------|----------|----------------|
| App state only | High (but lost on refresh) | ❌ Not practical |
| `localStorage` | Low (XSS vulnerable) | ❌ Never use |
| `sessionStorage` | Low (XSS vulnerable) | ❌ Never use |
| HttpOnly cookie | High (inaccessible to JS) | ✅ Always use |

### Auth Configuration Pattern

Use `react-query-auth` to manage auth state alongside React Query:

```tsx
// src/lib/auth.tsx
import { configureAuth } from 'react-query-auth';
import { Navigate, useLocation } from 'react-router';
import { z } from 'zod';
import { api } from './api-client';
import { paths } from '@/config/paths';
import { AuthResponse, User } from '@/types/api';

// Fetch current user
const getUser = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data;
};

const logout = (): Promise<void> => api.post('/auth/logout');

// Zod schemas for validation
export const loginInputSchema = z.object({
  email: z.string().min(1, 'Required').email('Invalid email'),
  password: z.string().min(5, 'Required'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

const loginWithEmailAndPassword = (data: LoginInput): Promise<AuthResponse> => {
  return api.post('/auth/login', data);
};

export const registerInputSchema = z.object({
  email: z.string().min(1, 'Required'),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  password: z.string().min(5, 'Required'),
}).and(
  z.object({ teamId: z.string().min(1, 'Required'), teamName: z.null().default(null) })
    .or(z.object({ teamName: z.string().min(1, 'Required'), teamId: z.null().default(null) }))
);

export type RegisterInput = z.infer<typeof registerInputSchema>;

const registerWithEmailAndPassword = (data: RegisterInput): Promise<AuthResponse> => {
  return api.post('/auth/register', data);
};

// Configure auth — exports hooks and components
const authConfig = {
  userFn: getUser,
  loginFn: async (data: LoginInput) => {
    const response = await loginWithEmailAndPassword(data);
    return response.user;
  },
  registerFn: async (data: RegisterInput) => {
    const response = await registerWithEmailAndPassword(data);
    return response.user;
  },
  logoutFn: logout,
};

export const { useUser, useLogin, useLogout, useRegister, AuthLoader } = configureAuth(authConfig);
```

### Exported Auth Utilities:
- `useUser()` — Get current authenticated user
- `useLogin()` — Login mutation hook
- `useLogout()` — Logout mutation hook
- `useRegister()` — Registration mutation hook
- `AuthLoader` — Component that loads user before rendering children

### Protected Route Pattern

```tsx
// src/lib/auth.tsx
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useUser();
  const location = useLocation();

  if (!user.data) {
    return <Navigate to={paths.auth.login.getHref(location.pathname)} replace />;
  }

  return children;
};
```

Usage in router:
```tsx
// app/router.tsx
{
  path: paths.app.root.path,
  element: (
    <ProtectedRoute>
      <AppRoot />
    </ProtectedRoute>
  ),
  children: [ /* protected routes */ ],
}
```

### Auth Loading State

Wrap the app with `AuthLoader` in the provider to show a loading state while checking auth:

```tsx
// app/provider.tsx
<AuthLoader renderLoading={() => <Spinner />}>
  {children}
</AuthLoader>
```

## Authorization

Authorization verifies whether an authenticated user has permission to access a resource.

### RBAC — Role-Based Access Control

Define roles and check access based on the user's role:

```tsx
// src/lib/authorization.tsx
export enum ROLES {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

type RoleTypes = keyof typeof ROLES;

export const useAuthorization = () => {
  const user = useUser();

  if (!user.data) {
    throw Error('User does not exist!');
  }

  const checkAccess = React.useCallback(
    ({ allowedRoles }: { allowedRoles: RoleTypes[] }) => {
      if (allowedRoles && allowedRoles.length > 0 && user.data) {
        return allowedRoles.includes(user.data.role);
      }
      return true;
    },
    [user.data],
  );

  return { checkAccess, role: user.data.role };
};
```

Usage:
```tsx
// Only admins can see this
<Authorization allowedRoles={['ADMIN']}>
  <DeleteUserButton />
</Authorization>
```

### PBAC — Permission/Policy-Based Access Control

For fine-grained access control (e.g., only the comment author can delete their comment):

```tsx
// src/lib/authorization.tsx
export const POLICIES = {
  'comment:delete': (user: User, comment: Comment) => {
    if (user.role === 'ADMIN') return true;
    if (user.role === 'USER' && comment.author?.id === user.id) return true;
    return false;
  },
};
```

Usage:
```tsx
// Only comment author or admin can delete
<Authorization policyCheck={POLICIES['comment:delete'](user, comment)}>
  <DeleteCommentButton />
</Authorization>
```

### Authorization Component

```tsx
// src/lib/authorization.tsx
type AuthorizationProps = {
  forbiddenFallback?: React.ReactNode;
  children: React.ReactNode;
} & (
  | { allowedRoles: RoleTypes[]; policyCheck?: never }
  | { allowedRoles?: never; policyCheck: boolean }
);

export const Authorization = ({
  policyCheck, allowedRoles, forbiddenFallback = null, children,
}: AuthorizationProps) => {
  const { checkAccess } = useAuthorization();

  let canAccess = false;
  if (allowedRoles) canAccess = checkAccess({ allowedRoles });
  if (typeof policyCheck !== 'undefined') canAccess = policyCheck;

  return <>{canAccess ? children : forbiddenFallback}</>;
};
```

## XSS Protection

### Sanitize User Input

Always sanitize user-generated content before rendering as HTML:

```tsx
// ✅ Sanitize HTML content
import DOMPurify from 'dompurify';

export const MdPreview = ({ content }: { content: string }) => {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(content),
      }}
    />
  );
};
```

### Rules:
- **Never** use `dangerouslySetInnerHTML` without sanitization
- Use `DOMPurify` for HTML sanitization
- Validate and sanitize all user inputs on both client AND server
- Check [OWASP Top 10 Client-Side Security Risks](https://owasp.org/www-project-top-10-client-side-security-risks/)

## API Error Handling for Auth

The API client automatically handles 401 errors by redirecting to login:

```typescript
// In api-client.ts response interceptor
if (error.response?.status === 401) {
  const redirectTo = window.location.pathname;
  window.location.href = paths.auth.login.getHref(redirectTo);
}
```

## Checklist for Auth Implementation

- [ ] Store tokens in HttpOnly cookies (never localStorage)
- [ ] Use `react-query-auth` for auth state management
- [ ] Wrap protected routes with `ProtectedRoute`
- [ ] Use `AuthLoader` in the app provider
- [ ] Define RBAC roles in `src/lib/authorization.tsx`
- [ ] Define PBAC policies for fine-grained access
- [ ] Use `Authorization` component to guard UI elements
- [ ] Sanitize all user-generated HTML with DOMPurify
- [ ] Handle 401 errors in the API client interceptor
- [ ] Validate auth inputs with Zod schemas
