---
name: performance
description: Use when optimizing application performance. Covers route-level code splitting, component/state render optimizations, lazy loading, data prefetching, image optimization, and Web Vitals monitoring.
---

# Performance

## When to use this skill

Use this skill when you need to:
- Implement code splitting for routes or components
- Optimize rendering performance
- Set up data prefetching
- Optimize images and assets
- Monitor and improve Web Vitals

## Code Splitting

Split the JavaScript bundle at the **route level** using lazy imports. Only the code needed for the current page is loaded initially.

### Route-Level Code Splitting

```tsx
// src/app/router.tsx
export const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: paths.home.path,
      lazy: () => import('./routes/landing').then(convert(queryClient)),
    },
    {
      path: paths.app.discussions.path,
      lazy: () => import('./routes/app/discussions/discussions').then(convert(queryClient)),
    },
    // Each route is a separate chunk
  ]);
```

### Rules:
- **Split at route boundaries** — Each page is a separate chunk
- **Don't over-split** — Too many tiny chunks cause more HTTP requests, hurting performance
- **Eagerly load critical routes** — Landing page and auth routes can be bundled with the main chunk
- **Lazy load feature routes** — Dashboard, settings, etc. loaded on demand

### React.lazy for Components

For heavy components that aren't immediately visible (e.g., modals, complex charts):

```tsx
const HeavyChart = React.lazy(() => import('@/components/chart'));

function Dashboard() {
  return (
    <React.Suspense fallback={<Spinner />}>
      <HeavyChart />
    </React.Suspense>
  );
}
```

## Component & State Optimizations

### 1. Split State Wisely

```tsx
// ❌ BAD — one state triggers re-render for everything
const [state, setState] = useState({ name: '', email: '', isOpen: false, count: 0 });

// ✅ GOOD — independent states re-render independently
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [isOpen, setIsOpen] = useState(false);
const [count, setCount] = useState(0);
```

### 2. Keep State Close to Usage

```tsx
// ❌ BAD — state in parent causes child re-renders
function Parent() {
  const [search, setSearch] = useState('');
  return (
    <>
      <SearchInput value={search} onChange={setSearch} />
      <ExpensiveList /> {/* re-renders when search changes! */}
    </>
  );
}

// ✅ GOOD — state is local to the component that needs it
function SearchInput() {
  const [search, setSearch] = useState('');
  return <input value={search} onChange={(e) => setSearch(e.target.value)} />;
}

function Parent() {
  return (
    <>
      <SearchInput />
      <ExpensiveList /> {/* no unnecessary re-renders */}
    </>
  );
}
```

### 3. Lazy State Initialization

```tsx
// ❌ BAD — expensive function runs on every render
const [state, setState] = useState(myExpensiveFn());

// ✅ GOOD — expensive function runs only once
const [state, setState] = useState(() => myExpensiveFn());
```

### 4. Use Children as Optimization

The `children` prop creates an isolated VDOM structure that doesn't re-render with the parent:

```tsx
// ❌ NOT OPTIMIZED — PureComponent re-renders when count changes
const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>count: {count}</button>
      <PureComponent /> {/* re-renders unnecessarily */}
    </div>
  );
};

// ✅ OPTIMIZED — PureComponent passed as children doesn't re-render
const Counter = ({ children }) => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>count: {count}</button>
      {children} {/* won't re-render */}
    </div>
  );
};

// Usage
<Counter>
  <PureComponent />
</Counter>
```

### 5. Context Usage

- **Good for:** low-velocity data (themes, user data, locale)
- **Bad for:** high-frequency updates (mouse position, real-time data)
- Consider `use-context-selector` for medium-velocity data
- Don't default to context for prop drilling — try composition first or lifting state up

### 6. Atomic State Libraries

For apps tracking many elements at once (lists, grids, complex forms):

```tsx
// Consider Jotai for atomic updates
import { atom, useAtom } from 'jotai';

const countAtom = atom(0);
const nameAtom = atom('');

// Only components subscribing to countAtom re-render when it changes
```

## Styling Performance

- **Use zero-runtime CSS solutions** — Tailwind CSS, CSS modules, vanilla-extract
- **Avoid runtime CSS-in-JS** for high-frequency updates (emotion, styled-components generate styles at runtime)
- Runtime styling creates JavaScript overhead on every render

## Image Optimizations

```tsx
// ✅ Lazy load images not in viewport
<img loading="lazy" src="/image.webp" alt="description" />

// ✅ Use modern formats
// Prefer WEBP over PNG/JPEG for smaller file sizes

// ✅ Responsive images with srcset
<img
  srcSet="/image-400.webp 400w, /image-800.webp 800w, /image-1200.webp 1200w"
  sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px"
  src="/image-800.webp"
  alt="description"
/>
```

## Data Prefetching

Prefetch data that the user is likely to need next:

```tsx
// ✅ Prefetch on hover — data is ready when user clicks
import { useQueryClient } from '@tanstack/react-query';
import { getDiscussionQueryOptions } from '../api/get-discussion';

function DiscussionsList() {
  const queryClient = useQueryClient();

  return discussions.map((discussion) => (
    <Link
      key={discussion.id}
      to={`/discussions/${discussion.id}`}
      onMouseEnter={() => {
        queryClient.prefetchQuery(getDiscussionQueryOptions(discussion.id));
      }}
    >
      {discussion.title}
    </Link>
  ));
}
```

### Route-Level Data Loading

Use route loaders to start fetching data before the component renders:

```tsx
// In a route module
export const clientLoader = (queryClient: QueryClient) => async () => {
  const query = getDiscussionsQueryOptions();
  return queryClient.getQueryData(query.queryKey) ?? (await queryClient.fetchQuery(query));
};
```

## Web Vitals

Monitor these metrics for production performance:

- **LCP** (Largest Contentful Paint) — How fast the main content loads
- **FID** (First Input Delay) — How quickly the app responds to user interaction
- **CLS** (Cumulative Layout Shift) — Visual stability

Tools:
- [Lighthouse](https://web.dev/measure/)
- [PageSpeed Insights](https://pagespeed.web.dev/)

## Performance Anti-Patterns

- ❌ Putting all state in one giant global store
- ❌ Using runtime CSS-in-JS for performance-critical components
- ❌ Creating too many code split chunks (one per component)
- ❌ Not lazy-loading heavy components/routes
- ❌ Using `React.memo` everywhere without measuring first
- ❌ Storing derived data in state instead of computing it
- ❌ Loading full-resolution images for thumbnail displays

## Checklist

- [ ] Routes use lazy imports for code splitting
- [ ] Heavy components wrapped in `React.Suspense`
- [ ] State is as close to usage as possible
- [ ] No unnecessary re-renders from shared state
- [ ] Images use lazy loading and modern formats (WEBP)
- [ ] Data prefetching on hover for navigation links
- [ ] Route loaders prefetch data before rendering
- [ ] Tailwind CSS (zero-runtime) for styling
- [ ] Web vitals measured and monitored
