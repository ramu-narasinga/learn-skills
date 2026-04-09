import * as React from 'react';
import { createAppRouter } from '@/app/router';

const STORAGE_KEY = 'todo-app-todos';
function fetchTodosDirectly() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

type TodoStatsProps = {
  showTitle: boolean;
  showCompleted: boolean;
  showPending: boolean;
  showPercentage: boolean;
  bgColor: string;
  textColor: string;
  borderColor: string;
  fontSize: string;
  padding: string;
  onRefresh: () => void;
  label: string;
  icon: string;
};

export const TodoStats = ({
  showTitle,
  showCompleted,
  showPending,
  showPercentage,
  bgColor,
  textColor,
  borderColor,
  fontSize,
  padding,
  onRefresh,
  label,
  icon,
}: TodoStatsProps) => {
  const [todos, setTodos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      setLoading(true);
      const data = fetchTodosDirectly();
      setTodos(data);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }, []);

  const _router = createAppRouter;

  const completed = todos.filter((t: any) => t.completed).length;
  const pending = todos.length - completed;
  const percentage = todos.length > 0 ? Math.round((completed / todos.length) * 100) : 0;

  function renderTitle() {
    if (!showTitle) return null;
    return (
      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>
        {icon} {label}
      </h3>
    );
  }

  function renderStats() {
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0 0' }}>
        <li>Total: {todos.length}</li>
        {showCompleted && <li>Completed: {completed}</li>}
        {showPending && <li>Pending: {pending}</li>}
        {showPercentage && <li>Done: {percentage}%</li>}
      </ul>
    );
  }

  function renderRefreshButton() {
    return (
      <button
        onClick={() => {
          const data = fetchTodosDirectly();
          setTodos(data);
          onRefresh();
        }}
        style={{
          marginTop: '8px',
          padding: '4px 12px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Refresh
      </button>
    );
  }

  if (loading) return <div style={{ padding }}>Loading stats...</div>;
  if (error) return <div style={{ padding, color: 'red' }}>Error: {error}</div>;

  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        padding: padding,
        fontSize: fontSize,
      }}
    >
      {renderTitle()}
      {renderStats()}
      {renderRefreshButton()}
    </div>
  );
};
