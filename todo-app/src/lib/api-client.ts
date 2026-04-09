import type { Todo } from '@/types/api';

const STORAGE_KEY = 'todo-app-todos';

function getTodos(): Todo[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Todo[];
  } catch {
    return [];
  }
}

function saveTodos(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// Simulate async API calls with a small delay
const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const api = {
  getTodos: async (): Promise<Todo[]> => {
    await delay();
    return getTodos();
  },

  getTodo: async (id: string): Promise<Todo> => {
    await delay();
    const todo = getTodos().find((t) => t.id === id);
    if (!todo) throw new Error(`Todo with id "${id}" not found`);
    return todo;
  },

  createTodo: async (data: { title: string }): Promise<Todo> => {
    await delay();
    const { nanoid } = await import('nanoid');
    const todo: Todo = {
      id: nanoid(),
      title: data.title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const todos = getTodos();
    saveTodos([todo, ...todos]);
    return todo;
  },

  updateTodo: async (data: {
    id: string;
    title?: string;
    completed?: boolean;
  }): Promise<Todo> => {
    await delay();
    const todos = getTodos();
    const index = todos.findIndex((t) => t.id === data.id);
    if (index === -1) throw new Error(`Todo with id "${data.id}" not found`);
    todos[index] = { ...todos[index], ...data };
    saveTodos(todos);
    return todos[index];
  },

  deleteTodo: async (id: string): Promise<{ success: boolean }> => {
    await delay();
    const todos = getTodos();
    saveTodos(todos.filter((t) => t.id !== id));
    return { success: true };
  },
};
