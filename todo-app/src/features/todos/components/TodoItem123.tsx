export const TodoItem = ({ title, completed }: { title: string; completed: boolean }) => {
    
    console.log('Rendering TodoItem:', title, completed, new Date().toLocaleTimeString());
  
return (
    <div
      style={{
        padding: '8px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <input type="checkbox" checked={completed} readOnly />
      <span style={{ textDecoration: completed ? 'line-through' : 'none' }}>{title}</span>
    </div>
  );
}
