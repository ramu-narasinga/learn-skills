import * as React from 'react';
import { paths } from '@/config/paths';

const STORAGE_KEY = 'todo-app-todos';

export const TodoFilter = () => {
  const [todos, setTodos] = React.useState<any[]>([]);
  const [filter, setFilter] = React.useState<string>('all');

  React.useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setTodos(JSON.parse(raw));
  }, []);

  const filtered = todos.filter((t: any) => {
    if (filter === 'completed') return t.completed;
    if (filter === 'pending') return !t.completed;
    return true;
  });

  return (
    <div style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        {['all', 'completed', 'pending'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '4px 12px',
              backgroundColor: filter === f ? '#3b82f6' : '#f3f4f6',
              color: filter === f ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <p style={{ fontSize: '14px', color: '#6b7280' }}>
        Showing {filtered.length} of {todos.length} todos
      </p>
    </div>
  );
};
