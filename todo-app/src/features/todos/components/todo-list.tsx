import { Spinner } from '@/components/ui/spinner/spinner';
import { useTodos } from '../api/get-todos';
import { TodoItem } from './todo-item';

export const TodoList = () => {
  const { data: todos, isLoading, isError, error } = useTodos();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load todos: {error.message}
      </div>
    );
  }

  if (!todos || todos.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <p className="text-lg">No todos yet</p>
        <p className="text-sm mt-1">Add one above to get started!</p>
      </div>
    );
  }

  const pending = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 px-1">
        {pending.length} remaining · {completed.length} completed
      </p>
      {pending.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
      {completed.length > 0 && (
        <>
          <div className="border-t border-gray-200 pt-3 mt-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Completed
            </p>
          </div>
          {completed.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </>
      )}
    </div>
  );
};
