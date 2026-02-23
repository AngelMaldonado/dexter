import type { Streak } from '../../types.js';

interface StreakDisplayProps {
  streaks: Streak[];
}

const STREAK_COLORS: Record<string, string> = {
  daily: 'var(--warning)',
  sprint: 'var(--success)',
  collaboration: 'var(--purple)',
};

export function StreakDisplay({ streaks }: StreakDisplayProps) {
  const activeStreaks = streaks.filter((s) => s.isActive);

  if (activeStreaks.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 16 }}>
        No active streaks
      </div>
    );
  }

  return (
    <div style={listStyle}>
      {activeStreaks.map((streak) => (
        <div key={streak.id} style={streakCardStyle}>
          <div style={{ ...streakIconStyle, color: STREAK_COLORS[streak.type] ?? 'var(--accent)' }}>
            {streak.type === 'daily' ? 'D' : streak.type === 'sprint' ? 'S' : 'C'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{streak.type}</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: STREAK_COLORS[streak.type] }}>
                {streak.currentCount}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Best: {streak.longestCount} | Last: {new Date(streak.lastActivityAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const streakCardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius)',
  padding: '10px 14px',
  display: 'flex',
  gap: 12,
  alignItems: 'center',
};

const streakIconStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  background: 'var(--bg-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16,
  fontWeight: 700,
  flexShrink: 0,
};
