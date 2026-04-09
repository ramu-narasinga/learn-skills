import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { Todo } from '@/types/api';
import { getTodosQueryOptions } from './get-todos';

export const updateTodo = (data: {
  id: string;
  title?: string;
  completed?: boolean;
}): Promise<Todo> => {
  return api.updateTodo(data);
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getTodosQueryOptions().queryKey,
      });
    },
  });
};
