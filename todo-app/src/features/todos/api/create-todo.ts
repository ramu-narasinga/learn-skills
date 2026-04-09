import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import type { Todo } from '@/types/api';
import { getTodosQueryOptions } from './get-todos';

export const createTodoInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

export type CreateTodoInput = z.infer<typeof createTodoInputSchema>;

export const createTodo = (data: CreateTodoInput): Promise<Todo> => {
  return api.createTodo(data);
};

export const useCreateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getTodosQueryOptions().queryKey,
      });
    },
  });
};
