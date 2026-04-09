import * as React from 'react';

import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input/input';
import { useNotifications } from '@/components/ui/notifications/notifications-store';
import type { Todo } from '@/types/api';
import { useUpdateTodo } from '../api/update-todo';
import { useDeleteTodo } from '../api/delete-todo';

type TodoItemProps = {
  todo: Todo;
};

export const TodoItem = ({ todo }: TodoItemProps) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(todo.title);
  const { addNotification } = useNotifications();

  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const handleToggle = () => {
    updateTodo.mutate({ id: todo.id, completed: !todo.completed });
  };

  const handleDelete = () => {
    deleteTodo.mutate(todo.id, {
      onSuccess: () => {
        addNotification({ type: 'success', title: 'Todo deleted' });
      },
    });
  };

  const handleEdit = () => {
    if (editTitle.trim() && editTitle !== todo.title) {
      updateTodo.mutate(
        { id: todo.id, title: editTitle.trim() },
        {
          onSuccess: () => {
            setIsEditing(false);
            addNotification({ type: 'success', title: 'Todo updated' });
          },
        },
      );
    } else {
      setEditTitle(todo.title);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEdit();
    if (e.key === 'Escape') {
      setEditTitle(todo.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md',
        todo.completed && 'bg-gray-50 opacity-75',
      )}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
      />

      {isEditing ? (
        <div className="flex-1">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleEdit}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
      ) : (
        <span
          onDoubleClick={() => setIsEditing(true)}
          className={cn(
            'flex-1 text-sm cursor-pointer select-none',
            todo.completed && 'line-through text-gray-400',
          )}
          title="Double-click to edit"
        >
          {todo.title}
        </span>
      )}

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleteTodo.isPending}
        >
          {deleteTodo.isPending ? '...' : 'Delete'}
        </Button>
      </div>
    </div>
  );
};
