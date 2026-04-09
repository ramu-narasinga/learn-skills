import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { getTodosQueryOptions } from './get-todos';

export const deleteTodo = (id: string): Promise<{ success: boolean }> => {
  return api.deleteTodo(id);
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getTodosQueryOptions().queryKey,
      });
    },
  });
};
