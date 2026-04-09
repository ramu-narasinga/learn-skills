import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { Todo } from '@/types/api';

export const getTodos = (): Promise<Todo[]> => {
  return api.getTodos();
};

export const getTodosQueryOptions = () => {
  return queryOptions({
    queryKey: ['todos'],
    queryFn: getTodos,
  });
};

export const useTodos = () => {
  return useQuery({
    ...getTodosQueryOptions(),
  });
};
