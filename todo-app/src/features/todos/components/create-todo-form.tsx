import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input/input';
import { useNotifications } from '@/components/ui/notifications/notifications-store';
import {
  createTodoInputSchema,
  type CreateTodoInput,
  useCreateTodo,
} from '../api/create-todo';

export const CreateTodoForm = () => {
  const { addNotification } = useNotifications();
  const createTodo = useCreateTodo();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTodoInput>({
    resolver: zodResolver(createTodoInputSchema),
    defaultValues: { title: '' },
  });

  const onSubmit = (data: CreateTodoInput) => {
    createTodo.mutate(data, {
      onSuccess: () => {
        reset();
        addNotification({ type: 'success', title: 'Todo created!' });
      },
      onError: () => {
        addNotification({ type: 'error', title: 'Failed to create todo' });
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex items-start gap-3"
    >
      <div className="flex-1">
        <Input
          placeholder="What needs to be done?"
          error={errors.title?.message}
          {...register('title')}
        />
      </div>
      <Button
        type="submit"
        disabled={createTodo.isPending}
        size="md"
      >
        {createTodo.isPending ? 'Adding...' : 'Add'}
      </Button>
    </form>
  );
};
