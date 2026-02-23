import { useState } from 'react';
import { TaskBoard } from '../components/tasks/TaskBoard.js';

export function TasksPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div style={headerStyle}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Tasks</h1>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Task'}
        </button>
      </div>

      <TaskBoard showCreateForm={showForm} onCloseForm={() => setShowForm(false)} />
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
};
