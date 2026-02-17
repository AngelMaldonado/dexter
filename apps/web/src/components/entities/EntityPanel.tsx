import type { Entity } from '../../lib/api.js';

const STATE_COLORS: Record<string, string> = {
  idle: 'var(--state-idle)',
  working: 'var(--state-working)',
  thinking: 'var(--state-thinking)',
  blocked: 'var(--state-blocked)',
  collaborating: 'var(--state-collaborating)',
  break: 'var(--state-break)',
};

export function EntityPanel({ entity }: { entity: Entity }) {
  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16 }}>{entity.name}</h3>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{entity.role}</div>
        </div>
        <div
          style={{
            ...stateBadgeStyle,
            background: STATE_COLORS[entity.state] ?? STATE_COLORS.idle,
          }}
        >
          {entity.state}
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Skills</div>
        <div style={tagsStyle}>
          {entity.skills.map((skill) => (
            <span key={skill} style={tagStyle}>{skill}</span>
          ))}
          {entity.skills.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>None</span>}
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Energy</div>
        <div style={energyBarWrapperStyle}>
          <div
            style={{
              height: '100%',
              width: `${entity.energy}%`,
              background: entity.energy > 50 ? 'var(--success)' : entity.energy > 20 ? 'var(--warning)' : 'var(--error)',
              borderRadius: 4,
              transition: 'width 0.5s',
            }}
          />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entity.energy}%</span>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Mood</div>
        <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{entity.mood}</span>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Personality</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {entity.personality.join(', ') || 'Not defined'}
        </div>
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const stateBadgeStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 600,
  color: 'white',
  textTransform: 'capitalize',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  letterSpacing: 0.5,
};

const tagsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
};

const tagStyle: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: 4,
  background: 'var(--bg-tertiary)',
  fontSize: 12,
  color: 'var(--text-secondary)',
};

const energyBarWrapperStyle: React.CSSProperties = {
  width: '100%',
  height: 6,
  background: 'var(--bg-tertiary)',
  borderRadius: 4,
  overflow: 'hidden',
};
