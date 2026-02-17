import { useEffect, useState } from 'react';
import { useStore } from '../stores/useStore.js';
import { api } from '../lib/api.js';
import type { CreateTaskInput } from '../lib/api.js';

const STATUS_COLUMNS = ['backlog', 'todo', 'in_progress', 'review', 'done', 'failed'] as const;

const STATUS_COLORS: Record<string, string> = {
  backlog: 'var(--text-muted)',
  todo: 'var(--info)',
  in_progress: 'var(--warning)',
  review: 'var(--accent)',
  done: 'var(--success)',
  failed: 'var(--error)',
};

export function TasksPage() {
  const tasks = useStore((s) => s.tasks);
  const entities = useStore((s) => s.entities);
  const fetchTasks = useStore((s) => s.fetchTasks);
  const fetchEntities = useStore((s) => s.fetchEntities);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchEntities();
  }, [fetchTasks, fetchEntities]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const input: CreateTaskInput = {
      title: data.get('title') as string,
      description: data.get('description') as string,
      priority: (data.get('priority') as string) || 'medium',
      skills: (data.get('skills') as string).split(',').map(s => s.trim()).filter(Boolean),
    };
    await api.createTask(input);
    await fetchTasks();
    setShowForm(false);
    form.reset();
  };

  const handleAssign = async (taskId: string) => {
    try {
      await api.assignTask(taskId);
      await fetchTasks();
      await fetchEntities();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign task');
    }
  };

  return (
    <div>
      <div style={headerStyle}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Tasks</h1>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Task'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={formStyle}>
          <input name="title" placeholder="Task title" required />
          <textarea name="description" placeholder="Description" rows={3} />
          <div style={{ display: 'flex', gap: 12 }}>
            <select name="priority" defaultValue="medium">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <input name="skills" placeholder="Skills (comma-separated)" />
          </div>
          <button type="submit">Create Task</button>
        </form>
      )}

      <div style={boardStyle}>
        {STATUS_COLUMNS.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          return (
            <div key={status} style={columnStyle}>
              <div style={columnHeaderStyle}>
                <span
                  style={{
                    ...statusDotStyle,
                    background: STATUS_COLORS[status],
                  }}
                />
                <span style={{ textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
                <span style={countStyle}>{columnTasks.length}</span>
              </div>
              <div style={columnBodyStyle}>
                {columnTasks.map((task) => {
                  const assignee = entities.find((e) => e.id === task.assigneeId);
                  return (
                    <div key={task.id} style={cardStyle}>
                      <div style={cardTitleStyle}>{task.title}</div>
                      {task.description && (
                        <div style={cardDescStyle}>
                          {task.description.slice(0, 100)}
                          {task.description.length > 100 ? '...' : ''}
                        </div>
                      )}
                      <div style={cardFooterStyle}>
                        <span style={{ ...priorityBadgeStyle, color: task.priority === 'critical' ? 'var(--error)' : task.priority === 'high' ? 'var(--warning)' : 'var(--text-muted)' }}>
                          {task.priority}
                        </span>
                        {assignee ? (
                          <span style={assigneeStyle}>{assignee.name}</span>
                        ) : status === 'backlog' || status === 'todo' ? (
                          <button
                            onClick={() => handleAssign(task.id)}
                            style={assignBtnStyle}
                          >
                            Auto-assign
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
};

const formStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  padding: 20,
  marginBottom: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const boardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(${STATUS_COLUMNS.length}, minmax(180px, 1fr))`,
  gap: 12,
  overflowX: 'auto',
};

const columnStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  minHeight: 300,
};

const columnHeaderStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  fontWeight: 600,
};

const statusDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
};

const countStyle: React.CSSProperties = {
  marginLeft: 'auto',
  background: 'var(--bg-tertiary)',
  padding: '1px 8px',
  borderRadius: 10,
  fontSize: 11,
  color: 'var(--text-muted)',
};

const columnBodyStyle: React.CSSProperties = {
  padding: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-tertiary)',
  borderRadius: 'var(--radius)',
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
};

const cardDescStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  lineHeight: 1.4,
};

const cardFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 4,
};

const priorityBadgeStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
};

const assigneeStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--accent)',
  fontWeight: 500,
};

const assignBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text-secondary)',
  fontSize: 11,
  padding: '2px 8px',
  borderRadius: 4,
};
