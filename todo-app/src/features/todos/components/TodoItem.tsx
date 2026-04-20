export const TodoItem = ({ title, completed }: { title: string; completed: boolean }) => {
    
    console.log('Rendering TodoItem:', title);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
            <input type="checkbox" checked={completed} readOnly />
            <span style={{ textDecoration: completed ? 'line-through' : 'none' }}>{title}</span>
        </div>
    );
}