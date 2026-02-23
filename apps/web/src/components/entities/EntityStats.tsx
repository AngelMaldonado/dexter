import type { Entity } from '../../types.js';
import { STATE_CSS_COLORS, MOOD_EMOJIS, getEnergyColorCSS, xpProgress } from '../office/utils/sprites.js';

interface EntityStatsProps {
  entity: Entity;
  onClose: () => void;
}

export function EntityStats({ entity, onClose }: EntityStatsProps) {
  const stateColor = STATE_CSS_COLORS[entity.state] ?? STATE_CSS_COLORS.idle;
  const progress = xpProgress(entity.xp);

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>{entity.name}</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>
            {entity.parsedSoul?.role ?? 'Entity'} {MOOD_EMOJIS[entity.mood] ?? ''}
          </div>
        </div>
        <button onClick={onClose} style={closeBtnStyle}>X</button>
      </div>

      <div style={statsGridStyle}>
        <StatBox label="State" value={entity.state.replace('_', ' ')} color={stateColor} />
        <StatBox label="Energy" value={`${entity.energy}%`} color={getEnergyColorCSS(entity.energy)} />
        <StatBox label="Level" value={String(entity.level)} color="var(--accent)" />
        <StatBox label="XP" value={entity.xp.toLocaleString()} />
        <StatBox label="Mode" value={entity.behaviorMode.replace('_', ' ')} />
        <StatBox label="Role" value={entity.hierarchyRole} />
      </div>

      {/* XP Progress Bar */}
      <div style={sectionStyle}>
        <div style={labelStyle}>XP Progress to Level {entity.level + 1}</div>
        <div style={xpBarWrapperStyle}>
          <div style={{ ...xpBarFillStyle, width: `${progress * 100}%` }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
          {Math.round(progress * 100)}%
        </div>
      </div>

      {/* Skills */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Skills</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(entity.parsedSoul?.skills ?? []).map((skill) => (
            <span key={skill} style={tagStyle}>{skill}</span>
          ))}
        </div>
      </div>

      {/* Personality */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Personality</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {(entity.parsedSoul?.personality ?? []).join(', ') || 'Not defined'}
        </div>
      </div>

      {/* SOUL.md Preview */}
      <div style={sectionStyle}>
        <div style={labelStyle}>SOUL.md</div>
        <pre style={soulPreviewStyle}>{entity.soulMd}</pre>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={statBoxStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: color ?? 'var(--text-primary)', textTransform: 'capitalize' }}>
        {value}
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  maxHeight: '100%',
  overflow: 'auto',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  color: 'var(--text-secondary)',
  width: 32,
  height: 32,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  fontSize: 14,
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12,
};

const statBoxStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 8,
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  letterSpacing: 0.5,
};

const tagStyle: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: 4,
  background: 'var(--bg-card)',
  fontSize: 12,
  color: 'var(--text-secondary)',
};

const xpBarWrapperStyle: React.CSSProperties = {
  width: '100%',
  height: 8,
  background: 'var(--bg-card)',
  borderRadius: 4,
  overflow: 'hidden',
};

const xpBarFillStyle: React.CSSProperties = {
  height: '100%',
  background: 'var(--accent)',
  borderRadius: 4,
  transition: 'width 0.5s',
};

const soulPreviewStyle: React.CSSProperties = {
  background: 'var(--bg-primary)',
  borderRadius: 8,
  padding: 12,
  fontSize: 12,
  fontFamily: '"SF Mono", "Fira Code", monospace',
  lineHeight: 1.5,
  color: 'var(--text-secondary)',
  maxHeight: 200,
  overflow: 'auto',
  whiteSpace: 'pre-wrap',
  margin: 0,
};
