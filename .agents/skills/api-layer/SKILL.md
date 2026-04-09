---
name: api-layer
description: Use when creating API requests, data fetching hooks, or mutations. Defines the single API client pattern, react-query query/mutation structures, Zod validation, and data prefetching.
---

# API Layer

## When to use this skill

Use this skill when you need to:
- Create a new API endpoint consumer
- Build a react-query hook for data fetching or mutation
- Configure the API client or interceptors
- Implement data prefetching
- Validate API request/response data with Zod

## API Client (Single Instance)

Create ONE pre-configured API client instance in `src/lib/api-client.ts`. All API calls go through this instance.

```typescript
// src/lib/api-client.ts
import Axios, { InternalAxiosRequestConfig } from 'axios';
import { useNotifications } from '@/components/ui/notifications';
import { env } from '@/config/env';
import { paths } from '@/config/paths';

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = 'application/json';
  }
  config.withCredentials = true;
  return config;
}

export const api = Axios.create({
  baseURL: env.API_URL,
});

api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message;
    useNotifications.getState().addNotification({
      type: 'error',
      title: 'Error',
      message,
    });

    if (error.response?.status === 401) {
      window.location.href = paths.auth.login.getHref(window.location.pathname);
    }

    return Promise.reject(error);
  },
);
```

### Key Rules:
- **One instance** — Never create additional Axios/fetch instances
- **Interceptors** — Handle auth headers, response unwrapping, and error notifications globally
- **withCredentials** — Always set to `true` for cookie-based auth
- **Response unwrapping** — The response interceptor returns `response.data` so consumers get data directly

## React Query Configuration

Pre-configure react-query in `src/lib/react-query.ts`:

```typescript
// src/lib/react-query.ts
import { DefaultOptions, UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';

export const queryConfig: DefaultOptions = {
  queries: {
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60, // 1 minute
  },
};

export type QueryConfig<T extends (...args: any[]) => any> = Omit<
  ReturnType<T>,
  'queryKey' | 'queryFn'
>;

export type MutationConfig<T extends (...args: any[]) => any> = UseMutationOptions<
  Awaited<ReturnType<T>>,
  Error,
  Parameters<T>[0]
>;
```

## API Request Pattern — Queries (Read)

Every query follows this exact structure within `src/features/<feature>/api/`:

```typescript
// src/features/<feature>/api/get-<resource>.ts
import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { Resource, Meta } from '@/types/api';

// 1. Fetcher function
export const getResources = (page = 1): Promise<{ data: Resource[]; meta: Meta }> => {
  return api.get('/resources', { params: { page } });
};

// 2. Query options factory
export const getResourcesQueryOptions = ({ page }: { page?: number } = {}) => {
  return queryOptions({
    queryKey: page ? ['resources', { page }] : ['resources'],
    queryFn: () => getResources(page),
  });
};

// 3. Custom hook
type UseResourcesOptions = {
  page?: number;
  queryConfig?: QueryConfig<typeof getResourcesQueryOptions>;
};

export const useResources = ({ queryConfig, page }: UseResourcesOptions) => {
  return useQuery({
    ...getResourcesQueryOptions({ page }),
    ...queryConfig,
  });
};
```

### Query Structure Breakdown:
1. **Fetcher function** — Pure async function that calls the API. No react-query logic here.
2. **Query options factory** — Defines `queryKey` and `queryFn`. Exported so it can be used for prefetching and cache invalidation.
3. **Custom hook** — Wraps `useQuery` and accepts optional `queryConfig` for consumer customization.

### Single Resource Query

```typescript
// src/features/<feature>/api/get-<resource>.ts
export const getResource = ({ resourceId }: { resourceId: string }): Promise<Resource> => {
  return api.get(`/resources/${resourceId}`);
};

export const getResourceQueryOptions = (resourceId: string) => {
  return queryOptions({
    queryKey: ['resources', resourceId],
    queryFn: () => getResource({ resourceId }),
  });
};

export const useResource = ({ resourceId, queryConfig }: UseResourceOptions) => {
  return useQuery({
    ...getResourceQueryOptions(resourceId),
    ...queryConfig,
  });
};
```

## API Request Pattern — Mutations (Write)

Every mutation follows this exact structure:

```typescript
// src/features/<feature>/api/create-<resource>.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { Resource } from '@/types/api';
import { getResourcesQueryOptions } from './get-resources';

// 1. Input validation schema
export const createResourceInputSchema = z.object({
  title: z.string().min(1, 'Required'),
  body: z.string().min(1, 'Required'),
});

export type CreateResourceInput = z.infer<typeof createResourceInputSchema>;

// 2. Mutation function
export const createResource = ({ data }: { data: CreateResourceInput }): Promise<Resource> => {
  return api.post('/resources', data);
};

// 3. Custom hook with cache invalidation
type UseCreateResourceOptions = {
  mutationConfig?: MutationConfig<typeof createResource>;
};

export const useCreateResource = ({ mutationConfig }: UseCreateResourceOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: getResourcesQueryOptions().queryKey,
      });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: createResource,
  });
};
```

### Mutation Structure Breakdown:
1. **Zod schema** — Validates input data. Shared with form validation.
2. **Mutation function** — Pure async function calling the API.
3. **Custom hook** — Wraps `useMutation`, handles cache invalidation, and allows consumer callbacks.

### Update and Delete Patterns

```typescript
// Update
export const useUpdateResource = ({ mutationConfig }) => {
  const queryClient = useQueryClient();
  return useMutation({
    onSuccess: (data, variables) => {
      queryClient.refetchQueries({ queryKey: getResourceQueryOptions(variables.resourceId).queryKey });
      queryClient.invalidateQueries({ queryKey: getResourcesQueryOptions().queryKey });
    },
    mutationFn: updateResource,
  });
};

// Delete
export const useDeleteResource = ({ mutationConfig }) => {
  const queryClient = useQueryClient();
  return useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getResourcesQueryOptions().queryKey });
    },
    mutationFn: deleteResource,
  });
};
```

## Data Prefetching

Prefetch data before navigation for better UX:

```typescript
// In a list component — prefetch on hover
import { useQueryClient } from '@tanstack/react-query';
import { getResourceQueryOptions } from '../api/get-resource';

const queryClient = useQueryClient();

<Link
  onMouseEnter={() => queryClient.prefetchQuery(getResourceQueryOptions(resource.id))}
  to={`/resources/${resource.id}`}
>
  {resource.title}
</Link>
```

## File Naming Convention

```
src/features/<feature>/api/
├── get-<resources>.ts       # List query (plural)
├── get-<resource>.ts        # Single item query (singular)
├── create-<resource>.ts     # Create mutation
├── update-<resource>.ts     # Update mutation
├── delete-<resource>.ts     # Delete mutation
```

## Checklist for Creating an API Endpoint

- [ ] Create file in `src/features/<feature>/api/`
- [ ] Define Zod schema for request/response data (mutations)
- [ ] Create fetcher function using the shared `api` client
- [ ] For queries: create `queryOptions` factory + `useQuery` hook
- [ ] For mutations: create `useMutation` hook with proper cache invalidation
- [ ] Export the schema type with `z.infer<typeof schema>`
- [ ] Use `QueryConfig`/`MutationConfig` types for hook options
- [ ] Never put react-query logic in the fetcher function
