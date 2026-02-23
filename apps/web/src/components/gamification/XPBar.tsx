import { xpProgress, xpForLevel } from '../office/utils/sprites.js';

interface XPBarProps {
  xp: number;
  level: number;
  size?: 'small' | 'medium';
}

export function XPBar({ xp, level, size = 'medium' }: XPBarProps) {
  const progress = xpProgress(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const isSmall = size === 'small';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isSmall ? 6 : 10 }}>
      <span style={{ fontSize: isSmall ? 11 : 13, fontWeight: 600, color: 'var(--accent)', minWidth: isSmall ? 32 : 40 }}>
        Lv.{level}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ ...barWrapperStyle, height: isSmall ? 4 : 8 }}>
          <div
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: 'var(--accent)',
              borderRadius: 4,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        {!isSmall && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
            <span style={xpLabelStyle}>{xp - currentLevelXp} / {nextLevelXp - currentLevelXp}</span>
            <span style={xpLabelStyle}>{Math.round(progress * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

const barWrapperStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-card)',
  borderRadius: 4,
  overflow: 'hidden',
};

const xpLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--text-muted)',
};
