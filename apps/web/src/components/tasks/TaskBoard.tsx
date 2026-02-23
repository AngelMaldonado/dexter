import { useEffect, useState } from 'react';
import { useTaskStore } from '../../stores/task-store.js';
import { useEntityStore } from '../../stores/entity-store.js';
import { TaskCard } from './TaskCard.js';
import type { TaskStatus, CreateTaskInput } from '../../types.js';

const STATUS_COLUMNS: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done', 'failed'];

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  failed: 'Failed',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: 'var(--text-muted)',
  todo: 'var(--info)',
  in_progress: 'var(--warning)',
  review: 'var(--accent)',
  done: 'var(--success)',
  failed: 'var(--error)',
};

interface TaskBoardProps {
  showCreateForm?: boolean;
  onCloseForm?: () => void;
}

export function TaskBoard({ showCreateForm, onCloseForm }: TaskBoardProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const createTask = useTaskStore((s) => s.createTask);
  const assignTask = useTaskStore((s) => s.assignTask);
  const selectTask = useTaskStore((s) => s.selectTask);
  const entities = useEntityStore((s) => s.entities);
  const fetchEntities = useEntityStore((s) => s.fetchEntities);

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
      priority: (data.get('priority') as CreateTaskInput['priority']) || 'medium',
      requiredSkills: (data.get('skills') as string).split(',').map((s) => s.trim()).filter(Boolean),
      estimatedEffort: parseInt(data.get('effort') as string) || 0,
    };
    await createTask(input);
    form.reset();
    onCloseForm?.();
  };

  return (
    <div>
      {showCreateForm && (
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
            <input name="effort" placeholder="Effort points" type="number" min="0" style={{ maxWidth: 120 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit">Create Task</button>
            <button type="button" onClick={onCloseForm} style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={boardStyle}>
        {STATUS_COLUMNS.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          return (
            <div key={status} style={columnStyle}>
              <div style={columnHeaderStyle}>
                <span style={{ ...statusDotStyle, background: STATUS_COLORS[status] }} />
                <span>{STATUS_LABELS[status]}</span>
                <span style={countStyle}>{columnTasks.length}</span>
              </div>
              <div style={columnBodyStyle}>
                {columnTasks.map((task) => {
                  const assignee = entities.find((e) => e.id === task.assignedEntityId);
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      assignee={assignee}
                      onClick={() => selectTask(task.id)}
                      onAssign={() => assignTask(task.id)}
                    />
                  );
                })}
                {columnTasks.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '8px 4px', textAlign: 'center' }}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  gridTemplateColumns: `repeat(${STATUS_COLUMNS.length}, minmax(200px, 1fr))`,
  gap: 12,
  overflowX: 'auto',
};

const columnStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  minHeight: 300,
  display: 'flex',
  flexDirection: 'column',
};

const columnHeaderStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  fontWeight: 600,
  flexShrink: 0,
};

const statusDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  flexShrink: 0,
};

const countStyle: React.CSSProperties = {
  marginLeft: 'auto',
  background: 'var(--bg-card)',
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
  flex: 1,
  overflow: 'auto',
};
