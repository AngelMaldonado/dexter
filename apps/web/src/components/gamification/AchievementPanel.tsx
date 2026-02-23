import type { AchievementDefinition, EntityAchievement } from '../../types.js';

interface AchievementPanelProps {
  achievements: AchievementDefinition[];
  unlocked: EntityAchievement[];
}

const CATEGORY_COLORS: Record<string, string> = {
  milestone: 'var(--accent)',
  streak: 'var(--warning)',
  performance: 'var(--success)',
  social: 'var(--purple)',
};

export function AchievementPanel({ achievements, unlocked }: AchievementPanelProps) {
  const unlockedIds = new Set(unlocked.map((a) => a.achievementId));

  return (
    <div style={gridStyle}>
      {achievements.map((achievement) => {
        const isUnlocked = unlockedIds.has(achievement.id);
        const unlockedEntry = unlocked.find((a) => a.achievementId === achievement.id);

        return (
          <div
            key={achievement.id}
            style={{
              ...cardStyle,
              opacity: isUnlocked ? 1 : 0.5,
              borderColor: isUnlocked ? CATEGORY_COLORS[achievement.category] ?? 'var(--border)' : 'var(--border)',
            }}
          >
            <div style={iconStyle}>{achievement.icon || '?'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{achievement.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {achievement.description}
              </div>
              <div style={metaRowStyle}>
                <span style={{ ...categoryBadgeStyle, color: CATEGORY_COLORS[achievement.category] }}>
                  {achievement.category}
                </span>
                <span style={{ fontSize: 11, color: 'var(--accent)' }}>+{achievement.xpReward} XP</span>
                {isUnlocked && unlockedEntry && (
                  <span style={{ fontSize: 11, color: 'var(--success)', marginLeft: 'auto' }}>
                    Unlocked {new Date(unlockedEntry.unlockedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {achievements.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: 20, gridColumn: '1 / -1' }}>
          No achievements defined yet
        </div>
      )}
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: 12,
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: 14,
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  transition: 'opacity 0.2s',
};

const iconStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 8,
  background: 'var(--bg-card)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  flexShrink: 0,
};

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 6,
};

const categoryBadgeStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
};
