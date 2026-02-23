import type { Entity } from '../../types.js';
import { STATE_CSS_COLORS, MOOD_EMOJIS, getEnergyColorCSS } from '../office/utils/sprites.js';

interface EntityPanelProps {
  entity: Entity;
  onClick?: () => void;
  compact?: boolean;
}

export function EntityPanel({ entity, onClick, compact }: EntityPanelProps) {
  const stateColor = STATE_CSS_COLORS[entity.state] ?? STATE_CSS_COLORS.idle;
  const moodEmoji = MOOD_EMOJIS[entity.mood] ?? '';
  const skills = entity.parsedSoul?.skills ?? [];

  if (compact) {
    return (
      <div style={compactStyle} onClick={onClick}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ ...avatarSmallStyle, borderColor: stateColor }}>{entity.name[0]}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{entity.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              {entity.parsedSoul?.role ?? 'Entity'} {moodEmoji}
            </div>
          </div>
        </div>
        <div style={{ ...stateBadgeStyle, background: stateColor }}>{entity.state.replace('_', ' ')}</div>
      </div>
    );
  }

  return (
    <div style={panelStyle} onClick={onClick}>
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16 }}>{entity.name}</h3>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {entity.parsedSoul?.role ?? 'Entity'} {moodEmoji}
          </div>
        </div>
        <div style={{ ...stateBadgeStyle, background: stateColor }}>{entity.state.replace('_', ' ')}</div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Skills</div>
        <div style={tagsStyle}>
          {skills.map((skill) => (
            <span key={skill} style={tagStyle}>{skill}</span>
          ))}
          {skills.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>None</span>}
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Energy</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={energyBarWrapperStyle}>
            <div
              style={{
                height: '100%',
                width: `${entity.energy}%`,
                background: getEnergyColorCSS(entity.energy),
                borderRadius: 4,
                transition: 'width 0.5s',
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 32 }}>{entity.energy}%</span>
        </div>
      </div>

      <div style={rowStyle}>
        <div style={sectionStyle}>
          <div style={labelStyle}>Level</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>Lv. {entity.level}</span>
        </div>
        <div style={sectionStyle}>
          <div style={labelStyle}>XP</div>
          <span style={{ fontSize: 14 }}>{entity.xp.toLocaleString()}</span>
        </div>
        <div style={sectionStyle}>
          <div style={labelStyle}>Mode</div>
          <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{entity.behaviorMode.replace('_', ' ')}</span>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Hierarchy</div>
        <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{entity.hierarchyRole}</span>
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
  gap: 14,
  cursor: 'pointer',
  transition: 'border-color 0.2s',
};

const compactStyle: React.CSSProperties = {
  ...panelStyle,
  padding: '12px 16px',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
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
  whiteSpace: 'nowrap',
};

const avatarSmallStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  background: 'var(--bg-card)',
  border: '2px solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  fontWeight: 600,
  flexShrink: 0,
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
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
  background: 'var(--bg-card)',
  fontSize: 12,
  color: 'var(--text-secondary)',
};

const energyBarWrapperStyle: React.CSSProperties = {
  flex: 1,
  height: 6,
  background: 'var(--bg-card)',
  borderRadius: 4,
  overflow: 'hidden',
};
