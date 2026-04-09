---
name: state-management
description: Use when managing any kind of state. Defines the 5 state categories (component, application, server cache, form, URL), their tools, and a decision tree for choosing the right approach.
---

# State Management

## When to use this skill

Use this skill when you need to:
- Decide how to manage a piece of state
- Choose between useState, Zustand, React Query, or React Hook Form
- Create a global store
- Handle form state with validation
- Work with URL-based state

## State Categories

| Category | What it is | Tool |
|----------|-----------|------|
| Component State | Local UI state for a single component | `useState`, `useReducer` |
| Application State | Global UI state (modals, notifications, theme) | Zustand |
| Server Cache State | Data fetched from the server | React Query (`@tanstack/react-query`) |
| Form State | Form inputs, validation, submission | React Hook Form + Zod |
| URL State | State encoded in the URL (params, query strings) | React Router |

## 1. Component State

Start here. Only elevate to a higher level if needed elsewhere.

```tsx
// ✅ Simple independent state
const [isOpen, setIsOpen] = useState(false);

// ✅ Complex related state — use reducer
const [state, dispatch] = useReducer(reducer, initialState);
```

### Rules:
- Default to `useState` for simple, independent values
- Use `useReducer` when a single action should update multiple pieces of state
- **Always start local** — lift state up only when another component needs it
- Pass down to children via props, not context

## 2. Application State (Global UI State)

For state that controls global UI behavior: notifications, modals, theme, sidebar toggle, etc.

### Tool: Zustand

```typescript
// src/components/ui/notifications/notifications-store.ts
import { nanoid } from 'nanoid';
import { create } from 'zustand';

export type Notification = {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message?: string;
};

type NotificationsStore = {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
};

export const useNotifications = create<NotificationsStore>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, { id: nanoid(), ...notification }],
    })),
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
```

### Rules:
- **Zustand for global UI state** — small, focused stores
- **One store per concern** — notifications store, theme store, sidebar store, etc.
- Stores can be accessed outside React components via `useStore.getState()`
- Stores colocate with the component that consumes them (e.g., notifications store lives in `components/ui/notifications/`)
- **Feature-specific stores** go in `src/features/<feature>/stores/`
- **Never put server data in Zustand** — that belongs in React Query

## 3. Server Cache State

All data from the server is managed by **React Query** (`@tanstack/react-query`).

```typescript
// ✅ Query — reading data
const { data, isLoading, error } = useDiscussions({ page: 1 });

// ✅ Mutation — writing data
const createDiscussion = useCreateDiscussion({
  mutationConfig: {
    onSuccess: () => {
      addNotification({ type: 'success', title: 'Discussion created' });
    },
  },
});
```

### Rules:
- **NEVER store server data in Zustand, Redux, or Context** — React Query handles caching, refetching, and background updates
- Use `queryOptions` factories for composable and reusable query configurations
- Invalidate queries after mutations to keep cache in sync
- See the **API Layer skill** for full patterns on queries and mutations

### Cache Invalidation Strategy:
- **Create** → Invalidate the list query
- **Update** → Refetch the single item query + invalidate the list query
- **Delete** → Invalidate the list query

## 4. Form State

Forms are managed by **React Hook Form** with **Zod** for validation.

```tsx
// ✅ Form with Zod validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Required'),
  body: z.string().min(1, 'Required'),
});

type FormValues = z.infer<typeof schema>;

function CreateForm({ onSubmit }: { onSubmit: (data: FormValues) => void }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('title')} />
      {form.formState.errors.title && <span>{form.formState.errors.title.message}</span>}
      <textarea {...form.register('body')} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Rules:
- **React Hook Form** for form state management
- **Zod** for schema validation (shared between form and API layer)
- Use the abstracted `<Form>` component from `src/components/ui/form/form.tsx`
- Schema is defined in the API file and imported by the form component
- Prefer uncontrolled components for better performance

### Abstracted Form Pattern:

```tsx
// ✅ Using the Form abstraction
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { createResourceInputSchema } from '../api/create-resource';

<Form schema={createResourceInputSchema} onSubmit={handleSubmit}>
  {({ register, formState }) => (
    <>
      <FormField name="title" render={({ field }) => (
        <FormItem>
          <FormLabel>Title</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <Button type="submit" disabled={formState.isSubmitting}>Create</Button>
    </>
  )}
</Form>
```

## 5. URL State

State that should survive page refreshes or be shareable via URL.

```tsx
// ✅ URL params (via route definition)
// Route: /discussions/:discussionId
import { useParams } from 'react-router';

const { discussionId } = useParams();

// ✅ Search params (query string)
import { useSearchParams } from 'react-router';

const [searchParams, setSearchParams] = useSearchParams();
const page = searchParams.get('page') || '1';
```

### Rules:
- Use URL params for resource identifiers (`/discussions/:id`)
- Use search params for filters, pagination, sorting (`?page=2&sort=newest`)
- URL state is the source of truth for anything that should be bookmarkable
- React Router manages all URL state — no need for additional libraries

## Decision Tree: Which State Type?

```
Is it data from the server?
  → YES → React Query (Server Cache State)
  → NO ↓

Is it form input data?
  → YES → React Hook Form + Zod (Form State)
  → NO ↓

Should it be in the URL (bookmarkable/shareable)?
  → YES → React Router URL params/search params (URL State)
  → NO ↓

Is it needed by multiple unrelated components?
  → YES → Zustand store (Application State)
  → NO ↓

Keep it local → useState or useReducer (Component State)
```

## Anti-Patterns to Avoid

- ❌ Putting server data in Zustand/Redux
- ❌ One massive global store for everything
- ❌ Using context for high-frequency updates
- ❌ Storing derived data in state (compute it instead)
- ❌ Prop drilling through 5+ levels (consider composition pattern or context)
- ❌ Unnecessary state — if you can compute it from existing state, don't store it
