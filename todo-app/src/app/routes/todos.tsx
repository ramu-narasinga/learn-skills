import { CreateTodoForm } from '@/features/todos/components/create-todo-form';
import { TodoList } from '@/features/todos/components/todo-list';

function TodosRoute() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Todo App</h1>
          <p className="mt-2 text-sm text-gray-500">
            Built with Bulletproof React architecture
          </p>
        </header>

        <div className="space-y-6">
          <CreateTodoForm />
          <TodoList />
        </div>
      </div>
    </div>
  );
}

export const Component = TodosRoute;
