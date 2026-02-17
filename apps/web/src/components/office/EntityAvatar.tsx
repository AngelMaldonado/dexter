import type { Entity } from '../../lib/api.js';

const STATE_COLORS: Record<string, string> = {
  idle: 'var(--state-idle)',
  working: 'var(--state-working)',
  thinking: 'var(--state-thinking)',
  blocked: 'var(--state-blocked)',
  collaborating: 'var(--state-collaborating)',
  break: 'var(--state-break)',
};

const MOOD_EMOJI: Record<string, string> = {
  happy: ':)',
  neutral: ':|',
  frustrated: '>:(',
  tired: '-_-',
  excited: ':D',
};

export function EntityAvatar({ entity }: { entity: Entity }) {
  const stateColor = STATE_COLORS[entity.state] ?? STATE_COLORS.idle;
  const initials = entity.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={wrapperStyle} title={`${entity.name} — ${entity.state}`}>
      <div
        style={{
          ...avatarStyle,
          borderColor: stateColor,
          boxShadow: entity.state === 'working' ? `0 0 8px ${stateColor}` : 'none',
        }}
      >
        {initials}
      </div>
      <div style={nameStyle}>{entity.name}</div>
      <div style={{ ...stateStyle, color: stateColor }}>
        {entity.state} {MOOD_EMOJI[entity.mood] ?? ''}
      </div>
      <div style={energyBarWrapperStyle}>
        <div
          style={{
            ...energyBarStyle,
            width: `${entity.energy}%`,
            background: entity.energy > 50 ? 'var(--success)' : entity.energy > 20 ? 'var(--warning)' : 'var(--error)',
          }}
        />
      </div>
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  padding: 8,
};

const avatarStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: '50%',
  background: 'var(--bg-tertiary)',
  border: '3px solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  fontWeight: 600,
  transition: 'all 0.3s',
};

const nameStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-primary)',
  textAlign: 'center',
  maxWidth: 80,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const stateStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'capitalize',
};

const energyBarWrapperStyle: React.CSSProperties = {
  width: 48,
  height: 3,
  background: 'var(--bg-primary)',
  borderRadius: 2,
  overflow: 'hidden',
};

const energyBarStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: 2,
  transition: 'width 0.5s',
};
