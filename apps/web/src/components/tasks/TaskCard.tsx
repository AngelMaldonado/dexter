import type { Task, Entity } from '../../types.js';
import { PRIORITY_COLORS } from '../office/utils/sprites.js';

interface TaskCardProps {
  task: Task;
  assignee?: Entity;
  onClick?: () => void;
  onAssign?: () => void;
}

export function TaskCard({ task, assignee, onClick, onAssign }: TaskCardProps) {
  return (
    <div style={cardStyle} onClick={onClick}>
      <div style={cardTitleStyle}>{task.title}</div>

      {task.description && (
        <div style={cardDescStyle}>
          {task.description.length > 120 ? task.description.slice(0, 120) + '...' : task.description}
        </div>
      )}

      {task.requiredSkills.length > 0 && (
        <div style={skillsRowStyle}>
          {task.requiredSkills.slice(0, 3).map((skill) => (
            <span key={skill} style={skillTagStyle}>{skill}</span>
          ))}
          {task.requiredSkills.length > 3 && (
            <span style={{ ...skillTagStyle, color: 'var(--text-muted)' }}>+{task.requiredSkills.length - 3}</span>
          )}
        </div>
      )}

      <div style={cardFooterStyle}>
        <span style={{ ...priorityBadgeStyle, color: PRIORITY_COLORS[task.priority] ?? 'var(--text-muted)' }}>
          {task.priority}
        </span>

        {task.estimatedEffort > 0 && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {task.estimatedEffort}pts
          </span>
        )}

        {assignee ? (
          <span style={assigneeStyle}>{assignee.name}</span>
        ) : (task.status === 'backlog' || task.status === 'todo') && onAssign ? (
          <button
            onClick={(e) => { e.stopPropagation(); onAssign(); }}
            style={assignBtnStyle}
          >
            Auto-assign
          </button>
        ) : null}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius)',
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  cursor: 'pointer',
  transition: 'background 0.15s',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.3,
};

const cardDescStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  lineHeight: 1.4,
};

const skillsRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
};

const skillTagStyle: React.CSSProperties = {
  padding: '1px 6px',
  borderRadius: 3,
  background: 'var(--bg-hover)',
  fontSize: 10,
  color: 'var(--text-secondary)',
};

const cardFooterStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 4,
};

const priorityBadgeStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
};

const assigneeStyle: React.CSSProperties = {
  marginLeft: 'auto',
  fontSize: 11,
  color: 'var(--accent)',
  fontWeight: 500,
};

const assignBtnStyle: React.CSSProperties = {
  marginLeft: 'auto',
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text-secondary)',
  fontSize: 11,
  padding: '2px 8px',
  borderRadius: 4,
  cursor: 'pointer',
};
